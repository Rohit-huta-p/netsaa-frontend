/** v4 composer UI primitives — label-first, sheet look. StyleSheet + lucide. */
import React from 'react';
import { View, Text, TextInput, Pressable, Switch, StyleSheet, TextInputProps, ViewStyle, StyleProp } from 'react-native';
import { ChevronRight, ChevronLeft, ChevronDown, Check, Plus, Minus, X } from 'lucide-react-native';
import { C, F, R, SP } from '../theme';

type IconCmp = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

export const Mono = ({ children, style }: { children: React.ReactNode; style?: any }) =>
  <Text style={[s.mono, style]}>{children}</Text>;

export const Hint = ({ children }: { children: React.ReactNode }) =>
  <Text style={s.hint}>{children}</Text>;

export function Group({ label, required, optional, sub, children }: {
  label: string; required?: boolean; optional?: boolean; sub?: string; children: React.ReactNode;
}) {
  return (
    <View style={s.group}>
      <View style={s.glabelRow}>
        <Text style={s.glabel}>{label}</Text>
        {required ? <Text style={s.req}> *</Text> : null}
        {optional ? <Text style={s.opt}> optional</Text> : null}
      </View>
      {sub ? <Text style={s.gsub}>{sub}</Text> : null}
      {children}
    </View>
  );
}

