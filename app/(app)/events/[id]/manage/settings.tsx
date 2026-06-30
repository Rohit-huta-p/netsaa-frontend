/**
 * Event settings screen — O15 / O15a / O15b (event-flow-mockups-organizer.html)
 *
 * Sections:
 *   Details      — Edit details · Date & time · Location  (all → /events/:id/edit)
 *   Registration — Registration toggle · Capacity (O15b) · Deadline · Waitlist · Auto-promote
 *   Visibility & discussion — Visibility (O15a) · Discussion (same radio-sheet pattern)
 *   Danger zone  — Cancel event (OrganizerCancellationModal)
 *
 * Manage Stack is headerless → this screen draws its own nav (back + DM Serif title).
 * Palette, fonts, and rhythms match roster.tsx / OverviewActions.tsx.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Switch,
  Modal,
  Platform,
  StyleSheet,
} from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Calendar,
  MapPin,
  Ticket,
  Users,
  Clock,
  List,
  Globe,
  MessageSquare,
  XCircle,
  Minus,
  Plus,
  Info,
} from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEvent, useUpdateEvent } from '@/hooks/useEvents';
import type { EventDoc } from '@/services/eventService';
import OrganizerCancellationModal, {
  type OrganizerCancelResult,
} from '@/components/events/manage/OrganizerCancellationModal';
import { CalendarModal } from '@/components/ui/CalendarModal';

// ── Palette ─────────────────────────────────────────────────────────────────

const BG       = '#09090b';
const SURFACE  = 'rgba(255,255,255,0.04)';
const HAIRLINE = 'rgba(255,255,255,0.1)';
const TEXT_0   = '#F3EFE8';
const TEXT_1   = '#A1A1AA';
const TEXT_2   = '#71717a';
const TEXT_3   = '#52525b';
const TEXT_4   = '#3f3f46';
const ORANGE   = '#FF6B35';
const ORANGE_SOFT = 'rgba(255,107,53,0.16)';
const ORANGE_LINE = 'rgba(255,107,53,0.32)';
const ORANGE_INK  = '#1A0D06';
const GREEN    = '#22C55E';
const RED      = '#EF4444';
const RED_SOFT = 'rgba(239,68,68,0.13)';
const PURPLE   = '#8B5CF6';
const PURPLE_SOFT = 'rgba(139,92,246,0.15)';
const BLUE     = '#5B8DEF';
const BLUE_SOFT = 'rgba(91,141,239,0.15)';
const YELLOW   = '#F59E0B';
const YELLOW_SOFT = 'rgba(245,158,11,0.13)';
const SHEET_BG = '#0E0C12';
const BACKDROP = 'rgba(0,0,0,0.60)';

// ── Helpers ──────────────────────────────────────────────────────────────────

function hexAlpha(hex: string, alpha: number): string {
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) return `rgba(255,107,53,${alpha})`;
  const int = parseInt(m[1], 16);
  return `rgba(${(int >> 16) & 255},${(int >> 8) & 255},${int & 255},${alpha})`;
}

function fmtDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

function fmtDateTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return (
    d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
  );
}

function venueLabel(loc?: EventDoc['location']): string {
  if (!loc) return '';
  if (loc.kind === 'online') return loc.onlinePlatform ?? 'Online';
  return loc.venueName ?? loc.address ?? '';
}

function dateRange(startsAt?: string, endsAt?: string): string {
  if (!startsAt) return '';
  const s = new Date(startsAt);
  if (Number.isNaN(s.getTime())) return '';
  const startStr = s.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  if (!endsAt) return startStr;
  const e = new Date(endsAt);
  if (Number.isNaN(e.getTime()) || e.toDateString() === s.toDateString()) return startStr;
  const sameMonth = e.getMonth() === s.getMonth() && e.getFullYear() === s.getFullYear();
  const endStr = sameMonth
    ? String(e.getDate())
    : e.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  return `${startStr} — ${endStr}`;
}

// ── SwitchPill ───────────────────────────────────────────────────────────────

function SwitchPill({
  value,
  onValueChange,
  disabled,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: TEXT_4, true: ORANGE }}
      thumbColor={TEXT_0}
      ios_backgroundColor={TEXT_4}
    />
  );
}

// ── SettingRow (icon + title + optional sub + right-slot) ────────────────────

interface RowProps {
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  iconColor?: string;
  label: string;
  sublabel?: string;
  value?: string;
  labelColor?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  showChevron?: boolean;
  isLast?: boolean;
}

function SettingRow({
  Icon,
  iconColor = ORANGE,
  label,
  sublabel,
  value,
  labelColor,
  onPress,
  right,
  showChevron = true,
  isLast = false,
}: RowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[st.row, isLast && st.rowLast]}
      accessibilityRole={onPress ? 'button' : 'none'}
      accessibilityLabel={[label, sublabel, value].filter(Boolean).join('. ')}
    >
      <View style={[st.av, { backgroundColor: hexAlpha(iconColor, 0.16) }]}>
        <Icon size={17} color={iconColor} />
      </View>
      <View style={st.rowBody}>
        <Text style={[st.rowTitle, labelColor ? { color: labelColor } : undefined]}>
          {label}
        </Text>
        {sublabel ? <Text style={st.rowSub}>{sublabel}</Text> : null}
      </View>
      {value ? <Text style={st.rowValue}>{value}</Text> : null}
      {right ?? (showChevron ? <ChevronRight size={16} color={TEXT_4} /> : null)}
    </Pressable>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ text, color }: { text: string; color?: string }) {
  return (
    <Text style={[st.sectionLabel, color ? { color } : undefined]}>{text}</Text>
  );
}

// ── Generic Radio Sheet (O15a pattern) ───────────────────────────────────────

interface RadioOption {
  key: string;
  label: string;
  sub: string;
}

interface RadioSheetProps {
  visible: boolean;
  title: string;
  lead: string;
  options: RadioOption[];
  selected: string;
  onSelect: (key: string) => void;
  onClose: () => void;
  saving?: boolean;
}

function RadioSheet({
  visible,
  title,
  lead,
  options,
  selected,
  onSelect,
  onClose,
  saving,
}: RadioSheetProps) {
  const [local, setLocal] = useState(selected);

  // Sync when sheet opens
  React.useEffect(() => {
    if (visible) setLocal(selected);
  }, [visible, selected]);

  const handleDone = () => {
    onSelect(local);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={sht.backdrop} onPress={onClose} />
      <View style={sht.sheet}>
        <View style={sht.grab} />
        <Text style={sht.sheetTitle}>{title}</Text>
        <Text style={sht.sheetLead}>{lead}</Text>
        <View style={sht.optionsWrap}>
          {options.map((opt) => {
            const active = local === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => setLocal(opt.key)}
                style={[
                  sht.optionRow,
                  active ? sht.optionRowActive : undefined,
                ]}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                accessibilityLabel={`${opt.label}. ${opt.sub}`}
              >
                <View
                  style={[sht.radioDot, active ? sht.radioDotActive : undefined]}
                >
                  {active ? <View style={sht.radioDotFill} /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[sht.optLabel, !active && { color: TEXT_1 }]}>
                    {opt.label}
                  </Text>
                  <Text style={[sht.optSub, !active && { color: TEXT_3 }]}>
                    {opt.sub}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
        <View style={sht.ctaWrap}>
          <Pressable
            onPress={handleDone}
            disabled={saving}
            style={sht.ctaBtn}
            accessibilityRole="button"
            accessibilityLabel="Done"
          >
            {saving ? (
              <ActivityIndicator size="small" color={ORANGE_INK} />
            ) : (
              <Text style={sht.ctaBtnText}>Done</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ── CapacitySheet (O15b) ─────────────────────────────────────────────────────

interface CapacitySheetProps {
  visible: boolean;
  current: number;
  floor: number;  // registeredCount — can't go below
  onSave: (total: number) => void;
  onClose: () => void;
  saving?: boolean;
}

function CapacitySheet({
  visible,
  current,
  floor,
  onSave,
  onClose,
  saving,
}: CapacitySheetProps) {
  const [value, setValue] = useState(current);

  React.useEffect(() => {
    if (visible) setValue(current);
  }, [visible, current]);

  const decrement = () => setValue((v) => Math.max(floor, v - 1));
  const increment = () => setValue((v) => v + 1);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={sht.backdrop} onPress={onClose} />
      <View style={sht.sheet}>
        <View style={sht.grab} />
        <Text style={sht.sheetTitle}>Change capacity</Text>
        <Text style={sht.sheetLead}>How many seats in total?</Text>

        {/* Stepper */}
        <View style={cap.row}>
          <Pressable
            onPress={decrement}
            disabled={value <= floor}
            style={[cap.stepBtn, value <= floor && cap.stepBtnDisabled]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Decrease capacity"
          >
            <Minus size={22} color={value <= floor ? TEXT_4 : TEXT_1} />
          </Pressable>

          <Text style={cap.number}>{value}</Text>

          <Pressable
            onPress={increment}
            style={cap.stepBtnPlus}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Increase capacity"
          >
            <Plus size={22} color={ORANGE} />
          </Pressable>
        </View>

        {/* Floor note */}
        {floor > 0 ? (
          <View style={cap.note}>
            <Info size={15} color={YELLOW} style={{ marginTop: 1, flexShrink: 0 }} />
            <Text style={cap.noteText}>
              {floor} seat{floor !== 1 ? 's are' : ' is'} already taken — you can't go below that.
              Lowering the cap won't remove anyone.
            </Text>
          </View>
        ) : null}

        <View style={sht.ctaWrap}>
          <Pressable
            onPress={() => { onSave(value); onClose(); }}
            disabled={saving}
            style={sht.ctaBtn}
            accessibilityRole="button"
            accessibilityLabel="Save capacity"
          >
            {saving ? (
              <ActivityIndicator size="small" color={ORANGE_INK} />
            ) : (
              <Text style={sht.ctaBtnText}>Save</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

const VISIBILITY_OPTIONS: RadioOption[] = [
  { key: 'public',   label: 'Public',   sub: 'Listed in search and feeds' },
  { key: 'unlisted', label: 'Unlisted', sub: 'Only people with the link' },
  { key: 'private',  label: 'Private',  sub: 'Invite-only · hidden everywhere' },
];

const DISCUSSION_OPTIONS: RadioOption[] = [
  { key: 'public',        label: 'Public',        sub: 'Anyone can see the discussion' },
  { key: 'attendees_only', label: 'Attendees only', sub: 'Only confirmed attendees can read and post' },
];

type Sheet =
  | 'visibility'
  | 'discussion'
  | 'capacity'
  | 'deadline'
  | 'cancel'
  | null;

export default function EventSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: event, isLoading } = useEvent(id);
  const update = useUpdateEvent(id);

  const [openSheet, setOpenSheet] = useState<Sheet>(null);

  if (isLoading) {
    return (
      <View style={[st.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={ORANGE} />
      </View>
    );
  }
  if (!event) return null;

  const registered = event.capacity?.registeredCount ?? 0;
  const totalCap   = event.capacity?.total ?? 0;
  const regClosed  = event.registrationClosed ?? false;
  const allowWL    = event.allowWaitlist ?? false;
  const autoPromote = event.waitlistAutoPromote ?? false;
  const visibility   = event.visibility ?? 'public';
  const discussionV  = event.discussionVisibility ?? 'public';
  const canCancel   = event.status === 'live' || event.status === 'pending_review';

  const ticketPrice: number = (event as any).pricing?.amount ?? 0;

  const visLabel: Record<string, string> = {
    public: 'Public', unlisted: 'Unlisted', private: 'Private',
  };
  const discLabel: Record<string, string> = {
    public: 'Public', attendees_only: 'Attendees only',
  };

  return (
    <View style={st.screen}>
      {/* Nav */}
      <View style={st.nav}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={st.navBtn}
          accessibilityRole="button"
          accessibilityLabel="Back to manage overview"
        >
          <ChevronLeft size={18} color={TEXT_0} />
        </Pressable>
        <Text style={st.navTitle}>Event settings</Text>
      </View>

      {/* Context line */}
      <Text style={st.contextLine}>
        {event.title}{' '}
        <Text style={{ color: event.status === 'live' ? GREEN : TEXT_2 }}>
          · {event.status}
        </Text>
      </Text>

      <ScrollView
        contentContainerStyle={st.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── DETAILS ─────────────────────────────────────────────────── */}
        <SectionLabel text="DETAILS" />

        <SettingRow
          Icon={Pencil}
          iconColor={BLUE}
          label="Edit details"
          sublabel="Title · story · cover · agenda"
          onPress={() => router.push(`/events/${id}/edit` as any)}
        />
        <SettingRow
          Icon={Calendar}
          iconColor={BLUE}
          label="Date & time"
          value={dateRange(event.startsAt, event.endsAt)}
          onPress={() => router.push(`/events/${id}/edit` as any)}
        />
        <SettingRow
          Icon={MapPin}
          iconColor={BLUE}
          label="Location"
          value={venueLabel(event.location)}
          onPress={() => router.push(`/events/${id}/edit` as any)}
          isLast
        />

        {/* ── REGISTRATION ─────────────────────────────────────────────── */}
        <SectionLabel text="REGISTRATION" />

        <SettingRow
          Icon={Ticket}
          iconColor={ORANGE}
          label="Registration"
          sublabel={
            regClosed
              ? 'Closed to new RSVPs'
              : `Accepting RSVPs · ${registered}/${totalCap}`
          }
          showChevron={false}
          right={
            <SwitchPill
              value={!regClosed}
              onValueChange={(open) =>
                update.mutate({ registrationClosed: !open })
              }
              disabled={update.isPending}
            />
          }
        />
        <SettingRow
          Icon={Users}
          iconColor={ORANGE}
          label="Capacity"
          value={`${totalCap} seats`}
          onPress={() => setOpenSheet('capacity')}
        />
        <SettingRow
          Icon={Clock}
          iconColor={ORANGE}
          label="Registration deadline"
          value={event.registrationDeadline ? fmtDateTime(event.registrationDeadline) : 'None'}
          onPress={() => setOpenSheet('deadline')}
        />
        <SettingRow
          Icon={List}
          iconColor={ORANGE}
          label="Waitlist"
          sublabel={allowWL && autoPromote ? 'Auto-promote on' : undefined}
          showChevron={false}
          right={
            <SwitchPill
              value={allowWL}
              onValueChange={(v) => update.mutate({ allowWaitlist: v })}
              disabled={update.isPending}
            />
          }
        />
        {allowWL ? (
          <SettingRow
            Icon={List}
            iconColor={TEXT_3}
            label="Auto-promote"
            sublabel="Automatically move waitlisted people when a spot opens"
            showChevron={false}
            isLast
            right={
              <SwitchPill
                value={autoPromote}
                onValueChange={(v) => update.mutate({ waitlistAutoPromote: v })}
                disabled={update.isPending}
              />
            }
          />
        ) : (
          // spacer row so section ends cleanly when waitlist is off
          <View style={st.sectionEnd} />
        )}

        {/* ── VISIBILITY & DISCUSSION ───────────────────────────────────── */}
        <SectionLabel text="VISIBILITY & DISCUSSION" />

        <SettingRow
          Icon={Globe}
          iconColor={PURPLE}
          label="Visibility"
          value={visLabel[visibility] ?? 'Public'}
          onPress={() => setOpenSheet('visibility')}
        />
        <SettingRow
          Icon={MessageSquare}
          iconColor={PURPLE}
          label="Discussion"
          value={discLabel[discussionV] ?? 'Public'}
          onPress={() => setOpenSheet('discussion')}
          isLast
        />

        {/* ── DANGER ZONE ──────────────────────────────────────────────── */}
        {canCancel ? (
          <>
            <SectionLabel text="DANGER ZONE" color="#A3431F" />
            <SettingRow
              Icon={XCircle}
              iconColor={RED}
              label="Cancel event"
              sublabel="Refund all attendees · can't be undone"
              labelColor={RED}
              onPress={() => setOpenSheet('cancel')}
              isLast
            />
          </>
        ) : null}
      </ScrollView>

      {/* ── Sheets ─────────────────────────────────────────────────────── */}

      <RadioSheet
        visible={openSheet === 'visibility'}
        title="Who can see this event?"
        lead="Changing this won't notify anyone."
        options={VISIBILITY_OPTIONS}
        selected={visibility}
        onSelect={(key) =>
          update.mutate({ visibility: key as EventDoc['visibility'] })
        }
        onClose={() => setOpenSheet(null)}
        saving={update.isPending}
      />

      <RadioSheet
        visible={openSheet === 'discussion'}
        title="Who can see the discussion?"
        lead="You can change this any time."
        options={DISCUSSION_OPTIONS}
        selected={discussionV}
        onSelect={(key) =>
          update.mutate({ discussionVisibility: key as EventDoc['discussionVisibility'] })
        }
        onClose={() => setOpenSheet(null)}
        saving={update.isPending}
      />

      <CapacitySheet
        visible={openSheet === 'capacity'}
        current={totalCap}
        floor={registered}
        onSave={(total) => update.mutate({ capacity: { total, registeredCount: registered } })}
        onClose={() => setOpenSheet(null)}
        saving={update.isPending}
      />

      <CalendarModal
        visible={openSheet === 'deadline'}
        date={event.registrationDeadline ? new Date(event.registrationDeadline) : undefined}
        onSelect={(d) => update.mutate({ registrationDeadline: d.toISOString() })}
        onClose={() => setOpenSheet(null)}
        minDate={new Date()}
        maxDate={event.startsAt ? new Date(event.startsAt) : undefined}
      />

      <OrganizerCancellationModal
        visible={openSheet === 'cancel'}
        eventId={id}
        attendeeCount={registered}
        ticketPriceRupees={ticketPrice}
        onClose={() => setOpenSheet(null)}
        onCancelled={(_result: OrganizerCancelResult) => {
          setOpenSheet(null);
          router.back();
        }}
      />
    </View>
  );
}

// ── Main styles ───────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: HAIRLINE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontFamily: 'DMSerifDisplay_400Regular',
    color: TEXT_0,
    fontSize: 20,
  },
  contextLine: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: TEXT_3,
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 64,
    gap: 0,
  },
  sectionLabel: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 10,
    letterSpacing: 1.8,
    color: '#6B6878',
    marginTop: 22,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: 'rgba(243,239,232,0.07)',
  },
  rowLast: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(243,239,232,0.07)',
  },
  av: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 13.5,
    color: TEXT_0,
    lineHeight: 18,
  },
  rowSub: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11.5,
    color: TEXT_2,
    marginTop: 2,
  },
  rowValue: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12.5,
    color: TEXT_2,
    flexShrink: 1,
    marginRight: 6,
    textAlign: 'right',
  },
  sectionEnd: { height: 1, borderBottomWidth: 1, borderBottomColor: 'rgba(243,239,232,0.07)' },
});

