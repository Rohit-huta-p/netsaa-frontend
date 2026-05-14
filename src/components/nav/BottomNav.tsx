// netsa-mobile/src/components/nav/BottomNav.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Home, Briefcase, Music, Calendar, User as UserIcon, Users } from 'lucide-react-native';
import { useRouter, usePathname } from 'expo-router';
import { useMode } from '../../hooks/useMode';
import PostFAB from './PostFAB';

/**
 * Mode-aware bottom nav. Spec §3.1.
 * Artist:  Home · Gigs · [Post FAB] · Events · Profile
 * Hirer:   Home · Artists · [Post FAB] · My Team · Profile
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

const HIRER_TABS: TabDef[] = [
  { id: 'home',     label: 'Home',     icon: Home,     route: '/(app)/dashboard' },
  { id: 'artists',  label: 'Artists',  icon: Music,    route: '/(app)/artists' },
  { id: 'team',     label: 'My Team',  icon: Users,    route: '/(app)/team' },
  { id: 'profile',  label: 'Profile',  icon: UserIcon, route: '/(app)/profile' },
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
  const { mode } = useMode();
  const router = useRouter();
  const pathname = usePathname();

  if (shouldHideNav(pathname)) return null;

  const tabs = mode === 'hirer' ? HIRER_TABS : ARTIST_TABS;

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
