import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { X, UserPlus } from 'lucide-react-native';

interface Item {
  _id: string;
  displayName?: string;
  artistType?: string;
  city?: string;
  reasons?: string[];
}

interface Props {
  items: Item[];
  onConnect: (artistId: string) => void;
  onDismiss: (artistId: string) => void;
}

// A·Minimal tokens (same family as the /network screen).
const C = {
  tile: '#1C1C23', avatarbg: '#2A2A33', hair: 'rgba(255,255,255,0.06)',
  t0: '#FFFFFF', t1: '#D4D4D8', t3: '#8B8B99', t4: '#6B6B78',
  orange: '#FF6B35', orangeSoft: 'rgba(255,107,53,0.12)', orangeLine: 'rgba(255,107,53,0.30)',
};

const initials = (name?: string) => {
  if (!name) return '?';
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase() || '?';
};

/**
 * Discover-people rail (A·Minimal). Horizontal cards of suggested people from
 * pymkService (artist-search-v2). The section header ("Discover people") is
 * rendered by the screen, not here — this component is the rail only.
 */
export function PYMKCarousel({ items, onConnect, onDismiss }: Props) {
  if (!items?.length) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scroll}>
      {items.map((it) => (
        <View key={it._id} style={s.card}>
          <Pressable
            testID={`pymk-dismiss-${it._id}`}
            onPress={() => onDismiss(it._id)}
            style={s.dismiss}
            hitSlop={6}
          >
            <X size={11} color={C.t4} strokeWidth={2} />
          </Pressable>
          <View style={s.avatar}>
            <Text style={s.avatarInitials}>{initials(it.displayName)}</Text>
          </View>
          <Text style={s.name} numberOfLines={1}>{it.displayName ?? '(unknown)'}</Text>
          <Text style={s.role} numberOfLines={1}>{it.artistType ?? it.city ?? ''}</Text>
          {it.reasons?.[0] ? (
            <Text style={s.reason} numberOfLines={1}>{it.reasons[0]}</Text>
          ) : null}
          <Pressable
            testID={`pymk-connect-${it._id}`}
            onPress={() => onConnect(it._id)}
            style={({ pressed }) => [s.connect, pressed && { opacity: 0.7 }]}
          >
            <UserPlus size={12} color={C.orange} strokeWidth={2.5} />
            <Text style={s.connectText}>Connect</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 2, gap: 10 },
  card: {
    width: 152, borderRadius: 18, backgroundColor: C.tile,
    borderWidth: 1, borderColor: C.hair,
    paddingVertical: 16, paddingHorizontal: 12, alignItems: 'center', position: 'relative',
  },
  dismiss: {
    position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', zIndex: 2,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: C.avatarbg,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  avatarInitials: { fontFamily: 'Outfit-Bold', fontSize: 17, color: C.t1, letterSpacing: -0.2 },
  name: { fontFamily: 'Outfit-Bold', fontSize: 13, color: C.t0, textAlign: 'center', marginBottom: 2, maxWidth: 128 },
  role: { fontFamily: 'Outfit-Regular', fontSize: 10.5, color: C.t3, textAlign: 'center', marginBottom: 6, maxWidth: 128 },
  reason: {
    fontFamily: 'SpaceMono-Bold', fontSize: 8.5, letterSpacing: 0.8, color: C.t4,
    textTransform: 'uppercase', textAlign: 'center', marginBottom: 13, maxWidth: 128,
  },
  connect: {
    width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 8, borderRadius: 10,
    backgroundColor: C.orangeSoft, borderWidth: 1, borderColor: C.orangeLine,
  },
  connectText: { fontFamily: 'SpaceMono-Bold', fontSize: 10, letterSpacing: 1, color: C.orange, textTransform: 'uppercase' },
});
