// netsa-mobile/src/components/dashboard/shared/HowItWorks.tsx
//
// Empty-state "How it works" explainer, shared across all three role homes
// (Client · Creative Lead · Artist). Design source:
//   DOCS/04-design/mockups/hirer-home-howitworks-v3-toggle.html   (Creative Lead)
//   DOCS/04-design/mockups/client-home-howitworks-v1.html         (Client)
//   DOCS/04-design/mockups/artist-home-howitworks-v1.html          (Artist)
//
// Structure: a segmented toggle whose first tab is the role's OWN job and
// whose second tab is the UNIVERSAL "Host an event" loop (events are open to
// every role). The toggle swaps only the loop content + heading; the footer
// shows BOTH CTAs at all times (own-job primary + "Post your event").
//
// The host loop is grounded in the O1–O15 organizer flow
// (DOCS/04-design/mockups/EVENT_FLOW_FRAME_MAP.md): compose → register → manage → settle.
//
// Gutter is caller-controlled via `style` (homes differ: CL sections pad 24,
// artist cards inset 20, client ScrollView already pads 20).

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  type LucideIcon,
  FileText, Users, CalendarCheck, PenLine,
  Search, Send, Wallet,
  SquarePen, Inbox, ListChecks, BadgeCheck,
  CalendarPlus, Ticket, ClipboardList, CalendarDays,
} from 'lucide-react-native';

export type HowItWorksRole = 'creative_lead' | 'artist' | 'client';

type Beat = { Icon: LucideIcon; title: string; sub: string };
type Loop = { label: string; tabLabel: string; TabIcon: LucideIcon; beats: Beat[] };
type RoleConfig = {
  eyebrow: string;
  own: Loop;
  primaryCta: string;
  primaryHref: string;
};

const EVENT_HREF = '/(app)/events/compose';

// ─── Universal second face: Host an event (identical for every role) ───
const HOST: Loop = {
  label: 'HOW HOSTING RUNS',
  tabLabel: 'Host an event',
  TabIcon: CalendarDays,
  beats: [
    { Icon: CalendarPlus, title: 'Create the event', sub: 'Workshop, showcase, meetup — free RSVP or paid ticket.' },
    { Icon: Ticket, title: 'People register', sub: 'Seats fill up; a waitlist catches the overflow.' },
    { Icon: ClipboardList, title: 'Manage the roster', sub: 'Announce, answer questions, and check people in on the day.' },
    { Icon: Wallet, title: 'Host & settle up', sub: 'Run the day. Paid events settle to your account after the NETSA fee.' },
  ],
};

// ─── Per-role first face (the role's own job) ───
const ROLE: Record<HowItWorksRole, RoleConfig> = {
  creative_lead: {
    eyebrow: 'Post it → responses arrive → you manage → money settles.',
    primaryCta: 'Post a gig',
    primaryHref: '/(app)/create',
    own: {
      label: 'HOW A HIRE RUNS',
      tabLabel: 'Hire an artist',
      TabIcon: Users,
      beats: [
        { Icon: FileText, title: 'Post the brief', sub: 'Role, date, budget — out to matched artists across Pune.' },
        { Icon: Users, title: 'Artists apply', sub: 'Profiles, past work, and rates arrive in one place.' },
        { Icon: CalendarCheck, title: 'Review & book', sub: 'Compare, chat, and book the artist who fits.' },
        { Icon: PenLine, title: 'Contract & pay', sub: 'A one-tap agreement seals it. Pay in-app when the work wraps.' },
      ],
    },
  },
  artist: {
    eyebrow: 'Find work, or host your own event — same simple rhythm.',
    primaryCta: 'Find gigs',
    primaryHref: '/(app)/gigs',
    own: {
      label: 'HOW FINDING WORK RUNS',
      tabLabel: 'Find work',
      TabIcon: Search,
      beats: [
        { Icon: Search, title: 'Find gigs', sub: 'Browse gigs matched to your craft, posted by leads across Pune.' },
        { Icon: Send, title: 'Apply', sub: 'Send your pitch, rate, and past work in a tap.' },
        { Icon: CalendarCheck, title: 'Get booked', sub: 'The lead reviews and books you — sealed with a one-tap agreement.' },
        { Icon: Wallet, title: 'Get paid', sub: 'Payment lands in-app when the gig wraps — and lifts your standing.' },
      ],
    },
  },
  client: {
    eyebrow: 'Hire a lead, or host your own event — same simple rhythm.',
    primaryCta: 'Post your requirement',
    primaryHref: '/(app)/client/new-requirement',
    own: {
      label: 'HOW HIRING WORKS',
      tabLabel: 'Hire a lead',
      TabIcon: Users,
      beats: [
        { Icon: SquarePen, title: 'Post your requirement', sub: 'Your occasion, craft, date, and budget — about two minutes.' },
        { Icon: Inbox, title: 'Creative Leads propose', sub: 'Up to five curated leads send pitches, quotes, and past work.' },
        { Icon: ListChecks, title: 'Compare & choose', sub: 'Line up proposals side by side. Chat, then pick the lead who fits.' },
        { Icon: BadgeCheck, title: 'Confirm & pay', sub: 'Lock it in with a simple agreement. Pay securely in-app.' },
      ],
    },
  },
};

function SegButton({
  active, label, Icon, onPress,
}: { active: boolean; label: string; Icon: LucideIcon; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={[styles.segBtn, active && styles.segBtnActive]}
    >
      <Icon size={15} color={active ? '#0A0A0F' : '#B8B1A6'} strokeWidth={1.9} />
      <Text style={[styles.segBtnText, active && styles.segBtnTextActive]}>{label}</Text>
    </Pressable>
  );
}

