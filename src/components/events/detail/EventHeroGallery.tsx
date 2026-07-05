import { useState } from 'react';
import { View, Image, Dimensions, FlatList, Text } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import NetsaVideoPlayer from '@/components/media/NetsaVideoPlayer';
import type { EventDoc } from '@/services/eventService';
import { computeSlotsLeft, isCapacityUrgent, durationKindLabel } from '@/lib/eventTokens';

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_H = 220;
const PAD = 20;

const NETSA_FALLBACK = require('@/../assets/netsa-logo-fallback.png');

const HAIRLINE_2 = 'rgba(255,255,255,0.10)';
const TEXT_0 = '#f4f4f5';
const ORANGE = '#FF6B35';

interface Props {
  event: EventDoc;
}

export default function EventHeroGallery({ event }: Props) {
  const [index, setIndex] = useState(0);
  const media = event.media || [];

  const items = media.length > 0
    ? [...media].sort((a, b) => a.sortOrder - b.sortOrder)
    : [{ kind: 'photo' as const, url: '', isHero: true, width: SCREEN_W, height: HERO_H, sortOrder: 0 }];

  const slots = computeSlotsLeft(event.capacity.total, event.capacity.registeredCount);
  const urgent = isCapacityUrgent(event.capacity.total, event.capacity.registeredCount);
  const isFull = slots === 0;
  const durationLabel = event.durationKind ? durationKindLabel[event.durationKind] : '';

  const innerW = SCREEN_W - PAD * 2;

  return (
    <View style={{ paddingHorizontal: PAD, paddingBottom: 24 }}>
      <View
        style={{
          height: HERO_H,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: HAIRLINE_2,
          overflow: 'hidden',
          backgroundColor: '#0E0C12',
          position: 'relative',
        }}>
        <FlatList
          data={items}
          keyExtractor={(_, i) => `media-${i}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const i = Math.round(e.nativeEvent.contentOffset.x / innerW);
            setIndex(i);
          }}
          renderItem={({ item }) => (
            <View style={{ width: innerW, height: HERO_H }}>
              {item.kind === 'video' && item.muxPlaybackId ? (
                <NetsaVideoPlayer playbackId={item.muxPlaybackId} style={{ width: innerW, height: HERO_H }} />
              ) : item.url ? (
                <ExpoImage
                  source={{ uri: item.url }}
                  style={{ width: innerW, height: HERO_H }}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0E0C12' }}>
                  <Image source={NETSA_FALLBACK} style={{ width: 96, height: 96, opacity: 0.45 }} resizeMode="contain" />
                </View>
              )}
            </View>
          )}
        />

        {/* Bottom-edge gradient — adds depth without overlaying foreground */}
        <LinearGradient
          colors={['rgba(9,9,11,0)', 'rgba(9,9,11,0.6)']}
          pointerEvents="none"
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: HERO_H * 0.45 }}
        />

        {/* Top-left: slots */}
        {slots > 0 ? (
          <View style={{
            position: 'absolute', top: 14, left: 14,
            paddingHorizontal: 10, paddingVertical: 5,
            borderRadius: 7,
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
            backgroundColor: 'rgba(0,0,0,0.55)',
            flexDirection: 'row', alignItems: 'center', gap: 6,
          }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: urgent ? ORANGE : '#22C55E' }} />
            <Text className="font-outfit" style={{ color: TEXT_0, fontSize: 10.5, fontWeight: '600', letterSpacing: 0.2 }}>
              {slots} {slots === 1 ? 'spot' : 'spots'}
            </Text>
          </View>
        ) : (
          <View style={{
            position: 'absolute', top: 14, left: 14,
            paddingHorizontal: 10, paddingVertical: 5,
            borderRadius: 7,
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
            backgroundColor: 'rgba(0,0,0,0.55)',
          }}>
            <Text className="font-outfit" style={{ color: TEXT_0, fontSize: 10.5, fontWeight: '600', letterSpacing: 0.2 }}>
              Sold out
            </Text>
          </View>
        )}

        {/* Top-right: duration */}
        {durationLabel ? (
          <View style={{
            position: 'absolute', top: 14, right: 14,
            paddingHorizontal: 10, paddingVertical: 5,
            borderRadius: 7,
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
            backgroundColor: 'rgba(0,0,0,0.55)',
          }}>
            <Text className="font-outfit" style={{ color: TEXT_0, fontSize: 10.5, fontWeight: '600', letterSpacing: 0.2 }}>
              {durationLabel}
            </Text>
          </View>
        ) : null}

        {/* Pagination */}
        {items.length > 1 && (
          <View style={{
            position: 'absolute', bottom: 12, right: 14,
            paddingHorizontal: 8, paddingVertical: 3,
            borderRadius: 5,
            backgroundColor: 'rgba(0,0,0,0.55)',
          }}>
            <Text className="font-outfit" style={{ color: TEXT_0, fontSize: 10, letterSpacing: 0.4 }}>
              {index + 1} / {items.length}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
