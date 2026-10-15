import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { Pencil, Users, Send, X } from 'lucide-react-native';
import { useComposerStoreV4 } from '../useComposerStoreV4';
import { presetFor, EVENT_TYPE_PRESETS, EVENT_TYPE_KEYS } from '../eventTypePresets';
import { Group, TextField, Pills, Chips, TagInput, Hint } from '../ui';
import { C, F } from '../theme';

const PRESET_KEYS = new Set<string>(EVENT_TYPE_KEYS);
const WHO_SUGGEST = ['Dancer', 'Actor', 'Musician', 'Singer', 'DJ', 'Model', 'Photographer', 'Director'];
const LEVELS: { label: string; v: 'all' | 'beginner' | 'intermediate' | 'advanced' }[] = [
  { label: 'Any', v: 'all' }, { label: 'Beginner', v: 'beginner' }, { label: 'Intermediate', v: 'intermediate' }, { label: 'Advanced', v: 'advanced' },
];

export default function Step1Event() {
  const form = useComposerStoreV4((s) => s.form);
  const update = useComposerStoreV4((s) => s.update);
  const setEventType = useComposerStoreV4((s) => s.setEventType);
  const [custom, setCustom] = useState(PRESET_KEYS.has(form.eventType) ? '' : form.eventType);
  const [person, setPerson] = useState('');
  const preset = presetFor(form.eventType);

  const addWho = (t: string) => { if (t && !form.whoFor.includes(t) && form.whoFor.length < 3) update('whoFor', [...form.whoFor, t]); };
  const removeWho = (t: string) => update('whoFor', form.whoFor.filter((x) => x !== t));
  const addStyle = (t: string) => { if (t && !form.styles.includes(t)) update('styles', [...form.styles, t]); };
  const addLang = (t: string) => { if (t && !form.languages.includes(t)) update('languages', [...form.languages, t]); };
  const addPerson = () => { if (!person.trim()) return; update('people', [...form.people, { displayName: person.trim(), role: preset.peopleRole, invited: true }]); setPerson(''); };
  const removePerson = (i: number) => update('people', form.people.filter((_, k) => k !== i));

  return (
    <View>
      <Text style={st.sub}>Start with the kind of event. It fills in suggestions; the form stays the same.</Text>

      <Group label="Event type" required>
        <Pills
          options={EVENT_TYPE_KEYS.filter((k) => k !== 'other').map((k) => ({ label: EVENT_TYPE_PRESETS[k].label, key: k, on: form.eventType === k }))}
          onPress={(k) => { setEventType(k); setCustom(''); }}
        />
        <TextField placeholder="Or type your own kind of event…" value={custom}
          onChangeText={(t) => { setCustom(t); if (t.trim()) { setEventType(t.trim()); update('eventTypeLabel', t.trim()); } }} />
        <Hint>It only fills in suggestions. Every event, even one you type in, gets the same form.</Hint>
      </Group>

      <Group label="Title" required>
        <TextField icon={Pencil} placeholder="e.g. Kathak Foundations · 3-day intensive" value={form.title} onChangeText={(t) => update('title', t)} maxLength={80} />
      </Group>

      <Group label="Who's it for" required sub="Up to 3. We suggest the event to these artists.">
        <TagInput tags={form.openToAll ? ['All creatives'] : form.whoFor} onRemove={(t) => (t === 'All creatives' ? update('openToAll', false) : removeWho(t))}
          placeholder={form.whoFor.length < 3 ? 'Pick or type an artist type…' : '3 of 3'}
          suggestions={['All creatives', ...WHO_SUGGEST].filter((w) => !form.whoFor.includes(w))}
          onAddSuggestion={(w) => (w === 'All creatives' ? update('openToAll', true) : addWho(w))} />
        <View style={st.lvl}>
          <Text style={st.lvlLab}>LEVEL</Text>
          <Chips options={LEVELS.map((l) => l.label)} value={LEVELS.find((l) => l.v === form.level)?.label} onChange={(lbl) => update('level', LEVELS.find((l) => l.label === lbl)!.v)} />
        </View>
      </Group>

      <Group label="Style / genre" optional>
        <TagInput tags={form.styles} onRemove={(t) => update('styles', form.styles.filter((x) => x !== t))} placeholder="Add a style…"
          suggestions={['Kathak', 'Classical', 'Hip-hop', 'Contemporary'].filter((x) => !form.styles.includes(x))} onAddSuggestion={addStyle} />
      </Group>

      <Group label="Language" optional>
        <TagInput tags={form.languages} onRemove={(t) => update('languages', form.languages.filter((x) => x !== t))} placeholder="Add a language…"
          suggestions={['Hindi', 'English', 'Marathi'].filter((x) => !form.languages.includes(x))} onAddSuggestion={addLang} />
      </Group>

      <Group label="People" optional sub="Anyone attendees should know about. Each person gets a role.">
        <View style={st.people}>
          {form.people.map((p, i) => (
            <Pressable key={i} onPress={() => removePerson(i)} style={st.person}>
              {p.invited ? <Send size={11} color={C.orange} /> : null}
              <Text style={st.personName}>{p.displayName}</Text>
              <Text style={st.personRole}>{p.role}</Text>
              <X size={12} color={C.dim2} />
            </Pressable>
          ))}
        </View>
        <View style={st.addPerson}>
          <Users size={15} color={C.dim} />
          <TextInput value={person} onChangeText={setPerson} onSubmitEditing={addPerson} returnKeyType="done"
            placeholder={`Search NETSA or type a ${preset.peopleRole.toLowerCase()}`} placeholderTextColor={C.dim2} style={st.addInput} />
          {person.trim() ? <Pressable onPress={addPerson}><Send size={16} color={C.orange} /></Pressable> : null}
        </View>
        <Hint>A name that isn't on NETSA is added as plain text; you can send them an invite link later.</Hint>
      </Group>
    </View>
  );
}

const st = StyleSheet.create({
  sub: { fontFamily: F.body, fontSize: 13, color: C.dim, marginBottom: 18, lineHeight: 18 },
  lvl: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  lvlLab: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.2, color: C.dim },
  people: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#1B1B24', borderWidth: 1, borderColor: C.border2 },
  personName: { fontFamily: F.semibold, fontSize: 12, color: C.t3 },
  personRole: { fontFamily: F.bold, fontSize: 9.5, color: C.t4, backgroundColor: '#2A2A34', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  addPerson: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: C.card, borderWidth: 1, borderStyle: 'dashed', borderColor: C.border2, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 11 },
  addInput: { flex: 1, fontFamily: F.body, fontSize: 13, color: C.t2, padding: 0 },
});
