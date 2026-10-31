// src/components/dashboard/artist/home/ui.tsx
//
// Shared tokens + presentational atoms for the simplified artist home
// (DOCS/04-design/mockups/artist-home-final.html, locked 2026-10-18 · skin "A").
// A·Minimal #121216 surfaces + the editorial type the home kept (DM Serif
// headlines, Space Mono labels, Outfit body). StyleSheet-only.

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Bookmark, ArrowRight } from 'lucide-react-native';

// A·Minimal palette (mirrors the gig-detail #121216 family) + brand accents.
export const HC = {
  canvas: '#121216',
  card: '#1C1C23', // lifted surface — does not camouflage against canvas
  well: '#212129',
  chip: '#24242E',
  chipb: '#3C3C47',
  hair: 'rgba(255,255,255,0.08)',
  hairSoft: 'rgba(255,255,255,0.06)',
  cream: '#FFFFFF',
  t1: '#D4D4D8',
  t2: '#A1A1AA',
  t3: '#8B8B99',
  t4: '#6B6B78',
  orange: '#FF6B35',
  purple: '#8B5CF6',
  green: '#22C55E',
  blue: '#3B82F6',
  gold: '#F59E0B',
} as const;

export const HF = {
  serif: 'DMSerifDisplay_400Regular',
  mono: 'SpaceMono-Regular',
  body: 'Outfit-Regular',
  med: 'Outfit-Medium',
  semi: 'Outfit-SemiBold',
  bold: 'Outfit-Bold',
} as const;

// ─── formatters (shared with YourStage lineage) ──────────────────────────
export function fmtRupees(n?: number | null): string {
  if (n == null || !Number.isFinite(n) || n <= 0) return 'Free';
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(n % 100_000 === 0 ? 0 : 1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export function fmtShortDate(iso?: string | null): string {
  if (!iso) return 'TBD';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'TBD';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }).toUpperCase();
}

export function fmtAgo(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return '';
  const days = Math.round((Date.now() - d) / 86_400_000);
  if (days <= 0) return 'TODAY';
  if (days === 1) return '1D AGO';
  return `${days}D AGO`;
}

// ─── pills ───────────────────────────────────────────────────────────────
export type PillTone = 'muted' | 'orange' | 'green' | 'purple' | 'gold' | 'blue';
const PILL: Record<PillTone, { bg: string; fg: string }> = {
  muted: { bg: 'rgba(255,255,255,0.05)', fg: HC.t1 },
  orange: { bg: 'rgba(255,107,53,0.13)', fg: HC.orange },
  green: { bg: 'rgba(34,197,94,0.12)', fg: HC.green },
  purple: { bg: 'rgba(139,92,246,0.13)', fg: HC.purple },
  gold: { bg: 'rgba(245,158,11,0.12)', fg: HC.gold },
  blue: { bg: 'rgba(59,130,246,0.13)', fg: HC.blue },
};

