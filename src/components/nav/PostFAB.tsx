// netsa-mobile/src/components/nav/PostFAB.tsx
import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useMode } from '../../hooks/useMode';
import { useAuthStore } from '../../stores/authStore';
import PostComposerPlaceholder from './PostComposerPlaceholder';

export default function PostFAB() {
  const { mode } = useMode();
  const role = useAuthStore((s) => s.role);
  const router = useRouter();
  const [composerOpen, setComposerOpen] = useState(false);

  const isClient = role === 'client';
  // Artist is single-face — its gradient must not flip just because a stale/
  // inferred mode='hirer' lingers. Only creative_lead defers to mode.
  const isArtistFace = role === 'artist' || mode === 'artist';
  const gradient: [string, string] =
    isArtistFace ? ['#8B5CF6', '#FF6B35'] : ['#FF6B35', '#8B5CF6'];

  // Clients post a requirement, not a gig/event.
  const handlePress = () =>
    isClient ? router.push('/(app)/client/new-requirement' as any) : setComposerOpen(true);

  return (
    <>
      <View style={styles.wrap} pointerEvents="box-none">
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel={isClient ? 'Post a requirement' : 'Post a gig or event'}
        >
          <LinearGradient colors={gradient} style={styles.fab}>
            <Plus size={26} color="#FFFFFF" strokeWidth={2.5} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
      <PostComposerPlaceholder visible={composerOpen} onClose={() => setComposerOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 28,
    left: 0, right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  fab: {
    width: 58, height: 58,
    borderRadius: 29,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
});
