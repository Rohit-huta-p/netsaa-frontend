import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

export interface TypeaheadData {
  people: any[];
  gigs: any[];
  events: any[];
  intent: { dominantVertical: 'people' | 'gigs' | 'events'; confidence: number };
  order: readonly ('people' | 'gigs' | 'events')[];
}

interface Props {
  data: TypeaheadData;
  query: string;
  onSelect: (vertical: 'people' | 'gigs' | 'events', item: any) => void;
  onSeeAll: (q: string, vertical?: 'people' | 'gigs' | 'events') => void;
}

const SECTION_LABELS = {
  people: 'People · top 3',
  gigs:   'Gigs · top 2',
  events: 'Events · top 1',
} as const;

const itemDisplayName = (_vertical: string, it: any): string =>
  it.displayName ?? it.title ?? it.name ?? '(untitled)';

const itemSubLine = (vertical: string, it: any): string => {
  if (vertical === 'people') return [it.artistType, it.city].filter(Boolean).join(' · ');
  if (vertical === 'gigs')   return [it.city, it.date].filter(Boolean).join(' · ');
  return [it.eventType, it.city].filter(Boolean).join(' · ');
};

export function TypeaheadDropdown({ data, query, onSelect, onSeeAll }: Props) {
  return (
    <ScrollView
      testID="typeahead-dropdown"
      className="bg-[#12121f] border border-purple-900/40 rounded-xl max-h-[60vh]"
      keyboardShouldPersistTaps="always"
    >
      {data.order.map((v) => {
        const items = data[v] as any[];
        if (!items?.length) return null;
        return (
          <View key={v} className="p-3 border-b border-white/5">
            <View className="flex-row justify-between mb-2">
              <Text testID="typeahead-section-title" className="text-purple-300 text-[10px] uppercase font-bold tracking-wider">
                {SECTION_LABELS[v]}
              </Text>
              <TouchableOpacity onPress={() => onSeeAll(query, v)}>
                <Text className="text-gray-400 text-[10px]">See all →</Text>
              </TouchableOpacity>
            </View>
            {items.map((it) => (
              <TouchableOpacity key={it._id} onPress={() => onSelect(v, it)} className="py-2 flex-row items-center">
                <View className="w-7 h-7 rounded-full bg-purple-500/40 mr-2" />
                <View className="flex-1">
                  <Text className="text-white text-xs font-bold">{itemDisplayName(v, it)}</Text>
                  <Text className="text-gray-400 text-[10px]">{itemSubLine(v, it)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        );
      })}
      <TouchableOpacity onPress={() => onSeeAll(query, undefined)} className="p-3">
        <Text className="text-gray-500 text-[10px]">See all results for "{query}"  ↵ Enter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
