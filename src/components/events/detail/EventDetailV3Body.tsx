/**
 * EventDetailV3Body — the scrolling content for the E·9 photo-led detail page.
 *
 * Order (each section hides itself when its data is empty — no placeholders):
 *   facts (When · Where · Spots) → meta line → style tags → About →
 *   Hosted by → Led by → type-specific details → day-by-day → venue / online.
 *
 * Reads only from EventDoc; "who's going" is passed in from the public roster.
 */
import { View, Text, Pressable, Linking, StyleSheet, ScrollView } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import {
  BadgeCheck, MapPin, Video, Lock, Navigation, UserPlus,
} from 'lucide-react-native';
import type { EventDoc } from '@/services/eventService';
import {
  metaLine, dateRange, timeLine, initials, featuringLabel, EVENT_TYPE_LABEL,
} from '@/lib/eventDetailV3';

/* ── v6 / E·9 palette ── */
const BG = '#09090b';
const SURFACE = 'rgba(255,255,255,0.04)';
const HAIR = 'rgba(255,255,255,0.07)';
const HAIR2 = 'rgba(255,255,255,0.10)';
const T0 = '#F3EFE8';
const T1 = '#C9C4BC';
const T2 = '#8C857B';
const T3 = '#57524C';
const ORANGE = '#FF6B35';
const ORANGE_HI = '#FF8A5C';
const GREEN = '#22C55E';
const GOLD = '#C9A961';

const SERIF = 'DMSerifDisplay_400Regular';
const OUTFIT = 'Outfit-Regular';
const OUTFIT_MED = 'Outfit-Medium';
const OUTFIT_SEMI = 'Outfit-SemiBold';
const OUTFIT_BOLD = 'Outfit-Bold';
const MONO = 'SpaceMono-Regular';
const MONO_BOLD = 'SpaceMono-Bold';
const PAD = 20;

interface Props {
  event: EventDoc;
  goingCount?: number;
  goingNames?: string[];
  organizerId?: string;
  onOpenProfile?: (userId?: string) => void;
}

const AVT_COLORS = ['#8a4a2a', '#46307a', '#2c5a4a', '#6a2a44', '#2a4a6a'];
type FeatPerson = { name: string; role?: string; invited?: boolean; userId?: string; avatarUrl?: string };

/* Small mono section label (E·9 uses labels, not divider lines). */
function SectionLabel({ children, aside }: { children: string; aside?: string }) {
  return (
    <View style={styles.slRow}>
      <Text style={styles.sl}>{children}</Text>
      {aside ? <Text style={styles.slAside}>{aside}</Text> : null}
    </View>
  );
}

