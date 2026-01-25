// src/stores/pendingAuthActionStore.ts
import { create } from 'zustand';

type PendingAuthActionState = {
    pendingAction: (() => Promise<void> | void) | null;
    actionReason: string | null;
    setPendingAction: (action: () => Promise<void> | void, reason?: string) => void;
    executePendingAction: () => Promise<void>;
    clearPendingAction: () => void;
};

export const usePendingAuthActionStore = create<PendingAuthActionState>()((set, get) => ({
    pendingAction: null,
    actionReason: null,

    setPendingAction: (action, reason) => {
        console.log('[PendingAuthAction] Setting pending action:', reason || 'unknown');
        set({ pendingAction: action, actionReason: reason || null });
    },

    executePendingAction: async () => {
        const { pendingAction, actionReason } = get();
        if (pendingAction) {
            console.log('[PendingAuthAction] Executing pending action:', actionReason || 'unknown');
            try {
                await pendingAction();
            } catch (error) {
                console.error('[PendingAuthAction] Error executing pending action:', error);
            } finally {
                get().clearPendingAction();
            }
        }
    },

    clearPendingAction: () => {
        console.log('[PendingAuthAction] Clearing pending action');
        set({ pendingAction: null, actionReason: null });
    },
}));

export default usePendingAuthActionStore;
