// netsa-mobile/src/hooks/useFeatureFlags.ts
//
// Central place to read runtime feature flags from env vars. All flags use
// the EXPO_PUBLIC_FEATURE_* prefix so Expo bundles them into the client at
// build time. Default is "off" for every flag — a missing env var means
// the feature is NOT enabled.
//
// Wrapped in useMemo so the return identity is stable across re-renders.
// Downstream consumers can safely use flags in useEffect deps without
// triggering false re-runs. Empty deps array is correct — env vars are
// inlined at build time, so their values cannot change at runtime.

import { useMemo } from 'react';

export interface FeatureFlags {
  /** Plan 5 — new 5-page GigForm vs legacy 10-step wizard. */
  newGigForm: boolean;
}

export function useFeatureFlags(): FeatureFlags {
  return useMemo<FeatureFlags>(
    () => ({
      newGigForm: process.env.EXPO_PUBLIC_FEATURE_NEW_GIG_FORM === 'true',
    }),
    []
  );
}

export default useFeatureFlags;
