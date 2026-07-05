# Video Uploads via Mux — Phase 1 Design (Foundation + Event Clips)

- **Date:** 2026-07-04
- **Status:** Approved (architecture + phasing), pending spec review
- **Scope:** Phase 1 only — build the Mux pipeline end-to-end and wire it into the **event composer**. Artist reels (Phase 2) and cleanup/analytics/migration (Phase 3) are out of scope here.
- **Precursors (already shipped this session):** the media presign `entityId: 'temp'` fix and the media-service owner-check alignment. Phase 1 builds on the corrected image flow.

---

## 1. Problem

The event gallery path already lets users *pick* video (`MediaTypeOptions.All`, 60s cap), but the pipeline is a broken half-feature:

- **iPhone `.mov` (`video/quicktime`) rejects** — `gallery` purpose allows only `video/mp4` → 400 MIME_PURPOSE_MISMATCH.
- **Real clips exceed the 50 MB `gallery` cap** → 400 FILE_TOO_LARGE.
- **No transcode** — HEVC/`.mov` won't play reliably cross-platform.
- **Fake thumbnail** — `thumbnailUrl` is set to the video URL itself; the grid renders a video as an `<Image>`.
- **No confirm / no cleanup** — worse for large files that fail mid-upload.

We are making video **first-class across the app** (events + artists). Phase 1 delivers the foundation on the event surface.

## 2. Decision

- **Buy the pipeline: Mux.** Encoding-free on the Basic tier (right for UGC/reels), 100K free delivery min/month, free player + analytics + auto-captions + signed URLs + **poster frames**. Effectively free through launch and the Pune wedge; cost is delivery-driven (engagement-linked) and only material at scale. (Per the Mux cost analysis on 2026-07-04: ~$0/mo through the wedge, ~$370/mo at early-growth, ~$4k/mo list at scale before enterprise/cold-storage discounts.)
- **media-service is the Mux broker (approach A).** It creates Mux uploads, hosts the one signed webhook, owns a new `MediaAsset` collection, and **pushes** the resulting `playbackId` to the owning service. Consistent with the existing webhook-authoritative Razorpay pattern and the "media-service brokers all uploads" seam.
- **Seam by media kind:** images stay on the S3 presign flow **unchanged**; video routes to Mux.
- **Events-first** to de-risk the async plumbing on the lower-stakes surface before artist reels.
- **Phase 1 video is edit-mode-only** (the event must already exist). This matches the image-upload guard already shipped: presign/upload requires a persisted, owned entity, and the create composer has no event id until publish. Draft-events (to allow media during create) is a future unlock, not Phase 1.

## 3. Architecture

### 3.1 End-to-end flow (event clip, edit mode)

```
composer(Step6Media)      media-service            Mux              events-service
  │ pick VIDEO                 │                     │                    │
  │ 1 POST /v1/media/video/upload {event,id,purpose}                     │
  │───────────────────────────>│ ownership check (reuse)                 │
  │                            │ 2 uploads.create(policy=public,         │
  │                            │    video_quality=basic, cors)           │
  │                            │────────────────────>│                    │
  │                            │ save MediaAsset(status=waiting)          │
  │ 3 {uploadId, uploadUrl}    │<────────────────────│                    │
  │<───────────────────────────│                     │                    │
  │ 4 PUT file ──────────────────────────────────────>│ (direct to Mux)   │
  │ 5 PATCH /events/:id media[]+= {kind:video,status:processing,uploadId} │
  │                            │           transcode…│                    │
  │                            │ 6 webhook video.asset.ready (sig-verified)│
  │                            │<────────────────────│                    │
  │                            │ MediaAsset → ready + playbackId + poster  │
  │                            │ 7 POST /internal/.../media/attach ───────>│ entry → ready
  │  (client also polls GET /v1/media/asset/:uploadId for snappy UI)       │
  │                                                                        │
 play: stream.mux.com/{playbackId}.m3u8   poster: image.mux.com/{playbackId}/thumbnail.jpg
```

The webhook push (step 7) is authoritative and works even if the app is backgrounded. Client polling is a UX nicety, not a correctness dependency.

### 3.2 media-service changes

