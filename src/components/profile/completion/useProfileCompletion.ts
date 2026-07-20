import { computeOverallScore, computeMissing, meetsMinimumApplyGate } from '@/components/profile/ProfileStrengthWidget';
import { useAuthStore } from '@/stores/authStore';
import { enrichMissing, type InterviewField } from './interviewFieldMeta';

type Tier = 'new' | 'rising' | 'trusted' | 'verified';

export interface ProfileCompletion {
  score: number;
  missing: InterviewField[];
  applyReady: boolean;
  tier: Tier;
  blanks: InterviewField[];
  nextBest: InterviewField | null;
  mirrorGaps: InterviewField[];
}

export function selectCompletion(user: any, trustTier: Tier): ProfileCompletion {
  if (!user) {
    return { score: 100, missing: [], applyReady: true, tier: trustTier, blanks: [], nextBest: null, mirrorGaps: [] };
  }
  const score = computeOverallScore(user);
  const missing = enrichMissing(computeMissing(user));
  const applyReady = meetsMinimumApplyGate(user).passes; // returns { passes, missing }
  const blanks = missing.filter((f) => f.playbillSlot !== 'none');
  const mirrorGaps = missing.filter((f) => f.mirrorRelevant);
  return { score, missing, applyReady, tier: trustTier, blanks, nextBest: missing[0] ?? null, mirrorGaps };
}

export function useProfileCompletion(): ProfileCompletion {
  const user = useAuthStore((s) => s.user);
  const trustTier = useAuthStore((s) => s.trustTier);
  return selectCompletion(user, trustTier);
}

export default useProfileCompletion;
