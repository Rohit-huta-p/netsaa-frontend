/**
 * Field-scoped diff for the event "Edit in Preview" auto-save.
 *
 * The composer's `buildEventPayload()` produces the FULL v4 event body. Auto-saving
 * that whole body on every keystroke is unsafe: `eventToForm()` is lossy by its own
 * doc (refund-enum heuristic, multi-spot collapse), so a full PATCH would silently
 * rewrite fields the host never touched. Instead we diff the live payload against the
 * one captured at hydrate and send ONLY the top-level keys that actually changed.
 *
 * The events-service PATCH is field-scoped on its side too — `buildComposerUpdate`
 * only writes keys present in the body (`has(k)` guards every write) and the whitelist
 * path copies verbatim — so a minimal diff applies with zero blast radius.
 *
 * A key whose live value is `undefined` (e.g. `buildEventPayload` drops an empty
 * optional like `tagline` via `|| undefined`) against a non-empty base is a CLEARED
 * field: we send an empty value of the base's type so the clear reaches the server.
 * Sending nothing would leave the old value, and it would reappear on reload.
 */

/** The empty value to send when a field is cleared, matching the base value's type. */
export function clearedValue(base: unknown): '' | [] | null {
  if (typeof base === 'string') return '';
  if (Array.isArray(base)) return [];
  return null;
}

/** Stable compare key — `undefined` normalises to `null` so a dropped and an
 *  explicit-null field compare equal and never produce a phantom change. */
function stable(v: unknown): string {
  return JSON.stringify(v === undefined ? null : v);
}

/**
 * Top-level diff of two event payloads. Returns only the keys whose JSON changed.
 * A key that is now `undefined` (dropped or explicitly cleared) but was set in the
 * base is emitted as the type-matched empty value so the clear is persisted.
 * An empty result means nothing changed — the caller sends no request.
 */
export function diffEventPayload(
  base: Record<string, any>,
  next: Record<string, any>,
): Record<string, any> {
  const patch: Record<string, any> = {};
  const keys = new Set([...Object.keys(base), ...Object.keys(next)]);
  for (const k of keys) {
    const nextVal = next[k];
    const baseVal = base[k];
    if (stable(baseVal) === stable(nextVal)) continue; // unchanged
    patch[k] = nextVal === undefined ? clearedValue(baseVal) : nextVal;
  }
  return patch;
}

/* ─────────────────────────── PATCH routing ───────────────────────────
 * The events-service PATCH has TWO code paths (controllers/events.ts +
 * services/composerMapping.ts, verified vs origin/main):
 *   · isComposerPatch(body) → buildComposerUpdate — field-scoped, `has(k)` guards
 *     every write, mirrors `tags`←topicTags, merges location, recomputes schedule.
 *   · otherwise → a narrow UPDATE_WHITELIST copied verbatim.
 * A minimal diff is right MOST of the time, but a few keys are mishandled by the
 * whitelist path when they travel ALONE (no composer key to trigger the richer
 * path). buildEventPatch() fixes those up so both save senders agree. */

/** Keys whose presence in a PATCH body routes the server to buildComposerUpdate
 *  (mirrors events-service COMPOSER_PATCH_KEYS). */
const COMPOSER_PATCH_KEYS = new Set<string>([
  'about', 'spots', 'offers', 'registration', 'registrationMode', 'people', 'lineup',
  'bring', 'included', 'coverFit', 'skillLevel', 'eligibleArtistTypes', 'otherArtistTypes',
  'openToAll', 'eventTypeLabel', 'ageRestriction', 'cancellationPolicy', 'timeTbd', 'languages',
]);

/** Keys the narrow whitelist path handles WRONG when they arrive without a
 *  composer key of their own, so we must force the composer path:
 *   · eventType — not whitelisted at all → silently dropped.
 *   · topicTags / skills — whitelisted, but only the composer path mirrors the
 *     legacy `tags` field that feed/search read; verbatim leaves `tags` stale.
 *   · location — the whitelist $sets the whole subdoc (no field merge, no
 *     kind→type mapping); the composer path merges + maps.
 *   · startsAt / endsAt / durationKind — written verbatim without recomputing the
 *     derived `schedule`. */
const NEEDS_COMPOSER_KEYS = new Set<string>([
  'eventType', 'topicTags', 'skills', 'location', 'startsAt', 'endsAt', 'durationKind',
]);

const hasComposerKey = (keys: string[]) => keys.some((k) => COMPOSER_PATCH_KEYS.has(k));

/** The schedule is recomputed server-side from the WHOLE date group — `buildComposerUpdate`
 *  reads `endsAt`/`durationKind`/`timeTbd` as `has(k) ? b[k] : <default>`, and a partial
 *  body (e.g. startsAt alone) defaults endsAt to undefined, collapsing a multi-day end. So
 *  whenever any date field changes, send the full group at its current value. */
const DATE_GROUP_KEYS = ['startsAt', 'endsAt', 'durationKind', 'timeTbd'];

export interface EventPatch {
  /** The PATCH body to send. Empty object ⇒ nothing to save. */
  body: Record<string, any>;
  /** Payload keys whose base snapshot the caller advances on success — the
   *  genuinely-changed keys only (never a routing sentinel, never a dropped
   *  blank title). */
  advance: string[];
}

/**
 * Turn a (base → next) payload diff into the exact PATCH body to send, applying the
 * cross-cutting rules the raw diff can't see — used by BOTH the debounced save AND the
 * unmount flush so a change committed just before "Done" is never dropped:
 *   1. never PATCH a blank/whitespace title — the backend rejects it (4xx), which
 *      would revert the host's *other* in-flight edits too; drop it from the body.
 *   2. never PATCH a transiently-invalid spot (capacity < 1, or price < 1 on a paid
 *      event) — a cleared price/capacity box is mid-edit, not a real value; drop the
 *      spots/pricing/capacity keys until it's valid again.
 *   3. send the whole date group when any date field changes (schedule is recomputed
 *      server-side from the full group).
 *   4. force the server's composer path (idempotent `openToAll` sentinel, a no-op
 *      write) whenever the diff carries a NEEDS_COMPOSER key but no composer key.
 */
export function buildEventPatch(base: Record<string, any>, next: Record<string, any>): EventPatch {
  const patch = diffEventPayload(base, next);
  // (1) a blank/whitespace title must never reach the server.
  if (typeof patch.title === 'string' && !patch.title.trim()) delete patch.title;
  // (2) a transiently-invalid spot (cleared capacity/price box) must never be sent.
  if ('spots' in patch) {
    const paid = next.registrationMode === 'paid_ticket';
    const invalid = (next.spots || []).some((sp: any) => (sp?.capacity ?? 0) < 1 || (paid && (sp?.price ?? 0) < 1));
    if (invalid) { delete patch.spots; delete patch.pricing; delete (patch as any).capacity; }
  }
  // (3) date group — if any date field changed, escort the whole group at its current
  //     value so the server recomputes `schedule` from a complete picture.
  if (DATE_GROUP_KEYS.some((k) => k in patch)) {
    for (const k of DATE_GROUP_KEYS) if (!(k in patch) && next[k] !== undefined) patch[k] = next[k];
  }
  const advance = Object.keys(patch);
  if (advance.length === 0) return { body: {}, advance };
  // (4) force composer routing, idempotently, when a mishandled key travels alone.
  if (!hasComposerKey(advance) && advance.some((k) => NEEDS_COMPOSER_KEYS.has(k))) {
    patch.openToAll = next.openToAll; // a composer key at its current value → routes + writes nothing new
  }
  return { body: patch, advance };
}
