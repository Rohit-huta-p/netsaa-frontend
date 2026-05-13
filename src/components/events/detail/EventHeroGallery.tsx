import { useState } from 'react';
import { View, Image, Dimensions, FlatList, Text } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import type { EventMedia } from '@/services/eventService';

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_H = SCREEN_W * 1.1;

const NETSA_FALLBACK = require('@/../assets/netsa-logo-fallback.png');

interface Props {
  media: EventMedia[];
  title: string;
}

export default function EventHeroGallery({ media, title }: Props) {
  const [index, setIndex] = useState(0);

  const items = media.length > 0
    ? media.sort((a, b) => a.sortOrder - b.sortOrder)
    : [{ kind: 'photo' as const, url: '', isHero: true, width: SCREEN_W, height: HERO_H, sortOrder: 0 }];

  return (
    <View style={{ width: SCREEN_W, height: HERO_H }} className="bg-event-bgAlt">
      <FlatList
        data={items}
        keyExtractor={(_, i) => `media-${i}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
          setIndex(i);
        }}
        renderItem={({ item }) => (
          <View style={{ width: SCREEN_W, height: HERO_H }} className="bg-event-bgAlt">
            {item.url ? (
              <ExpoImage
                source={{ uri: item.url }}
                style={{ width: SCREEN_W, height: HERO_H }}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View className="flex-1 items-center justify-center bg-black">
                <Image source={NETSA_FALLBACK} style={{ width: 120, height: 120, opacity: 0.6 }} resizeMode="contain" />
              </View>
            )}
          </View>
        )}
      />

      {/* Gradient overlay placeholder for title — actual gradient renders via Tailwind classes in production */}
      <View className="absolute bottom-0 left-0 right-0 px-6 py-8" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <Text className="font-serif text-event-textPrimary" style={{ fontSize: 28, lineHeight: 32 }} numberOfLines={3}>
          {title}
        </Text>
      </View>

      {items.length > 1 && (
        <View className="absolute top-4 right-4 px-2 py-1 rounded-full bg-black/50">
          <Text className="font-mono text-event-textPrimary text-xs">{index + 1} / {items.length}</Text>
        </View>
      )}
    </View>
  );
}
