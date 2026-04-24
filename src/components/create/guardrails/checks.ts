// netsa-mobile/src/components/create/guardrails/checks.ts

export type Severity = 'hard' | 'soft' | 'trust';

export interface GuardrailIssue {
  id: string;                // stable id, e.g. 'MODEL_NUDITY_REQUIRED'
  severity: Severity;
  message: string;           // hirer-facing copy
  field?: string;            // dot-path hint for inline UI, e.g. 'modelDetails.nudityLevel'
}

// Minimum form-state shape the checks read. Mirrors GigFormV2's state.
// Kept loose with index signature so tests can pass partial shapes.
export interface CheckableFormState {
  artistTypes?: string[];
  eventFunction?: string;
  ageRange?: { min?: number; max?: number };
  heightRequirements?: {
    male?: { min?: string | number; max?: string | number };
    female?: { min?: string | number; max?: string | number };
  };
  compensation?: {
    model?: string;
    /** Client-side UX flag — one of 'fixed' | 'range' | 'tbd'. Separate from
     * `model` (the payment unit) because 'tbd' means "no amount disclosed"
     * and lives in UI state, not the backend payload. Post-code-review P1-1
     * fix: checks that used to read `model === 'tbd'` now read this field. */
    structure?: string;
    amount?: string | number;
    minAmount?: string | number;
    maxAmount?: string | number;
    negotiable?: boolean;
  };
  title?: string;
  description?: string;
  schedule?: { startDate?: string };
  applicationDeadline?: string;
  location?: { venueName?: string; address?: string };
  modelDetails?: { nudityLevel?: string; shootType?: string };
  musicDetails?: { turnaroundDays?: number | string };
  isUrgent?: boolean;
  isFeatured?: boolean;
  [key: string]: unknown;
}

// Private helpers

