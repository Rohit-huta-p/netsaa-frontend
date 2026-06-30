import { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, FlatList, StyleSheet } from 'react-native';
import { X, Search } from 'lucide-react-native';
import { useTopicTagSuggestions } from '@/hooks/useTopicTags';
import { eventService } from '@/services/eventService';

interface Props {
  selected: string[];
  onChange: (next: string[]) => void;
  max?: number;
}

const SURFACE = 'rgba(255,255,255,0.04)';
const SURFACE_HI = 'rgba(255,255,255,0.07)';
const HAIRLINE = 'rgba(255,255,255,0.1)';
const TEXT_0 = '#F3EFE8';
const TEXT_2 = '#71717a';
const TEXT_3 = '#52525b';
const ORANGE = '#FF6B35';
const ORANGE_INK = '#1A0D06';

function normalize(raw: string): string {
  return raw
    .normalize('NFC')
    .toLowerCase()
    .replace(/[​-‍﻿]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 30);
}

export default function TopicTagAutocomplete({ selected, onChange, max = 3 }: Props) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { data } = useTopicTagSuggestions(40);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebounced(query.trim()), 250);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  const filtered = useMemo(() => {
    const q = debounced.toLowerCase();
    const pool = data?.tags ?? [];
    if (!q) return pool.slice(0, 8);
    return pool.filter((t) => t._id.includes(q) || t.displayName.toLowerCase().includes(q)).slice(0, 8);
  }, [data, debounced]);

  const normalizedQuery = normalize(debounced);
  const canCreateNew = normalizedQuery.length >= 2 && !filtered.some((t) => t._id === normalizedQuery);

  const add = async (raw: string) => {
    const id = normalize(raw);
    if (!id) return;
    if (selected.length >= max) return;
    if (selected.includes(id)) return;
    onChange([...selected, id]);
    setQuery('');
    eventService.submitTag(raw).catch(() => { /* swallow */ });
  };

  const remove = (tagId: string) => onChange(selected.filter((t) => t !== tagId));

  return (
    <View style={{ gap: 8 }}>
      {selected.length < max ? (
        <View style={styles.searchBox}>
          <Search size={15} color={TEXT_3} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search or type a topic…"
            placeholderTextColor={TEXT_3}
            autoCorrect={false}
            autoCapitalize="none"
            onSubmitEditing={() => canCreateNew && add(query)}
            style={styles.searchInput}
          />
        </View>
      ) : null}

      {selected.length < max && (filtered.length > 0 || canCreateNew) ? (
        <View style={styles.dropdown}>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <Pressable onPress={() => add(item._id)} style={styles.suggestRow}>
                <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 13.5, color: TEXT_0 }}>{item.displayName}</Text>
                <Text style={{ fontFamily: 'SpaceMono-Regular', fontSize: 11, color: TEXT_3 }}>{item.usageCount}</Text>
              </Pressable>
            )}
            ListFooterComponent={canCreateNew ? (
              <Pressable onPress={() => add(query)} style={styles.createRow}>
                <Text style={{ fontFamily: 'Outfit-SemiBold', fontSize: 13, color: ORANGE }}>+ Create “{normalizedQuery}”</Text>
                <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 10.5, color: TEXT_3, marginTop: 2 }}>New tags go to moderation — you can still use it now.</Text>
              </Pressable>
            ) : null}
          />
        </View>
      ) : null}

      {selected.length > 0 ? (
        <View style={styles.chipWrap}>
          {selected.map((tag) => (
            <Pressable key={tag} onPress={() => remove(tag)} style={styles.chip} accessibilityLabel={`Remove ${tag}`}>
              <Text style={styles.chipText}>{tag}</Text>
              <X size={12} color={ORANGE_INK} />
            </Pressable>
          ))}
        </View>
      ) : null}

      <Text style={styles.helper}>Pick up to {max} topics.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: HAIRLINE,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  searchInput: { flex: 1, color: TEXT_0, fontFamily: 'Outfit-Regular', fontSize: 14, padding: 0 },
  dropdown: { backgroundColor: SURFACE, borderWidth: 1, borderColor: HAIRLINE, borderRadius: 10, overflow: 'hidden' },
  suggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(243,239,232,0.06)',
  },
  createRow: { paddingHorizontal: 14, paddingVertical: 11, backgroundColor: SURFACE_HI },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 7,
    backgroundColor: TEXT_0,
  },
  chipText: { fontFamily: 'Outfit-SemiBold', fontSize: 12.5, color: ORANGE_INK },
  helper: { fontFamily: 'Outfit-Regular', fontSize: 11, color: TEXT_3 },
});
