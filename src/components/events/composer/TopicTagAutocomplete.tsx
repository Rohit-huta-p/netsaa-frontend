import { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, FlatList } from 'react-native';
import { X } from 'lucide-react-native';
import { useTopicTagSuggestions } from '@/hooks/useTopicTags';
import { eventTokens } from '@/lib/eventTokens';

interface Props {
  selected: string[];
  onChange: (next: string[]) => void;
  max?: number;
}

export default function TopicTagAutocomplete({ selected, onChange, max = 3 }: Props) {
  const [query, setQuery] = useState('');
  const { data } = useTopicTagSuggestions(40);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = data?.tags ?? [];
    if (!q) return pool.slice(0, 8);
    return pool.filter((t) => t._id.includes(q) || t.displayName.toLowerCase().includes(q)).slice(0, 8);
  }, [data, query]);

  const add = (tagId: string) => {
    if (selected.length >= max) return;
    if (selected.includes(tagId)) return;
    onChange([...selected, tagId]);
    setQuery('');
  };

  const remove = (tagId: string) => onChange(selected.filter((t) => t !== tagId));

  const canCreateNew = query.trim().length >= 2 && !filtered.some((t) => t._id === query.trim().toLowerCase());

  return (
    <View className="gap-3">
      {/* Selected pills */}
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

      {/* Input */}
      {selected.length < max ? (
        <View className="rounded-2xl bg-event-surface border border-event-border px-4 py-3">
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search or type a topic..."
            placeholderTextColor={eventTokens.textMuted ?? '#6E6C76'}
            autoCorrect={false}
            autoCapitalize="none"
            className="font-outfit text-event-textPrimary text-base"
            style={{ minHeight: 24 }}
          />
        </View>
      ) : null}

      {/* Suggestions */}
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
                onPress={() => add(query.trim().toLowerCase().replace(/\s+/g, '-'))}
                className="px-4 py-3"
              >
                <Text className="font-outfit text-event-brand">+ Create "{query.trim()}"</Text>
              </Pressable>
            ) : null}
          />
        </View>
      ) : null}

      <Text className="font-outfit text-event-textMuted text-xs">
        Pick up to {max} topics. Suggestions come from approved tags; new ones go to moderation.
      </Text>
    </View>
  );
}
