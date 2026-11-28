/**
 * HostOnlyZone — the "Only you see this" panel the host sees below the event body in
 * edit mode (P2). It surfaces the rest of the event form — the fields attendees don't
 * see inline — as quiet rows: tap a row to open its focused sheet (reusing the composer
 * inputs), or edit door inline. Each commit routes through useEventEdit's debounced save.
 *
 * Gated entirely on edit mode by the caller (EventDetailViewer), so the view/preview
 * output stays byte-identical. P3 adds capacity, discounts, media + cover.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import dayjs from 'dayjs';
import { EyeOff, Shapes, DoorOpen, Clock, MessageSquare, Users, ShieldAlert, Eye, RotateCcw, Pencil, ChevronRight, X } from 'lucide-react-native';
import { useComposerStoreV4 } from '../../composer/v4/useComposerStoreV4';
import { presetFor } from '../../composer/v4/eventTypePresets';
import { Segmented } from '../../composer/v4/ui';
import { C, F, R } from '../../composer/v4/theme';
import { CalendarModal } from '@/components/ui/CalendarModal';
import type { EventDoc } from '@/services/eventService';
import type { HostEditController } from './useEventEdit';
import FieldSheet from './FieldSheet';
import {
  TypeSheetBody, DetailsSheetBody, AgeSheetBody, VisibilitySheetBody, RefundSheetBody, QuestionsSheetBody,
} from './HostSheetBodies';

type SheetKey = 'type' | 'details' | 'questions' | 'age' | 'visibility' | 'refund';

const AGES: Record<number, string> = { 0: 'Any age', 16: '16+', 18: '18+', 21: '21+' };

const SHEETS: Record<SheetKey, { title: string; sub?: string; scroll?: boolean }> = {
  type: { title: 'Event type', sub: 'It only fills in suggestions — every event gets the same form.' },
  details: { title: 'Audience & details', sub: 'Who it’s for, level, style and language.' },
  questions: { title: 'Sign-up questions', sub: 'What you ask when someone registers.' },
  age: { title: 'Age limit', sub: 'The minimum age to register.' },
  visibility: { title: 'Who can see it', scroll: false },
  refund: { title: 'Refund policy', scroll: false },
};

export default function HostOnlyZone({ host, event }: { host: HostEditController; event: EventDoc }) {
  const form = useComposerStoreV4((s) => s.form);
  const update = useComposerStoreV4((s) => s.update);
  const [sheet, setSheet] = useState<SheetKey | null>(null);
  const [calOpen, setCalOpen] = useState(false);

  const close = () => { host.scheduleSave(); setSheet(null); }; // commit on close (idempotent)

  // ── summaries (read live off the store / event) ──
  const typeLabel = form.eventTypeLabel || presetFor(form.eventType).label;
  const qCount = form.questions.filter((q) => q.label.trim()).length;
  const ageLabel = AGES[form.ageRestriction ?? 0] ?? 'Any age';
  const visLabel = form.visibility === 'public' ? 'Public · anyone can find it' : 'Only people with the link';
  const refundLabel = form.refundPolicy === 'firm' ? 'Firm · no refunds'
    : form.refundPolicy === 'custom' ? 'Custom policy'
    : 'Flexible · full refund up to 24h before';

  const deadlineIso = event.registrationDeadline;
  const deadlineLabel = deadlineIso ? dayjs(deadlineIso).format('MMM D, YYYY') : 'No deadline';
  const deadlineDate = deadlineIso ? dayjs(deadlineIso).toDate() : undefined;

  const DOOR_OPTS = [
    { key: 'open' as const, label: 'Open door' },
    { key: 'guest_list' as const, label: 'Guest list' },
    { key: 'apply' as const, label: 'Apply' },
  ];

  return (
    <View style={s.zone}>
      <View style={s.head}>
        <View style={s.lockIc}><EyeOff size={15} color={C.dim} /></View>
        <View style={{ flex: 1 }}>
          <Text style={s.headT}>Only you see this</Text>
          <Text style={s.headS}>The rest of the event form — not shown to attendees</Text>
        </View>
      </View>

      <SheetRow icon={Shapes} label="Event type" value={typeLabel} onPress={() => setSheet('type')} />
      <SheetRow icon={Users} label="Audience & details" value={audienceSummary(form)} onPress={() => setSheet('details')} />

      {/* Door — inline (no sheet): the one real registration decision. */}
      <View style={s.row}>
        <View style={s.rowIc}><DoorOpen size={16} color={C.dim} /></View>
        <View style={{ flex: 1 }}>
          <Text style={s.rowLabel}>How people get in</Text>
          <View style={{ marginTop: 9 }}>
            <Segmented
              value={form.door}
              onChange={(v) => { update('door', v); host.scheduleSave(); }}
              options={DOOR_OPTS}
            />
          </View>
        </View>
      </View>

      {/* Registration deadline — opens the calendar directly (not in the composer form).
          Sibling Pressables (not nested) so the clear button doesn't double-fire on web. */}
      <View style={s.row}>
        <View style={s.rowIc}><Clock size={16} color={C.dim} /></View>
        <Pressable style={{ flex: 1 }} onPress={() => setCalOpen(true)} accessibilityRole="button" accessibilityLabel="Edit registration deadline">
          <Text style={s.rowLabel}>Registration deadline</Text>
          <Text style={[s.rowValue, !deadlineIso && s.rowValueDim]}>{deadlineLabel}</Text>
        </Pressable>
        {deadlineIso ? (
          <Pressable hitSlop={8} onPress={() => host.saveDeadline(null)} style={s.clearBtn} accessibilityRole="button" accessibilityLabel="Remove deadline">
            <X size={14} color={C.dim} />
          </Pressable>
        ) : null}
        <Pressable hitSlop={8} onPress={() => setCalOpen(true)} accessibilityRole="button" accessibilityLabel="Pick a deadline">
          <Pencil size={14} color={C.dim2} />
        </Pressable>
      </View>

      <SheetRow icon={MessageSquare} label="Sign-up questions" value={qCount ? `${qCount} asked at sign-up` : 'None'} onPress={() => setSheet('questions')} />
      <SheetRow icon={ShieldAlert} label="Age limit" value={ageLabel} onPress={() => setSheet('age')} />
      <SheetRow icon={Eye} label="Who can see it" value={visLabel} onPress={() => setSheet('visibility')} />
      {form.paid ? (
        <SheetRow icon={RotateCcw} label="Refund policy" value={refundLabel} onPress={() => setSheet('refund')} />
      ) : null}

      <Text style={s.foot}>Everything the composer had · one surface</Text>

      {/* The one active sheet. */}
      {sheet ? (
        <FieldSheet visible title={SHEETS[sheet].title} sub={SHEETS[sheet].sub} scroll={SHEETS[sheet].scroll} onClose={close}>
          {sheet === 'type' ? <TypeSheetBody scheduleSave={host.scheduleSave} /> : null}
          {sheet === 'details' ? <DetailsSheetBody scheduleSave={host.scheduleSave} /> : null}
          {sheet === 'questions' ? <QuestionsSheetBody scheduleSave={host.scheduleSave} /> : null}
          {sheet === 'age' ? <AgeSheetBody scheduleSave={host.scheduleSave} /> : null}
          {sheet === 'visibility' ? <VisibilitySheetBody scheduleSave={host.scheduleSave} /> : null}
          {sheet === 'refund' ? <RefundSheetBody scheduleSave={host.scheduleSave} /> : null}
        </FieldSheet>
      ) : null}

      <CalendarModal
        visible={calOpen}
        onClose={() => setCalOpen(false)}
        date={deadlineDate}
        onSelect={(d) => host.saveDeadline(dayjs(d).toISOString())}
      />
    </View>
  );
}

