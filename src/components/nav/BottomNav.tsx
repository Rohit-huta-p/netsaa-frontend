// netsa-mobile/src/components/nav/BottomNav.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Home, Briefcase, Calendar, User as UserIcon, Users } from 'lucide-react-native';
import { useRouter, usePathname } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useOrganizer } from '../../hooks/useOrganizer';
import PostFAB from './PostFAB';

/**
 * Role-aware bottom nav. Spec §3.1. One static nav per role (no mode toggle).
 * Artist:        Home · Gigs · [Post FAB] · Events · Profile
 * Creative Lead: Home · Find Work · [Post FAB] · Events · Talent
 *   Agency-style: both market faces are first-class tabs — Talent + Post FAB
 *   hire DOWN (a CL's gig is stamped posterRole 'creative_lead' server-side, so
 *   only Artists see/apply); Find Work applies UP (browse open client
 *   requirements). Profile is reachable from the top-avatar menu (Navbar).
 * Client:        Home · Talent · [Post FAB] · Events · Profile  (single-face role)
 * Agency client: Home · Find Work · [Post FAB] · Events · Talent
 */

type TabDef = {
  id: string;
  label: string;
  icon: any;
  route: string;
};

const ARTIST_TABS: TabDef[] = [
  { id: 'home',     label: 'Home',     icon: Home,      route: '/(app)/dashboard' },
  { id: 'gigs',     label: 'Gigs',     icon: Briefcase, route: '/(app)/gigs' },
  // Post FAB goes in slot 3 (rendered separately, overlapping nav)
  { id: 'events',   label: 'Events',   icon: Calendar,  route: '/(app)/events' },
  { id: 'profile',  label: 'Profile',  icon: UserIcon,  route: '/(app)/profile' },
];

// Creative Lead — the middle layer, agency-style nav (no Apply/Hire toggle).
// Talent + Post FAB = hire DOWN: a posted gig is stamped posterRole
// 'creative_lead' server-side (gigController.posterRoleFor), so only Artists
// see/apply. Find Work = apply UP: /(app)/requirements is the CL-gated feed of
// open client requirements (403 for non-CL). Profile lives in the top-avatar
// menu (Navbar), mirroring AGENCY_TABS.
const CREATIVE_LEAD_TABS: TabDef[] = [
  { id: 'home',     label: 'Home',      icon: Home,      route: '/(app)/dashboard' },
  { id: 'findwork', label: 'Find Work', icon: Briefcase, route: '/(app)/requirements' },
  { id: 'events',   label: 'Events',    icon: Calendar,  route: '/(app)/events' },
  { id: 'talent',   label: 'Talent',    icon: Users,     route: '/(app)/talent' },
];

// Client shell (Client Experience spec §0). Home + Events are live;
// Talent (Part B) + Profile (Part D) are coming-soon stubs for now.
const CLIENT_TABS: TabDef[] = [
  { id: 'home',     label: 'Home',     icon: Home,      route: '/(app)/client' },
  { id: 'talent',   label: 'Talent',   icon: Users,     route: '/(app)/talent' },
  { id: 'events',   label: 'Events',   icon: Calendar,  route: '/(app)/events' },
  { id: 'profile',  label: 'Profile',  icon: UserIcon,  route: '/(app)/client-profile' },
];

// Agency-flagged clients supply talent, so they get a "Find Work" tab in place
// of Profile. Profile stays reachable from the top-avatar (Navbar). Everything
// else matches CLIENT_TABS.
const AGENCY_TABS: TabDef[] = [
  { id: 'home',     label: 'Home',      icon: Home,      route: '/(app)/client' },
  { id: 'findwork', label: 'Find Work', icon: Briefcase, route: '/(app)/requirements' },
  { id: 'events',   label: 'Events',    icon: Calendar,  route: '/(app)/events' },
  { id: 'talent',   label: 'Talent',    icon: Users,     route: '/(app)/talent' },
];

// Deep event screens hide the bottom nav so sticky CTAs / wizard footers
// have full edge access. The /events listing keeps the nav visible.
const HIDE_NAV_PATTERNS: RegExp[] = [
  /^\/events\/[^/]+(\/.*)?$/,   // /events/:id detail + nested (manage tabs, register, manage/overview, manage/roster)
  /^\/events\/compose$/,        // 7-step composer
];

function shouldHideNav(pathname: string | null): boolean {
  if (!pathname) return false;
  return HIDE_NAV_PATTERNS.some((re) => re.test(pathname));
}

export default function BottomNav() {
  const role = useAuthStore((s) => s.role);
  const { isAgency } = useOrganizer();
  const router = useRouter();
  const pathname = usePathname();

  if (shouldHideNav(pathname)) return null;

  // One static nav per role (no mode toggle). Creative Lead uses an agency-style
  // layout where both market faces are first-class tabs — Talent + Post FAB to
  // hire down, Find Work to apply up — so the old Artist/Hirer nav swap is gone.
  // Agency-flagged clients get the same Find-Work face in place of Profile.
  const tabs =
    role === 'client'
      ? isAgency
        ? AGENCY_TABS
        : CLIENT_TABS
      : role === 'artist'
        ? ARTIST_TABS
        : CREATIVE_LEAD_TABS;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <BlurView intensity={40} tint="dark" style={styles.bar}>
        <View style={styles.tabRow}>
          {/* Left 2 tabs */}
          {tabs.slice(0, 2).map((t) => (
            <NavButton key={t.id} tab={t} currentPath={pathname} onPress={() => router.push(t.route as any)} />
          ))}
          {/* Spacer for Post FAB */}
          <View style={styles.fabSpacer} />
          {/* Right 2 tabs */}
          {tabs.slice(2).map((t) => (
            <NavButton key={t.id} tab={t} currentPath={pathname} onPress={() => router.push(t.route as any)} />
          ))}
        </View>
      </BlurView>
      <PostFAB />
    </View>
  );
}

function NavButton({
  tab, currentPath, onPress,
}: { tab: TabDef; currentPath: string; onPress: () => void }) {
  const Icon = tab.icon;
  const active = currentPath?.startsWith(tab.route.replace('/(app)', ''));
  const color = active ? '#FFFFFF' : 'rgba(245, 240, 235, 0.55)';
  return (
    <TouchableOpacity
      style={styles.tab}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: active }}
    >
      <Icon size={22} color={color} strokeWidth={active ? 2.3 : 2} />
      <Text style={[styles.tabLabel, { color }]}>{tab.label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
  },
  bar: {
    marginHorizontal: 12,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  tabRow: {
    flexDirection: 'row',
    height: 64,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabLabel: {
    fontFamily: 'Outfit-Medium',  // App uses hyphenated names
    fontSize: 10,
    letterSpacing: 0.3,
  },
  fabSpacer: { width: 64 },
});
