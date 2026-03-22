import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';

type MasonryGridProps = {
  uris: string[];
  ratios: Record<string, number>;
  columnWidth: number;
  gap: number;
  onPress: (index: number) => void;
  onAdd?: () => void;
};

export const MasonryGrid: React.FC<MasonryGridProps> = ({ uris, ratios, columnWidth, gap, onPress, onAdd }) => {
  // Distribute items into 2 columns by shortest column
  const col1: { uri: string; idx: number }[] = [];
  const col2: { uri: string; idx: number }[] = [];
  let h1 = 0;
  let h2 = 0;

  uris.forEach((uri, idx) => {
    const ratio = ratios[uri] || 1;
    // Cap extreme portrait images to a max aspect ratio of 1.5 (e.g. 2:3)
    const displayRatio = Math.min(ratio, 1.5);
    const itemH = columnWidth * displayRatio;
    if (h1 <= h2) {
      col1.push({ uri, idx });
      h1 += itemH + gap;
    } else {
      col2.push({ uri, idx });
      h2 += itemH + gap;
    }
  });

  // Determine which column is shorter (to append the "Add" card)
  const addToCol1 = h1 <= h2;

  const renderColumn = (items: { uri: string; idx: number }[], showAddCard: boolean) => (
    <View style={{ width: columnWidth, gap }}>
      {items.map(({ uri, idx }) => {
        // If URI is empty/falsy, show a Plus placeholder card
        if (!uri) {
          return (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.7}
              onPress={() => onAdd?.()}
              style={{
                width: columnWidth,
                height: columnWidth,
                borderRadius: 14,
                borderWidth: 2,
                borderStyle: 'dashed',
                borderColor: 'rgba(234,105,139,0.25)',
                backgroundColor: 'rgba(24,24,27,0.4)',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: 'rgba(234,105,139,0.1)',
                  borderWidth: 1,
                  borderColor: 'rgba(234,105,139,0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Plus size={20} color="#ea698b" />
              </View>
              <Text
                style={{
                  color: '#71717a',
                  fontSize: 10,
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: 1.5,
                }}
              >
                Add Photo
              </Text>
            </TouchableOpacity>
          );
        }

        const ratio = ratios[uri] || 1;
        const displayRatio = Math.min(ratio, 1.5);
        const itemH = columnWidth * displayRatio;
        return (
          <TouchableOpacity
            key={idx}
            activeOpacity={0.85}
            onPress={() => onPress(idx)}
            style={{
              width: columnWidth,
              height: itemH,
              borderRadius: 14,
              overflow: 'hidden',
              backgroundColor: '#18181b',
            }}
          >
            <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode={'cover'} />
            {/* Subtle bottom gradient for depth */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.35)']}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: 40,
              }}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={{ flexDirection: 'row', gap, paddingBottom: 4 }}>
      {renderColumn(col1, addToCol1)}
      {renderColumn(col2, !addToCol1)}
    </View>
  );
};