function parseNum(v: unknown): number | undefined {
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && v.trim().length) {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function isPast(iso: string): boolean {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

const PRIVATE_VENUE_KEYWORDS = /\b(home|residence|apartment|flat|pg|house|villa|bungalow)\b/i;

// ── Public: HARD checks (must resolve before publish) ──────────────

export function runHardChecks(state: CheckableFormState): GuardrailIssue[] {
  const issues: GuardrailIssue[] = [];
  const types = state.artistTypes ?? [];

  // 1. Model without nudityLevel
  if (types.includes('Model') && !state.modelDetails?.nudityLevel) {
    issues.push({
      id: 'MODEL_NUDITY_REQUIRED',
      severity: 'hard',
      message: "Nudity level required for model gigs. Select 'None' if not applicable.",
      field: 'modelDetails.nudityLevel',
    });
  }

  // 1b. Model without shootType
  if (types.includes('Model') && !state.modelDetails?.shootType) {
    issues.push({
      id: 'MODEL_SHOOTTYPE_REQUIRED',
      severity: 'hard',
      message: 'Shoot type required for model gigs.',
      field: 'modelDetails.shootType',
    });
  }

  // 2. Unpaid nudity
  if (
    state.modelDetails?.nudityLevel &&
    state.modelDetails.nudityLevel !== 'None' &&
    state.compensation?.structure === 'tbd'
  ) {
    issues.push({
      id: 'UNPAID_NUDITY',
      severity: 'hard',
      message: 'Nudity gigs must specify paid compensation. Update the pay structure on Page 2.',
      field: 'compensation.structure',
    });
  }

  // 5. Missing required fields — backend Zod rejects empty title/artistTypes/
  // eventFunction/description with a cryptic error. Friendlier to surface as
  // an inline hard block. Post-code-review P1-3 fix.
  if (!state.title || state.title.trim().length === 0) {
    issues.push({
      id: 'MISSING_TITLE',
      severity: 'hard',
      message: 'Title is required. Go back to Page 1 and enter a gig title.',
      field: 'title',
    });
  }
  if (!state.artistTypes || state.artistTypes.length === 0) {
    issues.push({
      id: 'MISSING_PERFORMER_TYPE',
      severity: 'hard',
      message: 'At least one performer type is required. Go back to Page 1 and select.',
      field: 'artistTypes',
    });
  }
  if (!state.eventFunction || state.eventFunction.trim().length === 0) {
    issues.push({
      id: 'MISSING_EVENT_FUNCTION',
      severity: 'hard',
      message: 'Event function is required. Go back to Page 1 and pick or type one.',
      field: 'eventFunction',
    });
  }
  if (!state.description || state.description.trim().length === 0) {
    issues.push({
      id: 'MISSING_DESCRIPTION',
      severity: 'hard',
      message: 'Description is required. Go back to Page 4 and add a description.',
      field: 'description',
    });
  }

  // 3. Underage + adult context
  if (
    parseNum(state.ageRange?.min) !== undefined &&
    (parseNum(state.ageRange?.min) as number) < 18 &&
    state.modelDetails?.nudityLevel &&
    state.modelDetails.nudityLevel !== 'None'
  ) {
    issues.push({
      id: 'UNDERAGE_ADULT',
      severity: 'hard',
      message: 'Roles involving minors cannot require nudity. Raise the minimum age or set nudity to None.',
      field: 'modelDetails.nudityLevel',
    });
  }

  // 4. Past date
  if (state.schedule?.startDate && isPast(state.schedule.startDate)) {
    issues.push({
      id: 'PAST_DATE',
      severity: 'hard',
      message: 'Start date must be today or later.',
      field: 'schedule.startDate',
    });
  }

  return issues;
}

// ── Public: SOFT nudges (warn, don't block) ─────────────────────────

export function runSoftChecks(state: CheckableFormState): GuardrailIssue[] {
  const issues: GuardrailIssue[] = [];

  // TBD pay (reads structure, not model — post-code-review P1-1 fix)
  if (state.compensation?.structure === 'tbd') {
    issues.push({
      id: 'TBD_PAY',
      severity: 'soft',
      message: 'Gigs with no pay disclosed get ~40% fewer quality applicants. Consider posting a range.',
      field: 'compensation',
    });
  }

  // Narrow age window
  const aMin = parseNum(state.ageRange?.min);
  const aMax = parseNum(state.ageRange?.max);
  if (aMin !== undefined && aMax !== undefined && aMax - aMin < 5) {
    issues.push({
      id: 'NARROW_AGE',
      severity: 'soft',
      message: 'Narrow age filter reduces applicant pool. Most hirers widen by 20%.',
      field: 'ageRange',
    });
  }

  // Narrow height window (inches)
  const hMinM = parseNum(state.heightRequirements?.male?.min);
  const hMaxM = parseNum(state.heightRequirements?.male?.max);
  if (hMinM !== undefined && hMaxM !== undefined && hMaxM - hMinM < 0.25) {
    // 0.25 ft = 3 inches
    issues.push({
      id: 'NARROW_HEIGHT',
      severity: 'soft',
      message: 'Narrow height filter reduces applicant pool. Most hirers widen by 3 inches.',
      field: 'heightRequirements',
    });
  }

  // Multi-type overload at 3
  if ((state.artistTypes?.length ?? 0) >= 3) {
    issues.push({
      id: 'MULTI_TYPE_OVERLOAD',
      severity: 'soft',
      message: 'Posting for 3 different performer types? Consider splitting into separate gigs for better matches.',
      field: 'artistTypes',
    });
  }

  // Private venue
  const venueText = `${state.location?.venueName ?? ''} ${state.location?.address ?? ''}`.toLowerCase();
  if (PRIVATE_VENUE_KEYWORDS.test(venueText)) {
    issues.push({
      id: 'PRIVATE_VENUE',
      severity: 'soft',
      message: 'Auditions at private residences carry safety risk. Consider a public venue or verified workspace.',
      field: 'location',
    });
  }

  // Short application window
  if (state.applicationDeadline && !state.isUrgent) {
    const deadlineMs = new Date(state.applicationDeadline).getTime();
    if (Number.isFinite(deadlineMs) && deadlineMs - Date.now() < 48 * 60 * 60 * 1000) {
      issues.push({
        id: 'SHORT_APPLICATION_WINDOW',
        severity: 'soft',
        message: 'Short application window. Consider extending or marking urgent.',
        field: 'applicationDeadline',
      });
    }
  }

  return issues;
}

// ── Public: TRUST signals (non-blocking, surface in preview) ────────

export function runTrustSignals(state: CheckableFormState): GuardrailIssue[] {
  const signals: GuardrailIssue[] = [];

  // Reads structure, not model — post-code-review P1-1 fix
  if (state.compensation?.structure === 'tbd') {
    signals.push({
      id: 'LOW_PAY_TRANSPARENCY',
      severity: 'trust',
      message: 'Pay transparency score: low. Verified hirers with disclosed pay get 2× faster fills.',
      field: 'compensation',
    });
  }

  if (state.isFeatured === true) {
    signals.push({
      id: 'FEATURED_UNVERIFIED',
      severity: 'trust',
      message: 'Featured flag available once your Trust tier reaches Rising. Soft-allowed in MVP.',
      field: 'isFeatured',
    });
  }

  return signals;
}
