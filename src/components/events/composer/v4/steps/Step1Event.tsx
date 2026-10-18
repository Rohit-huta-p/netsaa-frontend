import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Pencil } from 'lucide-react-native';
import { useComposerStoreV4 } from '../useComposerStoreV4';
import { Group, TextField, ChipsMulti, TagInput, Hint } from '../ui';
import type { SkillLevelV4 } from '../composerForm';
import EventTypeField from '../EventTypeField';
import { C, F } from '../theme';

const WHO_SUGGEST = ['Dancer', 'Actor', 'Musician', 'Singer', 'DJ', 'Model', 'Photographer', 'Director'];
const LEVELS: { label: string; v: 'all' | 'beginner' | 'intermediate' | 'advanced' }[] = [
  { label: 'Any', v: 'all' }, { label: 'Beginner', v: 'beginner' }, { label: 'Intermediate', v: 'intermediate' }, { label: 'Advanced', v: 'advanced' },
];

export default function Step1Event() {
  const form = useComposerStoreV4((s) => s.form);
  const update = useComposerStoreV4((s) => s.update);

  // "All creatives" and specific types are mutually exclusive, so a specific
  // pick is never hidden behind openToAll (and vice-versa).
  const addWho = (t: string) => {
    if (!t) return;
    const base = form.openToAll ? [] : form.whoFor;
    if (base.includes(t) || base.length >= 3) return;
    if (form.openToAll) update('openToAll', false);
    update('whoFor', [...base, t]);
  };
  const removeWho = (t: string) => update('whoFor', form.whoFor.filter((x) => x !== t));
  const chooseAllCreatives = () => { if (form.whoFor.length) update('whoFor', []); update('openToAll', true); };
  const addStyle = (t: string) => { if (t && !form.styles.includes(t)) update('styles', [...form.styles, t]); };
  const addLang = (t: string) => { if (t && !form.languages.includes(t)) update('languages', [...form.languages, t]); };
  // Level is multi-select; [] = any. "Any" clears the array, a specific level toggles in/out.
  const toggleLevel = (v: string) => {
    if (v === 'all') return update('levels', []);
    const lv = v as SkillLevelV4;
    update('levels', form.levels.includes(lv) ? form.levels.filter((x) => x !== lv) : [...form.levels, lv]);
  };

  return (
    <View>
      <Text style={st.sub}>Start with the kind of event. It fills in suggestions; the form stays the same.</Text>

      <Group label="Event type" required>
        <EventTypeField />
        <Hint>It only fills in suggestions. Every event, even one you type in, gets the same form.</Hint>
      </Group>

      <Group label="Title" required>
        <TextField icon={Pencil} placeholder="e.g. Kathak Foundations · 3-day intensive" value={form.title} onChangeText={(t) => update('title', t)} maxLength={80} />
      </Group>

      <Group label="Who's it for" required sub="Up to 3. We suggest the event to these artists.">
        <TagInput tags={form.openToAll ? ['All creatives'] : form.whoFor} onRemove={(t) => (t === 'All creatives' ? update('openToAll', false) : removeWho(t))}
          placeholder={form.openToAll ? '' : form.whoFor.length < 3 ? 'Pick or type an artist type…' : '3 of 3'}
          suggestions={[...(form.openToAll ? [] : ['All creatives']), ...WHO_SUGGEST].filter((w) => !form.whoFor.includes(w))}
          onAddSuggestion={(w) => (w === 'All creatives' ? chooseAllCreatives() : addWho(w))} />
        <View style={st.lvl}>
          <Text style={st.lvlLab}>LEVEL · pick any</Text>
          <ChipsMulti
            options={LEVELS.map((l) => ({ label: l.label, key: l.v }))}
            values={form.levels.length ? form.levels : ['all']}
            onToggle={toggleLevel}
          />
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
    </View>
  );
}

const st = StyleSheet.create({
  sub: { fontFamily: F.body, fontSize: 13, color: C.dim, marginBottom: 18, lineHeight: 18 },
  lvl: { gap: 8, marginTop: 12 },
  lvlLab: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.2, color: C.dim },
});
