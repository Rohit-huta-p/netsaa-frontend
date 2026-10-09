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

/**
 * Returns true if contracts are enabled.
 *
 * Contracts are DISABLED by default (preserve-but-dormant): the
 * contract-first booking flow and the home-screen contract strips stay in
 * the codebase but make NO network calls — so nothing hits
 * `GET /v1/users/me/contracts`. Flip EXPO_PUBLIC_CONTRACTS_ENABLED=true to
 * re-enable the whole feature.
 *
 * Default: false.
 */
export function contractsEnabled(): boolean {
  return process.env.EXPO_PUBLIC_CONTRACTS_ENABLED === 'true';
}
