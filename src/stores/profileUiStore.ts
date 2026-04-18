// src/stores/profileUiStore.ts
import { create } from 'zustand';

export type SectionId =
    | 'header'       // fullName, artistType, location (ProfileHeader)
    | 'basic'        // age, height, skinTone
    | 'identity'     // artistType, skills
    | 'about'        // bio, socials
    | 'socials'        // bio, socials
    | 'experience'   // experience[]
    | 'media'        // profileImageUrl, galleryUrls, videoUrls
    | 'organization' // organizerTypeCategory, organizationWebsite
    | 'contact';     // primaryContactName, primaryContactPhone, primaryContactEmail

type DirtySections = Partial<Record<SectionId, boolean>>;

interface ProfileUiState {
    // ─── Core Toggle ───
    isEditMode: boolean; // Keep for legacy, though activeEditSection handles specifics
    activeEditSection: SectionId | null;

    // ─── Dirty Tracking ───
    dirtySections: DirtySections;
    sectionDrafts: Partial<Record<SectionId, any>>;

    // ─── Bottom Sheet Control ───
    activeSheet: SectionId | null;

    // ─── Highlight Missing Fields ───
    highlightMissing: string[];

    // ─── Saving State ───
    savingSection: SectionId | null;
    sectionErrors: Partial<Record<SectionId, string>>;

    // ─── Actions ───
    toggleEditMode: () => void;
    enterEditMode: () => void;
    exitEditMode: () => void;

    setEditSection: (section: SectionId | null) => void;

    setDirty: (section: SectionId, dirty: boolean) => void;
    setSectionDraft: (section: SectionId, data: any) => void;
    clearSectionDraft: (section: SectionId) => void;
    clearAllDrafts: () => void;

    openSheet: (section: SectionId) => void;
    closeSheet: () => void;

    setHighlightMissing: (items: string[]) => void;
    clearHighlightMissing: () => void;

    setSaving: (section: SectionId | null) => void;
    setSectionError: (section: SectionId, error: string | null) => void;

    hasDirtyChanges: () => boolean;
    getDirtyCount: () => number;
}

export const useProfileUiStore = create<ProfileUiState>((set, get) => ({
    isEditMode: false,
    activeEditSection: null,
    dirtySections: {},
    sectionDrafts: {},
    activeSheet: null,
    highlightMissing: [],
    savingSection: null,
    sectionErrors: {},

    toggleEditMode: () => set(state => ({ isEditMode: !state.isEditMode })),
    enterEditMode: () => set({ isEditMode: true }),
    exitEditMode: () => set({
        isEditMode: false,
        activeEditSection: null,
        dirtySections: {},
        sectionDrafts: {},
        activeSheet: null,
        savingSection: null,
        sectionErrors: {},
    }),

    setEditSection: (section) => set({
        activeEditSection: section,
        isEditMode: section !== null
    }),

    setDirty: (section, dirty) => set(state => ({
        dirtySections: { ...state.dirtySections, [section]: dirty }
    })),

    setSectionDraft: (section, data) => set(state => ({
        sectionDrafts: { ...state.sectionDrafts, [section]: data },
        dirtySections: { ...state.dirtySections, [section]: true },
    })),

    clearSectionDraft: (section) => set(state => {
        const { [section]: _, ...rest } = state.sectionDrafts;
        return {
            sectionDrafts: rest,
            dirtySections: { ...state.dirtySections, [section]: false },
            sectionErrors: { ...state.sectionErrors, [section]: undefined },
        };
    }),

    clearAllDrafts: () => set({
        sectionDrafts: {},
        dirtySections: {},
        sectionErrors: {},
    }),

    openSheet: (section) => set({ activeSheet: section }),
    closeSheet: () => set({ activeSheet: null, highlightMissing: [] }),

    setHighlightMissing: (items) => set({ highlightMissing: items }),
    clearHighlightMissing: () => set({ highlightMissing: [] }),

    setSaving: (section) => set({ savingSection: section }),
    setSectionError: (section, error) => set(state => ({
        sectionErrors: { ...state.sectionErrors, [section]: error || undefined },
    })),

    hasDirtyChanges: () => Object.values(get().dirtySections).some(Boolean),
    getDirtyCount: () => Object.values(get().dirtySections).filter(Boolean).length,
}));

export default useProfileUiStore;
