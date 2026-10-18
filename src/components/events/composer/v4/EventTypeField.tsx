import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import { ChevronDown, ChevronUp, Check } from 'lucide-react-native';
import { useComposerStoreV4 } from './useComposerStoreV4';
import { presetFor, EVENT_TYPE_PRESETS, EVENT_TYPE_KEYS } from './eventTypePresets';
import { C, F, R } from './theme';

// The preset list, minus the generic "other" fallback (reached only by typing your own).
const SELECTABLE = EVENT_TYPE_KEYS.filter((k) => k !== 'other');

/**
 * Event type as an anchored dropdown: tap the field and the options drop down
 * directly below it (not a bottom sheet). A preset clears eventTypeLabel so the
 * preset label shows; a custom entry sets eventTypeLabel to the typed text.
 *
 * The menu is an absolutely-positioned sibling of the field; the wrapper (and
 * the Event-type Group in Step1Event) carry a zIndex so it overlays the fields
 * below instead of being painted under them.
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
    <View style={st.wrap}>
      <Pressable onPress={() => setOpen((o) => !o)} style={[st.field, open && st.fieldOpen]} accessibilityRole="button" accessibilityLabel="Choose event type">
        <Text style={st.value} numberOfLines={1}>{selectedLabel}</Text>
        {open ? <ChevronUp size={16} color={C.orange} /> : <ChevronDown size={16} color={C.dim2} />}
      </Pressable>

      {open ? (
        <View style={st.menu}>
          <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled showsVerticalScrollIndicator={false} bounces={false} style={st.menuScroll}>
            {SELECTABLE.map((k, i) => {
              const on = form.eventType === k;
              return (
                <Pressable key={k} onPress={() => pickPreset(k)} style={[st.row, i > 0 && st.rowDiv, on && st.rowOn]}>
                  <Text style={[st.rowTxt, on && st.rowTxtOn]}>{EVENT_TYPE_PRESETS[k].label}</Text>
                  {on ? <Check size={15} color={C.orange} strokeWidth={2.6} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={st.customWrap}>
            <TextInput
              value={custom}
              onChangeText={setCustom}
              placeholder="Or type your own…"
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
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { position: 'relative', zIndex: 30 },
  field: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 9, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: R.md, paddingHorizontal: 12, paddingVertical: 13 },
  fieldOpen: { borderColor: C.orangeBorder },
  value: { flex: 1, fontFamily: F.body, fontSize: 14, color: C.t2 },
  menu: { position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, backgroundColor: C.card2, borderWidth: 1, borderColor: C.border2, borderRadius: R.md, overflow: 'hidden', zIndex: 30, elevation: 12, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 10 } },
  menuScroll: { maxHeight: 258 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 13, paddingVertical: 12 },
  rowDiv: { borderTopWidth: 1, borderTopColor: C.border },
  rowOn: { backgroundColor: C.orangeSoft },
  rowTxt: { fontFamily: F.semibold, fontSize: 14, color: C.t3 },
  rowTxtOn: { color: C.orangeInk },
  customWrap: { flexDirection: 'row', gap: 8, padding: 10, borderTopWidth: 1, borderTopColor: C.border2, backgroundColor: C.well },
  customInput: { flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: R.sm, paddingHorizontal: 10, paddingVertical: 9, color: C.t2, fontFamily: F.body, fontSize: 13.5 },
  addBtn: { paddingHorizontal: 14, borderRadius: R.sm, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center' },
  addBtnOff: { opacity: 0.4 },
  addTxt: { fontFamily: F.labelHeavy, fontSize: 12.5, color: '#fff' },
});
