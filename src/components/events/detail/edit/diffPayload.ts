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
