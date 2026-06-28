import { create } from 'zustand';

type Gate = 'none' | 'profile' | 'consent' | 'sheet';

interface State {
  gate: Gate;
  setGate: (g: Gate) => void;
  reset: () => void;
}

export const useRegisterFlowStore = create<State>((set) => ({
  gate: 'none',
  setGate: (gate) => set({ gate }),
  reset: () => set({ gate: 'none' }),
}));
