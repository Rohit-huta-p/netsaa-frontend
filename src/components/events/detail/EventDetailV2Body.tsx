import { View, Text, Pressable, Linking, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Clock,
  BadgeCheck,
  ShieldCheck,
  ChevronRight,
  MapPin,
} from 'lucide-react-native';
import type { EventDoc } from '@/services/eventService';
import { durationKindLabel, computeSlotsLeft } from '@/lib/eventTokens';
import { formatRupees } from '@/lib/eventPricing';
import EventGallery from '@/components/events/detail/EventGallery';

interface Props {
  event: EventDoc;
  organizerEventCount?: number;
}

/* ───────────────────────────────────────────────
   v2 palette — ported EXACTLY from event-detail-v2.html :root
   ─────────────────────────────────────────────── */
const BG_0 = '#07070B';
const BG_1 = '#0B0A0F';
const BG_2 = '#131218';
const BG_3 = '#1B1A22';

const HAIRLINE = 'rgba(255,255,255,0.06)';
const HAIRLINE_2 = 'rgba(255,255,255,0.10)';

const TEXT_0 = '#F0ECE6';
const TEXT_1 = '#C8C0B5';
const TEXT_2 = '#8C857B';
const TEXT_3 = '#57524C';
const TEXT_4 = '#2E2B28';

const ORANGE = '#FF6B35';
const ORANGE_SOFT = 'rgba(255,107,53,0.08)';
const ORANGE_BORDER = 'rgba(255,107,53,0.15)';
const ORANGE_CTA_BORDER = 'rgba(255,107,53,0.25)';
const GREEN = '#4ADE80';
const AMBER = '#F59E0B';
const AMBER_SOFT = 'rgba(245,158,11,0.10)';
const AMBER_BORDER = 'rgba(245,158,11,0.20)';
const PURPLE = '#8B5CF6';
const PURPLE_SOFT = 'rgba(139,92,246,0.08)';
const PURPLE_BORDER = 'rgba(139,92,246,0.18)';
const PURPLE_TEXT = '#C4B5FD';
const GOLD = '#C9A961';

/* Fonts (RN family names) */
const SERIF = 'DMSerifDisplay_400Regular';
const OUTFIT = 'Outfit-Regular';
const OUTFIT_MED = 'Outfit-Medium';
const OUTFIT_SEMI = 'Outfit-SemiBold';
const OUTFIT_BOLD = 'Outfit-Bold';
const MONO = 'SpaceMono-Regular';
const MONO_BOLD = 'SpaceMono-Bold';

const PAD = 20;

const TIME_FMT: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };

/* ───────────────────────────────────────────────
   Data helpers — copied from EventDetailSections so the two
   surfaces resolve organizer / dates / venue / agenda identically.
   ─────────────────────────────────────────────── */
function fmtRange(startISO: string, endISO?: string): string {
  const s = new Date(startISO);
  const startStr = s.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  if (!endISO) return startStr;
  const e = new Date(endISO);
  const sameDay = s.toDateString() === e.toDateString();
  if (sameDay) return startStr;
  return `${startStr} — ${e.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
}

function diffHours(startISO: string, endISO?: string): number | null {
  if (!endISO) return null;
  const ms = new Date(endISO).getTime() - new Date(startISO).getTime();
  if (ms <= 0) return null;
  return Math.round((ms / 3600000) * 10) / 10;
}

function initials(name?: string): string {
  if (!name) return 'N';
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || 'N';
}

/** "Starts in N days" copy from startsAt. null → past (omit pill). */
function startsInLabel(startISO: string): string | null {
  const start = new Date(startISO).getTime();
  const now = Date.now();
  if (start <= now) return null;
  const days = Math.ceil((start - now) / 86400000);
  if (days <= 0) return 'Starts today';
  if (days === 1) return 'Starts tomorrow';
  return `Starts in ${days} days`;
}

/** Google Maps deep link — prefer geo coords, else the address string. */
function mapsUrl(loc: EventDoc['location']): string | null {
  const geo = loc.geo?.coordinates;
  if (geo && geo.length === 2) {
    // GeoJSON stores [lng, lat]; maps query wants "lat,lng".
    return `https://maps.google.com/?q=${geo[1]},${geo[0]}`;
  }
  if (loc.address) {
    return `https://maps.google.com/?q=${encodeURIComponent(loc.address)}`;
  }
  if (loc.venueName) {
    return `https://maps.google.com/?q=${encodeURIComponent(loc.venueName)}`;
  }
  return null;
}

