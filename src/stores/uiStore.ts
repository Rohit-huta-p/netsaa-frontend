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
  // > 0 while a full-screen overlay (e.g. the MediaViewer) is open → global chrome
  // like the BottomNav hides itself. A counter (not a bool) so stacked overlays are safe.
  fullscreenOverlayCount: number;

  // Actions
  setSelectedGigId: (id: string | null) => void;
  setSelectedEventId: (id: string | null) => void;
  setGigFilters: (filters: Record<string, any>) => void;
  setEventFilters: (filters: Record<string, any>) => void;
  toggleFilterModal: (isOpen: boolean) => void;
  setActiveModal: (modalName: string | null) => void;
  setDrawerOpen: (isOpen: boolean) => void;
  pushFullscreenOverlay: () => void;
  popFullscreenOverlay: () => void;
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
  fullscreenOverlayCount: 0,

  setSelectedGigId: (id) => set({ selectedGigId: id }),
  setSelectedEventId: (id) => set({ selectedEventId: id }),

  setGigFilters: (filters) => set({ gigFilters: filters }),
  setEventFilters: (filters) => set({ eventFilters: filters }),

  toggleFilterModal: (isOpen) => set({ isFilterModalOpen: isOpen }),
  setActiveModal: (modalName) => set({ activeModal: modalName }),
  setDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),
  pushFullscreenOverlay: () => set((s) => ({ fullscreenOverlayCount: s.fullscreenOverlayCount + 1 })),
  popFullscreenOverlay: () => set((s) => ({ fullscreenOverlayCount: Math.max(0, s.fullscreenOverlayCount - 1) })),

  resetSelections: () => set({
    selectedGigId: null,
    selectedEventId: null
  })
}));