export default function EventDetailV3Body({ event, goingCount = 0, goingNames = [], organizerId, onOpenProfile }: Props) {
  const loc = event.location;
  const online = loc?.kind === 'online';
  const total = event.capacity?.total ?? 0;
  const registered = event.capacity?.registeredCount ?? 0;
  const spotsLeft = Math.max(0, total - registered);

  const org = event.organizerSnapshot;
  const meta = metaLine(event);
  const tags = event.topicTags ?? [];
  const featuring: FeatPerson[] = (event.people ?? []).map((p) => ({ name: p.displayName, role: p.role, invited: p.invite?.status === 'invited', userId: p.userId, avatarUrl: p.avatarUrl }));

  return (
    <View style={{ backgroundColor: BG }}>
      {/* ═══ FACTS ═══ */}
      <View style={styles.facts}>
        <Fact label="When" value={dateRange(event.startsAt, event.endsAt)} sub={timeLine(event)} />
        <Fact
          label="Where"
          value={online ? 'Online' : (loc?.venueName || (loc as any)?.city || 'TBA')}
          sub={online ? (loc?.onlinePlatform || 'Link on register') : ((loc as any)?.city || '')}
        />
        <Fact
          label="Spots"
          value={total > 0 ? String(spotsLeft) : '—'}
          unit={total > 0 ? 'left' : undefined}
          last
        />
      </View>

      {/* ═══ META LINE ═══ */}
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}

      {/* ═══ STYLE TAGS ═══ */}
      {tags.length ? (
        <View style={styles.tags}>
          <Text style={styles.tagLabel}>STYLE</Text>
          {tags.map((t, i) => (
            <View key={`tag-${i}`} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>
          ))}
        </View>
      ) : null}

      {/* ═══ ABOUT ═══ */}
      {event.about ? (
        <View style={styles.sec}>
          <Text style={styles.aboutH}>About this {(EVENT_TYPE_LABEL[event.eventType ?? ''] || 'event').toLowerCase()}</Text>
          <Text style={styles.p}>{event.about}</Text>
          {event.whatToExpect ? <Text style={[styles.p, { marginTop: 12 }]}>{event.whatToExpect}</Text> : null}
        </View>
      ) : null}

      {/* ═══ HOSTED BY ═══ */}
      {org?.name ? (
        <View style={styles.sec}>
          <SectionLabel>Hosted by</SectionLabel>
          <View style={styles.pr}>
            {org.profileImageUrl ? (
              <ExpoImage source={{ uri: org.profileImageUrl }} style={styles.avt} />
            ) : (
              <View style={[styles.avt, { backgroundColor: AVT_COLORS[4], alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={styles.avtTxt}>{initials(org.name)}</Text>
              </View>
            )}
            <View style={styles.pn}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Text style={styles.pnName} numberOfLines={1}>{org.name}</Text>
                {org.verified ? <BadgeCheck size={14} color={GREEN} fill={GREEN} strokeWidth={0} /> : null}
              </View>
              {org.role ? <Text style={styles.pnSub} numberOfLines={1}>{org.role}</Text> : null}
            </View>
            <Pressable style={styles.followChip} onPress={() => onOpenProfile?.(organizerId)} accessibilityRole="button">
              <UserPlus size={13} color={T0} />
              <Text style={styles.followTxt}>Follow</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* ═══ LED BY ═══ (empty → hidden) */}
      {featuring.length ? (
        <View style={styles.sec}>
          <SectionLabel>{featuringLabel(event)}</SectionLabel>
          {featuring.length === 1 ? (
            <PersonRow p={featuring[0]} index={0} onOpenProfile={onOpenProfile} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ppl}>
              {featuring.map((p, i) => (
                <PersonCard key={`feat-${i}`} p={p} index={i} onOpenProfile={onOpenProfile} />
              ))}
            </ScrollView>
          )}
        </View>
      ) : null}

      {/* ═══ TYPE-SPECIFIC DETAILS ═══ */}
      <TypeBlock event={event} />

      {/* ═══ DAY BY DAY ═══ */}
      {Array.isArray(event.agenda) && event.agenda.length ? (
        <View style={styles.sec}>
          <SectionLabel aside={`${event.agenda.length} ${event.agenda.length === 1 ? 'day' : 'days'}`}>Day by day</SectionLabel>
          {event.agenda.map((a, i) => (
            <View key={`ag-${i}`} style={styles.ag}>
              <Text style={styles.agT}>DAY {i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.agTitle}>{a.title}</Text>
                {a.subtitle ? <Text style={styles.agSub}>{a.subtitle}</Text> : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {/* ═══ WHERE / ONLINE ═══ */}
      <View style={styles.sec}>
        <SectionLabel>Where</SectionLabel>
        {online ? (
          <View style={styles.venue}>
            <Video size={16} color={T1} />
            <View style={{ flex: 1 }}>
              <Text style={styles.vName}>Online · {loc?.onlinePlatform || 'link shared'}</Text>
              <Text style={styles.vSub}>The join link unlocks before it starts. We’ll email and notify you.</Text>
            </View>
          </View>
        ) : (loc as any)?.hideAddress ? (
          <View style={styles.venue}>
            <Lock size={16} color={T1} />
            <View style={{ flex: 1 }}>
              <Text style={styles.vName}>{(loc as any)?.city || 'Address shared on approval'}</Text>
              <Text style={styles.vSub}>The exact address is shared once you’re approved.</Text>
            </View>
          </View>
        ) : (
          <View style={styles.venueCol}>
            <View style={styles.venue}>
              <MapPin size={16} color={T1} />
              <View style={{ flex: 1 }}>
                <Text style={styles.vName}>{loc?.venueName || 'Venue TBA'}</Text>
                <Text style={styles.vSub}>{[loc?.address, (loc as any)?.city].filter(Boolean).join(', ')}</Text>
              </View>
            </View>
            {loc?.address || loc?.venueName ? (
              <Pressable
                style={styles.dirBtn}
                onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(loc.address || loc.venueName || '')}`)}
              >
                <Navigation size={13} color={ORANGE} />
                <Text style={styles.dirTxt}>Directions</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}

/* ── Fact cell ── */
function Fact({ label, value, sub, unit, last }: { label: string; value: string; sub?: string; unit?: string; last?: boolean }) {
  return (
    <View style={[styles.fact, last && { borderRightWidth: 0, paddingRight: 0 }, !last && { paddingRight: 14 }]}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factVal} numberOfLines={2}>
        {value}{unit ? <Text style={styles.factUnit}> {unit}</Text> : null}
      </Text>
      {sub ? <Text style={styles.factSub} numberOfLines={1}>{sub}</Text> : null}
    </View>
  );
}

/* ── Led-by: single-artist row ── */
function PersonRow({ p, index, onOpenProfile }: { p: FeatPerson; index: number; onOpenProfile?: (id?: string) => void }) {
  return (
    <View style={styles.pr}>
      {p.avatarUrl && !p.invited ? (
        <ExpoImage source={{ uri: p.avatarUrl }} style={styles.avt} />
      ) : (
        <View style={[styles.avt, p.invited ? styles.avtPlain : { backgroundColor: AVT_COLORS[index % 5] }, { alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={[styles.avtTxt, p.invited && { color: T2 }]}>{initials(p.name)}</Text>
        </View>
      )}
      <View style={styles.pn}>
        <Text style={styles.pnName} numberOfLines={1}>{p.name}</Text>
        <Text style={styles.pnSub} numberOfLines={1}>{p.invited ? 'Not on NETSA yet' : (p.role || '')}</Text>
      </View>
      {!p.invited ? (
        <Pressable style={styles.followChip} onPress={() => onOpenProfile?.(p.userId)} accessibilityRole="button">
          <UserPlus size={13} color={T0} />
          <Text style={styles.followTxt}>Follow</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/* ── Led-by: multi-artist card (borderless, small) ── */
function PersonCard({ p, index, onOpenProfile }: { p: FeatPerson; index: number; onOpenProfile?: (id?: string) => void }) {
  return (
    <View style={styles.pcard}>
      {p.avatarUrl && !p.invited ? (
        <ExpoImage source={{ uri: p.avatarUrl }} style={styles.avtBig} />
      ) : (
        <View style={[styles.avtBig, p.invited ? styles.avtPlain : { backgroundColor: AVT_COLORS[index % 5] }, { alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={[styles.avtTxtBig, p.invited && { color: T2 }]}>{initials(p.name)}</Text>
        </View>
      )}
      <Text style={styles.pcName} numberOfLines={1}>{p.name}</Text>
      <Text style={styles.pcRole} numberOfLines={1}>{p.invited ? 'Invited' : (p.role || '')}</Text>
      {!p.invited ? (
        <Pressable style={styles.followChipSm} onPress={() => onOpenProfile?.(p.userId)} accessibilityRole="button">
          <UserPlus size={11} color={T0} />
          <Text style={styles.followTxtSm}>Follow</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/* ── Type-specific details (roles / slots / prizes / films / Bring-Get) ── */
function TypeBlock({ event }: { event: EventDoc }) {
  const c = event.eventConfig;
  const bring = event.bring?.items ?? [];
  const included = event.included ?? [];
  const prizes = c?.prizes ?? [];
  const lineup = event.lineup ?? [];

  return (
    <>
      {bring.length || included.length ? (
        <View style={styles.sec}>
          <SectionLabel>What to bring</SectionLabel>
          <View style={styles.gg}>
            <View style={styles.ggCol}>
              <Text style={styles.ggH}>YOU BRING</Text>
              {(bring.length ? bring : ['Just yourself']).map((b, i) => (
                <View key={`br-${i}`} style={styles.ggLi}><View style={styles.ggDot} /><Text style={styles.ggTxt}>{b}</Text></View>
              ))}
            </View>
            <View style={[styles.ggCol, styles.ggColGet]}>
              <Text style={[styles.ggH, { color: ORANGE_HI }]}>YOU GET</Text>
              {(included.length ? included : ['Just show up']).map((g, i) => (
                <View key={`gt-${i}`} style={styles.ggLi}><View style={[styles.ggDot, { backgroundColor: ORANGE }]} /><Text style={styles.ggTxt}>{g}</Text></View>
              ))}
            </View>
          </View>
          {event.bring?.note ? <Text style={[styles.p, { marginTop: 10, fontSize: 13 }]}>{event.bring.note}</Text> : null}
        </View>
      ) : null}

      {prizes.length ? (
        <View style={styles.sec}>
          <SectionLabel>Prizes</SectionLabel>
          {prizes.map((pz, i) => (
            <View key={`pz-${i}`} style={[styles.prize, i === 0 && styles.prizeFirst]}>
              <Text style={[styles.prizePos, i === 0 && { color: GOLD }]}>{pz.position}</Text>
              <Text style={styles.prizeReward}>{pz.reward}</Text>
            </View>
          ))}
          {c?.judgingCriteria?.length ? <Text style={[styles.p, { marginTop: 12 }]}>Judged on: {c.judgingCriteria.join(' · ')}</Text> : null}
          {c?.competitionFormat ? <Text style={[styles.kvV, { marginTop: 8 }]}>{c.competitionFormat}</Text> : null}
        </View>
      ) : null}

      {lineup.length ? (
        <View style={styles.sec}>
          <SectionLabel>Line-up</SectionLabel>
          {lineup.map((l, i) => (
            <View key={`lu-${i}`} style={styles.ag}>
              <Text style={styles.agT}>{l.when || String(i + 1).padStart(2, '0')}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.agTitle}>{l.title}</Text>
                {l.detail ? <Text style={styles.agSub}>{l.detail}</Text> : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  slRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  sl: { fontFamily: MONO_BOLD, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: T3 },
  slAside: { marginLeft: 'auto', fontFamily: MONO, fontSize: 10, color: T3, letterSpacing: 0.6 },
  sec: { paddingHorizontal: PAD, paddingTop: 26 },

  facts: { flexDirection: 'row', paddingHorizontal: PAD, paddingTop: 20 },
  fact: { flex: 1, minWidth: 0, borderRightWidth: 1, borderRightColor: HAIR2, paddingLeft: 0 },
  factLabel: { fontFamily: MONO, fontSize: 9.5, letterSpacing: 1.4, textTransform: 'uppercase', color: T3, marginBottom: 7 },
  factVal: { fontFamily: OUTFIT_SEMI, fontSize: 14, color: T0, lineHeight: 18 },
  factUnit: { fontFamily: OUTFIT, fontSize: 12, color: T2 },
  factSub: { fontFamily: OUTFIT, fontSize: 12, color: T2, marginTop: 4 },

  meta: { paddingHorizontal: PAD, paddingTop: 14, fontFamily: OUTFIT, fontSize: 12.5, color: T1, lineHeight: 18 },

  tags: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7, paddingHorizontal: PAD, paddingTop: 12 },
  tagLabel: { fontFamily: MONO_BOLD, fontSize: 9, letterSpacing: 1, color: T3, marginRight: 2 },
  tag: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: HAIR2, backgroundColor: SURFACE },
  tagText: { fontFamily: OUTFIT_MED, fontSize: 12, color: T1 },

  aboutH: { fontFamily: SERIF, fontSize: 20, color: T0, letterSpacing: -0.2, marginBottom: 10 },
  p: { fontFamily: OUTFIT, fontSize: 14.5, lineHeight: 24, color: T1 },

  pr: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  avt: { width: 42, height: 42, borderRadius: 21, overflow: 'hidden' },
  avtBig: { width: 50, height: 50, borderRadius: 25, overflow: 'hidden', marginBottom: 6 },
  avtPlain: { backgroundColor: 'transparent', borderWidth: 1, borderColor: T3, borderStyle: 'dashed' },
  avtTxt: { fontFamily: OUTFIT_BOLD, fontSize: 14, color: '#fff' },
  avtTxtBig: { fontFamily: OUTFIT_BOLD, fontSize: 15, color: '#fff' },
  pn: { flex: 1, minWidth: 0 },
  pnName: { fontFamily: OUTFIT_SEMI, fontSize: 14.5, color: T0 },
  pnSub: { fontFamily: OUTFIT, fontSize: 12, color: T2, marginTop: 1 },
  followChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: HAIR2, backgroundColor: SURFACE },
  followTxt: { fontFamily: OUTFIT_SEMI, fontSize: 12, color: T0 },

  ppl: { gap: 16, paddingTop: 2, paddingRight: PAD },
  pcard: { width: 100, alignItems: 'center' },
  pcName: { fontFamily: OUTFIT_SEMI, fontSize: 12.5, color: T0, textAlign: 'center' },
  pcRole: { fontFamily: OUTFIT, fontSize: 10.5, color: T2, textAlign: 'center', marginTop: 2 },
  followChipSm: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: HAIR2, backgroundColor: SURFACE, marginTop: 7 },
  followTxtSm: { fontFamily: OUTFIT_SEMI, fontSize: 10.5, color: T0 },

  ag: { flexDirection: 'row', gap: 14, paddingVertical: 11, borderTopWidth: 1, borderTopColor: HAIR },
  agT: { fontFamily: MONO_BOLD, fontSize: 11, color: ORANGE, letterSpacing: 0.6, width: 52, paddingTop: 2 },
  agTitle: { fontFamily: OUTFIT_MED, fontSize: 14, color: T0 },
  agSub: { fontFamily: OUTFIT, fontSize: 12, color: T2, marginTop: 2, lineHeight: 17 },

  venueCol: { gap: 12 },
  venue: { flexDirection: 'row', gap: 11, alignItems: 'flex-start', padding: 14, borderWidth: 1, borderColor: HAIR2, borderRadius: 14, backgroundColor: SURFACE },
  vName: { fontFamily: OUTFIT_SEMI, fontSize: 14.5, color: T0 },
  vSub: { fontFamily: OUTFIT, fontSize: 12.5, color: T2, lineHeight: 18, marginTop: 2 },
  dirBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(255,107,53,0.3)', borderRadius: 8 },
  dirTxt: { fontFamily: OUTFIT_SEMI, fontSize: 12, color: ORANGE },

  kvV: { fontFamily: OUTFIT, fontSize: 13.5, color: T0, lineHeight: 20 },

  role: { padding: 13, borderRadius: 13, borderWidth: 1, borderColor: HAIR2, backgroundColor: SURFACE, marginBottom: 8 },
  roleHead: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 },
  roleName: { fontFamily: SERIF, fontSize: 20, color: T0 },
  roleTag: { borderWidth: 1, borderColor: HAIR2, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  roleTagTxt: { fontFamily: OUTFIT, fontSize: 11, color: T1 },
  roleDesc: { fontFamily: OUTFIT, fontSize: 13, color: T1, lineHeight: 19, marginTop: 6 },

  prize: { flexDirection: 'row', alignItems: 'baseline', gap: 12, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: HAIR2, backgroundColor: SURFACE, marginBottom: 6 },
  prizeFirst: { borderColor: 'rgba(201,169,97,0.4)', backgroundColor: 'rgba(201,169,97,0.07)' },
  prizePos: { fontFamily: MONO_BOLD, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: T2, width: 34 },
  prizeReward: { fontFamily: SERIF, fontSize: 18, color: T0 },

  film: { flexDirection: 'row', gap: 14, paddingVertical: 11, borderTopWidth: 1, borderTopColor: HAIR },
  filmN: { fontFamily: MONO_BOLD, fontSize: 11, color: T3, paddingTop: 4, width: 24 },
  filmTitle: { fontFamily: SERIF, fontSize: 18, color: T0 },
  filmMeta: { fontFamily: OUTFIT, fontSize: 12, color: T2, marginTop: 1 },

  gg: { flexDirection: 'row', borderWidth: 1, borderColor: HAIR2, borderRadius: 14, overflow: 'hidden' },
  ggCol: { flex: 1, minWidth: 0, padding: 14 },
  ggColGet: { borderLeftWidth: 1, borderLeftColor: HAIR2 },
  ggH: { fontFamily: MONO_BOLD, fontSize: 9.5, letterSpacing: 1, color: T3, marginBottom: 11 },
  ggLi: { flexDirection: 'row', gap: 9, paddingVertical: 5 },
  ggDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: T3, marginTop: 7 },
  ggTxt: { fontFamily: OUTFIT, fontSize: 13.5, color: T0, lineHeight: 19, flex: 1 },
});
