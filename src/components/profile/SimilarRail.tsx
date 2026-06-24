// src/components/profile/SimilarRail.tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

interface Item {
  _id: string;
  displayName?: string;
  artistType?: string;
  city?: string;
  reasons?: string[];
}

interface Props {
  items: Item[];
  total: number;
  onSeeAll: () => void;
  onItemPress: (peerId: string) => void;
}

export function SimilarRail({ items, total, onSeeAll, onItemPress }: Props) {
  if ((items?.length ?? 0) < 3) return null;
  return (
    <View className="bg-white/[0.04] border border-white/10 rounded-xl p-3 mt-4">
      <View className="flex-row justify-between mb-2">
        <View>
          <Text className="text-white font-bold text-sm">People also viewed</Text>
          <Text className="text-gray-400 text-[10px]">Similar craft, city, skills</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {items.map((it) => (
          <TouchableOpacity
            key={it._id}
            testID={`similar-card-${it._id}`}
            onPress={() => onItemPress(it._id)}
            className="w-24 bg-[#12121f] border border-white/10 rounded-lg p-2 mr-2 items-center"
          >
            <View className="w-9 h-9 rounded-full bg-purple-500/40 mb-1" />
            <Text className="text-white text-[10px] font-bold text-center" numberOfLines={1}>
              {it.displayName}
            </Text>
            <Text className="text-gray-400 text-[9px] text-center" numberOfLines={1}>
              {it.artistType ?? it.city ?? ''}
            </Text>
            {it.reasons?.[0] && (
              <Text className="text-green-300 text-[8px] text-center mt-1" numberOfLines={1}>
                {it.reasons[0]}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity
        testID="similar-see-all"
        onPress={onSeeAll}
        className="py-2 mt-2 border-t border-white/5 flex-row items-center justify-center"
      >
        <Text className="text-purple-300 text-xs font-bold">Show all {total} similar artists</Text>
        <ChevronRight size={14} color="#a78bfa" />
      </TouchableOpacity>
    </View>
  );
}
