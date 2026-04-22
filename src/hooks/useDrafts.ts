/**
 * useDrafts — hook wrapping the client-local draftService (AsyncStorage).
 *
 * Drafts are device-local only (post-MVP will add a server collection —
 * see src/services/draftService.ts header). This hook is NOT backed by
 * React Query: AsyncStorage reads are cheap and local, and mutations
 * (upsert/remove) happen from modals not nested under this hook — so a
 * simple `refresh()` trigger is enough.
 *
 * RETURN SHAPE
 * ------------
 *   {
 *     drafts: ApplicationDraft[],
 *     isLoading: boolean,
 *     refresh: () => Promise<void>,  // re-reads AsyncStorage
 *     remove: (draftId: string) => Promise<void>,  // deletes + refreshes
 *   }
 *
 * REFRESH ON FOCUS
 * ----------------
 * Uses `useFocusEffect` from expo-router so drafts re-load whenever the
 * screen containing the Drafts section comes back into focus (e.g., the
 * user returns from the apply modal after saving a new draft).
 *
 * ERROR SEMANTICS
 * ---------------
 * draftService.list() never throws — corrupted JSON falls back to [].
 * The hook mirrors that: errors are swallowed, the list becomes empty,
 * isLoading settles to false. This keeps the dashboard rendering even if
 * local storage is broken — failing the drafts card silently is
 * acceptable per the plan's failure-modes table.
 */

import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  draftService,
  type ApplicationDraft,
} from '../services/draftService';

export function useDrafts() {
  const [drafts, setDrafts] = useState<ApplicationDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await draftService.list();
      setDrafts(list);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const remove = useCallback(
    async (draftId: string) => {
      await draftService.remove(draftId);
      await refresh();
    },
    [refresh]
  );

  // Re-fetch on every focus event. useCallback keeps the deps stable so
  // the effect doesn't loop.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { drafts, isLoading, refresh, remove };
}

export default useDrafts;
