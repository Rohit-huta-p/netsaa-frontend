import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Switch } from 'react-native';
import { Lock, Plus, X, ChevronDown, Check } from 'lucide-react-native';
import { useComposerStoreV4 } from '../useComposerStoreV4';
import { presetFor, type DoorPolicy } from '../eventTypePresets';
import { Note, Pills } from '../ui';
import { C, F, R } from '../theme';
import type { QuestionV4 } from '../composerForm';

/** The one real decision on this step. Name + phone are always collected, so they're
 *  a footnote, not a section. Questions and age limit are optional — demoted to quiet
 *  rows that stay empty until a host wants them. */
const DOORS: { key: DoorPolicy; label: string; line: string }[] = [
  { key: 'open', label: 'Open door', line: 'Anyone registers instantly. Waitlist when full.' },
  { key: 'guest_list', label: 'Guest list', line: 'You approve each request.' },
  { key: 'apply', label: 'Apply with work', line: 'They send a reel or photos; you pick.' },
];
const Q_TYPES: { k: QuestionV4['type']; label: string }[] = [
  { k: 'text', label: 'Short answer' }, { k: 'choice', label: 'Choice' },
  { k: 'link', label: 'Link' }, { k: 'photo', label: 'Photo' }, { k: 'yes_no', label: 'Yes / no' },
];
const AGES: { label: string; v: number }[] = [
  { label: 'Any age', v: 0 }, { label: '16+', v: 16 }, { label: '18+', v: 18 }, { label: '21+', v: 21 },
];
const MAX_Q = 3;

