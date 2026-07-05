# Video Uploads via Mux — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make video a first-class media type in the event composer by routing video to Mux (transcode + adaptive HLS + poster frames) while images stay on the existing S3 presign flow.

**Architecture:** media-service is the Mux broker — it creates Mux direct uploads, owns a new `MediaAsset` collection, receives Mux's signed webhook, and pushes the resulting `playbackId` to events-service via an internal, token-authed endpoint. The client uploads the raw file straight to Mux, shows an optimistic "processing" tile, and the reel becomes playable when the webhook lands. Edit-mode only (the event must already exist).

**Tech Stack:** Node/Express/TypeScript/Mongoose (media-service, events-service), `@mux/mux-node`, React Native/Expo + `expo-video` (frontend), jest.

**Spec:** `DOCS/superpowers/specs/2026-07-04-video-uploads-mux-phase1-design.md`

---

## File Structure

**media-service** (`netsa-backend/media-service`)
- Create `src/config/mux.ts` — Mux client + Phase-1 config constants.
- Modify `src/config/env.ts` — add `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, `MUX_WEBHOOK_SECRET`, `INTERNAL_SERVICE_TOKEN`, `EVENTS_SERVICE_URL`.
- Create `src/models/MediaAsset.ts` — video lifecycle record (media-service's own collection).
- Create `src/services/video.service.ts` — create upload, read status, apply webhook event, attach to entity.
- Create `src/controllers/media.video.controller.ts` — `POST /video/upload`, `GET /asset/:uploadId`.
- Create `src/controllers/media.webhook.controller.ts` — `POST /webhooks/mux`.
- Modify `src/routes/media.routes.ts` — register the three routes.
- Modify `src/server.ts` — mount `express.raw` on the webhook path before `express.json()`.
- Create test harness: `jest.config.js`, dev-deps, `src/**/__tests__/*.test.ts`.

**events-service** (`netsa-backend/events-service`)
- Modify `src/models/Event.ts` — extend the `media` subschema + `IEvent` with video fields.
- Create `src/middleware/serviceAuth.ts` — `requireServiceToken`.
- Create `src/controllers/internalMedia.ts` — `attachMedia`.
- Create `src/routes/internal.ts` — `POST /internal/events/media/attach`.
- Modify `src/server.ts` — mount `app.use('/internal', internalRoutes)`.
- Create `src/tests/internalMediaAttach.integration.test.ts`.

**frontend** (`netsa-frontend`)
- Modify `src/services/eventService.ts` — extend `EventMedia`.
- Modify `src/services/mediaService.ts` — `requestVideoUpload`, `getAssetStatus`.
- Modify `src/utils/upload.ts` — `uploadVideoFlow`.
- Modify `src/components/events/composer/steps/Step6Media.tsx` — video branch, processing/errored tiles, polling.
- Create `src/components/events/EventVideo.tsx` — `expo-video` player.
- Modify `src/components/events/manage/PosterHero.tsx:137` — play video via `EventVideo`.

---

# Phase A — media-service (Mux broker)

### Task A1: Stand up the media-service test harness

**Files:**
- Modify: `netsa-backend/media-service/package.json`
- Create: `netsa-backend/media-service/jest.config.js`
- Create: `netsa-backend/media-service/src/__tests__/harness.test.ts`

- [ ] **Step 1: Install dev deps**

Run:
```bash
cd netsa-backend/media-service && npm i -D jest ts-jest @types/jest supertest @types/supertest mongodb-memory-server
```

- [ ] **Step 2: Add jest config**

Create `jest.config.js`:
```js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
};
```

- [ ] **Step 3: Add an in-memory Mongo setup file**

Create `src/__tests__/setup.ts`:
```ts
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  for (const key of Object.keys(collections)) await collections[key].deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
```

- [ ] **Step 4: Add the `test` script**

In `package.json` `"scripts"`, add: `"test": "jest --runInBand"`.

- [ ] **Step 5: Sanity test**

Create `src/__tests__/harness.test.ts`:
```ts
describe('harness', () => {
  it('runs', () => { expect(1 + 1).toBe(2); });
});
```

- [ ] **Step 6: Run and verify PASS**

Run: `npm test -- harness`
Expected: 1 passing test.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json jest.config.js src/__tests__
git commit -m "test(media): stand up jest + in-memory mongo harness"
```

---

### Task A2: Extend env config with Mux + internal secrets

**Files:**
- Modify: `netsa-backend/media-service/src/config/env.ts`

- [ ] **Step 1: Add the vars to the zod schema**

In `envSchema` (after the AWS block), add:
```ts
    // Mux
    MUX_TOKEN_ID: z.string().min(1, 'MUX_TOKEN_ID is required'),
    MUX_TOKEN_SECRET: z.string().min(1, 'MUX_TOKEN_SECRET is required'),
    MUX_WEBHOOK_SECRET: z.string().min(1, 'MUX_WEBHOOK_SECRET is required'),

    // Service-to-service
    INTERNAL_SERVICE_TOKEN: z.string().min(1, 'INTERNAL_SERVICE_TOKEN is required'),
    EVENTS_SERVICE_URL: z.string().url().default('http://localhost:5003'),
```

- [ ] **Step 2: Export them on the `env` object**

In the `env` object literal, add:
```ts
  mux: {
    tokenId: parsedEnv.MUX_TOKEN_ID,
    tokenSecret: parsedEnv.MUX_TOKEN_SECRET,
    webhookSecret: parsedEnv.MUX_WEBHOOK_SECRET,
  },
  internalServiceToken: parsedEnv.INTERNAL_SERVICE_TOKEN,
  eventsServiceUrl: parsedEnv.EVENTS_SERVICE_URL,
```

- [ ] **Step 3: Make tests provide the vars**

Prepend to `src/__tests__/setup.ts` (top of file, before other imports load env):
```ts
process.env.MUX_TOKEN_ID ||= 'test-mux-id';
process.env.MUX_TOKEN_SECRET ||= 'test-mux-secret';
process.env.MUX_WEBHOOK_SECRET ||= 'test-webhook-secret';
process.env.INTERNAL_SERVICE_TOKEN ||= 'test-internal-token';
process.env.MONGO_URI ||= 'mongodb://127.0.0.1:27017/test';
process.env.JWT_SECRET ||= 'test-jwt';
process.env.AWS_ACCESS_KEY_ID ||= 'x';
process.env.AWS_SECRET_ACCESS_KEY ||= 'x';
process.env.AWS_S3_BUCKET ||= 'test-bucket';
```

- [ ] **Step 4: Verify harness still passes**

Run: `npm test -- harness`
Expected: PASS (env validation does not throw).

- [ ] **Step 5: Commit**

```bash
git add src/config/env.ts src/__tests__/setup.ts
git commit -m "feat(media): add Mux + internal-service env config"
```

---

### Task A3: Mux client + Phase-1 constants

**Files:**
- Create: `netsa-backend/media-service/src/config/mux.ts`

- [ ] **Step 1: Install the SDK**

Run: `cd netsa-backend/media-service && npm i @mux/mux-node`

- [ ] **Step 2: Create the client module**

Create `src/config/mux.ts`:
```ts
import Mux from '@mux/mux-node';
import { env } from './env';

// One shared Mux client. Reads credentials explicitly from validated env.
export const mux = new Mux({
  tokenId: env.mux.tokenId,
  tokenSecret: env.mux.tokenSecret,
  webhookSecret: env.mux.webhookSecret,
});

// Phase-1 policy: public playback, free Basic encoding tier.
export const MUX_ASSET_SETTINGS = {
  playback_policy: ['public'] as const,
  video_quality: 'basic' as const,
};

export const MAX_VIDEO_DURATION_SECONDS = 65; // 60s picker cap + rounding buffer

export const playbackUrl = (playbackId: string) => `https://stream.mux.com/${playbackId}.m3u8`;
export const posterUrl = (playbackId: string) => `https://image.mux.com/${playbackId}/thumbnail.jpg?time=1`;
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/config/mux.ts
git commit -m "feat(media): add Mux client + phase-1 constants"
```

---

### Task A4: MediaAsset model

**Files:**
- Create: `netsa-backend/media-service/src/models/MediaAsset.ts`
- Test: `netsa-backend/media-service/src/models/__tests__/MediaAsset.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/models/__tests__/MediaAsset.test.ts`:
```ts
import { MediaAsset } from '../MediaAsset';

describe('MediaAsset', () => {
  it('persists a waiting record and enforces uploadId uniqueness', async () => {
    await MediaAsset.create({
      uploadId: 'up_1', entityType: 'event', entityId: 'e1', purpose: 'gallery',
      ownerId: 'u1', status: 'waiting',
    });
    const found = await MediaAsset.findOne({ uploadId: 'up_1' });
    expect(found?.status).toBe('waiting');
    await expect(
      MediaAsset.create({
        uploadId: 'up_1', entityType: 'event', entityId: 'e1', purpose: 'gallery',
        ownerId: 'u1', status: 'waiting',
      }),
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- MediaAsset`
Expected: FAIL ("Cannot find module '../MediaAsset'").

- [ ] **Step 3: Implement the model**

Create `src/models/MediaAsset.ts`:
```ts
import mongoose, { Schema, Document } from 'mongoose';

export type MediaAssetStatus = 'waiting' | 'asset_created' | 'ready' | 'errored';

export interface IMediaAsset extends Document {
  uploadId: string;
  assetId?: string;
  playbackId?: string;
  playbackPolicy: 'public' | 'signed';
  entityType: 'event';
  entityId: string;
  purpose: string;
  ownerId: string;
  status: MediaAssetStatus;
  duration?: number;
  aspectRatio?: string;
  error?: string;
}

const MediaAssetSchema = new Schema<IMediaAsset>(
  {
    uploadId: { type: String, required: true, unique: true, index: true },
    assetId: { type: String, index: true, sparse: true },
    playbackId: { type: String },
    playbackPolicy: { type: String, enum: ['public', 'signed'], default: 'public' },
    entityType: { type: String, enum: ['event'], required: true },
    entityId: { type: String, required: true },
    purpose: { type: String, required: true },
    ownerId: { type: String, required: true },
    status: { type: String, enum: ['waiting', 'asset_created', 'ready', 'errored'], default: 'waiting' },
    duration: { type: Number },
    aspectRatio: { type: String },
    error: { type: String },
  },
  { timestamps: true },
);

export const MediaAsset = mongoose.models.MediaAsset || mongoose.model<IMediaAsset>('MediaAsset', MediaAssetSchema);
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- MediaAsset`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/models/MediaAsset.ts src/models/__tests__/MediaAsset.test.ts
git commit -m "feat(media): add MediaAsset lifecycle model"
```

---

### Task A5: video.service — create upload + read status

**Files:**
- Create: `netsa-backend/media-service/src/services/video.service.ts`
- Test: `netsa-backend/media-service/src/services/__tests__/video.service.create.test.ts`

- [ ] **Step 1: Write the failing test** (Mux SDK + permission mocked)

Create `src/services/__tests__/video.service.create.test.ts`:
```ts
jest.mock('../../config/mux', () => ({
  mux: { video: { uploads: { create: jest.fn().mockResolvedValue({ id: 'up_abc', url: 'https://storage.mux/upload' }) } } },
  MUX_ASSET_SETTINGS: { playback_policy: ['public'], video_quality: 'basic' },
  MAX_VIDEO_DURATION_SECONDS: 65,
  playbackUrl: (id: string) => `https://stream.mux.com/${id}.m3u8`,
  posterUrl: (id: string) => `https://image.mux.com/${id}/thumbnail.jpg?time=1`,
}));
jest.mock('../permission.service', () => ({
  checkUploadPermission: jest.fn().mockResolvedValue(undefined),
  PermissionError: class extends Error {},
}));

import { createVideoUpload } from '../video.service';
import { MediaAsset } from '../../models/MediaAsset';

describe('createVideoUpload', () => {
  it('creates a Mux upload and a waiting MediaAsset owned by the caller', async () => {
    const res = await createVideoUpload(
      { id: 'owner1', role: 'artist' } as any,
      { entityType: 'event', entityId: 'evt1', purpose: 'gallery' },
    );
    expect(res).toEqual({ uploadId: 'up_abc', uploadUrl: 'https://storage.mux/upload' });
    const rec = await MediaAsset.findOne({ uploadId: 'up_abc' });
    expect(rec?.status).toBe('waiting');
    expect(rec?.ownerId).toBe('owner1');
    expect(rec?.entityId).toBe('evt1');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- video.service.create`
Expected: FAIL ("Cannot find module '../video.service'").

- [ ] **Step 3: Implement create + status**

Create `src/services/video.service.ts`:
```ts
import { AuthUser } from '../middleware/auth';
import { mux, MUX_ASSET_SETTINGS } from '../config/mux';
import { MediaAsset } from '../models/MediaAsset';
import { checkUploadPermission } from './permission.service';
import { Purpose } from '../utils/mime';
import { EntityType } from '../utils/fileKey';

export interface CreateVideoUploadInput {
  entityType: EntityType;
  entityId: string;
  purpose: Purpose;
}

export async function createVideoUpload(user: AuthUser, input: CreateVideoUploadInput) {
  const { entityType, entityId, purpose } = input;

  // Reuse the existing ownership + purpose↔entity checks (owner = organizerId === user.id).
  await checkUploadPermission({ user, entityType, entityId, purpose });

  const upload = await mux.video.uploads.create({
    cors_origin: '*',
    new_asset_settings: { ...MUX_ASSET_SETTINGS },
  });

  await MediaAsset.create({
    uploadId: upload.id,
    entityType,
    entityId,
    purpose,
    ownerId: user.id,
    status: 'waiting',
    playbackPolicy: 'public',
  });

  return { uploadId: upload.id, uploadUrl: upload.url };
}

export async function getAssetStatus(user: AuthUser, uploadId: string) {
  const rec = await MediaAsset.findOne({ uploadId });
  if (!rec) return null;
  if (rec.ownerId !== user.id && user.role !== 'admin') return null; // owner-scoped
  return {
    status: rec.status,
    playbackId: rec.playbackId,
    duration: rec.duration,
    aspectRatio: rec.aspectRatio,
    error: rec.error,
  };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- video.service.create`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/video.service.ts src/services/__tests__/video.service.create.test.ts
git commit -m "feat(media): video.service create upload + status"
```

---

### Task A6: video.service — apply webhook event (idempotent) + attach

**Files:**
- Modify: `netsa-backend/media-service/src/services/video.service.ts`
- Test: `netsa-backend/media-service/src/services/__tests__/video.service.webhook.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/services/__tests__/video.service.webhook.test.ts`:
```ts
jest.mock('../../config/mux', () => ({
  mux: {},
  MUX_ASSET_SETTINGS: {}, MAX_VIDEO_DURATION_SECONDS: 65,
  playbackUrl: (id: string) => `https://stream.mux.com/${id}.m3u8`,
  posterUrl: (id: string) => `https://image.mux.com/${id}/thumbnail.jpg?time=1`,
}));
const attachSpy = jest.fn().mockResolvedValue(undefined);
jest.mock('../attach.client', () => ({ attachToEvent: (...a: any[]) => attachSpy(...a) }));

import { applyMuxEvent } from '../video.service';
import { MediaAsset } from '../../models/MediaAsset';

const seed = () => MediaAsset.create({
  uploadId: 'up_1', entityType: 'event', entityId: 'evt1', purpose: 'gallery',
  ownerId: 'u1', status: 'waiting',
});

describe('applyMuxEvent', () => {
  it('asset_created then ready → attaches playbackId, is forward-only + idempotent', async () => {
    await seed();
    await applyMuxEvent({ type: 'video.upload.asset_created', data: { id: 'up_1', asset_id: 'as_1' } });
    await applyMuxEvent({ type: 'video.asset.ready', data: { id: 'as_1', upload_id: 'up_1', duration: 12.4, aspect_ratio: '16:9', playback_ids: [{ id: 'pb_1', policy: 'public' }] } });

    const rec = await MediaAsset.findOne({ uploadId: 'up_1' });
    expect(rec?.status).toBe('ready');
    expect(rec?.playbackId).toBe('pb_1');
    expect(attachSpy).toHaveBeenCalledWith(expect.objectContaining({ eventId: 'evt1', uploadId: 'up_1', playbackId: 'pb_1', status: 'ready' }));

    // Idempotent / forward-only: a late asset_created must not regress status.
    await applyMuxEvent({ type: 'video.upload.asset_created', data: { id: 'up_1', asset_id: 'as_1' } });
    expect((await MediaAsset.findOne({ uploadId: 'up_1' }))?.status).toBe('ready');
  });

  it('over-cap duration → errored, no attach as ready', async () => {
    await seed();
    attachSpy.mockClear();
    await applyMuxEvent({ type: 'video.asset.ready', data: { id: 'as_2', upload_id: 'up_1', duration: 120, aspect_ratio: '16:9', playback_ids: [{ id: 'pb_2' }] } });
    const rec = await MediaAsset.findOne({ uploadId: 'up_1' });
    expect(rec?.status).toBe('errored');
    expect(attachSpy).toHaveBeenCalledWith(expect.objectContaining({ status: 'errored' }));
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- video.service.webhook`
Expected: FAIL (`applyMuxEvent` / `attach.client` not found).

- [ ] **Step 3: Create the attach client**

Create `src/services/attach.client.ts`:
```ts
import { env } from '../config/env';
import { posterUrl } from '../config/mux';

export interface AttachInput {
  eventId: string;
  uploadId: string;
  playbackId?: string;
  duration?: number;
  aspectRatio?: string;
  status: 'ready' | 'errored';
}

// Push the resolved video to events-service. Best-effort with small retry.
export async function attachToEvent(input: AttachInput): Promise<void> {
  const body = {
    eventId: input.eventId,
    uploadId: input.uploadId,
    playbackId: input.playbackId,
    thumbnailUrl: input.playbackId ? posterUrl(input.playbackId) : undefined,
    duration: input.duration,
    aspectRatio: input.aspectRatio,
    status: input.status,
  };
  const url = `${env.eventsServiceUrl}/internal/events/media/attach`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.internalServiceToken}` },
        body: JSON.stringify(body),
      });
      if (res.ok || res.status === 202) return;
    } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
  }
}
```

- [ ] **Step 4: Add `applyMuxEvent` to `video.service.ts`**

Append to `src/services/video.service.ts`:
```ts
import { MAX_VIDEO_DURATION_SECONDS } from '../config/mux';
import { attachToEvent } from './attach.client';

const STATUS_RANK = { waiting: 0, asset_created: 1, ready: 2, errored: 2 } as const;

// Idempotent + forward-only. Mux may deliver duplicates or out of order.
export async function applyMuxEvent(event: { type: string; data: any }): Promise<void> {
  const { type, data } = event;

  if (type === 'video.upload.asset_created') {
    const rec = await MediaAsset.findOne({ uploadId: data.id });
    if (!rec) return;
    if (STATUS_RANK[rec.status] < STATUS_RANK.asset_created) {
      rec.assetId = data.asset_id;
      rec.status = 'asset_created';
      await rec.save();
    } else if (!rec.assetId) {
      rec.assetId = data.asset_id;
      await rec.save();
    }
    return;
  }

  if (type === 'video.asset.ready') {
    const rec = await MediaAsset.findOne(data.upload_id ? { uploadId: data.upload_id } : { assetId: data.id });
    if (!rec || rec.status === 'ready' || rec.status === 'errored') return;

    const duration = typeof data.duration === 'number' ? data.duration : undefined;
    const playbackId = data.playback_ids?.[0]?.id;

    if (duration !== undefined && duration > MAX_VIDEO_DURATION_SECONDS) {
      rec.status = 'errored';
      rec.error = `Video too long (${Math.round(duration)}s > ${MAX_VIDEO_DURATION_SECONDS}s)`;
      await rec.save();
      await attachToEvent({ eventId: rec.entityId, uploadId: rec.uploadId, status: 'errored' });
      return;
    }

    rec.assetId = data.id;
    rec.playbackId = playbackId;
    rec.duration = duration;
    rec.aspectRatio = data.aspect_ratio;
    rec.status = 'ready';
    await rec.save();
    await attachToEvent({ eventId: rec.entityId, uploadId: rec.uploadId, playbackId, duration, aspectRatio: data.aspect_ratio, status: 'ready' });
    return;
  }

  if (type === 'video.asset.errored') {
    const rec = await MediaAsset.findOne(data.upload_id ? { uploadId: data.upload_id } : { assetId: data.id });
    if (!rec || rec.status === 'ready' || rec.status === 'errored') return;
    rec.status = 'errored';
    rec.error = data.errors?.messages?.join('; ') || 'Mux asset errored';
    await rec.save();
    await attachToEvent({ eventId: rec.entityId, uploadId: rec.uploadId, status: 'errored' });
  }
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `npm test -- video.service.webhook`
Expected: PASS (both cases).

- [ ] **Step 6: Commit**

```bash
git add src/services/video.service.ts src/services/attach.client.ts src/services/__tests__/video.service.webhook.test.ts
git commit -m "feat(media): idempotent Mux webhook state machine + attach push"
```

---

### Task A7: Controllers + routes + raw-body webhook

**Files:**
- Create: `netsa-backend/media-service/src/controllers/media.video.controller.ts`
- Create: `netsa-backend/media-service/src/controllers/media.webhook.controller.ts`
- Modify: `netsa-backend/media-service/src/routes/media.routes.ts`
- Modify: `netsa-backend/media-service/src/server.ts`

- [ ] **Step 1: Video controller**

Create `src/controllers/media.video.controller.ts`:
```ts
import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { createVideoUpload, getAssetStatus } from '../services/video.service';
import { PermissionError } from '../services/permission.service';

const Body = z.object({
  entityType: z.enum(['event']),
  entityId: z.string().min(1).max(50),
  purpose: z.enum(['gallery']),
});

export async function videoUploadController(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'UNAUTHORIZED', message: 'Auth required' }); return; }
  const parsed = Body.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid body' }); return; }
  try {
    const data = await createVideoUpload(req.user, parsed.data);
    res.status(200).json({ success: true, data });
  } catch (err) {
    if (err instanceof PermissionError) { res.status(err.statusCode).json({ error: err.code, message: err.message }); return; }
    console.error('[videoUpload] error', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Could not create upload' });
  }
}

export async function assetStatusController(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'UNAUTHORIZED', message: 'Auth required' }); return; }
  const status = await getAssetStatus(req.user, req.params.uploadId);
  if (!status) { res.status(404).json({ error: 'NOT_FOUND', message: 'Asset not found' }); return; }
  res.status(200).json({ success: true, data: status });
}
```

- [ ] **Step 2: Webhook controller** (raw body, signature-verified)

Create `src/controllers/media.webhook.controller.ts`:
```ts
import { Request, Response } from 'express';
import { mux } from '../config/mux';
import { applyMuxEvent } from '../services/video.service';

// req.body is a Buffer here (see server.ts raw mount for this path).
export async function muxWebhookController(req: Request, res: Response): Promise<void> {
  let event: { type: string; data: any };
  try {
    const raw = (req.body as Buffer).toString('utf8');
    event = mux.webhooks.unwrap(raw, req.headers) as any; // verifies signature, throws on mismatch
  } catch {
    res.status(400).json({ error: 'INVALID_SIGNATURE' });
    return;
  }
  // Ack fast; process without blocking Mux's delivery timeout.
  res.status(200).json({ received: true });
  try { await applyMuxEvent(event); } catch (e) { console.error('[muxWebhook] apply failed', e); }
}
```

- [ ] **Step 3: Register routes**

In `src/routes/media.routes.ts`, add imports and routes:
```ts
import { videoUploadController, assetStatusController } from '../controllers/media.video.controller';
import { muxWebhookController } from '../controllers/media.webhook.controller';

router.post('/video/upload', requireAuth, videoUploadController);
router.get('/asset/:uploadId', requireAuth, assetStatusController);
router.post('/webhooks/mux', muxWebhookController); // no requireAuth — verified by signature
```

- [ ] **Step 4: Mount raw body for the webhook path only**

In `src/server.ts`, **before** `app.use(express.json())`, add:
```ts
// Mux webhook needs the raw body for signature verification.
app.use('/v1/media/webhooks/mux', express.raw({ type: 'application/json' }));
```

- [ ] **Step 5: Verify compile + full suite**

Run: `npx tsc --noEmit && npm test`
Expected: tsc clean; all media-service tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/controllers/media.video.controller.ts src/controllers/media.webhook.controller.ts src/routes/media.routes.ts src/server.ts
git commit -m "feat(media): video upload, asset status, and signed Mux webhook routes"
```

---

# Phase B — events-service (attach)

### Task B1: Extend the Event media subschema

**Files:**
- Modify: `netsa-backend/events-service/src/models/Event.ts` (interface line ~16, schema line ~133-144)

- [ ] **Step 1: Extend the `IEvent.media` type** (replace the `media?:` line ~16)
```ts
  media?: Array<{
    kind: string; url?: string; width?: number; height?: number;
    isHero?: boolean; sortOrder?: number;
    thumbnailUrl?: string; status?: 'processing' | 'ready' | 'errored';
    uploadId?: string; muxPlaybackId?: string; duration?: number; aspectRatio?: string;
  }>;
```

- [ ] **Step 2: Extend the `media` schema block** (the `type: [{ ... }]` at ~134-141)
```ts
      type: [{
        kind: String,
        url: String,
        width: Number,
        height: Number,
        isHero: Boolean,
        sortOrder: Number,
        thumbnailUrl: String,
        status: { type: String, enum: ['processing', 'ready', 'errored'] },
        uploadId: String,
        muxPlaybackId: String,
        duration: Number,
        aspectRatio: String,
      }],
```

- [ ] **Step 3: Verify compile**

Run: `cd netsa-backend/events-service && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/models/Event.ts
git commit -m "feat(events): add video fields to EventMedia subschema"
```

---

### Task B2: Service-token middleware

**Files:**
- Create: `netsa-backend/events-service/src/middleware/serviceAuth.ts`
- Test: `netsa-backend/events-service/src/tests/serviceAuth.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/tests/serviceAuth.test.ts`:
```ts
process.env.INTERNAL_SERVICE_TOKEN = 'secret-token';
import { requireServiceToken } from '../middleware/serviceAuth';

const mockRes = () => { const r: any = {}; r.status = jest.fn(() => r); r.json = jest.fn(() => r); return r; };

describe('requireServiceToken', () => {
  it('rejects a missing/wrong token', () => {
    const res = mockRes(); const next = jest.fn();
    requireServiceToken({ headers: { authorization: 'Bearer nope' } } as any, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
  it('passes the correct token', () => {
    const res = mockRes(); const next = jest.fn();
    requireServiceToken({ headers: { authorization: 'Bearer secret-token' } } as any, res, next);
    expect(next).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- serviceAuth`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement middleware** (constant-time compare)

Create `src/middleware/serviceAuth.ts`:
```ts
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function requireServiceToken(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization || '';
  const provided = header.startsWith('Bearer ') ? header.slice(7) : '';
  const expected = process.env.INTERNAL_SERVICE_TOKEN || '';
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (!expected || a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid service token' });
    return;
  }
  next();
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- serviceAuth`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/middleware/serviceAuth.ts src/tests/serviceAuth.test.ts
git commit -m "feat(events): internal service-token middleware"
```

---

### Task B3: Internal attach endpoint

**Files:**
- Create: `netsa-backend/events-service/src/controllers/internalMedia.ts`
- Create: `netsa-backend/events-service/src/routes/internal.ts`
- Modify: `netsa-backend/events-service/src/server.ts` (mount + before `express.json()` is fine; JSON body is expected here)
- Test: `netsa-backend/events-service/src/tests/internalMediaAttach.integration.test.ts`

- [ ] **Step 1: Write the failing integration test** (mirror the bootstrap in `eventUpdate.integration.test.ts`)

Create `src/tests/internalMediaAttach.integration.test.ts`:
```ts
import request from 'supertest';
import mongoose from 'mongoose';
process.env.JWT_SECRET = 'test-secret';
process.env.INTERNAL_SERVICE_TOKEN = 'svc-token';
import app from '../server';
import Event from '../models/Event';

const ownerId = new mongoose.Types.ObjectId().toString();

async function eventWithProcessingVideo() {
  return Event.create({
    title: 'Kathak Night', description: 'x', eventType: 'showcase', category: 'dance',
    organizerId: ownerId, organizerSnapshot: { name: 'A', organizationName: 'B' },
    status: 'live', visibility: 'public',
    media: [{ kind: 'video', status: 'processing', uploadId: 'up_9', isHero: true, sortOrder: 0 }],
  });
}

describe('POST /internal/events/media/attach', () => {
  it('rejects without the service token', async () => {
    const res = await request(app).post('/internal/events/media/attach').send({ eventId: 'x', uploadId: 'y', status: 'ready' });
    expect(res.status).toBe(401);
  });

  it('flips the matching processing entry to ready with the playbackId', async () => {
    const ev = await eventWithProcessingVideo();
    const res = await request(app)
      .post('/internal/events/media/attach')
      .set('Authorization', 'Bearer svc-token')
      .send({ eventId: ev.id, uploadId: 'up_9', playbackId: 'pb_9', thumbnailUrl: 'https://image.mux.com/pb_9/thumbnail.jpg', duration: 11, aspectRatio: '9:16', status: 'ready' });
    expect(res.status).toBe(200);
    const fresh = await Event.findById(ev.id).lean();
    const m = (fresh!.media as any[])[0];
    expect(m.status).toBe('ready');
    expect(m.muxPlaybackId).toBe('pb_9');
  });

  it('returns 202 when no entry matches yet (race)', async () => {
    const ev = await eventWithProcessingVideo();
    const res = await request(app)
      .post('/internal/events/media/attach')
      .set('Authorization', 'Bearer svc-token')
      .send({ eventId: ev.id, uploadId: 'does-not-exist', playbackId: 'pb', status: 'ready' });
    expect(res.status).toBe(202);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- internalMediaAttach`
Expected: FAIL (route 404s → assertions fail).

- [ ] **Step 3: Implement the controller**

Create `src/controllers/internalMedia.ts`:
```ts
import { Request, Response } from 'express';
import Event from '../models/Event';

// Called by media-service on Mux asset ready/errored. Idempotent.
export async function attachMedia(req: Request, res: Response): Promise<void> {
  const { eventId, uploadId, playbackId, thumbnailUrl, duration, aspectRatio, status } = req.body || {};
  if (!eventId || !uploadId || !status) { res.status(400).json({ error: 'BAD_REQUEST' }); return; }

  const ev = await Event.findById(eventId);
  if (!ev) { res.status(404).json({ error: 'NOT_FOUND' }); return; }

  const entry = (ev.media || []).find((m: any) => m.uploadId === uploadId);
  if (!entry) { res.status(202).json({ pending: true }); return; } // client hasn't PATCHed yet

  entry.status = status;
  if (playbackId) entry.muxPlaybackId = playbackId;
  if (thumbnailUrl) entry.thumbnailUrl = thumbnailUrl;
  if (typeof duration === 'number') entry.duration = duration;
  if (aspectRatio) entry.aspectRatio = aspectRatio;
  ev.markModified('media');
  await ev.save();
  res.status(200).json({ ok: true });
}
```

- [ ] **Step 4: Implement the route**

Create `src/routes/internal.ts`:
```ts
import { Router } from 'express';
import { requireServiceToken } from '../middleware/serviceAuth';
import { attachMedia } from '../controllers/internalMedia';

const router = Router();
router.post('/events/media/attach', requireServiceToken, attachMedia);
export default router;
```

- [ ] **Step 5: Mount it** — in `src/server.ts`, after the `app.use('/v1', eventRoutes)` line add:
```ts
import internalRoutes from './routes/internal';
app.use('/internal', internalRoutes);
```

- [ ] **Step 6: Run to verify it passes**

Run: `npm test -- internalMediaAttach`
Expected: PASS (all three cases).

- [ ] **Step 7: Commit**

```bash
git add src/controllers/internalMedia.ts src/routes/internal.ts src/server.ts src/tests/internalMediaAttach.integration.test.ts
git commit -m "feat(events): internal media attach endpoint (service-token auth)"
```

---

# Phase C — frontend

### Task C1: Extend the EventMedia type

**Files:**
- Modify: `netsa-frontend/src/services/eventService.ts:6-15`

- [ ] **Step 1: Replace the `EventMedia` interface**
```ts
export interface EventMedia {
  kind: 'photo' | 'video';
  url: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
  duration?: number;
  isHero: boolean;
  sortOrder: number;
  // Video (Mux) fields
  status?: 'processing' | 'ready' | 'errored';
  uploadId?: string;
  muxPlaybackId?: string;
  aspectRatio?: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/eventService.ts
git commit -m "feat(events-mobile): add Mux video fields to EventMedia"
```

---

### Task C2: mediaService video methods

**Files:**
- Modify: `netsa-frontend/src/services/mediaService.ts`

- [ ] **Step 1: Add request/response types + methods** (append inside the `mediaService` object)
```ts
    requestVideoUpload: async (request: { entityType: 'event'; entityId: string; purpose: 'gallery' }) => {
        const response = await API.post<{ success: boolean; data: { uploadId: string; uploadUrl: string }; message?: string }>('/media/video/upload', request);
        return response.data;
    },
    getAssetStatus: async (uploadId: string) => {
        const response = await API.get<{ success: boolean; data: { status: 'waiting' | 'asset_created' | 'ready' | 'errored'; playbackId?: string; duration?: number; aspectRatio?: string; error?: string } }>(`/media/asset/${uploadId}`);
        return response.data;
    },
```

- [ ] **Step 2: Commit**

```bash
git add src/services/mediaService.ts
git commit -m "feat(events-mobile): mediaService video upload + status methods"
```

---

### Task C3: uploadVideoFlow

**Files:**
- Modify: `netsa-frontend/src/utils/upload.ts`
- Test: `netsa-frontend/src/utils/__tests__/uploadVideoFlow.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/utils/__tests__/uploadVideoFlow.test.ts`:
```ts
jest.mock('../../services/mediaService', () => ({
  __esModule: true,
  default: { requestVideoUpload: jest.fn().mockResolvedValue({ success: true, data: { uploadId: 'up_x', uploadUrl: 'https://mux/put' } }) },
}));
global.fetch = jest.fn()
  .mockResolvedValueOnce({ blob: async () => new Blob(['x']) } as any) // read local file
  .mockResolvedValueOnce({ ok: true } as any);                          // PUT to Mux

import { uploadVideoFlow } from '../upload';

it('presigns via media-service then PUTs the file to Mux', async () => {
  const res = await uploadVideoFlow({ asset: { uri: 'file://v.mp4', mimeType: 'video/mp4' } as any, entityType: 'event', entityId: 'e1', purpose: 'gallery' });
  expect(res).toEqual({ success: true, uploadId: 'up_x' });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest src/utils/__tests__/uploadVideoFlow.test.ts`
Expected: FAIL (`uploadVideoFlow` not exported).

- [ ] **Step 3: Implement**

Append to `src/utils/upload.ts`:
```ts
import mediaServiceDefault from '../services/mediaService';

export async function uploadVideoFlow(options: {
  asset: ImagePickerAsset;
  entityType: 'event';
  entityId: string;
  purpose: 'gallery';
  onProgress?: (p: number) => void;
}): Promise<{ success: boolean; uploadId?: string; error?: string }> {
  const { asset, entityType, entityId, purpose } = options;
  try {
    const presign = await mediaServiceDefault.requestVideoUpload({ entityType, entityId, purpose });
    if (!presign.success) return { success: false, error: presign.message };

    const fileRes = await fetch(asset.uri);
    const blob = await fileRes.blob();
    const put = await fetch(presign.data.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': asset.mimeType || 'video/mp4' },
      body: blob,
    });
    if (!put.ok) return { success: false, error: `Upload failed (${put.status})` };
    return { success: true, uploadId: presign.data.uploadId };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Upload failed' };
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx jest src/utils/__tests__/uploadVideoFlow.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/upload.ts src/utils/__tests__/uploadVideoFlow.test.ts
git commit -m "feat(events-mobile): uploadVideoFlow (media-service presign + Mux PUT)"
```

---

### Task C4: Step6Media video branch + processing/errored tiles + poll

**Files:**
- Modify: `netsa-frontend/src/components/events/composer/steps/Step6Media.tsx`
- Test: `netsa-frontend/src/components/events/__tests__/Step6Media.video.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/events/__tests__/Step6Media.video.test.tsx`:
```tsx
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Step6Media from '../composer/steps/Step6Media';
import { useCreateEventStore } from '@/stores/createEventStore';
import * as ImagePicker from 'expo-image-picker';
import { uploadVideoFlow } from '@/utils/upload';

jest.mock('@/utils/upload', () => ({ uploadVideoFlow: jest.fn(), uploadMediaFlow: jest.fn() }));
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn(), MediaTypeOptions: { All: 'All' } }));
jest.mock('@/services/mediaService', () => ({ __esModule: true, default: { getAssetStatus: jest.fn().mockResolvedValue({ data: { status: 'processing' } }) } }));

const EVENT_ID = '60d5ec9af682fbd12a892c41';

it('video pick → uploadVideoFlow + a processing entry (no S3, no <Image> on a video url)', async () => {
  useCreateEventStore.getState().reset();
  useCreateEventStore.setState({ editMode: true, editEventId: EVENT_ID });
  (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({ canceled: false, assets: [{ uri: 'file://v.mp4', type: 'video', mimeType: 'video/mp4', width: 720, height: 1280, duration: 12 }] });
  (uploadVideoFlow as jest.Mock).mockResolvedValue({ success: true, uploadId: 'up_1' });

  const { getByLabelText } = render(<Step6Media onNext={jest.fn()} onBack={jest.fn()} />);
  fireEvent.press(getByLabelText('Add photo'));

  await waitFor(() => expect(uploadVideoFlow).toHaveBeenCalled());
  const media = useCreateEventStore.getState().form.media;
  expect(media[0]).toEqual(expect.objectContaining({ kind: 'video', status: 'processing', uploadId: 'up_1' }));
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest Step6Media.video`
Expected: FAIL (video path not implemented → `uploadVideoFlow` not called).

- [ ] **Step 3: Implement the branch** — in `Step6Media.tsx`, update the imports and the upload body inside `pick()` after the asset is chosen:
```tsx
import { uploadMediaFlow, uploadVideoFlow } from '@/utils/upload';
```
Replace the `try { ... }` block that currently calls `uploadMediaFlow` with:
```tsx
    try {
      const isVideo = asset.type === 'video';
      if (isVideo) {
        const uploaded = await uploadVideoFlow({ asset, entityType: 'event', entityId: editEventId, purpose: 'gallery' });
        if (!uploaded.success || !uploaded.uploadId) throw new Error(uploaded.error ?? 'Upload failed');
        const entry: EventMedia = {
          kind: 'video', url: '', status: 'processing', uploadId: uploaded.uploadId,
          width: asset.width ?? 1080, height: asset.height ?? 1080, duration: asset.duration ?? undefined,
          isHero: form.media.length === 0, sortOrder: form.media.length,
        };
        update('media', [...form.media, entry]);
      } else {
        const uploaded = await uploadMediaFlow({ asset, entityType: 'event', entityId: editEventId, purpose: 'gallery' });
        if (!uploaded.success || !uploaded.url) throw new Error(uploaded.error ?? 'Upload returned no URL');
        const entry: EventMedia = {
          kind: 'photo', url: uploaded.url, thumbnailUrl: uploaded.url,
          width: asset.width ?? 1080, height: asset.height ?? 1080,
          isHero: form.media.length === 0, sortOrder: form.media.length,
        };
        update('media', [...form.media, entry]);
      }
    } catch {
      Alert.alert('Upload failed', 'Try again or pick a different file.');
    } finally {
      setUploading(false);
    }
```

- [ ] **Step 4: Render processing/errored/ready tiles** — in the grid `.map`, replace the media cell body so a video entry shows its state (add above the existing `<Image>`):
```tsx
              {m.kind === 'video' && m.status !== 'ready' ? (
                <View style={styles.fallbackCell}>
                  <Text style={styles.makeHeroText}>{m.status === 'errored' ? 'Failed — remove' : 'Processing…'}</Text>
                </View>
              ) : m.kind === 'video' && m.muxPlaybackId ? (
                <Image source={{ uri: m.thumbnailUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : m.url === NETSA_FALLBACK_URL ? (
                <View style={styles.fallbackCell}><Text style={styles.fallbackMonogram}>N</Text></View>
              ) : (
                <Image source={{ uri: m.thumbnailUrl ?? m.url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              )}
```
(Remove the old single `{m.url === NETSA_FALLBACK_URL ? ... : <Image/>}` ternary it replaces.)

- [ ] **Step 5: Poll processing videos** — add near the top of the component:
```tsx
import mediaService from '@/services/mediaService';
import { useEffect } from 'react';
```
```tsx
  useEffect(() => {
    const processing = form.media.filter((m) => m.kind === 'video' && m.status === 'processing' && m.uploadId);
    if (processing.length === 0) return;
    const t = setInterval(async () => {
      for (const m of processing) {
        try {
          const r = await mediaService.getAssetStatus(m.uploadId!);
          const s = r.data.status;
          if (s === 'ready' || s === 'errored') {
            update('media', form.media.map((x) => x.uploadId === m.uploadId
              ? { ...x, status: s === 'ready' ? 'ready' : 'errored', muxPlaybackId: r.data.playbackId, thumbnailUrl: r.data.playbackId ? `https://image.mux.com/${r.data.playbackId}/thumbnail.jpg?time=1` : x.thumbnailUrl }
              : x));
          }
        } catch { /* keep polling */ }
      }
    }, 4000);
    return () => clearInterval(t);
  }, [form.media, update]);
