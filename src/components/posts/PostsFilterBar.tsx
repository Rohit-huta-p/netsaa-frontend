/**
 * PostsFilterBar — type filter (All/Gigs/Events) + sort handle + result count.
 * Used by the /posts (Manage all) screen. Purely presentational; state lives
 * in the screen.
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

export type TypeFilter = 'all' | 'gig' | 'event';
export type SortOrder = 'newest' | 'oldest';

const TYPE_CHIPS: { key: TypeFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'gig', label: 'Gigs' },
  { key: 'event', label: 'Events' },
];

export interface PostsFilterBarProps {
  type: TypeFilter;
  onTypeChange: (t: TypeFilter) => void;
  sort: SortOrder;
  onSortToggle: () => void;
  count: number;
}

export default function PostsFilterBar({ type, onTypeChange, sort, onSortToggle, count }: PostsFilterBarProps) {
  return (
    <View>
      <View style={styles.row}>
        <View style={styles.chips}>
          {TYPE_CHIPS.map((c) => {
            const on = c.key === type;
            return (
              <Pressable
                key={c.key}
                onPress={() => onTypeChange(c.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                hitSlop={6}
                style={[styles.chip, on && styles.chipOn]}
              >
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{c.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable onPress={onSortToggle} accessibilityRole="button" hitSlop={6} style={styles.sort}>
          <Text style={styles.sortText}>{sort === 'newest' ? 'Newest' : 'Oldest'} ⇅</Text>
        </Pressable>
      </View>
      <Text style={styles.count}>{count} {count === 1 ? 'RESULT' : 'RESULTS'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(243,239,232,0.06)',
  },
  chipOn: { backgroundColor: '#F3EFE8', borderColor: '#F3EFE8' },
  chipText: { fontSize: 11, fontFamily: 'Outfit-SemiBold', color: '#B8B1A6' },
  chipTextOn: { color: '#060509' },
  sort: { paddingVertical: 6 },
  sortText: { fontSize: 11, color: '#6B6878', fontFamily: 'Outfit-Medium' },
  count: { fontSize: 11, color: '#6B6878', fontFamily: 'SpaceMono-Regular', letterSpacing: 0.5, marginBottom: 14 },
});