export function Pill({ label, tone = 'muted' }: { label: string; tone?: PillTone }) {
  const c = PILL[tone];
  return (
    <View style={[s.pill, { backgroundColor: c.bg }]}>
      <Text style={[s.pillTxt, { color: c.fg }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

// ─── section title ───────────────────────────────────────────────────────
export function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <View style={s.shead}>
      <Text style={s.stitle}>{children}</Text>
      {hint ? <Text style={s.shint}>{hint}</Text> : null}
    </View>
  );
}

// ─── primary segmented tabs (Gigs / Events) ──────────────────────────────
export function SegTabs<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { key: T; label: string }[];
  onChange: (k: T) => void;
}) {
  return (
    <View style={s.seg}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable key={o.key} onPress={() => onChange(o.key)} style={[s.segBtn, on && s.segBtnOn]}>
            <Text style={[s.segTxt, on && s.segTxtOn]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── secondary sub-tabs (underline + count) ──────────────────────────────
export function SubTabs<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { key: T; label: string; count: number }[];
  onChange: (k: T) => void;
}) {
  return (
    <View style={s.subs}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable key={o.key} onPress={() => onChange(o.key)} style={s.sub}>
            <Text style={[s.subTxt, on && s.subTxtOn]}>
              {o.label} <Text style={[s.subCount, on && s.subCountOn]}>· {o.count}</Text>
            </Text>
            {on ? <View style={s.subUnderline} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── list row (What you're in) ───────────────────────────────────────────
export function Row({
  title,
  initial,
  kind = 'gig',
  pill,
  meta,
  right,
  accent,
  rightSub,
  saved,
  muted,
  onPress,
}: {
  title: string;
  initial: string;
  // 'brief' = a client brief the CL pitches on (blue thumb — the Pitching face).
  kind?: 'gig' | 'event' | 'brief';
  pill?: { label: string; tone?: PillTone };
  meta?: string;
  right?: string;
  /** Optional orange accent above rightSub, e.g. "2 NEW" applicants. */
  accent?: string;
  rightSub?: string;
  saved?: boolean;
  muted?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={s.row}>
      <View style={[s.thumb, kind === 'event' && s.thumbEv, kind === 'brief' && s.thumbBrief, muted && { opacity: 0.6 }]}>
        <Text style={[s.thumbTxt, kind === 'event' && { color: HC.purple }, kind === 'brief' && { color: HC.blue }]}>{initial}</Text>
      </View>
      <View style={s.rb}>
        <Text style={[s.rt, muted && { color: HC.t1 }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={s.rm}>
          {pill ? <Pill label={pill.label} tone={pill.tone} /> : null}
          {meta ? <Text style={s.rmeta} numberOfLines={1}>{meta}</Text> : null}
        </View>
      </View>
      <View style={s.rside}>
        {right ? <Text style={s.rpay}>{right}</Text> : null}
        {accent ? <Text style={s.raccent}>{accent}</Text> : null}
        {saved ? (
          <View style={s.savedRow}>
            <Bookmark size={9} color={HC.orange} fill={HC.orange} />
            <Text style={s.rsub}>SAVED</Text>
          </View>
        ) : rightSub ? (
          <Text style={s.rsub}>{rightSub}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

// ─── see-all link ────────────────────────────────────────────────────────
export function SeeAll({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={s.seeall}>
      <Text style={s.seeallTxt}>{label}</Text>
      <ArrowRight size={11} color={HC.t2} />
    </Pressable>
  );
}

// ─── empty state ─────────────────────────────────────────────────────────
export function EmptyState({ copy, cta, onPress }: { copy: string; cta: string; onPress: () => void }) {
  return (
    <View style={s.empty}>
      <Text style={s.emptyCopy}>{copy}</Text>
      <Pressable onPress={onPress} style={s.emptyCta}>
        <Text style={s.emptyCtaTxt}>{cta.toUpperCase()}</Text>
        <ArrowRight size={11} color={HC.orange} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  pill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  pillTxt: { fontFamily: HF.bold, fontSize: 8, letterSpacing: 1 },

  shead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 26, marginBottom: 13 },
  stitle: { fontFamily: HF.serif, fontSize: 24, letterSpacing: -0.5, color: HC.cream },
  shint: { fontFamily: HF.mono, fontSize: 10, letterSpacing: 1, color: HC.t4 },

  seg: { flexDirection: 'row', gap: 6, alignSelf: 'flex-start', backgroundColor: HC.card, borderWidth: 1, borderColor: HC.hair, borderRadius: 11, padding: 4, marginBottom: 14 },
  segBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  segBtnOn: { backgroundColor: HC.orange },
  segTxt: { fontFamily: HF.mono, fontSize: 10, letterSpacing: 1, color: HC.t2 },
  segTxtOn: { fontFamily: HF.bold, color: '#190B05' },

  subs: { flexDirection: 'row', gap: 22, borderBottomWidth: 1, borderBottomColor: HC.hairSoft, marginBottom: 6 },
  sub: { paddingTop: 9, paddingBottom: 12, position: 'relative' },
  subTxt: { fontFamily: HF.mono, fontSize: 10, letterSpacing: 1, color: HC.t2 },
  subTxtOn: { color: HC.cream },
  subCount: { color: HC.t4 },
  subCountOn: { color: HC.orange, fontFamily: HF.bold },
  subUnderline: { position: 'absolute', left: 0, right: 0, bottom: -1, height: 1.5, backgroundColor: HC.orange },

  row: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: HC.hairSoft },
  thumb: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,107,53,0.13)', alignItems: 'center', justifyContent: 'center' },
  thumbEv: { backgroundColor: 'rgba(139,92,246,0.14)' },
  thumbBrief: { backgroundColor: 'rgba(59,130,246,0.14)' },
  thumbTxt: { fontFamily: HF.serif, fontSize: 17, color: HC.orange },
  rb: { flex: 1, minWidth: 0 },
  rt: { fontFamily: HF.body, fontSize: 14, color: HC.cream },
  rm: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  rmeta: { fontFamily: HF.mono, fontSize: 9.5, letterSpacing: 0.4, color: HC.t2, flexShrink: 1 },
  rside: { alignItems: 'flex-end' },
  rpay: { fontFamily: HF.serif, fontSize: 15, color: HC.cream },
  raccent: { fontFamily: HF.mono, fontSize: 8.5, letterSpacing: 0.8, color: HC.orange, marginTop: 3 },
  rsub: { fontFamily: HF.mono, fontSize: 8.5, letterSpacing: 0.8, color: HC.t3, marginTop: 3 },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },

  seeall: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 12, paddingVertical: 11, borderWidth: 1, borderStyle: 'dashed', borderColor: HC.hair, borderRadius: 12 },
  seeallTxt: { fontFamily: HF.mono, fontSize: 9.5, letterSpacing: 1.3, color: HC.t2 },

  empty: { paddingVertical: 24, paddingHorizontal: 10, alignItems: 'center' },
  emptyCopy: { fontFamily: HF.body, fontSize: 13, color: HC.t2, textAlign: 'center', lineHeight: 19, marginBottom: 12 },
  emptyCta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  emptyCtaTxt: { fontFamily: HF.mono, fontSize: 10, letterSpacing: 1.3, color: HC.orange },
});