```

- [ ] **Step 6: Run to verify it passes** (and the earlier presign test still passes)

Run: `npx jest Step6Media`
Expected: both `Step6Media.presign` and `Step6Media.video` PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/events/composer/steps/Step6Media.tsx src/components/events/__tests__/Step6Media.video.test.tsx
git commit -m "feat(events-mobile): video branch, processing tiles, and status polling in composer"
```

---

### Task C5: EventVideo player component

**Files:**
- Create: `netsa-frontend/src/components/events/EventVideo.tsx`

- [ ] **Step 1: Implement** (uses `expo-video`, already a dependency)

Create `src/components/events/EventVideo.tsx`:
```tsx
import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, View } from 'react-native';

export default function EventVideo({ playbackId, style }: { playbackId: string; style?: any }) {
  const player = useVideoPlayer(`https://stream.mux.com/${playbackId}.m3u8`, (p) => {
    p.loop = true;
    p.muted = true;
  });
  return (
    <View style={[styles.wrap, style]}>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls />
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { overflow: 'hidden', backgroundColor: '#000' } });
```

- [ ] **Step 2: Verify it imports cleanly**

Run: `npx jest --listTests | head -1` (smoke — confirms transform config resolves `expo-video`) or type-check the file per your tsc flow.

- [ ] **Step 3: Commit**

```bash
git add src/components/events/EventVideo.tsx
git commit -m "feat(events-mobile): EventVideo (Mux HLS) player component"
```

---

### Task C6: Play video where the poster hero renders

**Files:**
- Modify: `netsa-frontend/src/components/events/manage/PosterHero.tsx:137`

- [ ] **Step 1: Swap the static poster for the player when the hero is a ready video** — at `PosterHero.tsx:137`, where it currently renders `source={{ uri: item.kind === 'video' ? item.thumbnailUrl ?? item.url : item.url }}` in an `<Image>`, branch:
```tsx
import EventVideo from '../EventVideo';
// ...
{item.kind === 'video' && item.muxPlaybackId ? (
  <EventVideo playbackId={item.muxPlaybackId} style={StyleSheet.absoluteFill} />
) : (
  <Image source={{ uri: item.kind === 'video' ? item.thumbnailUrl ?? item.url : item.url }} /* keep existing props */ />
)}
```

- [ ] **Step 2: Verify the app still bundles**

Run: `npx jest PosterHero 2>/dev/null || true` (if a smoke test exists) and confirm no type errors in the touched file per your tsc flow.

- [ ] **Step 3: Commit**

```bash
git add src/components/events/manage/PosterHero.tsx
git commit -m "feat(events-mobile): play Mux video in the poster hero"
```

---

# Phase D — wiring & manual verification

### Task D1: Local end-to-end run + Mux webhook registration

**Files:** none (ops). Env values only.

- [ ] **Step 1: Set env** — in `netsa-backend/media-service/.env`: `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, `MUX_WEBHOOK_SECRET`, `INTERNAL_SERVICE_TOKEN`, `EVENTS_SERVICE_URL=http://localhost:5003`. In `netsa-backend/events-service/.env`: the same `INTERNAL_SERVICE_TOKEN`.

