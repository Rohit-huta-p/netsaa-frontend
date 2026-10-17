/**
 * "Featuring" people search for Step 1 (spec C3: "Search NETSA or type a name").
 *
 * Live people-only search (same search-service as the navbar, via useSearchPeople)
 * with a debounced query. Picking a result adds a real NETSA profile (userId →
 * no invite needed). "Add as a guest" falls back to a plain name, which gets the
 * ✈ invite flow. Mirrors the navbar typeahead, scoped to people.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { Users, Send, UserPlus } from 'lucide-react-native';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useSearchPeople } from '@/hooks/useSearchQueries';
import { C, F } from './theme';

export interface PickedPerson { userId: string; displayName: string; avatarUrl?: string }

/** Pull a {userId, displayName, avatarUrl} out of a raw search-service person result. */
export function personFromResult(p: any): PickedPerson {
  const name =
    [p?.firstName, p?.lastName].filter(Boolean).join(' ').trim() ||
    p?.displayName || p?.name || p?.title || 'Unknown';
  return {
    userId: String(p?._id ?? p?.id ?? ''),
    displayName: name,
    avatarUrl: p?.profileImageUrl || undefined,
  };
}

/** "Dancer · Pune" line under a result. */
export function resultMeta(p: any): string {
  return [p?.artistType, p?.city].filter(Boolean).join(' · ');
}

const MAX_RESULTS = 6;

export default function PeopleSearchFieldV4({ roleLabel, existingUserIds, onPick, onAddPlain }: {
  roleLabel: string;
  existingUserIds: Set<string>;
  onPick: (p: PickedPerson) => void;
  onAddPlain: (name: string) => void;
}) {
  const [q, setQ] = useState('');
  const typed = q.trim();
  const debounced = useDebouncedValue(typed, 250);
  const active = debounced.length >= 2;
  const { data, isFetching } = useSearchPeople(debounced);

  const results: any[] = active
    ? ((data?.results ?? []) as any[])
        .filter((p) => !existingUserIds.has(String(p?._id ?? p?.id ?? '')))
        .slice(0, MAX_RESULTS)
    : [];

  const pick = (p: any) => { onPick(personFromResult(p)); setQ(''); };
  const addPlain = () => { if (typed) { onAddPlain(typed); setQ(''); } };

  return (
    <View>
      <View style={st.field}>
        <Users size={15} color={C.dim} />
        <TextInput
          value={q} onChangeText={setQ} onSubmitEditing={addPlain} returnKeyType="done"
          autoCorrect={false} autoCapitalize="words"
          placeholder={`Search NETSA or type a ${roleLabel.toLowerCase()}`} placeholderTextColor={C.dim2}
          style={st.input}
        />
        {active && isFetching ? <ActivityIndicator size="small" color={C.dim} />
          : typed ? <Pressable onPress={addPlain} accessibilityLabel="Add person"><Send size={16} color={C.orange} /></Pressable>
          : null}
      </View>

      {typed ? (
        <View style={st.dropdown}>
          {results.map((p, i) => {
            const person = personFromResult(p);
            const meta = resultMeta(p);
            return (
              <Pressable key={person.userId || i} style={[st.row, i > 0 && st.rowDivider]} onPress={() => pick(p)}
                accessibilityLabel={`Add ${person.displayName} from NETSA`}>
                {person.avatarUrl
                  ? <Image source={{ uri: person.avatarUrl }} style={st.avatar} />
                  : <View style={[st.avatar, st.avatarBlank]} />}
                <View style={{ flex: 1 }}>
                  <Text style={st.name} numberOfLines={1}>{person.displayName}</Text>
                  {meta ? <Text style={st.meta} numberOfLines={1}>{meta}</Text> : null}
                </View>
                <Text style={st.onNetsa}>On NETSA</Text>
              </Pressable>
            );
          })}

          {active && !isFetching && results.length === 0 ? (
            <Text style={st.empty}>No one on NETSA matches “{typed}”.</Text>
          ) : null}

          <Pressable style={[st.row, results.length > 0 && st.rowDivider]} onPress={addPlain}
            accessibilityLabel={`Add ${typed} as a guest`}>
            <View style={[st.avatar, st.addPlainIc]}><UserPlus size={15} color={C.orange} /></View>
            <Text style={st.addPlain} numberOfLines={1}>Add “{typed}” as a guest</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: C.card, borderWidth: 1, borderStyle: 'dashed', borderColor: C.border2, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 11 },
  input: { flex: 1, fontFamily: F.body, fontSize: 13, color: C.t2, padding: 0 },
  dropdown: { marginTop: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 12, paddingVertical: 10 },
  rowDivider: { borderTopWidth: 1, borderTopColor: C.border },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.well },
  avatarBlank: { borderWidth: 1, borderColor: C.border2 },
  name: { fontFamily: F.semibold, fontSize: 13, color: C.t2 },
  meta: { fontFamily: F.body, fontSize: 11, color: C.dim, marginTop: 1 },
  onNetsa: { fontFamily: F.mono, fontSize: 8.5, letterSpacing: 0.6, color: C.green, textTransform: 'uppercase' },
  empty: { fontFamily: F.body, fontSize: 12, color: C.dim, paddingHorizontal: 12, paddingVertical: 11 },
  addPlainIc: { alignItems: 'center', justifyContent: 'center', backgroundColor: C.orangeSoft },
  addPlain: { flex: 1, fontFamily: F.semibold, fontSize: 13, color: C.t3 },
});
