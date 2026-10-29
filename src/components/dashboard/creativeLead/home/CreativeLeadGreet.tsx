// src/components/dashboard/creativeLead/home/CreativeLeadGreet.tsx
//
// Section 1 of the Creative Lead home — the company greet. Mirrors ArtistGreet
// but the avatar is a company monogram (not a person), and the sub-line reads
// `type · city`. Data via useHeroDataHirer ({ user, organizer }).

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import useHeroDataHirer from '@/hooks/useHeroDataHirer';
import { HC, HF } from '@/components/dashboard/artist/home/ui';

function greetingFor(d: Date): string {
  const h = d.getHours();
  if (h < 12) return 'GOOD MORNING';
  if (h < 17) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
}

export default function CreativeLeadGreet() {
  const router = useRouter();
  const { user, organizer } = useHeroDataHirer();

  const name = (user?.displayName as string) || 'Your company';
  const initial = (name.trim()[0] || 'N').toUpperCase();
  const city = (organizer as any)?.city || (user as any)?.city;
  const type =
    (organizer as any)?.organizerType ||
    (organizer as any)?.companyType ||
    'Creative lead';
  const sub = [type, city].filter(Boolean).join(' · ').toUpperCase();

  return (
    <View style={styles.row}>
      <LinearGradient
        colors={['#2A2016', '#1B1B22']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.logo}
      >
        <Text style={styles.logoTxt}>{initial}</Text>
      </LinearGradient>

      <View style={styles.mid}>
        <Text style={styles.greet}>{greetingFor(new Date())}</Text>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        {sub ? <Text style={styles.sub} numberOfLines={1}>{sub}</Text> : null}
      </View>

      <Pressable
        style={styles.bell}
        onPress={() => router.push('/notifications' as any)}
        accessibilityRole="button"
        accessibilityLabel="Notifications"
      >
        <Bell size={17} color={HC.t2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 20, paddingTop: 10 },
  logo: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.35)',
  },
  logoTxt: { fontFamily: HF.serif, fontSize: 24, color: HC.orange },
  mid: { flex: 1, minWidth: 0 },
  greet: { fontFamily: HF.mono, fontSize: 10, letterSpacing: 1.6, color: HC.t2 },
  name: { fontFamily: HF.serif, fontSize: 21, letterSpacing: -0.3, color: HC.cream, marginTop: 3 },
  sub: { fontFamily: HF.mono, fontSize: 9, letterSpacing: 0.8, color: HC.t3, marginTop: 3 },
  bell: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: HC.hair,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