New dependency: `@mux/mux-node`. New env: `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, `MUX_WEBHOOK_SECRET`, `INTERNAL_SERVICE_TOKEN`, `EVENTS_SERVICE_URL`.

**New collection `MediaAsset`** (media-service's *own* collection — its read-only access to other services' collections is unchanged):

| field | type | notes |
|---|---|---|
| `uploadId` | string, unique index | Mux upload id; correlation key |
| `assetId` | string, sparse index | set on `asset_created` |
| `playbackId` | string | set on `ready` |
| `playbackPolicy` | `'public' \| 'signed'` | Phase 1: `public` |
| `entityType` | enum | `event` in Phase 1 |
| `entityId` | ObjectId (string) | the event |
| `purpose` | enum | `gallery` in Phase 1 |
| `ownerId` | string | organizer (from JWT at create) |
| `status` | `'waiting'\|'asset_created'\|'ready'\|'errored'` | forward-only |
| `duration` | number | seconds, from `ready` |
| `aspectRatio` | string | e.g. `"16:9"` |
| `error` | string? | from `errored` |
| timestamps | | |

**New endpoints:**

- `POST /v1/media/video/upload` — `requireAuth`; reuse `checkUploadPermission({user, entityType, entityId, purpose})` (ownership now role-agnostic). Skip the S3 MIME/size gates (Mux normalizes format; duration is validated post-transcode). Call `mux.video.uploads.create({ cors_origin, new_asset_settings: { playback_policy: ['public'], video_quality: 'basic' } })`. Persist `MediaAsset(status='waiting')`. Return `{ uploadId, uploadUrl }`.
- `POST /v1/media/webhooks/mux` — **no `requireAuth`**; verify signature via `mux.webhooks.unwrap(rawBody, headers)` (needs raw body — mount `express.raw` for this route). Handle:
  - `video.upload.asset_created` → set `assetId`, `status='asset_created'`.
  - `video.asset.ready` → set `playbackId` (`data.playback_ids[0].id`), `duration`, `aspectRatio`, `status='ready'`; **validate duration ≤ cap** (see §5) else `status='errored'`; then push attach to events-service.
  - `video.asset.errored` → `status='errored'`, `error`.
  - Idempotent + forward-only (webhooks may duplicate or arrive out of order; never regress `ready`→`asset_created`). Correlate by `data.upload_id`.
- `GET /v1/media/asset/:uploadId` — `requireAuth` + owner check; returns `{ status, playbackId?, duration?, aspectRatio?, error? }` for composer polling.

**Internal push:** on `ready`, `POST {EVENTS_SERVICE_URL}/internal/events/media/attach` with `Authorization: Bearer ${INTERNAL_SERVICE_TOKEN}` and `{ eventId, uploadId, playbackId, thumbnailUrl, duration, aspectRatio, status }`. Retry a few times on transient failure; idempotent on the receiver.

### 3.3 events-service changes

- **`EventMedia` subschema (`models/Event.ts`) gains video fields:** `thumbnailUrl?`, `status?: 'processing'|'ready'|'errored'`, `uploadId?`, `muxPlaybackId?`, `duration?`, `aspectRatio?`. `url` stays optional (unused for video; playback is derived from `muxPlaybackId`). Backward-compatible (all optional); existing image entries unaffected.
- **New internal route `POST /internal/events/media/attach`**, guarded by a new `requireServiceToken` middleware (constant-time compare against `INTERNAL_SERVICE_TOKEN`). Finds the event, updates the `media[]` entry matching `uploadId` (set `status`, `muxPlaybackId`, `thumbnailUrl`, `duration`, `aspectRatio`). Idempotent. If no entry matches yet (client hasn't PATCHed — rare race in edit mode), respond 202 and rely on media-service retry / the client poll writing it. Does **not** require organizer JWT (service-to-service).
- The existing organizer `PATCH /events/:id` already whitelists `media`, so the client writes the initial `{kind:'video',status:'processing',uploadId}` entry through the normal path. No change there.

### 3.4 Frontend changes

- **New `uploadVideoFlow(asset, entityType, entityId, purpose)`** in `src/utils/upload.ts` (sibling to `uploadMediaFlow`): POST `/media/video/upload` → PUT file to Mux `uploadUrl` (with progress) → return `{ uploadId }`.
- **`Step6Media` branches by kind:** image → existing `uploadMediaFlow` (S3, unchanged); video → `uploadVideoFlow`. On success, add media entry `{ kind:'video', status:'processing', uploadId, isHero, sortOrder }` and PATCH immediately (edit mode → event exists). Render a "processing…" tile (spinner + no `<Image>` on a video URL — fixes the fake-thumbnail bug).
- **Optional composer polling:** while mounted, poll `GET /media/asset/:uploadId` every ~4s for processing entries; flip to `ready` + set `muxPlaybackId`/`thumbnailUrl` when done. Bounded, stops on unmount.
- **New `<EventVideo>` player** using `expo-video` (already a dependency): source `https://stream.mux.com/{playbackId}.m3u8`, poster `https://image.mux.com/{playbackId}/thumbnail.jpg?time=1`. Used on event detail + composer preview. Ready videos render the player/poster; processing → spinner; errored → "couldn't process, re-upload".
- **`EventMedia` type** gains the same optional fields as the backend schema. `expo-video-thumbnails` no longer needed for video (Mux poster is free) — leave for any image use.

