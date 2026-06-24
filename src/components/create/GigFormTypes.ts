// netsa-mobile/src/components/create/GigFormTypes.ts
//
// Shared types between legacy GigForm and new GigFormV2. Both forms
// expose the same imperative-ref handle so the parent route's
// useStepBackGuard plumbing works identically for either.

export interface GigFormHandle {
  /** Parent back-button handler. Return true if handled (stayed on form), false to allow exit. */
  handleBack: () => boolean;
}
