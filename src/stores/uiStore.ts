import { create } from 'zustand';

interface UiState {
  // Selection State (Global)
  selectedGigId: string | null;
  selectedEventId: string | null;

  // Filter State (Drafts)
  gigFilters: Record<string, any>;
  eventFilters: Record<string, any>;

  // UI Controls
  isFilterModalOpen: boolean;
  activeModal: string | null;
  isDrawerOpen: boolean;

  // Actions
  setSelectedGigId: (id: string | null) => void;
  setSelectedEventId: (id: string | null) => void;
  setGigFilters: (filters: Record<string, any>) => void;
  setEventFilters: (filters: Record<string, any>) => void;
  toggleFilterModal: (isOpen: boolean) => void;
  setActiveModal: (modalName: string | null) => void;
  setDrawerOpen: (isOpen: boolean) => void;
  resetSelections: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  selectedGigId: null,
  selectedEventId: null,
  gigFilters: {},
  eventFilters: {},
  isFilterModalOpen: false,
  activeModal: null,
  isDrawerOpen: false,

  setSelectedGigId: (id) => set({ selectedGigId: id }),
  setSelectedEventId: (id) => set({ selectedEventId: id }),

  setGigFilters: (filters) => set({ gigFilters: filters }),
  setEventFilters: (filters) => set({ eventFilters: filters }),

  toggleFilterModal: (isOpen) => set({ isFilterModalOpen: isOpen }),
  setActiveModal: (modalName) => set({ activeModal: modalName }),
  setDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),

  resetSelections: () => set({
    selectedGigId: null,
    selectedEventId: null
  })
}));