- [ ] **Step 2: Start services** — run media-service (:5004) and events-service (:5003) per your local dev runtime.

- [ ] **Step 3: Expose media-service + register the webhook** — `ngrok http 5004`; in the Mux dashboard (Settings → Webhooks, same environment as the token) create a webhook at `https://<ngrok>/v1/media/webhooks/mux`; copy its signing secret into `MUX_WEBHOOK_SECRET` and restart media-service.

- [ ] **Step 4: Manual happy path** — in the app, open an existing event → Edit → Media step → pick a short (<60s) video. Expect: a "Processing…" tile; within ~seconds it flips to a poster thumbnail; the event doc's media entry gains `status:'ready'` + `muxPlaybackId`.

- [ ] **Step 5: Manual sad paths** — (a) pick a >60s clip → tile ends "Failed — remove". (b) In Mux dashboard, use "Send test" for `video.asset.ready` → 200 returned; a mismatched-signature POST (e.g. via curl with a bad `mux-signature`) → 400.

- [ ] **Step 6: Append a live-QA note** — per the project's live-QA convention, add a short human-run section to `DOCS/QA/event-flow-live-qa.md` for the video path (auth + native + Mux paths auto-tests can't cover).

- [ ] **Step 7: Commit any env.example / docs**

```bash
git add -A && git commit -m "docs(video): phase-1 local run + Mux webhook setup notes"
```

---

## Self-Review (completed by author)

- **Spec coverage:** upload endpoint (A5/A7), signed webhook (A7) + idempotent state machine (A6), `MediaAsset` (A4), events-service schema (B1) + internal attach (B2/B3), frontend `uploadVideoFlow` (C3) + composer branch/processing/poll (C4) + `EventVideo` (C5) + hero playback (C6), optimistic UX (C4), edit-mode-only (C4 reuses `editEventId` guard), 60s cap (A3/A6), security (A7 signature, B2 token, ownership reuse in A5), local run (D1). All spec sections map to a task.
- **Placeholder scan:** no TBD/TODO; every code step shows code.
- **Type consistency:** `uploadId`/`playbackId`/`muxPlaybackId`/`status` names are consistent across MediaAsset (A4) → attach (A6) → events schema (B1) → EventMedia (C1) → composer (C4).

**Known soft spot:** Task C6 anchors on `PosterHero.tsx:137` (a `manage` surface). The public event-detail cover renderer was not pinned during planning; if a separate detail-hero component exists, apply the same `kind==='video' && muxPlaybackId → <EventVideo>` swap there too (search `app/(app)/events/[id]/index.tsx` and its imported cover/hero component).
