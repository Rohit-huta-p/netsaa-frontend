import { create } from 'zustand';
import { IEvent } from '../types/event';

// Most event state is now handled by React Query (server state).
// This store can be used for client-side only state, e.g. "current selected event for editing" if not URL based.
// For now, keeping it minimal or we can remove it entirely if unused.

interface EventState {
    // events: IEvent[]; // Deprecated, use useEvents()
    // currentEvent: IEvent | null; // Deprecated, use useEvent(id)
    // isLoading: boolean;
    error: string | null;
}

export const useEventStore = create<EventState>((set) => ({
    // events: [],
    // currentEvent: null,
    // isLoading: false,
    error: null,
}));
