import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import asyncStorageAdapter from './asyncStorageAdapter';

const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SCORE_JUMP_TO_RESURFACE = 10;        // re-show early if score moves this much

interface ProfileNudgeState {
  playbillDismissedUntil: number | null;
  playbillDismissedAtScore: number | null;
  dismissPlaybill: (currentScore: number) => void;
  isPlaybillVisible: (score: number, missingCount: number, now?: number) => boolean;
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
    }),
    {
      name: 'profile-nudge-storage',
      storage: createJSONStorage(() => asyncStorageAdapter),
      partialize: (s) => ({
        playbillDismissedUntil: s.playbillDismissedUntil,
        playbillDismissedAtScore: s.playbillDismissedAtScore,
      }),
    }
  )
);

export default useProfileNudgeStore;
