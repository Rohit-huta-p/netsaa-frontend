import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Search as SearchIcon } from 'lucide-react-native';
import { useSearchTypeahead } from '@/hooks/useSearchTypeahead';
import { TypeaheadDropdown } from './TypeaheadDropdown';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const router = useRouter();
  const { data } = useSearchTypeahead(query);

  const handleSeeAll = (q: string, vertical?: 'people' | 'gigs' | 'events') => {
    const tab = vertical ?? (data?.intent?.dominantVertical ?? 'people');
    router.push(`/(app)/search?q=${encodeURIComponent(q)}&tab=${tab}` as any);
  };

  const handleSelect = (vertical: 'people' | 'gigs' | 'events', it: any) => {
    if (vertical === 'people') router.push(`/(app)/profile/${it._id}` as any);
    else if (vertical === 'gigs') router.push(`/(app)/gigs/${it._id}` as any);
    else router.push(`/(app)/events/${it._id}` as any);
  };

  const showDropdown = focused && !!data && query.trim().length >= 2;

  return (
    <View>
      <View className="flex-row items-center gap-2 bg-white/10 border border-white/10 rounded-xl px-3 py-2">
        <SearchIcon size={16} color="#9ca3af" />
        <TextInput
          testID="searchbar-input"
          className="flex-1 text-white text-xs"
          placeholder="Search artists, gigs, events"
          placeholderTextColor="#6b7280"
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onSubmitEditing={() => handleSeeAll(query)}
          returnKeyType="search"
        />
      </View>
      {showDropdown && (
        <View className="absolute top-12 left-0 right-0 z-50">
          <TypeaheadDropdown
            data={data}
            query={query}
            onSelect={handleSelect}
            onSeeAll={handleSeeAll}
          />
        </View>
      )}
    </View>
  );
}
