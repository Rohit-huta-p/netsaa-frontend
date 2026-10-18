// src/components/dashboard/artist/home/ArtistGreet.tsx
//
// Section 1 — greet. Avatar + time-of-day greeting + "Hello, {firstName}" and a
// notifications bell. Simplified artist home (artist-home-final.html, skin A).

import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import useHeroData from '@/hooks/useHeroData';
import { HC, HF } from './ui';

function greetingFor(d: Date): string {
  const h = d.getHours();
  if (h < 5) return 'Late night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Tonight';
}

export default function ArtistGreet() {
  const router = useRouter();
  const { data: user, isLoading } = useHeroData();
  const greeting = useMemo(() => greetingFor(new Date()), []);

  if (isLoading || !user) {
    return <View style={styles.skeleton} accessibilityElementsHidden />;
  }

  const displayName = (user as any).displayName ?? 'Artist';
  const firstName = displayName.split(' ')[0] ?? displayName;
  const initial = (firstName[0] ?? 'A').toUpperCase();

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#8B5CF6', '#EC4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.avatar}
      >
        <Text style={styles.avatarInitial}>{initial}</Text>
      </LinearGradient>

      <View style={styles.nameLine}>
        <Text style={styles.greet}>{greeting.toUpperCase()}</Text>
        <Text style={styles.name} numberOfLines={1}>
          Hello, {firstName}
        </Text>
      </View>

      <Pressable
        onPress={() => router.push('/notifications' as any)}
        style={styles.bell}
        accessibilityRole="button"
        accessibilityLabel="Notifications"
        hitSlop={8}
      >
        <Bell size={18} color={HC.t2} />
        {/* TODO: show unread dot once a notifications-unread signal is wired. */}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 20, paddingTop: 30, paddingBottom: 10 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: HC.hair },
  avatarInitial: { fontFamily: HF.bold, fontSize: 17, color: '#0A0A0F' },
  nameLine: { flex: 1, gap: 3 },
  greet: { fontFamily: HF.mono, fontSize: 10, letterSpacing: 1.6, color: HC.t3 },
  name: { fontFamily: HF.serif, fontSize: 22, letterSpacing: -0.3, color: HC.cream },
  bell: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: HC.hair, alignItems: 'center', justifyContent: 'center' },
  skeleton: { height: 92, marginHorizontal: 20, marginVertical: 28, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)' },
});
