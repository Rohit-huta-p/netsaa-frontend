// src/stores/requirementDraftStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Draft = {
    title: string;
    occasionText: string;
    city: string;
    eventDate: string; // ISO or ''
    budgetPreset: 'under25' | '25to75' | '75plus' | 'custom' | 'unsure' | null;
    budgetMin: string;
    budgetMax: string;
    description: string;
    photos: string[];
};

type DraftState = Draft & {
    _hasHydrated: boolean;
    setHasHydrated: (v: boolean) => void;
    set: (patch: Partial<Draft>) => void;
    clear: () => void;
};

const EMPTY: Draft = {
    title: '', occasionText: '', city: '', eventDate: '', budgetPreset: null,
    budgetMin: '', budgetMax: '', description: '', photos: [],
};

export const useRequirementDraft = create<DraftState>()(
    persist(
        (set) => ({
            ...EMPTY,
            _hasHydrated: false,
            setHasHydrated: (v) => set({ _hasHydrated: v }),
            set: (patch) => set(patch),
            clear: () => set(EMPTY),
        }),
        {
            name: 'requirement-draft',
            storage: createJSONStorage(() => AsyncStorage),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        },
    ),
);
