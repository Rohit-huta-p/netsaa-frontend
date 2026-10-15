import React from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { DoorOpen, ClipboardList, Image as ImageIcon, Plus, X, Pencil } from 'lucide-react-native';
import { useComposerStoreV4 } from '../useComposerStoreV4';
import { presetFor, type DoorPolicy } from '../eventTypePresets';
import { Group, Segmented, Chips, Hint, Note, Card, ToggleRow, Pills } from '../ui';
import { C, F } from '../theme';
import type { QuestionV4 } from '../composerForm';

const DOORS: { key: DoorPolicy; label: string; icon: any; line: string }[] = [
  { key: 'open', label: 'Open door', icon: DoorOpen, line: 'Anyone registers instantly. Waitlist when full.' },
  { key: 'guest_list', label: 'Guest list', icon: ClipboardList, line: 'People request a spot. You approve each one.' },
  { key: 'apply', label: 'Apply with work', icon: ImageIcon, line: 'They send a reel or photos. You pick who gets in.' },
];
const Q_TYPES: { k: QuestionV4['type']; label: string }[] = [
  { k: 'text', label: 'Short answer' }, { k: 'choice', label: 'Choice' }, { k: 'link', label: 'Link' }, { k: 'photo', label: 'Photo' }, { k: 'yes_no', label: 'Yes / no' },
];
const AGES: { label: string; v: number }[] = [{ label: 'All ages', v: 0 }, { label: '16+', v: 16 }, { label: '18+', v: 18 }, { label: '21+', v: 21 }];

export default function Step4Register() {
  const form = useComposerStoreV4((s) => s.form);
  const update = useComposerStoreV4((s) => s.update);
  const { addQuestion, updateQuestion, removeQuestion } = useComposerStoreV4.getState();
  const preset = presetFor(form.eventType);
  const door = DOORS.find((d) => d.key === form.door) ?? DOORS[0];
  const paidSpot = form.spots.find((s) => s.price > 0);
  const button = form.door === 'apply' ? 'Apply' : form.door === 'guest_list' ? 'Request to join'
    : (form.paid && paidSpot && form.spots.length === 1 ? `Get tickets · ₹${paidSpot.price}` : 'Register');

  const setOption = (q: QuestionV4, i: number, v: string) => updateQuestion(q.id, { options: (q.options ?? []).map((o, k) => (k === i ? v : o)) });
  const addOption = (q: QuestionV4) => updateQuestion(q.id, { options: [...(q.options ?? ['', '']), ''] });

  return (
    <View>
      <Text style={st.sub}>How people get in, and what you ask them.</Text>

      <Group label="Door policy">
        <Segmented value={form.door} onChange={(v) => update('door', v)} options={DOORS.map((d) => ({ key: d.key, label: d.label, icon: d.icon }))} />
        <Hint>{door.line}</Hint>
        {form.paid && form.door !== 'open' ? (
          <Note kind="warn"><Text style={st.b}>Pay after approval. </Text>Approved people get a link to pay within 48 hours, or the spot goes to the next person.</Note>
        ) : null}
      </Group>

      <Group label="Sign-up form" sub="What attendees fill in. Tap a question to change it.">
        <Card style={st.form}>
          <Text style={st.formKey}>WHAT ATTENDEES FILL IN</Text>
          <Locked label="Name" hint="Your full name" />
          <Locked label="Phone" hint="+91 98xxx xxxxx" />
          {form.spots.length > 1 ? <Locked label="Spot" hint={form.spots.map((s) => s.name).join(' / ')} tag="Pick one" /> : null}
          {form.questions.map((q) => (
            <View key={q.id} style={st.qCard}>
              <View style={st.spotTop}>
                <TextInput value={q.label} onChangeText={(t) => updateQuestion(q.id, { label: t })} placeholder="Type your question" placeholderTextColor={C.dim2} style={st.qLabel} />
                <Pressable onPress={() => removeQuestion(q.id)}><X size={15} color={C.dim2} /></Pressable>
              </View>
              <Text style={st.miniLab}>Answer type</Text>
              <Chips options={Q_TYPES.map((t) => t.label)} value={Q_TYPES.find((t) => t.k === q.type)?.label} onChange={(lbl) => updateQuestion(q.id, { type: Q_TYPES.find((t) => t.label === lbl)!.k })} />
              {q.type === 'choice' ? (
                <View style={{ gap: 6 }}>
                  {(q.options ?? ['', '']).map((opt, i) => (
                    <View key={i} style={st.opt}><View style={st.odot} /><TextInput value={opt} onChangeText={(t) => setOption(q, i, t)} placeholder={`Option ${i + 1}`} placeholderTextColor={C.dim2} style={st.optInput} /></View>
                  ))}
                  <Pressable onPress={() => addOption(q)} style={st.optAdd}><Plus size={11} color={C.orange} strokeWidth={2.6} /><Text style={st.optAddTxt}>Add a choice</Text></Pressable>
                </View>
              ) : null}
              <ToggleRow label="Required" sub="They can't register without answering" value={q.required} onChange={(v) => updateQuestion(q.id, { required: v })} />
            </View>
          ))}
          <View style={st.formBtn}><Text style={st.formBtnTxt}>{button}</Text></View>
        </Card>
        {form.questions.length < 3 ? (
          <View style={st.addRow}>
            <Text style={st.addLab}>ADD</Text>
            <Pills options={preset.questionSuggestions.map((x) => ({ label: x }))} onPress={(lbl) => addQuestion({ label: lbl, type: lbl.toLowerCase().includes('link') ? 'link' : 'text' })} />
            <Pressable onPress={() => addQuestion()} style={st.writeOwn}><Pencil size={11} color={C.orange} /><Text style={st.writeOwnTxt}>Write your own question</Text></Pressable>
          </View>
        ) : <Hint>3 of 3 questions used.</Hint>}
      </Group>

      <Group label="Age limit" optional>
        <Chips options={AGES.map((a) => a.label)} value={AGES.find((a) => a.v === (form.ageRestriction ?? 0))?.label} onChange={(lbl) => update('ageRestriction', AGES.find((a) => a.label === lbl)!.v)} />
      </Group>
    </View>
  );
}

