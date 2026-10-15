import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Calendar, MapPin, Video, Link as LinkIcon } from 'lucide-react-native';
import { useComposerStoreV4 } from '../useComposerStoreV4';
import { Group, Field, TextField, Chips, Segmented, Hint, ToggleRow } from '../ui';
import { C, F } from '../theme';
import { CalendarModal } from '@/components/ui/CalendarModal';

const DURATIONS: { label: string; v: string }[] = [
  { label: '1 hour', v: 'h1' }, { label: '2 hours', v: 'h2' }, { label: '3 hours', v: 'h3' }, { label: 'Half day', v: 'half' }, { label: 'Full day', v: 'full' },
];
const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : undefined);

export default function Step2WhereWhen() {
  const form = useComposerStoreV4((s) => s.form);
  const update = useComposerStoreV4((s) => s.update);
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [showEnd, setShowEnd] = useState(!!form.endsAt);
  const online = form.format === 'online';

  return (
    <View>
      <Text style={st.sub}>When it happens and where people go.</Text>

      <Group label="Date" required>
        <Field icon={Calendar} value={fmtDate(form.startsAt)} placeholder="Pick a start date" onPress={() => setStartOpen(true)} right={null} />
        {showEnd || form.endsAt ? (
          <Field icon={Calendar} value={fmtDate(form.endsAt)} placeholder="Pick an end date (multi-day)" onPress={() => setEndOpen(true)} right={null} />
        ) : (
          <Pressable onPress={() => setShowEnd(true)}><Text style={st.addEnd}>+ End date</Text></Pressable>
        )}
      </Group>

      <Group label="How long" optional sub="Leave blank if the time isn't fixed yet.">
        <Chips options={DURATIONS.map((d) => d.label)} value={DURATIONS.find((d) => d.v === form.durationKind)?.label} onChange={(lbl) => update('durationKind', DURATIONS.find((d) => d.label === lbl)!.v)} />
        <ToggleRow label="Time to be announced" value={form.timeTbd} onChange={(v) => update('timeTbd', v)} />
      </Group>

      <Group label="Format" required>
        <Segmented value={form.format} onChange={(v) => update('format', v)}
          options={[{ key: 'in_person', label: 'In person', icon: MapPin }, { key: 'online', label: 'Online', icon: Video }]} />
      </Group>

      {!online ? (
        <>
          <Group label="Location" required>
            <TextField icon={MapPin} placeholder="Venue name" value={form.location.venueName} onChangeText={(t) => update('location', { ...form.location, venueName: t })} />
            <TextField placeholder="Address" value={form.location.address} onChangeText={(t) => update('location', { ...form.location, address: t })} />
            <View style={st.row2}>
              <View style={{ flex: 1 }}><TextField placeholder="City" value={form.location.city} onChangeText={(t) => update('location', { ...form.location, city: t })} /></View>
              <View style={{ flex: 1 }}><TextField placeholder="State" value={form.location.state} onChangeText={(t) => update('location', { ...form.location, state: t })} /></View>
            </View>
            <TextField placeholder="Landmark (optional)" value={form.location.landmark} onChangeText={(t) => update('location', { ...form.location, landmark: t })} />
          </Group>
          <Group label="Hide the exact address" optional>
            <ToggleRow label="Show the address only after they register" sub="For house concerts, home studios and secret gigs"
              value={!!form.location.hideAddress} onChange={(v) => update('location', { ...form.location, hideAddress: v })} />
          </Group>
        </>
      ) : (
        <>
          <Group label="Platform" optional>
            <Chips options={['Zoom', 'Google Meet', 'YouTube Live', 'Other']} value={form.location.onlinePlatform} onChange={(t) => update('location', { ...form.location, onlinePlatform: t })} />
          </Group>
          <Group label="Join link" optional sub="Add it now or any time before the event.">
            <TextField icon={LinkIcon} placeholder="https://…" autoCapitalize="none" value={form.location.meetingLink} onChangeText={(t) => update('location', { ...form.location, meetingLink: t })} />
          </Group>
          <Group label="When attendees see the link">
            <Chips options={['On registering', '24h before', '1h before']}
              value={{ on_register: 'On registering', 'T-24h': '24h before', 'T-1h': '1h before' }[form.location.meetingLinkRevealAt ?? 'T-24h']}
              onChange={(lbl) => update('location', { ...form.location, meetingLinkRevealAt: ({ 'On registering': 'on_register', '24h before': 'T-24h', '1h before': 'T-1h' } as const)[lbl] })} />
          </Group>
        </>
      )}

      <CalendarModal visible={startOpen} onClose={() => setStartOpen(false)} minDate={new Date()}
        onSelect={(d) => { update('startsAt', d.toISOString()); setStartOpen(false); }} />
      <CalendarModal visible={endOpen} onClose={() => setEndOpen(false)} minDate={form.startsAt ? new Date(form.startsAt) : new Date()}
        onSelect={(d) => { update('endsAt', d.toISOString()); setEndOpen(false); }} />
    </View>
  );
}

const st = StyleSheet.create({
  sub: { fontFamily: F.body, fontSize: 13, color: C.dim, marginBottom: 18, lineHeight: 18 },
  addEnd: { fontFamily: F.semibold, fontSize: 12.5, color: C.orange, paddingVertical: 4 },
  row2: { flexDirection: 'row', gap: 10 },
});
