// register-kit/AccentContext.tsx
// register.tsx is the single provider (derives from the `role` param); every step reads the accent.
import React, { createContext, useContext } from 'react';
import { ROLE_ACCENT, type Accent, type RoleKey } from './theme';

const AccentCtx = createContext<Accent>(ROLE_ACCENT.artist);

export function AccentProvider({ role, children }: { role: RoleKey; children: React.ReactNode }) {
    return <AccentCtx.Provider value={ROLE_ACCENT[role]}>{children}</AccentCtx.Provider>;
}

export const useAccent = (): Accent => useContext(AccentCtx);
