import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import asyncStorageAdapter from './asyncStorageAdapter';

const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SCORE_JUMP_TO_RESURFACE = 10;        // re-show early if score moves this much
const MIRROR_MIN_GAP_MS = 24 * 60 * 60 * 1000; // 24h minimum gap between Mirror shows

interface ProfileNudgeState {
  playbillDismissedUntil: number | null;
  playbillDismissedAtScore: number | null;
  dismissPlaybill: (currentScore: number) => void;
  isPlaybillVisible: (score: number, missingCount: number, now?: number) => boolean;

  mirrorLastShownAt: number | null;
  mirrorShownThisSession: boolean;
  mirrorCtaTappedThisSession: boolean;
  markMirrorShown: () => void;
  markMirrorCtaTapped: () => void;
  isMirrorEligible: (hasGapTrigger: boolean, now?: number) => boolean;
}

export const useProfileNudgeStore = create<ProfileNudgeState>()(
  persist(
    (set, get) => ({
      playbillDismissedUntil: null,
      playbillDismissedAtScore: null,

      dismissPlaybill: (currentScore) =>
        set({ playbillDismissedUntil: Date.now() + SNOOZE_MS, playbillDismissedAtScore: currentScore }),

      isPlaybillVisible: (score, missingCount, now = Date.now()) => {
        if (missingCount <= 0) return false;
        const { playbillDismissedUntil, playbillDismissedAtScore } = get();
        if (playbillDismissedUntil == null) return true;
        if (now >= playbillDismissedUntil) return true; // snooze expired
        if (playbillDismissedAtScore != null && score - playbillDismissedAtScore >= SCORE_JUMP_TO_RESURFACE) return true;
        return false; // still snoozed
      },

      mirrorLastShownAt: null,
      mirrorShownThisSession: false,
      mirrorCtaTappedThisSession: false,

      markMirrorShown: () => set({ mirrorShownThisSession: true, mirrorLastShownAt: Date.now() }),

      markMirrorCtaTapped: () => set({ mirrorCtaTappedThisSession: true }),

      isMirrorEligible: (hasGapTrigger, now = Date.now()) => {
        if (!hasGapTrigger) return false;
        const { mirrorShownThisSession, mirrorCtaTappedThisSession, mirrorLastShownAt } = get();
        if (mirrorShownThisSession || mirrorCtaTappedThisSession) return false;
        if (mirrorLastShownAt != null && now - mirrorLastShownAt < MIRROR_MIN_GAP_MS) return false;
        return true;
      },
    }),
    {
      name: 'profile-nudge-storage',
      storage: createJSONStorage(() => asyncStorageAdapter),
      partialize: (s) => ({
        playbillDismissedUntil: s.playbillDismissedUntil,
        playbillDismissedAtScore: s.playbillDismissedAtScore,
        mirrorLastShownAt: s.mirrorLastShownAt,
      }),
    }
  )
);

export default useProfileNudgeStore;
