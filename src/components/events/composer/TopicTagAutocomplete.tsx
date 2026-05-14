import { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, FlatList } from 'react-native';
import { X } from 'lucide-react-native';
import { useTopicTagSuggestions } from '@/hooks/useTopicTags';
import { eventService } from '@/services/eventService';
import { eventTokens } from '@/lib/eventTokens';

interface Props {
  selected: string[];
  onChange: (next: string[]) => void;
  max?: number;
}

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
    // Fire-and-forget tag submit (backend dedups; safe if it already exists)
    eventService.submitTag(raw).catch(() => { /* swallow */ });
  };

  const remove = (tagId: string) => onChange(selected.filter((t) => t !== tagId));

  return (
    <View className="gap-3">
      {selected.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {selected.map((tag) => (
            <Pressable
              key={tag}
              onPress={() => remove(tag)}
              className="flex-row items-center gap-2 px-3 py-2 rounded-full bg-event-brand"
            >
              <Text className="font-outfit text-white text-sm">{tag}</Text>
              <X size={14} color="#fff" />
            </Pressable>
          ))}
        </View>
      ) : null}

      {selected.length < max ? (
        <View className="rounded-2xl bg-event-surface border border-event-border px-4 py-3">
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search or type a topic..."
            placeholderTextColor={eventTokens.textMuted ?? '#6E6C76'}
            autoCorrect={false}
            autoCapitalize="none"
            onSubmitEditing={() => canCreateNew && add(query)}
            className="font-outfit text-event-textPrimary text-base"
            style={{ minHeight: 24 }}
          />
        </View>
      ) : null}

      {selected.length < max && (filtered.length > 0 || canCreateNew) ? (
        <View className="rounded-2xl bg-event-surface border border-event-border overflow-hidden">
          <FlatList
            data={filtered}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => add(item._id)}
                className="flex-row items-center justify-between px-4 py-3 border-b border-event-border"
              >
                <Text className="font-outfit text-event-textPrimary">{item.displayName}</Text>
                <Text className="font-mono text-event-textMuted text-xs">{item.usageCount}</Text>
              </Pressable>
            )}
            ListFooterComponent={canCreateNew ? (
              <Pressable
                onPress={() => add(query)}
                className="px-4 py-3 bg-event-surfaceAlt"
              >
                <Text className="font-outfit text-event-brand">+ Create "{normalizedQuery}"</Text>
                <Text className="font-outfit text-event-textMuted text-[10px] mt-1">Tags new to the platform go to moderation. You can still use it immediately.</Text>
              </Pressable>
            ) : null}
          />
        </View>
      ) : null}

      <Text className="font-outfit text-event-textMuted text-xs">
        Pick up to {max} topics.
      </Text>
    </View>
  );
}