function audienceSummary(form: ReturnType<typeof useComposerStoreV4.getState>['form']): string {
  if (form.openToAll) return 'All creatives';
  const who = form.whoFor.length ? form.whoFor.join(', ') : 'Anyone';
  const lvl = form.levels.length ? ` · ${form.levels.join('/')}` : '';
  return who + lvl;
}

function SheetRow({ icon: Icon, label, value, onPress }: {
  icon: React.ComponentType<{ size?: number; color?: string }>; label: string; value: string; onPress: () => void;
}) {
  return (
    <Pressable style={s.row} onPress={onPress} accessibilityRole="button" accessibilityLabel={`Edit ${label}`}>
      <View style={s.rowIc}><Icon size={16} color={C.dim} /></View>
      <View style={{ flex: 1 }}>
        <Text style={s.rowLabel}>{label}</Text>
        <Text style={s.rowValue} numberOfLines={1}>{value}</Text>
      </View>
      <Pencil size={14} color={C.dim2} />
      <ChevronRight size={16} color={C.dim2} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  zone: { marginHorizontal: 20, marginTop: 18, backgroundColor: C.sheet, borderWidth: 1, borderColor: C.border, borderRadius: R.xl, padding: 6, paddingTop: 14 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 10, marginBottom: 12 },
  lockIc: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  headT: { fontFamily: F.semibold, fontSize: 14, color: C.t2, letterSpacing: -0.2 },
  headS: { fontFamily: F.body, fontSize: 11.5, color: C.dim, marginTop: 2, lineHeight: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: R.lg, paddingHorizontal: 13, paddingVertical: 13, marginBottom: 6 },
  rowIc: { width: 30, height: 30, borderRadius: 9, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontFamily: F.semibold, fontSize: 13.5, color: C.t2 },
  rowValue: { fontFamily: F.body, fontSize: 12, color: C.t4, marginTop: 3 },
  rowValueDim: { color: C.dim2 },
  clearBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center' },
  foot: { fontFamily: F.mono, fontSize: 9.5, letterSpacing: 0.5, color: C.dim2, textAlign: 'center', marginTop: 8, marginBottom: 4 },
});
