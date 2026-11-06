/**
 * Runtime feature flags read from EXPO_PUBLIC_* env vars at build time.
 * Env vars are inlined into the client bundle, so their values cannot change
 * at runtime.
 */

/**
 * Returns true if the E·9 photo-led event detail page (V3) is enabled.
 * `/events/[id]` then renders the photo-led layout; otherwise the current v2 page.
 * Default: false.
 */
export function eventDetailV3Enabled(): boolean {
  return process.env.EXPO_PUBLIC_EVENT_DETAIL_V3 === 'true';
}
