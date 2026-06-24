import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';

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
  onSeeAll: () => void;
}

export function PYMKCarousel({ items, onConnect, onDismiss, onSeeAll }: Props) {
  if (!items?.length) return null;
  return (
    <View className="mb-3">
      <View className="flex-row justify-between mb-2 px-2">
        <View>
          <Text className="text-white font-bold text-sm">People you may know</Text>
          <Text className="text-gray-400 text-[10px]">Based on your network</Text>
        </View>
        <TouchableOpacity onPress={onSeeAll}>
          <Text className="text-purple-300 text-xs font-bold">See all →</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 8 }}>
        {items.map((it) => (
          <View key={it._id} className="w-28 bg-[#12121f] border border-white/10 rounded-xl p-2 mr-2 relative items-center">
            <TouchableOpacity
              testID={`pymk-dismiss-${it._id}`}
              onPress={() => onDismiss(it._id)}
              className="absolute top-1 right-1 bg-white/10 rounded-full w-5 h-5 items-center justify-center z-10"
            >
              <X size={12} color="#9ca3af" />
            </TouchableOpacity>
            <View className="w-12 h-12 rounded-full bg-purple-500/40 mb-2 mt-1" />
            <Text className="text-white text-[11px] font-bold text-center" numberOfLines={1}>
              {it.displayName ?? '(unknown)'}
            </Text>
            <Text className="text-gray-400 text-[9px] text-center" numberOfLines={1}>
              {it.artistType ?? it.city ?? ''}
            </Text>
            {it.reasons?.[0] && (
              <Text className="text-green-300 text-[9px] mb-2 text-center" numberOfLines={1}>
                {it.reasons[0]}
              </Text>
            )}
            <TouchableOpacity
              testID={`pymk-connect-${it._id}`}
              onPress={() => onConnect(it._id)}
              className="border border-purple-400/50 rounded-md px-3 py-1"
            >
              <Text className="text-purple-300 text-[10px] font-bold">Connect</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
