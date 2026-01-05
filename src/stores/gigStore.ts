import { create } from 'zustand';
import { Gig } from '../types/gig';

// Most gig state is now handled by React Query.
// This store can be used for client-side only state.

interface GigState {
    gigs: Gig[]; // Deprecated, use useGigs()
    activeGig: Gig | null; // Deprecated, use useGig(id)
    isLoading: boolean;
    error: string | null;
}

export const useGigStore = create<GigState>((set) => ({
    gigs: [],
    activeGig: null,
    isLoading: false,
    error: null,
}));