export function Field({ icon: Icon, value, placeholder, onPress, right, multilineValue }: {
  icon?: IconCmp; value?: string; placeholder?: string; onPress?: () => void; right?: React.ReactNode; multilineValue?: boolean;
}) {
  const Body = (
    <View style={s.field}>
      {Icon ? <Icon size={15} color={C.dim} /> : null}
      <Text style={[s.fieldVal, !value && s.fieldPh]} numberOfLines={multilineValue ? 4 : 1}>
        {value || placeholder}
      </Text>
      {right !== undefined ? right : (onPress ? <ChevronDown size={14} color={C.dim2} /> : null)}
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{Body}</Pressable> : Body;
}

export function TextField({ icon: Icon, style, ...props }: TextInputProps & { icon?: IconCmp }) {
  return (
    <View style={[s.field, props.multiline && s.fieldMultiline]}>
      {Icon ? <Icon size={15} color={C.dim} /> : null}
      <TextInput
        placeholderTextColor={C.dim2}
        style={[s.input, props.multiline && s.inputMultiline, style]}
        {...props}
      />
    </View>
  );
}

export function Chips({ options, value, onChange }: { options: string[]; value?: string; onChange: (v: string) => void }) {
  return (
    <View style={s.chips}>
      {options.map((o) => {
        const on = o === value;
        return (
          <Pressable key={o} onPress={() => onChange(o)} style={[s.chip, on && s.chipOn]}>
            <Text style={[s.chipTxt, on && s.chipTxtOn]}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Pills({ options, onPress }: { options: { label: string; key?: string; on?: boolean }[]; onPress: (key: string) => void }) {
  return (
    <View style={s.pills}>
      {options.map((o) => (
        <Pressable key={o.key ?? o.label} onPress={() => onPress(o.key ?? o.label)} style={[s.pill, o.on && s.pillOn]}>
          {!o.on ? <Text style={s.pillPlus}>+ </Text> : null}
          <Text style={[s.pillTxt, o.on && s.pillTxtOn]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function TagInput({ tags, onRemove, placeholder = 'Add…', suggestions, onAddSuggestion }: {
  tags: string[]; onRemove: (t: string) => void; placeholder?: string; suggestions?: string[]; onAddSuggestion?: (t: string) => void;
}) {
  return (
    <View>
      <View style={[s.field, s.tagField]}>
        {tags.map((t) => (
          <Pressable key={t} onPress={() => onRemove(t)} style={s.tag}>
            <Text style={s.tagTxt}>{t}</Text>
            <X size={12} color={C.orange} />
          </Pressable>
        ))}
        <Text style={s.fieldPh}>{placeholder}</Text>
      </View>
      {suggestions && suggestions.length ? (
        <Pills options={suggestions.map((x) => ({ label: x }))} onPress={(k) => onAddSuggestion?.(k)} />
      ) : null}
    </View>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: {
  options: { key: T; label: string; icon?: IconCmp }[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <View style={s.seg}>
      {options.map((o) => {
        const on = o.key === value;
        const Icon = o.icon;
        return (
          <Pressable key={o.key} onPress={() => onChange(o.key)} style={[s.segOpt, on && s.segOptOn]}>
            {Icon ? <Icon size={15} color={on ? C.orangeInk : C.dim} /> : null}
            <Text style={[s.segTxt, on && s.segTxtOn]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Stepper({ value, onChange, min = 1, max = 1000 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <View style={s.stepper}>
      <Pressable onPress={() => onChange(Math.max(min, value - 1))} style={s.stepBtn}><Minus size={16} color={C.t3} /></Pressable>
      <Text style={s.stepNum}>{value}</Text>
      <Pressable onPress={() => onChange(Math.min(max, value + 1))} style={s.stepBtn}><Plus size={16} color={C.orange} /></Pressable>
    </View>
  );
}

export function Note({ kind = 'info', children }: { kind?: 'info' | 'warn'; children: React.ReactNode }) {
  const warn = kind === 'warn';
  return (
    <View style={[s.note, warn ? s.noteWarn : s.noteInfo]}>
      <Text style={[s.noteTxt, { color: warn ? C.amber : C.info }]}>{children}</Text>
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.innerCard, style]}>{children}</View>;
}

export function ProgressDots({ step, steps }: { step: number; steps: string[] }) {
  return (
    <View>
      <View style={s.progTrack}><View style={[s.progFill, { width: `${Math.round((step / steps.length) * 100)}%` }]} /></View>
      <View style={s.dots}>
        {steps.map((l, i) => {
          const n = i + 1;
          const cur = n === step, done = n < step;
          return (
            <View key={l} style={s.dcell}>
              <View style={[s.dot, done && s.dotDone, cur && s.dotCur]} />
              <Text style={[s.dlab, cur && s.dlabCur]}>{l}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function FooterBar({ left, right }: {
  left?: { label: string; onPress: () => void; icon?: 'back' };
  right: { label: string; onPress: () => void; disabled?: boolean; icon?: 'next' | 'check' };
}) {
  return (
    <View style={s.footer}>
      {left ? (
        <Pressable onPress={left.onPress} style={s.ghost}>
          {left.icon === 'back' ? <ChevronLeft size={16} color={C.t3} /> : null}
          <Text style={s.ghostTxt}>{left.label}</Text>
        </Pressable>
      ) : <View style={{ flex: 1 }} />}
      <Pressable onPress={right.onPress} disabled={right.disabled} style={[s.primary, right.disabled && s.primaryOff]}>
        {right.icon === 'check' ? <Check size={17} color="#fff" strokeWidth={2.4} /> : null}
        <Text style={s.primaryTxt}>{right.label}</Text>
        {right.icon === 'next' ? <ChevronRight size={17} color="#fff" strokeWidth={2.4} /> : null}
      </Pressable>
    </View>
  );
}

export function ToggleRow({ label, sub, value, onChange }: { label: string; sub?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={s.trow}>
      <View style={{ flex: 1 }}>
        <Text style={s.trowLab}>{label}</Text>
        {sub ? <Text style={s.trowSub}>{sub}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: C.orange, false: '#2A2A34' }} thumbColor="#fff" />
    </View>
  );
}

const s = StyleSheet.create({
  mono: { fontFamily: F.mono, fontSize: 10.5, color: C.dim, letterSpacing: 0.5 },
  hint: { fontFamily: F.body, fontSize: 11, color: C.dim, lineHeight: 16 },
  group: { gap: SP.sm, marginBottom: SP.xl },
  glabelRow: { flexDirection: 'row', alignItems: 'baseline' },
  glabel: { fontFamily: F.bold, fontSize: 15, color: C.t1, letterSpacing: -0.2 },
  req: { fontFamily: F.bold, fontSize: 15, color: C.orange },
  opt: { fontFamily: F.medium, fontSize: 11, color: C.dim2 },
  gsub: { fontFamily: F.body, fontSize: 11.5, color: C.dim, marginTop: -4, lineHeight: 16 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: R.md, paddingHorizontal: 12, paddingVertical: 11 },
  fieldMultiline: { alignItems: 'flex-start' },
  tagField: { flexWrap: 'wrap', gap: 6, minHeight: 44 },
  fieldVal: { flex: 1, fontFamily: F.medium, fontSize: 13.5, color: C.t2 },
  fieldPh: { color: C.dim2, fontFamily: F.body },
  input: { flex: 1, color: C.t2, fontFamily: F.body, fontSize: 13.5, padding: 0 },
  inputMultiline: { minHeight: 76, textAlignVertical: 'top', lineHeight: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: R.md, backgroundColor: C.card2, borderWidth: 1, borderColor: C.border2 },
  chipOn: { backgroundColor: C.orangeSoft, borderColor: C.orangeBorder },
  chipTxt: { fontFamily: F.medium, fontSize: 12.5, color: C.t4 },
  chipTxtOn: { color: C.orangeInk, fontFamily: F.semibold },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 2 },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 4, borderRadius: R.pill, borderWidth: 1, borderColor: C.border2 },
  pillOn: { backgroundColor: C.orangeSoft, borderColor: C.orangeBorder },
  pillPlus: { fontFamily: F.bold, fontSize: 11, color: C.orange },
  pillTxt: { fontFamily: F.semibold, fontSize: 11, color: C.t4 },
  pillTxtOn: { color: C.orangeInk },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 7, borderRadius: R.sm, backgroundColor: C.orangeSoft, borderWidth: 1, borderColor: C.orangeBorder },
  tagTxt: { fontFamily: F.semibold, fontSize: 12.5, color: C.orangeInk },
  seg: { flexDirection: 'row', backgroundColor: '#0C0C11', borderWidth: 1, borderColor: C.border, borderRadius: R.lg, padding: 4, gap: 4 },
  segOpt: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 9, borderRadius: R.md },
  segOptOn: { backgroundColor: C.orangeSoft },
  segTxt: { fontFamily: F.bold, fontSize: 12, color: C.t4 },
  segTxtOn: { color: C.orangeInk },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: R.lg, overflow: 'hidden' },
  stepBtn: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  stepNum: { flex: 1, textAlign: 'center', fontFamily: F.bold, fontSize: 18, color: C.t1 },
  note: { flexDirection: 'row', gap: 10, padding: 11, borderRadius: R.lg, borderWidth: 1 },
  noteInfo: { backgroundColor: C.infoSoft, borderColor: C.infoBorder },
  noteWarn: { backgroundColor: C.amberSoft, borderColor: C.amberBorder },
  noteTxt: { flex: 1, fontFamily: F.body, fontSize: 11.5, lineHeight: 16 },
  innerCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: R.xl, padding: 14, gap: 11 },
  progTrack: { height: 3, backgroundColor: C.card2 },
  progFill: { height: 3, backgroundColor: C.orange },
  dots: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12 },
  dcell: { flex: 1, alignItems: 'center', gap: 6 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.border2 },
  dotDone: { backgroundColor: 'rgba(255,107,53,0.35)' },
  dotCur: { backgroundColor: C.orange },
  dlab: { fontFamily: F.semibold, fontSize: 8.5, letterSpacing: 0.4, textTransform: 'uppercase', color: C.dim2 },
  dlabCur: { color: '#fff', fontFamily: F.bold },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.sheet },
  ghost: { flex: 1, height: 50, borderRadius: R.lg, borderWidth: 1, borderColor: C.border2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  ghostTxt: { fontFamily: F.bold, fontSize: 15, color: C.t4 },
  primary: { flex: 1, height: 50, borderRadius: R.lg, backgroundColor: C.orange, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryOff: { opacity: 0.4 },
  primaryTxt: { fontFamily: F.labelHeavy, fontSize: 15, color: '#fff' },
  trow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: R.md, paddingHorizontal: 12, paddingVertical: 9 },
  trowLab: { fontFamily: F.bold, fontSize: 13, color: C.t2 },
  trowSub: { fontFamily: F.body, fontSize: 10.5, color: C.dim, marginTop: 2, lineHeight: 14 },
});
