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
  /** Spotlight — editorial artist profile (SpotlightProfile) vs legacy ProfileScreen. */
  spotlightProfile: boolean;
  /** Creative Lead — company/org profile page (CreativeLeadProfile) vs the artist/performer fallback. */
  creativeLeadProfile: boolean;
  /** Events — v4 "one form for every event" composer vs legacy ComposerShell. */
  eventComposerV4: boolean;
  /** Media — in-app pan/zoom cropper (MediaCropper) for avatar/cover/event-poster/logo uploads. */
  mediaCropper: boolean;
}

export function useFeatureFlags(): FeatureFlags {
  return useMemo<FeatureFlags>(
    () => ({
      newGigForm: process.env.EXPO_PUBLIC_FEATURE_NEW_GIG_FORM === 'true',
      spotlightProfile: process.env.EXPO_PUBLIC_FEATURE_SPOTLIGHT_PROFILE === 'true',
      creativeLeadProfile: process.env.EXPO_PUBLIC_FEATURE_CL_PROFILE === 'true',
      eventComposerV4: process.env.EXPO_PUBLIC_FEATURE_EVENT_V4 === 'true',
      mediaCropper: process.env.EXPO_PUBLIC_FEATURE_MEDIA_CROPPER === 'true',
    }),
    []
  );
}

export default useFeatureFlags;
