/**
 * Feature flags for artist-search-v2 rollout.
 *
 * Flags are read from EXPO_PUBLIC_* env vars at build time.
 * Env vars are inlined into the client bundle, so their values cannot change at runtime.
 */

/**
 * Returns true if SEARCH_PEOPLE_V2 is enabled.
 *
 * When true:
 * - New ranking pipeline (v2) with intent classification + PyMK is used
 * - New search results page with PyMK carousel, similar artists rail, etc. is visible
 *
 * Default: false (v1 ranking, legacy search UI)
 */
export function searchPeopleV2Enabled(): boolean {
  return process.env.EXPO_PUBLIC_SEARCH_PEOPLE_V2 === 'true';
}
