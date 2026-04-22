/**
 * Trust-tier thresholds + progress math.
 *
 * NOTE: These thresholds are CLIENT-SIDE PLACEHOLDERS.
 * The real Trust Engine backend is not built yet — it lands in Plan 6
 * per the NETSA MVP plan. Until then, the client shows a progress bar
 * based on whatever `trustScore` the user record carries.
 *
 * Source of truth for final thresholds + weights:
 *   DOCS/NETSA_Dashboard_ModeToggle_Design_v1.md §TBD (Trust Engine spec).
 *
 * Current placeholder ranges (0–100 score):
 *   new       : 0  – 24
 *   rising    : 25 – 49
 *   trusted   : 50 – 79
 *   verified  : 80 – 100
 */

export type TrustTier = 'new' | 'rising' | 'trusted' | 'verified';

export interface TierThreshold {
  tier: TrustTier;
  min: number;
  max: number; // inclusive upper bound for `verified`; exclusive for others
}

/**
 * Tier ranges in ascending order.
 * A score s belongs to tier T when T.min <= s and (s < nextTier.min || tier is top).
 */
export const TRUST_TIER_THRESHOLDS: readonly TierThreshold[] = [
  { tier: 'new', min: 0, max: 25 },
  { tier: 'rising', min: 25, max: 50 },
  { tier: 'trusted', min: 50, max: 80 },
  { tier: 'verified', min: 80, max: 100 },
] as const;

export interface TierProgress {
  currentTier: TrustTier;
  nextTier: TrustTier | null;
  currentScore: number;
  /** Points needed to reach the next tier floor. 0 once at verified cap. */
  pointsToNext: number;
  /** Progress within current tier, 0–100. 100 when at verified top. */
  progressPct: number;
}

/**
 * Compute the tier + progress bar state for a given trust score.
 * Clamps score to [0, 100].
 */
export function computeTierProgress(score: number): TierProgress {
  const clamped = Math.max(0, Math.min(100, score));

  // Find current tier: the last threshold whose min <= clamped.
  // For verified (top), use min <= 100 and include the 100 boundary.
  let currentIdx = 0;
  for (let i = 0; i < TRUST_TIER_THRESHOLDS.length; i++) {
    const t = TRUST_TIER_THRESHOLDS[i];
    const isTop = i === TRUST_TIER_THRESHOLDS.length - 1;
    const withinRange = isTop
      ? clamped >= t.min // top tier: everything at or above 80 is verified
      : clamped >= t.min && clamped < t.max;
    if (withinRange) {
      currentIdx = i;
      break;
    }
  }

  const current = TRUST_TIER_THRESHOLDS[currentIdx];
  const isTop = currentIdx === TRUST_TIER_THRESHOLDS.length - 1;
  const nextTier: TrustTier | null = isTop
    ? null
    : TRUST_TIER_THRESHOLDS[currentIdx + 1].tier;

  // Progress within the current tier.
  const tierSpan = current.max - current.min;
  let progressPct: number;
  let pointsToNext: number;

  if (isTop) {
    // verified: span is 80–100. Report progress within that span.
    const span = current.max - current.min; // 20
    const rawPct = span === 0 ? 0 : ((clamped - current.min) / span) * 100;
    progressPct = Math.max(0, Math.min(100, rawPct));
    pointsToNext = Math.max(0, current.max - clamped);
  } else {
    const rawPct = tierSpan === 0 ? 0 : ((clamped - current.min) / tierSpan) * 100;
    progressPct = Math.max(0, Math.min(100, rawPct));
    pointsToNext = Math.max(0, current.max - clamped);
  }

  return {
    currentTier: current.tier,
    nextTier,
    currentScore: clamped,
    pointsToNext,
    progressPct,
  };
}
