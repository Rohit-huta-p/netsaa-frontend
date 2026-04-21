// netsa-mobile/app/(app)/dashboard/index.tsx
import React from 'react';
import { useMode } from '../../../src/hooks/useMode';
import ArtistHome from './artist-home';
import HirerHome from './hirer-home';

/**
 * Home dispatcher. Selects artist-home or hirer-home based on modeStore.mode.
 * Plan 1 scope — shells are empty, sections populate in Plans 2 + 3.
 *
 * NOTE: components from the original unified dashboard (AmbientBackdrop,
 * SectionDivider, HeroGreeting, NextUpCard, ContextCard, ContractsStrip,
 * MiniStat, QuickActions) are preserved in git history at commit e204d59.
 * Plan 2 salvages them into src/components/dashboard/ for reuse.
 */
export default function DashboardHome() {
  const { mode } = useMode();
  return mode === 'hirer' ? <HirerHome /> : <ArtistHome />;
}
