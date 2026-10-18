import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, TextInput, ScrollView } from 'react-native';
import { ChevronDown, Check, X } from 'lucide-react-native';
import { useComposerStoreV4 } from './useComposerStoreV4';
import { presetFor, EVENT_TYPE_PRESETS, EVENT_TYPE_KEYS } from './eventTypePresets';
import { C, F, R } from './theme';

// The preset list, minus the generic "other" fallback (reached only by typing your own).
const SELECTABLE = EVENT_TYPE_KEYS.filter((k) => k !== 'other');

/**
 * Event type as a tap-to-open picker: choose one of the presets, or type your own.
 * A preset clears eventTypeLabel (so the preset label shows); a custom type sets
 * eventTypeLabel to the typed text so it shows on the field and the review card.
 */
export default function EventTypeField() {
  const form = useComposerStoreV4((s) => s.form);
  const update = useComposerStoreV4((s) => s.update);
  const setEventType = useComposerStoreV4((s) => s.setEventType);
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState('');

  const selectedLabel = form.eventTypeLabel || presetFor(form.eventType).label;

  const pickPreset = (key: string) => {
    setEventType(key);
    update('eventTypeLabel', undefined);
    setCustom('');
    setOpen(false);
  };
  const commitCustom = () => {
    const t = custom.trim();
    if (!t) return;
    setEventType(t);
    update('eventTypeLabel', t);
    setCustom('');
    setOpen(false);
  };

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={st.field} accessibilityRole="button" accessibilityLabel="Choose event type">
        <Text style={st.value} numberOfLines={1}>{selectedLabel}</Text>
        <ChevronDown size={16} color={C.dim2} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={st.backdrop} onPress={() => setOpen(false)} accessibilityLabel="Close" />
        <View style={st.sheet}>
          <View style={st.head}>
            <Text style={st.title}>Event type</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={8} accessibilityLabel="Close">
              <X size={18} color={C.dim} />
            </Pressable>
          </View>

          <ScrollView style={st.list} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {SELECTABLE.map((k) => {
              const on = form.eventType === k;
              return (
                <Pressable key={k} onPress={() => pickPreset(k)} style={[st.row, on && st.rowOn]}>
                  <Text style={[st.rowTxt, on && st.rowTxtOn]}>{EVENT_TYPE_PRESETS[k].label}</Text>
                  {on ? <Check size={16} color={C.orange} strokeWidth={2.6} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={st.customWrap}>
            <Text style={st.customLab}>OR TYPE YOUR OWN</Text>
            <View style={st.customRow}>
              <TextInput
                value={custom}
                onChangeText={setCustom}
                placeholder="e.g. Residency, Retreat…"
                placeholderTextColor={C.dim2}
                style={st.customInput}
                returnKeyType="done"
                onSubmitEditing={commitCustom}
              />
              <Pressable onPress={commitCustom} disabled={!custom.trim()} style={[st.addBtn, !custom.trim() && st.addBtnOff]}>
                <Text style={st.addTxt}>Add</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const st = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 9, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: R.md, paddingHorizontal: 12, paddingVertical: 13 },
  value: { flex: 1, fontFamily: F.body, fontSize: 14, color: C.t2 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { backgroundColor: C.sheet, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderTopWidth: 1, borderColor: C.border2, paddingBottom: 28 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  title: { fontFamily: F.serif, fontSize: 18, color: C.t1, letterSpacing: -0.2 },
  list: { maxHeight: 320 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13, borderTopWidth: 1, borderTopColor: C.border },
  rowOn: { backgroundColor: C.orangeSoft },
  rowTxt: { fontFamily: F.semibold, fontSize: 14.5, color: C.t3 },
  rowTxtOn: { color: C.orangeInk },
  customWrap: { paddingHorizontal: 16, paddingTop: 14, gap: 8, borderTopWidth: 1, borderTopColor: C.border2 },
  customLab: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1, color: C.dim },
  customRow: { flexDirection: 'row', gap: 8 },
  customInput: { flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: R.md, paddingHorizontal: 12, paddingVertical: 11, color: C.t2, fontFamily: F.body, fontSize: 14 },
  addBtn: { paddingHorizontal: 18, borderRadius: R.md, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center' },
  addBtnOff: { opacity: 0.4 },
  addTxt: { fontFamily: F.labelHeavy, fontSize: 13, color: '#fff' },
});