export default function Step4Register() {
  const form = useComposerStoreV4((s) => s.form);
  const update = useComposerStoreV4((s) => s.update);
  const { addQuestion, updateQuestion, removeQuestion } = useComposerStoreV4.getState();
  const preset = presetFor(form.eventType);
  const ageVal = form.ageRestriction ?? 0;
  const age = AGES.find((a) => a.v === ageVal) ?? AGES[0];

  const [ageOpen, setAgeOpen] = useState(ageVal > 0);
  const [typeOpenFor, setTypeOpenFor] = useState<string | null>(null);

  const setOption = (q: QuestionV4, i: number, v: string) =>
    updateQuestion(q.id, { options: (q.options ?? ['', '']).map((o, k) => (k === i ? v : o)) });
  const addOption = (q: QuestionV4) => updateQuestion(q.id, { options: [...(q.options ?? ['', '']), ''] });

  return (
    <View>
      {/* The header already asks "How do people get in?" — go straight to the choice. */}
      <View style={st.doors}>
        {DOORS.map((d) => {
          const on = form.door === d.key;
          return (
            <Pressable key={d.key} onPress={() => update('door', d.key)} style={[st.door, on && st.doorOn]}
              accessibilityRole="radio" accessibilityState={{ selected: on }}>
              <View style={[st.radio, on && st.radioOn]}>{on ? <View style={st.radioDot} /> : null}</View>
              <View style={{ flex: 1 }}>
                <Text style={[st.dTitle, on && st.dTitleOn]}>{d.label}</Text>
                <Text style={st.dLine}>{d.line}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {form.paid && form.door !== 'open' ? (
        <View style={{ marginTop: 12 }}>
          <Note kind="warn"><Text style={st.b}>Paid + approval: </Text>approved guests get 48 hours to pay, or the spot passes on.</Note>
        </View>
      ) : null}

      {/* Always collected — a footnote, not a section. */}
      <View style={st.foot}>
        <Lock size={13} color={C.dim2} />
        <Text style={st.footTxt}>You&apos;ll always get their <Text style={st.footB}>name</Text> and <Text style={st.footB}>phone</Text>.</Text>
      </View>

      <Text style={st.optLab}>OPTIONAL</Text>

      {/* Questions — editors only appear once a host adds one. */}
      {form.questions.map((q, i) => (
        <View key={q.id} style={st.qcard}>
          <View style={st.qHead}>
            <Text style={st.qEyebrow}>QUESTION {i + 1}</Text>
            <Pressable onPress={() => { removeQuestion(q.id); setTypeOpenFor((o) => (o === q.id ? null : o)); }} hitSlop={8}>
              <X size={15} color={C.dim2} />
            </Pressable>
          </View>
          <TextInput value={q.label} onChangeText={(t) => updateQuestion(q.id, { label: t })}
            placeholder="What do you want to ask?" placeholderTextColor={C.dim2} style={st.qInput} />

          <View style={st.qMeta}>
            <Pressable onPress={() => setTypeOpenFor(typeOpenFor === q.id ? null : q.id)} style={st.sel}>
              <Text style={st.selTxt}>{Q_TYPES.find((t) => t.k === q.type)?.label ?? 'Short answer'}</Text>
              <ChevronDown size={14} color={C.dim} />
            </Pressable>
            <View style={st.reqWrap}>
              <Text style={[st.reqLab, q.required && st.reqLabOn]}>Required</Text>
              <Switch value={q.required} onValueChange={(v) => updateQuestion(q.id, { required: v })}
                trackColor={{ true: C.orange, false: '#2A2A34' }} thumbColor="#fff" />
            </View>
          </View>

          {typeOpenFor === q.id ? (
            <View style={st.menu}>
              {Q_TYPES.map((t) => {
                const sel = t.k === q.type;
                return (
                  <Pressable key={t.k} onPress={() => { updateQuestion(q.id, { type: t.k }); setTypeOpenFor(null); }} style={st.menuItem}>
                    <Text style={[st.menuTxt, sel && st.menuTxtOn]}>{t.label}</Text>
                    {sel ? <Check size={14} color={C.orange} /> : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {q.type === 'choice' ? (
            <View style={{ gap: 6 }}>
              {(q.options ?? ['', '']).map((opt, i2) => (
                <View key={i2} style={st.opt}>
                  <View style={st.oDot} />
                  <TextInput value={opt} onChangeText={(t) => setOption(q, i2, t)} placeholder={`Option ${i2 + 1}`}
                    placeholderTextColor={C.dim2} style={st.optInput} />
                </View>
              ))}
              <Pressable onPress={() => addOption(q)} style={st.optAdd}>
                <Plus size={11} color={C.orange} strokeWidth={2.6} /><Text style={st.optAddTxt}>Add a choice</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ))}

      {form.questions.length < MAX_Q ? (
        <>
          <Pressable onPress={() => addQuestion()} style={st.addRow}>
            <View style={st.addPlus}><Plus size={13} color={C.orange} strokeWidth={2.6} /></View>
            <Text style={st.addTxt}>Ask a question</Text>
            {form.questions.length === 0 ? <Text style={st.addMeta}>optional</Text> : null}
          </Pressable>
          {form.questions.length >= 1 ? (
            <Pills options={preset.questionSuggestions.map((x) => ({ label: x }))}
              onPress={(lbl) => addQuestion({ label: lbl, type: lbl.toLowerCase().includes('link') ? 'link' : 'text' })} />
          ) : null}
        </>
      ) : null}

      {/* Age limit — a quiet row that expands on tap. */}
      <Pressable onPress={() => setAgeOpen((o) => !o)} style={[st.ageRow, { marginTop: 10 }]}>
        <Text style={st.ageT}>Age limit</Text>
        <Text style={st.ageV}>{age.label}</Text>
        <ChevronDown size={16} color={C.dim2} style={{ transform: [{ rotate: ageOpen ? '180deg' : '0deg' }] }} />
      </Pressable>
      {ageOpen ? (
        <View style={st.ageChips}>
          {AGES.map((a) => {
            const on = a.v === ageVal;
            return (
              <Pressable key={a.v} onPress={() => update('ageRestriction', a.v)} style={[st.chip, on && st.chipOn]}>
                <Text style={[st.chipTxt, on && st.chipTxtOn]}>{a.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  b: { fontFamily: F.bold, color: '#fff' },

  doors: { gap: 10 },
  door: { flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: R.xl, paddingHorizontal: 15, paddingVertical: 15 },
  doorOn: { backgroundColor: C.orangeSoft, borderColor: C.orangeBorder },
  radio: { width: 21, height: 21, borderRadius: 11, borderWidth: 2, borderColor: C.border2, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: C.orange },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: C.orange },
  dTitle: { fontFamily: F.bold, fontSize: 15, color: C.t2, letterSpacing: -0.1 },
  dTitleOn: { color: C.orangeInk },
  dLine: { fontFamily: F.body, fontSize: 12, color: C.dim, marginTop: 3, lineHeight: 16 },

  foot: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, paddingHorizontal: 2 },
  footTxt: { flex: 1, fontFamily: F.body, fontSize: 12, color: C.dim, lineHeight: 16 },
  footB: { fontFamily: F.semibold, color: C.t4 },

  optLab: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.4, color: C.dim2, marginTop: 22, marginBottom: 9, marginLeft: 2 },

  qcard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.orangeBorder, borderRadius: R.xl, padding: 13, gap: 11, marginBottom: 9 },
  qHead: { flexDirection: 'row', alignItems: 'center' },
  qEyebrow: { flex: 1, fontFamily: F.mono, fontSize: 9, letterSpacing: 1.3, color: C.orangeInk },
  qInput: { fontFamily: F.semibold, fontSize: 15, color: C.t2, padding: 0 },
  qMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sel: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: C.card2, borderWidth: 1, borderColor: C.border2, borderRadius: R.md, paddingHorizontal: 12, paddingVertical: 9 },
  selTxt: { fontFamily: F.semibold, fontSize: 12.5, color: C.t3 },
  reqWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 'auto' },
  reqLab: { fontFamily: F.semibold, fontSize: 12.5, color: C.dim },
  reqLabOn: { color: C.t3 },
  menu: { backgroundColor: C.card2, borderWidth: 1, borderColor: C.border2, borderRadius: R.md, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border },
  menuTxt: { fontFamily: F.medium, fontSize: 13, color: C.t4 },
  menuTxtOn: { fontFamily: F.semibold, color: C.orangeInk },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  oDot: { width: 13, height: 13, borderRadius: 7, borderWidth: 1.5, borderColor: C.border2 },
  optInput: { flex: 1, fontFamily: F.body, fontSize: 12.5, color: C.t2, padding: 0 },
  optAdd: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  optAddTxt: { fontFamily: F.semibold, fontSize: 11.5, color: C.orange },

  addRow: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: R.lg, paddingHorizontal: 14, paddingVertical: 14 },
  addPlus: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.orangeSoft, alignItems: 'center', justifyContent: 'center' },
  addTxt: { flex: 1, fontFamily: F.semibold, fontSize: 14, color: C.t2 },
  addMeta: { fontFamily: F.medium, fontSize: 11, color: C.dim2 },

  ageRow: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: R.lg, paddingHorizontal: 14, paddingVertical: 14 },
  ageT: { flex: 1, fontFamily: F.semibold, fontSize: 14, color: C.t2 },
  ageV: { fontFamily: F.body, fontSize: 12.5, color: C.dim },
  ageChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 9 },
  chip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: R.pill, backgroundColor: C.card2, borderWidth: 1, borderColor: C.border2 },
  chipOn: { backgroundColor: C.orangeSoft, borderColor: C.orangeBorder },
  chipTxt: { fontFamily: F.medium, fontSize: 12.5, color: C.t4 },
  chipTxtOn: { fontFamily: F.semibold, color: C.orangeInk },
});