/* Small reusable mono section header (matches .section-head) */
const SectionHead = ({ title, aside }: { title: string; aside?: string }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
    <Text style={{ fontFamily: OUTFIT_BOLD, fontSize: 11, color: TEXT_1, letterSpacing: 1.7, textTransform: 'uppercase' }}>
      {title}
    </Text>
    {aside ? (
      <Text style={{ fontFamily: MONO, fontSize: 10, color: TEXT_3, letterSpacing: 0.6 }}>{aside}</Text>
    ) : null}
  </View>
);

export default function EventDetailV2Body({ event, organizerEventCount }: Props) {
  const startDate = new Date(event.startsAt);
  const organizer = typeof event.organizerId === 'object' ? event.organizerId : null;
  const agenda = Array.isArray(event.agenda) ? event.agenda : [];
  const loc = event.location;
  const locCity = (loc as any)?.city as string | undefined;

  // Price
  const isPaid = event.registrationMode === 'paid_ticket';
  const priceAmount = (event as any).pricing?.amount ?? 0;
  const priceLabel = isPaid ? formatRupees(priceAmount) : 'Free';
  const priceAux = isPaid ? 'Ticketed entry' : 'Open · free entry';

  // When cell
  const durLabel = event.durationKind ? durationKindLabel[event.durationKind] : null;
  const hours = diffHours(event.startsAt, event.endsAt);
  const whenSub = hours
    ? `${startDate.toLocaleTimeString('en-IN', TIME_FMT)} · ${hours} h`
    : durLabel
      ? `${startDate.toLocaleTimeString('en-IN', TIME_FMT)} · ${durLabel}`
      : startDate.toLocaleTimeString('en-IN', TIME_FMT);

  // Where cell
  const whereVal = loc?.kind === 'online'
    ? 'Online'
    : (loc?.venueName || (loc?.address ? loc.address.split(',')[0].trim() : (locCity || 'TBA')));
  const whereSub = loc?.kind === 'online'
    ? (loc.onlinePlatform || 'Link on register')
    : (locCity || (loc?.address ? '' : 'Venue TBA'));

  // Spots + capacity
  const total = event.capacity?.total ?? 0;
  const registered = event.capacity?.registeredCount ?? 0;
  const spotsLeft = computeSlotsLeft(total, registered);
  const fillPct = total > 0 ? Math.min(100, (registered / total) * 100) : 0;

  const startsPill = startsInLabel(event.startsAt);
  const mapLink = loc ? mapsUrl(loc) : null;

  return (
    <View style={{ backgroundColor: BG_1 }}>

      {/* ═══ TOPIC TAG ROW ═══ */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        paddingHorizontal: PAD,
        paddingTop: 14,
      }}>
        {(event.topicTags ?? []).map((tag, i) => {
          const purple = i % 2 === 1;
          return (
            <View
              key={`topic-${i}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 9,
                paddingVertical: 4,
                borderRadius: 999,
                backgroundColor: purple ? PURPLE_SOFT : ORANGE_SOFT,
                borderWidth: 1,
                borderColor: purple ? PURPLE_BORDER : ORANGE_BORDER,
              }}>
              <Text style={{
                fontFamily: OUTFIT_SEMI,
                fontSize: 11,
                color: purple ? PURPLE_TEXT : ORANGE,
              }}>
                {tag}
              </Text>
            </View>
          );
        })}

        {startsPill ? (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingHorizontal: 9,
            paddingVertical: 4,
            borderRadius: 999,
            backgroundColor: AMBER_SOFT,
            borderWidth: 1,
            borderColor: AMBER_BORDER,
          }}>
            <Clock size={11} color={AMBER} strokeWidth={2} />
            <Text style={{ fontFamily: OUTFIT_SEMI, fontSize: 11, color: AMBER }}>{startsPill}</Text>
          </View>
        ) : null}

        {registered > 0 ? (
          <View style={{
            paddingHorizontal: 9,
            paddingVertical: 4,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: HAIRLINE_2,
          }}>
            <Text style={{ fontFamily: OUTFIT_SEMI, fontSize: 11, color: TEXT_2 }}>{registered} going</Text>
          </View>
        ) : null}
      </View>

      {/* ═══ TITLE + TAGLINE ═══ */}
      <View style={{ paddingHorizontal: PAD, paddingTop: 14, paddingBottom: 16 }}>
        <Text style={{
          fontFamily: SERIF,
          fontSize: 28,
          lineHeight: 32,
          letterSpacing: -0.4,
          color: TEXT_0,
          marginBottom: 6,
        }}>
          {event.title}
        </Text>
        {event.tagline ? (
          <Text style={{ fontFamily: OUTFIT, fontSize: 13.5, lineHeight: 20, color: TEXT_2 }}>
            {event.tagline}
          </Text>
        ) : null}
      </View>

      {/* ═══ ORGANIZER CARD ═══ */}
      {organizer ? (
        <View style={{
          marginHorizontal: PAD,
          padding: 14,
          backgroundColor: BG_2,
          borderWidth: 1,
          borderColor: HAIRLINE,
          borderRadius: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}>
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: PURPLE,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{ fontFamily: OUTFIT_BOLD, fontSize: 16, color: '#FFFFFF', letterSpacing: -0.2 }}>
              {initials(organizer.name)}
            </Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <Text style={{ fontFamily: OUTFIT_SEMI, fontSize: 14.5, color: TEXT_0, letterSpacing: -0.1 }} numberOfLines={1}>
                {organizer.name}
              </Text>
              {organizer.verified ? <BadgeCheck size={14} color={GREEN} fill={GREEN} strokeWidth={0} /> : null}
            </View>
            {typeof organizerEventCount === 'number' && organizerEventCount > 0 ? (
              <Text style={{ fontFamily: MONO, fontSize: 10.5, color: TEXT_2, letterSpacing: 0.1 }} numberOfLines={1}>
                {organizerEventCount} events hosted
              </Text>
            ) : null}
          </View>
          <ChevronRight size={16} color={TEXT_2} strokeWidth={1.6} />
        </View>
      ) : null}

      {/* ═══ AT-A-GLANCE ═══ */}
      <View style={{ paddingHorizontal: PAD, paddingTop: 20 }}>

        {/* Price hero */}
        <View style={{ marginBottom: 18 }}>
          <Text style={{
            fontFamily: MONO_BOLD,
            fontSize: 9.5,
            letterSpacing: 2.1,
            textTransform: 'uppercase',
            color: TEXT_3,
            marginBottom: 6,
          }}>
            Entry
          </Text>
          <Text style={{
            fontFamily: SERIF,
            fontSize: 44,
            lineHeight: 44,
            letterSpacing: -1.1,
            color: ORANGE,
            marginBottom: 6,
          }}>
            {priceLabel}
          </Text>
          <Text style={{ fontFamily: OUTFIT, fontSize: 13, color: TEXT_2, letterSpacing: -0.05 }}>
            {priceAux}
          </Text>
        </View>

        {/* Stat line — When / Where / Spots */}
        <View style={{ position: 'relative' }}>
          {/* orange corner ticks */}
          <View style={{ position: 'absolute', top: -1, left: 0, width: 6, height: 1, backgroundColor: ORANGE }} />
          <View style={{ position: 'absolute', bottom: -1, right: 0, width: 6, height: 1, backgroundColor: ORANGE }} />
          <View style={{
            flexDirection: 'row',
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: HAIRLINE_2,
            paddingVertical: 12,
          }}>
            <StatCell
              lab="When"
              val={startDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
              sub={whenSub}
              first
            />
            <StatCell
              lab="Where"
              val={whereVal}
              sub={whereSub}
            />
            <StatCell
              lab="Spots"
              val={total > 0 ? `${total} total` : '—'}
              sub={isPaid ? 'reserved' : 'first come'}
              last
            />
          </View>
        </View>

        {/* Capacity bar card */}
        {total > 0 ? (
          <View style={{
            marginTop: 14,
            paddingHorizontal: 14,
            paddingVertical: 12,
            backgroundColor: BG_2,
            borderWidth: 1,
            borderColor: HAIRLINE,
            borderRadius: 12,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <Text style={{ fontFamily: OUTFIT_MED, fontSize: 12.5, color: TEXT_1 }}>
                <Text style={{ fontFamily: MONO_BOLD, color: ORANGE }}>{registered} / {total}</Text> registered
              </Text>
              <Text style={{ fontFamily: MONO, fontSize: 10, color: TEXT_3, letterSpacing: 0.6 }}>
                {spotsLeft === 0 ? 'FULL' : `${spotsLeft} SPOTS LEFT`}
              </Text>
            </View>
            <View style={{ height: 4, backgroundColor: BG_3, borderRadius: 2, overflow: 'hidden' }}>
              <LinearGradient
                colors={[ORANGE, '#FF8E5C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ width: `${fillPct}%`, height: '100%', borderRadius: 2 }}
              />
            </View>
          </View>
        ) : null}
      </View>

      {/* ═══ TRUST STRIP ═══ */}
      {organizer?.verified ? (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: PAD,
          paddingTop: 14,
          paddingBottom: 4,
          flexWrap: 'wrap',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <ShieldCheck size={12} color={GREEN} strokeWidth={2} />
            <Text style={{ fontFamily: MONO, fontSize: 11, color: TEXT_2, letterSpacing: 0.2 }}>Verified</Text>
          </View>
        </View>
      ) : null}

      {/* ═══ ABOUT ═══ */}
      {event.about ? (
        <View style={{ paddingHorizontal: PAD, paddingTop: 24, paddingBottom: 22, borderTopWidth: 1, borderColor: HAIRLINE, marginTop: 18 }}>
          <SectionHead title="About" />
          <Text style={{ fontFamily: OUTFIT, fontSize: 14.5, lineHeight: 24, color: TEXT_1, letterSpacing: 0.02 }}>
            {event.about}
          </Text>
        </View>
      ) : null}

      {/* ═══ WHAT TO EXPECT + SKILLS ═══ */}
      {event.whatToExpect || (event.skills && event.skills.length) ? (
        <View style={{ paddingHorizontal: PAD, paddingTop: 24, paddingBottom: 22, borderTopWidth: 1, borderColor: HAIRLINE, marginTop: 18 }}>
          <SectionHead title="What to expect" />

          {event.whatToExpect ? (
            <View style={{ gap: 10 }}>
              {event.whatToExpect
                .split(/\r?\n/)
                .map((l) => l.replace(/^\s*[-•*]\s*/, '').trim())
                .filter(Boolean)
                .map((line, i) => (
                  <View key={`exp-${i}`} style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: ORANGE, marginTop: 8 }} />
                    <Text style={{ fontFamily: OUTFIT, fontSize: 14, lineHeight: 21, color: TEXT_1, flex: 1, letterSpacing: 0.02 }}>
                      {line}
                    </Text>
                  </View>
                ))}
            </View>
          ) : null}

          {event.skills && event.skills.length ? (
            <View style={{ marginTop: event.whatToExpect ? 18 : 0 }}>
              <Text style={{
                fontFamily: MONO_BOLD,
                fontSize: 10,
                letterSpacing: 1.8,
                textTransform: 'uppercase',
                color: TEXT_3,
                marginBottom: 8,
              }}>
                Skills we'd like to see
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {event.skills.map((s, i) => (
                  <View
                    key={`skill-${i}`}
                    style={{
                      paddingHorizontal: 11,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: PURPLE_SOFT,
                      borderWidth: 1,
                      borderColor: PURPLE_BORDER,
                    }}>
                    <Text style={{ fontFamily: OUTFIT_MED, fontSize: 12, color: PURPLE_TEXT }}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* ═══ GALLERY (organizer photos · scroll rail; self-gates at <2 photos) ═══ */}
      <EventGallery event={event} />

      {/* ═══ SCHEDULE ═══ */}
      {agenda.length ? (
        <View style={{ paddingHorizontal: PAD, paddingTop: 24, paddingBottom: 22, borderTopWidth: 1, borderColor: HAIRLINE, marginTop: 18 }}>
          <SectionHead
            title="Schedule"
            aside={`${agenda.length} ${agenda.length === 1 ? 'day' : 'days'}`}
          />
          <View>
            {agenda.map((item, i) => {
              const d = new Date(item.startsAt || item.date);
              const isLast = i === agenda.length - 1;
              const dayNum = i + 1;
              return (
                <View
                  key={`agenda-${i}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 14,
                    paddingVertical: 12,
                    borderBottomWidth: isLast ? 0 : 1,
                    borderColor: HAIRLINE,
                  }}>
                  <View style={{ width: 80 }}>
                    <Text style={{
                      fontFamily: MONO_BOLD,
                      fontSize: 11,
                      color: ORANGE,
                      letterSpacing: 0.6,
                      lineHeight: 15,
                    }}>
                      DAY {dayNum}
                      {'\n'}
                      {item.startsAt ? d.toLocaleTimeString('en-IN', TIME_FMT) : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontFamily: OUTFIT_MED, fontSize: 14, color: TEXT_0, letterSpacing: -0.05 }}>
                      {item.title}
                    </Text>
                    {item.subtitle ? (
                      <Text style={{ fontFamily: OUTFIT, fontSize: 12, color: TEXT_2, marginTop: 2, lineHeight: 17 }}>
                        {item.subtitle}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* ═══ VENUE ═══ */}
      {loc ? (
        <View style={{ paddingHorizontal: PAD, paddingTop: 24, paddingBottom: 22, borderTopWidth: 1, borderColor: HAIRLINE, marginTop: 18 }}>
          <SectionHead title="Venue" />
          <View style={{
            borderRadius: 14,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: HAIRLINE,
            backgroundColor: BG_2,
          }}>
            {/* Stylized map tile — gradient canvas + orange pin (NOT a real map) */}
            <View style={{ height: 140, overflow: 'hidden' }}>
              <LinearGradient
                colors={['#15131a', '#1d1a26']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              {/* faint "street" hairlines to evoke a map grid */}
              <View style={{ position: 'absolute', top: 44, left: -20, right: -20, height: 1, backgroundColor: 'rgba(255,255,255,0.05)', transform: [{ rotate: '-24deg' }] }} />
              <View style={{ position: 'absolute', top: 96, left: -20, right: -20, height: 1, backgroundColor: 'rgba(255,255,255,0.04)', transform: [{ rotate: '18deg' }] }} />
              <View style={{ position: 'absolute', top: 118, left: -20, right: -20, height: 1, backgroundColor: 'rgba(255,255,255,0.03)' }} />
              {/* pin */}
              <View style={{ position: 'absolute', top: 70, left: 0, right: 0, alignItems: 'center' }}>
                <View style={{
                  width: 28,
                  height: 28,
                  backgroundColor: ORANGE,
                  borderTopLeftRadius: 14,
                  borderTopRightRadius: 14,
                  borderBottomRightRadius: 14,
                  borderBottomLeftRadius: 0,
                  transform: [{ rotate: '-45deg' }],
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: ORANGE,
                  shadowOpacity: 0.35,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 4 },
                }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: BG_0, transform: [{ rotate: '45deg' }] }} />
                </View>
              </View>
            </View>

            {/* Venue info + Open Maps */}
            <View style={{
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: OUTFIT_SEMI, fontSize: 14, color: TEXT_0, letterSpacing: -0.05, marginBottom: 2 }} numberOfLines={2}>
                  {loc.kind === 'online' ? 'Online event' : (loc.venueName || 'Venue TBA')}
                </Text>
                <Text style={{ fontFamily: OUTFIT, fontSize: 12, color: TEXT_2, lineHeight: 17 }}>
                  {loc.kind === 'online'
                    ? (loc.onlinePlatform || 'Link shared after registration')
                    : ([loc.address, loc.landmark].filter(Boolean).join(' · ') || 'Address shared on register')}
                </Text>
              </View>
              {loc.kind === 'in_person' && mapLink ? (
                <Pressable
                  onPress={() => Linking.openURL(mapLink)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderWidth: 1,
                    borderColor: ORANGE_CTA_BORDER,
                    borderRadius: 8,
                  }}>
                  <MapPin size={12} color={ORANGE} strokeWidth={2} />
                  <Text style={{ fontFamily: OUTFIT_SEMI, fontSize: 11.5, color: ORANGE }}>Open Maps</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

/* ───────────────────────────────────────────────
   Stat cell (When / Where / Spots)
   ─────────────────────────────────────────────── */
function StatCell({ lab, val, sub, first, last }: { lab: string; val: string; sub?: string; first?: boolean; last?: boolean }) {
  return (
    <View style={{
      flex: 1,
      paddingLeft: first ? 0 : 14,
      paddingRight: last ? 0 : 14,
      borderRightWidth: last ? 0 : 1,
      borderColor: HAIRLINE,
    }}>
      <Text style={{
        fontFamily: MONO,
        fontSize: 9,
        letterSpacing: 1.8,
        textTransform: 'uppercase',
        color: TEXT_3,
        marginBottom: 4,
      }}>
        {lab}
      </Text>
      <Text style={{ fontFamily: OUTFIT_SEMI, fontSize: 14, color: TEXT_0, letterSpacing: -0.1, lineHeight: 16 }} numberOfLines={1}>
        {val}
      </Text>
      {sub ? (
        <Text style={{ fontFamily: MONO, fontSize: 9.5, color: TEXT_2, letterSpacing: 0.4, lineHeight: 13, marginTop: 4 }} numberOfLines={1}>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}