## 4. Async readiness & UX

Optimistic. Upload returns immediately; the tile shows "processing…"; the host can keep composing and save. The reel becomes playable when the webhook lands (seconds for short clips). Publishing an event with a still-processing video is allowed — it goes live shortly after. No blocking waits.

## 5. Edge cases & rules

- **Duration cap:** picker caps at 60s (event clips); server validates `duration ≤ 65s` on `ready` (buffer for rounding). Over cap → `errored`, not attached, composer prompts re-upload.
- **Errored transcode:** `video.asset.errored` (or over-cap) → entry `status='errored'` → composer shows re-upload affordance; event stays valid (other media / NETSA fallback).
- **Webhook duplication / reordering:** upsert by `uploadId`/`assetId`; state is forward-only; attach is idempotent.
- **Race (ready before client PATCH):** edit-mode PATCH happens right at upload, so the entry usually exists; media-service retries attach; if still absent, the composer poll writes `playbackId` into the entry on next PATCH. MediaAsset remains the source of truth.
- **Abandoned upload** (picked, PUT failed): `MediaAsset` stuck `waiting`; harmless in Phase 1; swept in Phase 3 cleanup.
- **Create mode:** video upload disabled (same guard as images — no event id). Steer to publish-then-edit.

## 6. Security

- **Webhook signature verification is mandatory** (`mux.webhooks.unwrap`); reject unverified. Raw body required for that route only.
- **Internal attach** protected by `INTERNAL_SERVICE_TOKEN` (constant-time compare); never callable with a user JWT; not exposed on the public gateway.
- **Ownership** reuses `checkUploadPermission` (owner = `event.organizerId === user.id`).
- **Playback policy:** `public` for events (event pages are public). Signed playback deferred to Phase 2 (auditions).

## 7. Testing

- **media-service (stand up a jest + ts-jest harness — none exists today; justified by new stateful/webhook logic):**
  - `/video/upload`: ownership enforced; Mux SDK mocked; `MediaAsset(waiting)` created.
  - Webhook: signature rejection; `asset_created`→`ready`→ idempotent/out-of-order transitions; over-cap → errored; attach called on ready (events-service mocked).
- **events-service (has jest + mongodb-memory-server):**
  - `requireServiceToken` accept/reject.
  - attach updates the matching `media[]` entry by `uploadId`; idempotent; 202 when entry absent.
  - `EventMedia` schema accepts new optional fields; existing image entries unaffected.
- **frontend (jest + RTL):**
  - `Step6Media` video pick → calls `uploadVideoFlow` (not S3), adds `processing` entry, renders spinner (no `<Image>` on video URL).
  - Poll flips `processing`→`ready`.
  - `<EventVideo>` renders HLS source + Mux poster for a ready entry.

## 8. Config / local dev

- Secrets: `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, `MUX_WEBHOOK_SECRET` (media-service); `INTERNAL_SERVICE_TOKEN` (media-service + events-service); `EVENTS_SERVICE_URL` (media-service).
- **Local webhooks need a public URL → reuse the ngrok setup already used for Razorpay.** Point the Mux webhook at `https://<ngrok>/v1/media/webhooks/mux`.
- Mux account provisioning (env keys, webhook endpoint registration) is a Phase 1 setup task.

## 9. Out of scope (future phases)

- **Phase 2 — Artist reels:** portfolio/audition video, a reel player, and **signed playback** for private auditions. Separate spec.
- **Phase 3 — Polish:** abandoned-`MediaAsset` cleanup job, Mux Data analytics surfaced to artists, migration of any stray S3 videos, create-mode media via draft-events.

## 10. Resolved decisions (were open questions)

1. **Reel length cap: 60s.** Picker caps at 60s; server validates `duration ≤ 65s` on `ready` (rounding buffer); over-cap → `errored`.
2. **Mux account: created 2026-07-04.** Dev access token (Mux Video Read+Write) + internal service token obtained. **Webhook registration deferred to the build step** — register the endpoint in the Mux dashboard once the `/v1/media/webhooks/mux` route exists, then verify with Mux's "Send test". Local delivery via the existing Razorpay ngrok setup.
3. **Edit-mode-only video for Phase 1: confirmed.** Create-mode stays images/fallback only (no event id yet). Draft-events is a Phase 3 unlock.
4. **`video_quality: 'basic'`: confirmed** against Mux docs (2026-07-04) as the current field name and the correct free/on-demand tier. No `plus`/`premium` surface in Phase 1. Webhook verification uses the Node SDK helper on the raw body (`mux.webhooks.unwrap(rawBody, headers)`).
```
