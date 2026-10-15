import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { Image as ImageIcon, Plus, X, Check } from 'lucide-react-native';
import { useComposerStoreV4 } from '../useComposerStoreV4';
import { presetFor, type DescribeSection } from '../eventTypePresets';
import { Group, TextField, Segmented, Hint } from '../ui';
import { C, F } from '../theme';
import type { LineupItemV4 } from '../composerForm';

const SECTION_META: Record<DescribeSection, { label: string; sub: string }> = {
  lineup: { label: 'Lineup', sub: 'What happens, in order: days, sessions, films or rounds.' },
  bring: { label: 'What to bring', sub: 'Things to bring, wear or prepare.' },
  included: { label: 'What they get', sub: "Anything included: certificates, materials, prizes, food." },
};
const ALL_SECTIONS: DescribeSection[] = ['lineup', 'bring', 'included'];

export default function Step5Describe() {
  const form = useComposerStoreV4((s) => s.form);
  const update = useComposerStoreV4((s) => s.update);
  const preset = presetFor(form.eventType);

  const has = (s: DescribeSection) =>
    s === 'lineup' ? form.lineup.length > 0 : s === 'bring' ? form.bring.items.length > 0 : form.included.length > 0;
  const [revealed, setRevealed] = useState<DescribeSection[]>(() => preset.openSections);
  const shown = ALL_SECTIONS.filter((s) => revealed.includes(s) || has(s));
  const missing = ALL_SECTIONS.filter((s) => !shown.includes(s));

  // lineup
  const setLineup = (next: LineupItemV4[]) => update('lineup', next);
  const editLine = (i: number, patch: Partial<LineupItemV4>) => setLineup(form.lineup.map((l, k) => (k === i ? { ...l, ...patch } : l)));
  // included
  const setIncluded = (next: string[]) => update('included', next);

  return (
    <View>
      <Text style={st.sub}>What people read before they sign up.</Text>

      <Group label="Cover / poster" required>
        <Pressable style={st.cover}>
          <ImageIcon size={22} color={C.dim} />
          <Text style={st.coverTxt}>Add a poster or photo</Text>
          <Text style={st.coverHint}>Portrait posters keep their text on the “whole poster” fit.</Text>
        </Pressable>
        <View style={st.fitRow}>
          <Text style={st.fitLab}>FIT</Text>
          <View style={{ flex: 1 }}>
            <Segmented value={form.coverFit} onChange={(v) => update('coverFit', v)}
              options={[{ key: 'whole', label: 'Whole poster' }, { key: 'fill', label: 'Fill the frame' }]} />
          </View>
        </View>
        <Hint>Uploads open once your draft is saved.</Hint>
      </Group>

      <Group label="About" required>
        <TextField value={form.about} onChangeText={(t) => update('about', t)} multiline
          placeholder="A few lines about the event — who it’s for and what happens." />
        <Hint>Write in the language your people read. You can edit this any time.</Hint>
      </Group>

      <Group label="Tagline" optional>
        <TextField value={form.tagline ?? ''} onChangeText={(t) => update('tagline', t)}
          placeholder="One line for the event page" />
        <Hint>Shown on the event page only when it’s filled.</Hint>
      </Group>

      {shown.map((s) => (
        <Group key={s} label={SECTION_META[s].label} sub={SECTION_META[s].sub} optional>
          {s === 'lineup' ? (
            <View style={{ gap: 7 }}>
              {form.lineup.map((l, i) => (
                <View key={i} style={st.line}>
                  <TextInput value={l.when ?? ''} onChangeText={(t) => editLine(i, { when: t })} placeholder="When" placeholderTextColor={C.dim2} style={st.lineWhen} />
                  <TextInput value={l.title} onChangeText={(t) => editLine(i, { title: t })} placeholder="What happens" placeholderTextColor={C.dim2} style={st.lineTitle} />
                  <Pressable onPress={() => setLineup(form.lineup.filter((_, k) => k !== i))}><X size={15} color={C.dim2} /></Pressable>
                </View>
              ))}
              <Adder label="Add an item" onPress={() => setLineup([...form.lineup, { title: '' }])} />
            </View>
          ) : s === 'bring' ? (
            <View style={{ gap: 7 }}>
              {form.bring.items.map((it, i) => (
                <View key={i} style={st.get}>
                  <View style={st.bringDot} />
                  <TextInput value={it} onChangeText={(t) => update('bring', { ...form.bring, items: form.bring.items.map((x, k) => (k === i ? t : x)) })} placeholder="Ghungroo, water bottle, headshot…" placeholderTextColor={C.dim2} style={st.getTxt} />
                  <Pressable onPress={() => update('bring', { ...form.bring, items: form.bring.items.filter((_, k) => k !== i) })}><X size={15} color={C.dim2} /></Pressable>
                </View>
              ))}
              <Adder label="Add something" onPress={() => update('bring', { ...form.bring, items: [...form.bring.items, ''] })} />
              <TextField value={form.bring.note ?? ''} onChangeText={(t) => update('bring', { ...form.bring, note: t })}
                placeholder="Anything to prepare before coming? (optional)" multiline />
            </View>
          ) : (
            <View style={{ gap: 7 }}>
              {form.included.map((g, i) => (
                <View key={i} style={st.get}>
                  <View style={st.getIc}><Check size={11} color={C.green} strokeWidth={2.6} /></View>
                  <TextInput value={g} onChangeText={(t) => setIncluded(form.included.map((x, k) => (k === i ? t : x)))} placeholder="Certificate, materials, prize, food…" placeholderTextColor={C.dim2} style={st.getTxt} />
                  <Pressable onPress={() => setIncluded(form.included.filter((_, k) => k !== i))}><X size={15} color={C.dim2} /></Pressable>
                </View>
              ))}
              <Adder label="Add something" onPress={() => setIncluded([...form.included, ''])} />
            </View>
          )}
        </Group>
      ))}

      {missing.length ? (
        <View style={st.addSec}>
          <Text style={st.addLab}>ADD A SECTION</Text>
          {missing.map((s) => (
            <Pressable key={s} onPress={() => setRevealed([...revealed, s])} style={st.secPill}>
              <Plus size={11} color={C.orange} strokeWidth={2.6} /><Text style={st.secPillTxt}>{SECTION_META[s].label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Group label="More photos & video" optional sub="Up to 6, including the cover.">
        <Pressable style={st.photoAdd}><Plus size={18} color={C.dim} /><Text style={st.photoTxt}>Add photos</Text></Pressable>
        <Hint>Uploads open once your draft is saved.</Hint>
      </Group>
    </View>
  );
}

const Adder = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <Pressable onPress={onPress} style={st.adder}><Plus size={13} color={C.orange} strokeWidth={2.6} /><Text style={st.adderTxt}>{label}</Text></Pressable>
);

const st = StyleSheet.create({
  sub: { fontFamily: F.body, fontSize: 13, color: C.dim, marginBottom: 18, lineHeight: 18 },
  cover: { height: 150, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: C.border2, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', gap: 5 },
  coverTxt: { fontFamily: F.semibold, fontSize: 13, color: C.t3 },
  coverHint: { fontFamily: F.body, fontSize: 10.5, color: C.dim2 },
  fitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  fitLab: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.2, color: C.dim, width: 22 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 9, paddingHorizontal: 9, paddingVertical: 7 },
  lineWhen: { width: 62, fontFamily: F.semibold, fontSize: 12, color: C.t2, padding: 0 },
  lineTitle: { flex: 1, fontFamily: F.body, fontSize: 12.5, color: C.t2, padding: 0 },
  get: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 9, paddingHorizontal: 9, paddingVertical: 7 },
  getIc: { width: 17, height: 17, borderRadius: 9, backgroundColor: C.greenSoft, alignItems: 'center', justifyContent: 'center' },
  bringDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.orange, marginLeft: 5, marginRight: 3 },
  getTxt: { flex: 1, fontFamily: F.body, fontSize: 12.5, color: C.t2, padding: 0 },
  adder: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 4 },
  adderTxt: { fontFamily: F.semibold, fontSize: 12, color: C.orange },
  addSec: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7, marginBottom: 22, marginTop: -6 },
  addLab: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.2, color: C.dim },
  secPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: C.border2 },
  secPillTxt: { fontFamily: F.semibold, fontSize: 11.5, color: C.orange },
  photoAdd: { height: 54, borderRadius: 11, borderWidth: 1, borderStyle: 'dashed', borderColor: C.border2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  photoTxt: { fontFamily: F.semibold, fontSize: 12.5, color: C.dim },
});