export default function HowItWorks({
  role,
  style,
}: {
  role: HowItWorksRole;
  style?: StyleProp<ViewStyle>;
}) {
  const router = useRouter();
  const cfg = ROLE[role];
  const [tab, setTab] = useState<'own' | 'host'>('own');
  const active = tab === 'own' ? cfg.own : HOST;

  return (
    <View style={[styles.section, style]}>
      <View style={styles.headRow}>
        <Text style={styles.h2}>How it works</Text>
        <Text style={styles.mono}>4 BEATS</Text>
      </View>
      <Text style={styles.eyebrow}>{cfg.eyebrow}</Text>

      {/* Segmented toggle: own job | Host an event */}
      <View style={styles.seg} accessibilityRole="tablist">
        <SegButton active={tab === 'own'} label={cfg.own.tabLabel} Icon={cfg.own.TabIcon} onPress={() => setTab('own')} />
        <SegButton active={tab === 'host'} label={HOST.tabLabel} Icon={HOST.TabIcon} onPress={() => setTab('host')} />
      </View>

      {/* Loop card */}
      <View style={styles.card}>
        <View style={styles.loopHead}>
          <View style={styles.loopHeadLeft}>
            <View style={styles.orangeDot} />
            <Text style={styles.loopLabel}>{active.label}</Text>
          </View>
          <View style={styles.guidePill}><Text style={styles.guidePillText}>GUIDE</Text></View>
        </View>

        {active.beats.map((b, i) => {
          const Icon = b.Icon;
          const isLast = i === active.beats.length - 1;
          return (
            <View key={b.title} style={styles.row}>
              <View style={styles.rail}>
                <View style={styles.iconChip}><Icon size={16} color="#FF6B35" strokeWidth={1.8} /></View>
                {!isLast && <View style={styles.connector} />}
              </View>
              <View style={[styles.body, isLast && styles.bodyLast]}>
                <Text style={styles.rowTitle}>{b.title}</Text>
                <Text style={styles.rowSub}>{b.sub}</Text>
              </View>
            </View>
          );
        })}

        {/* Both CTAs, always visible, side-by-side */}
        <View style={styles.foot}>
          <Pressable
            style={styles.btnSolid}
            onPress={() => router.push(cfg.primaryHref as any)}
            accessibilityRole="button"
          >
            <Text style={styles.btnSolidText} numberOfLines={1}>{cfg.primaryCta}</Text>
          </Pressable>
          <Pressable
            style={styles.btnGhost}
            onPress={() => router.push(EVENT_HREF as any)}
            accessibilityRole="button"
          >
            <Text style={styles.btnGhostText} numberOfLines={1}>Post your event</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const LINE = 'rgba(243,239,232,0.05)';
const LINE_2 = 'rgba(243,239,232,0.09)';
const LINE_3 = 'rgba(243,239,232,0.14)';

const styles = StyleSheet.create({
  section: { paddingBottom: 32 },
  headRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 },
  h2: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 28, letterSpacing: -0.8, color: '#F3EFE8' },
  mono: { fontFamily: 'SpaceMono-Regular', fontSize: 10, color: '#6B6878', letterSpacing: 1.5 },
  eyebrow: { fontFamily: 'DMSerifDisplay_400Regular', fontStyle: 'italic', fontSize: 12, color: '#6B6878', marginBottom: 16 },

  seg: {
    flexDirection: 'row', gap: 4, padding: 4, marginBottom: 16,
    backgroundColor: '#0D0B12', borderWidth: 1, borderColor: LINE_2, borderRadius: 999,
  },
  segBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    paddingVertical: 10, borderRadius: 999,
  },
  segBtnActive: { backgroundColor: '#F3EFE8' },
  segBtnText: { fontFamily: 'Outfit-SemiBold', fontSize: 13, color: '#B8B1A6' },
  segBtnTextActive: { color: '#0A0A0F' },

  card: { backgroundColor: '#14111B', borderColor: LINE_2, borderWidth: 1, borderRadius: 22, padding: 20 },
  loopHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  loopHeadLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orangeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF6B35' },
  loopLabel: { fontFamily: 'Outfit-SemiBold', fontSize: 13, color: '#F3EFE8', letterSpacing: 0.3 },
  guidePill: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  guidePillText: { fontFamily: 'Outfit-Bold', fontSize: 9, color: '#B8B1A6', letterSpacing: 1 },

  row: { flexDirection: 'row', gap: 14 },
  rail: { width: 36, alignItems: 'center' },
  iconChip: {
    width: 36, height: 36, borderRadius: 11,
    backgroundColor: 'rgba(255,107,53,0.10)', borderWidth: 1, borderColor: 'rgba(255,107,53,0.16)',
    alignItems: 'center', justifyContent: 'center',
  },
  connector: { width: 1, flex: 1, minHeight: 16, backgroundColor: LINE_2, marginTop: 6 },
  body: { flex: 1, paddingTop: 8, paddingBottom: 18 },
  bodyLast: { paddingBottom: 4 },
  rowTitle: { fontFamily: 'Outfit-SemiBold', fontSize: 15, color: '#F3EFE8', marginBottom: 2 },
  rowSub: { fontFamily: 'Outfit-Regular', fontSize: 12, color: '#6B6878', lineHeight: 18 },

  foot: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: LINE, flexDirection: 'row', gap: 10 },
  btnSolid: { flex: 1, backgroundColor: '#F3EFE8', borderRadius: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  btnSolidText: { fontFamily: 'Outfit-Bold', fontSize: 12, color: '#0A0A0F', letterSpacing: 0.2 },
  btnGhost: { flex: 1, borderWidth: 1, borderColor: LINE_3, borderRadius: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  btnGhostText: { fontFamily: 'Outfit-Bold', fontSize: 12, color: '#F3EFE8' },
});