// ── Sheet styles ──────────────────────────────────────────────────────────────

const sht = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BACKDROP,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: HAIRLINE,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
  },
  grab: {
    alignSelf: 'center',
    width: 36,
    height: 3,
    borderRadius: 99,
    backgroundColor: TEXT_4,
    marginTop: 10,
    marginBottom: 14,
  },
  sheetTitle: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 20,
    color: TEXT_0,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  sheetLead: {
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    color: TEXT_1,
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  optionsWrap: { paddingHorizontal: 20, gap: 8 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: HAIRLINE,
    borderRadius: 10,
  },
  optionRowActive: {
    borderColor: ORANGE_LINE,
  },
  radioDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: TEXT_4,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioDotActive: { borderColor: ORANGE },
  radioDotFill: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ORANGE,
  },
  optLabel: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 13.5,
    color: TEXT_0,
    lineHeight: 18,
  },
  optSub: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11.5,
    color: TEXT_2,
    marginTop: 2,
  },
  ctaWrap: { paddingHorizontal: 20, paddingTop: 18 },
  ctaBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: TEXT_0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnText: {
    fontFamily: 'Outfit-Bold',
    fontSize: 15,
    color: ORANGE_INK,
  },
});

// ── Capacity sheet styles ─────────────────────────────────────────────────────

const cap = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 18,
  },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: HAIRLINE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: { opacity: 0.4 },
  stepBtnPlus: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: ORANGE_LINE,
    backgroundColor: ORANGE_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 52,
    lineHeight: 56,
    color: TEXT_0,
    minWidth: 90,
    textAlign: 'center',
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: YELLOW_SOFT,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 13,
  },
  noteText: {
    flex: 1,
    fontFamily: 'Outfit-Regular',
    fontSize: 11.5,
    color: TEXT_1,
    lineHeight: 17,
  },
});
