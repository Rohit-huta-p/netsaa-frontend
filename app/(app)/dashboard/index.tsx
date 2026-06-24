// netsa-mobile/app/(app)/dashboard/index.tsx
import React from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../../../src/stores/authStore';
import ArtistHome from './artist-home';
import HirerHome from './hirer-home';

/**
 * Home dispatcher. Selects the home surface by role (no mode toggle):
 *   client → /client · artist → artist-home · creative_lead → hirer-home.
 * Plan 1 scope — shells are empty, sections populate in Plans 2 + 3.
 *
 * NOTE: components from the original unified dashboard (AmbientBackdrop,
 * SectionDivider, HeroGreeting, NextUpCard, ContextCard, ContractsStrip,
 * MiniStat, QuickActions) are preserved in git history at commit e204d59.
 * Plan 2 salvages them into src/components/dashboard/ for reuse.
 */
export default function DashboardHome() {
  const role = useAuthStore((s) => s.role);
  // Three-role model: client = manage-posts surface (redirect to /client),
  // artist = find-work surface, creative_lead = hire/manage surface. The CL nav
  // surfaces the apply-up face as its own "Find Work" tab (/requirements), so
  // Home is always the hire-down dashboard — there is no artist-home for CLs.
  if (role === 'client') return <Redirect href="/(app)/client" />;
  if (role === 'artist') return <ArtistHome />;
  return <HirerHome />;
}
