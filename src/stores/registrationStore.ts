// src/stores/registrationStore.ts
import { create } from 'zustand';
import type { ArtistRegistrationPayload, OrganizerRegistrationPayload } from '../types/registration.type';

type RegistrationState = {
  artist?: Partial<ArtistRegistrationPayload>;
  organizer?: Partial<OrganizerRegistrationPayload>;

  setArtistPartial: (p: Partial<ArtistRegistrationPayload>) => void;
  setOrganizerPartial: (p: Partial<OrganizerRegistrationPayload>) => void;
  clearAll: () => void;
};

export const useRegistrationStore = create<RegistrationState>((set) => ({
  artist: undefined,
  organizer: undefined,
  setArtistPartial: (p) => set((s) => ({ artist: { ...(s.artist || {}), ...p } })),
  setOrganizerPartial: (p) => set((s) => ({ organizer: { ...(s.organizer || {}), ...p } })),
  clearAll: () => set({ artist: undefined, organizer: undefined }),
}));

export default useRegistrationStore;