const Locked = ({ label, hint, tag = 'Always' }: { label: string; hint: string; tag?: string }) => (
  <View style={st.locked}><View style={{ flex: 1 }}><Text style={st.lockedLab}>{label}</Text><Text style={st.lockedHint}>{hint}</Text></View><Text style={st.lockedTag}>{tag}</Text></View>
);

const st = StyleSheet.create({
  sub: { fontFamily: F.body, fontSize: 13, color: C.dim, marginBottom: 18, lineHeight: 18 },
  b: { fontFamily: F.bold, color: '#fff' },
  form: { backgroundColor: '#1A1A22', gap: 7 },
  formKey: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.3, color: C.dim },
  locked: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 9, paddingHorizontal: 9, paddingVertical: 7 },
  lockedLab: { fontFamily: F.bold, fontSize: 10.5, color: C.t4 },
  lockedHint: { fontFamily: F.body, fontSize: 11, color: C.dim2, marginTop: 1 },
  lockedTag: { fontFamily: F.labelHeavy, fontSize: 8.5, letterSpacing: 0.6, color: C.dim2 },
  qCard: { backgroundColor: C.card, borderWidth: 1, borderStyle: 'dashed', borderColor: C.orangeBorder, borderRadius: 9, padding: 9, gap: 7 },
  spotTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qLabel: { flex: 1, fontFamily: F.semibold, fontSize: 12.5, color: C.t2, padding: 0 },
  miniLab: { fontFamily: F.bold, fontSize: 11, color: C.t3 },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  odot: { width: 13, height: 13, borderRadius: 7, borderWidth: 1.5, borderColor: C.border2 },
  optInput: { flex: 1, fontFamily: F.body, fontSize: 12, color: C.t2, padding: 0 },
  optAdd: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  optAddTxt: { fontFamily: F.semibold, fontSize: 11, color: C.orange },
  formBtn: { height: 34, borderRadius: 10, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  formBtnTxt: { fontFamily: F.labelHeavy, fontSize: 12.5, color: '#fff' },
  addRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  addLab: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.2, color: C.dim },
  writeOwn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: C.border2 },
  writeOwnTxt: { fontFamily: F.semibold, fontSize: 11, color: C.orange },
});
