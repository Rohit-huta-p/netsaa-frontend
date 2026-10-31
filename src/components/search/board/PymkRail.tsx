// src/components/search/board/PymkRail.tsx
//
// "People you may know" horizontal rail for the idle state. Pulls from
// connectionService.getPYMK(); the whole block degrades to nothing when the
// endpoint is empty or unavailable (so it never shows a broken/empty shell).
// Accepts an optional `data` override so the preview route can demo it without
// a live backend. A·Minimal (search mockup, .rail/.pcard).

import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
import connectionService from '@/services/connectionService';
import { interpretConnectionError } from '@/utils/connectionErrors';
import { C, F, ORANGE_SOFT, ORANGE_LINE, avatarGradient, initialOf, metaLine } from './theme';

export type PymkSuggestion = {
  userId: string;
  displayName: string;
  profileImageUrl?: string;
  artistType?: string | string[];
  primaryCity?: string | null;
  mutualCount?: number;
};

export function PymkRail({
  data,
  onOpenProfile,
}: {
  data?: PymkSuggestion[];
  onOpenProfile?: (userId: string) => void;
}) {
  const query = useQuery({
    queryKey: ['search', 'pymk'],
    queryFn: () => connectionService.getPYMK(10),
    staleTime: 1000 * 60 * 5,
    enabled: data === undefined, // skip the fetch when an override is supplied
  });

  const suggestions: PymkSuggestion[] = data ?? query.data?.suggestions ?? [];
  if (suggestions.length === 0) return null; // degrade to hidden

  return (
    <View style={s.block}>
      <View style={s.head}>
        <Text style={s.eyebrow}>People you may know</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.rail}>
        {suggestions.map((p) => (
          <PymkCard key={p.userId} person={p} onOpen={() => onOpenProfile?.(p.userId)} />
        ))}
      </ScrollView>
    </View>
  );
}

function PymkCard({ person, onOpen }: { person: PymkSuggestion; onOpen: () => void }) {
  const [status, setStatus] = useState<'none' | 'pending'>('none');
  const [loading, setLoading] = useState(false);

  const craft = Array.isArray(person.artistType) ? person.artistType[0] : person.artistType;
  const meta = metaLine(craft, person.primaryCity);

  const connect = async () => {
    if (status !== 'none' || loading) return;
    try {
      setLoading(true);
      await connectionService.sendConnectionRequest(person.userId);
      setStatus('pending');
    } catch (error: any) {
      const info = interpretConnectionError(error);
      if (info.swallow) setStatus('pending');
      else Alert.alert(info.title, info.message);
    } finally {
      setLoading(false);
    }
  };

  const [g1, g2] = avatarGradient(person.displayName || person.userId);

  return (
    <Pressable onPress={onOpen} style={s.card}>
      <LinearGradient colors={[g1, g2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.av}>
        <Text style={s.avTxt}>{initialOf(person.displayName)}</Text>
      </LinearGradient>
      <Text style={s.nm} numberOfLines={1}>
        {person.displayName}
      </Text>
      {meta ? (
        <Text style={s.meta} numberOfLines={2}>
          {meta}
        </Text>
      ) : null}
      <Pressable
        onPress={(e) => {
          e.stopPropagation?.();
          connect();
        }}
        disabled={status === 'pending' || loading}
        style={[s.cbtn, status === 'pending' && s.cbtnDone]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={C.orange} />
        ) : status === 'pending' ? (
          <Text style={s.cbtnDoneTxt}>Pending</Text>
        ) : (
          <>
            <Plus size={13} color={C.orange} strokeWidth={2.2} />
            <Text style={s.cbtnTxt}>Connect</Text>
          </>
        )}
      </Pressable>
    </Pressable>
  );
}

const s = StyleSheet.create({
  block: { paddingTop: 18, paddingBottom: 4 },
  head: { marginBottom: 12 },
  eyebrow: { fontFamily: F.mono, fontSize: 10.5, letterSpacing: 1.7, color: C.t4, textTransform: 'uppercase' },
  rail: { gap: 12, paddingBottom: 2, paddingRight: 4 },
  card: {
    width: 150,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.hairSoft,
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 13,
    alignItems: 'center',
  },
  av: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  avTxt: { fontFamily: F.bold, fontSize: 19, color: 'rgba(255,255,255,0.92)' },
  nm: { fontFamily: F.semi, fontSize: 13.5, color: C.cream, marginTop: 9, textAlign: 'center' },
  meta: { fontFamily: F.body, fontSize: 11, color: C.t3, textAlign: 'center', marginTop: 2, lineHeight: 15 },
  cbtn: {
    marginTop: 12,
    width: '100%',
    height: 32,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: ORANGE_LINE,
    backgroundColor: ORANGE_SOFT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  cbtnTxt: { fontFamily: F.semi, fontSize: 12, color: C.orange },
  cbtnDone: { borderColor: C.hair, backgroundColor: 'transparent' },
  cbtnDoneTxt: { fontFamily: F.med, fontSize: 12, color: C.t3 },
});
