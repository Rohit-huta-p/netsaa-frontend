import { View, Text, Pressable, Linking } from 'react-native';
import type { EventDoc } from '@/services/eventService';
import { durationKindLabel } from '@/lib/eventTokens';

interface Props {
  event: EventDoc;
}

// Inbox palette
const BG = '#09090b';
const SURFACE = 'rgba(255,255,255,0.04)';
const HAIRLINE = 'rgba(255,255,255,0.07)';
const HAIRLINE_2 = 'rgba(255,255,255,0.10)';
const TEXT_0 = '#f4f4f5';
const TEXT_1 = '#a1a1aa';
const TEXT_2 = '#71717a';
const TEXT_3 = '#52525b';
const ORANGE = '#FF6B35';
const ORANGE_SOFT = 'rgba(255,107,53,0.18)';
const ORANGE_BORDER = 'rgba(255,107,53,0.32)';
const BLUE = '#5B8DEF';

const PAD = 20;

const TIME_FMT: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };

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

const SectionLabel = ({ children, trail }: { children: string; trail?: string }) => (
  <View style={{
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  }}>
    <Text className="font-mono" style={{
      color: TEXT_3,
      fontSize: 11,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      fontWeight: '600',
    }}>{children}</Text>
    {trail ? (
      <Text className="font-mono" style={{
        color: TEXT_3,
        fontSize: 11,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        fontWeight: '600',
      }}>{trail}</Text>
    ) : null}
  </View>
);

export default function EventDetailSections({ event }: Props) {
  const startDate = new Date(event.startsAt);
  const organizer = typeof event.organizerId === 'object' ? event.organizerId : null;
  const agenda = Array.isArray(event.agenda) ? event.agenda : [];

  const hours = diffHours(event.startsAt, event.endsAt);
  const totalHours = hours ?? (event.durationKind === 'multi' && agenda.length
    ? agenda.reduce((s, a) => s + (a.durationMinutes || 0), 0) / 60
    : null);

  const levelLabel = 'Open'; // EventDoc doesn't carry skillLevel — placeholder

  return (
    <View style={{ backgroundColor: BG }}>

      {/* Eyebrow row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: PAD, marginTop: 4, marginBottom: 12 }}>
        <View style={{
          backgroundColor: ORANGE_SOFT,
          paddingHorizontal: 9,
          paddingVertical: 4,
          borderRadius: 7,
        }}>
          <Text className="font-outfit" style={{
            color: ORANGE,
            fontSize: 10.5,
            fontWeight: '600',
            textTransform: 'capitalize',
          }}>
            {(event as any).eventType || 'Event'}
          </Text>
        </View>
        <Text className="font-outfit" style={{ color: TEXT_2, fontSize: 11.5, fontWeight: '500' }}>
          {fmtRange(event.startsAt, event.endsAt)}
          {(event as any).location?.city ? ` · ${(event as any).location.city}` : ''}
        </Text>
      </View>

      {/* Title + tagline */}
      <View style={{ paddingHorizontal: PAD, marginBottom: 14 }}>
        <Text className="font-serif" style={{
          color: TEXT_0,
          fontSize: 32,
          lineHeight: 34,
          letterSpacing: -0.5,
          marginBottom: 12,
        }}>
          {event.title}
        </Text>
        {event.tagline ? (
          <Text className="font-serif" style={{
            color: TEXT_1,
            fontSize: 16,
            lineHeight: 23,
            fontStyle: 'italic',
            maxWidth: 340,
          }}>
            {event.tagline}
          </Text>
        ) : null}
      </View>

      {/* 3-column meta row */}
      <View style={{
        flexDirection: 'row',
        paddingVertical: 18,
        paddingHorizontal: PAD,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: HAIRLINE,
        marginTop: 8,
      }}>
        <MetaCell
          lbl="When"
          val={startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          sub={startDate.toLocaleDateString('en-IN', { weekday: 'short' }) + ' · ' + startDate.toLocaleTimeString('en-IN', TIME_FMT)}
          first
        />
        <MetaCell
          lbl="Hours"
          val={totalHours ? `${totalHours} h` : (event.durationKind ? durationKindLabel[event.durationKind] : '—')}
          sub={agenda.length ? `${(totalHours && agenda.length ? Math.round(totalHours / agenda.length * 10) / 10 : 0)}h × ${agenda.length}` : 'total'}
        />
        <MetaCell
          lbl="Level"
          val={levelLabel}
          sub="All welcome"
        />
      </View>

      {/* Host row */}
      {organizer ? (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: PAD,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderColor: HAIRLINE,
        }}>
          <View style={{
            width: 46, height: 46, borderRadius: 23,
            backgroundColor: ORANGE_SOFT,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text className="font-outfit" style={{ color: ORANGE, fontWeight: '600', fontSize: 15 }}>
              {initials(organizer.name)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text className="font-outfit" style={{ color: TEXT_0, fontWeight: '600', fontSize: 14.5 }} numberOfLines={1}>
              {organizer.name}
              {organizer.verified ? <Text style={{ color: BLUE, fontSize: 11 }}>  ✓</Text> : null}
            </Text>
            <Text className="font-outfit" style={{ color: TEXT_1, fontSize: 12, marginTop: 3 }} numberOfLines={1}>
              Hosted by · {organizer.role || 'Organizer'}
            </Text>
          </View>
        </View>
      ) : null}

      {/* About */}
      {event.about ? (
        <View style={{
          paddingHorizontal: PAD,
          paddingVertical: 24,
          borderBottomWidth: 1,
          borderColor: HAIRLINE,
        }}>
          <SectionLabel>About</SectionLabel>
          <Text className="font-outfit" style={{
            color: TEXT_1,
            fontSize: 14.5,
            lineHeight: 25,
            fontWeight: '300',
          }}>
            {event.about}
          </Text>
        </View>
      ) : null}

      {/* What to expect */}
      {event.whatToExpect ? (
        <View style={{
          paddingHorizontal: PAD,
          paddingVertical: 24,
          borderBottomWidth: 1,
          borderColor: HAIRLINE,
        }}>
          <SectionLabel>What to expect</SectionLabel>
          <Text className="font-outfit" style={{
            color: TEXT_1,
            fontSize: 14.5,
            lineHeight: 25,
            fontWeight: '300',
          }}>
            {event.whatToExpect}
          </Text>
        </View>
      ) : null}

      {/* Where */}
      {event.location ? (
        <View style={{
          paddingHorizontal: PAD,
          paddingVertical: 24,
          borderBottomWidth: 1,
          borderColor: HAIRLINE,
        }}>
          <SectionLabel>Where</SectionLabel>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 14 }}>
            <View style={{ flex: 1 }}>
              {event.location.kind === 'online' ? (
                <>
                  <Text className="font-serif" style={{ color: TEXT_0, fontSize: 19, lineHeight: 22 }}>
                    Online
                  </Text>
                  <Text className="font-outfit" style={{ color: TEXT_1, fontSize: 12.5, marginTop: 4 }}>
                    {event.location.onlinePlatform || 'Platform shared after registration'}
                  </Text>
                </>
              ) : (
                <>
                  <Text className="font-serif" style={{ color: TEXT_0, fontSize: 19, lineHeight: 22 }}>
                    {event.location.venueName || 'Venue TBA'}
                  </Text>
                  <Text className="font-outfit" style={{ color: TEXT_1, fontSize: 12.5, marginTop: 4 }}>
                    {event.location.address}
                    {event.location.landmark ? ` · ${event.location.landmark}` : ''}
                  </Text>
                </>
              )}
            </View>
            {event.location.kind === 'in_person' && event.location.address ? (
              <Pressable
                onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(event.location.address!)}`)}
                style={{
                  borderWidth: 1,
                  borderColor: ORANGE_BORDER,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}>
                <Text className="font-outfit" style={{ color: ORANGE, fontSize: 12.5, fontWeight: '600' }}>
                  Map ↗
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* Day by day */}
      {agenda.length ? (
        <View>
          <View style={{
            paddingHorizontal: PAD,
            paddingTop: 24,
            paddingBottom: 8,
            borderBottomWidth: 1,
            borderColor: HAIRLINE,
          }}>
            <SectionLabel trail={`${agenda.length} ${agenda.length === 1 ? 'day' : 'days'}`}>
              Day by day
            </SectionLabel>
          </View>
          {agenda.map((item, i) => {
            const d = new Date(item.startsAt || item.date);
            return (
              <View
                key={`agenda-${i}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 14,
                  paddingHorizontal: PAD,
                  paddingVertical: 13,
                  borderBottomWidth: 1,
                  borderColor: HAIRLINE,
                }}>
                <View style={{ width: 36 }}>
                  <Text className="font-serif" style={{ color: TEXT_0, fontSize: 18, lineHeight: 18 }}>
                    {d.toLocaleDateString('en-IN', { day: 'numeric' })}
                  </Text>
                  <Text className="font-mono" style={{
                    color: TEXT_3, fontSize: 9.5, marginTop: 4,
                    letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: '600',
                  }}>
                    {d.toLocaleDateString('en-IN', { weekday: 'short' })}
                  </Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text className="font-outfit" style={{
                    color: TEXT_0, fontWeight: '600', fontSize: 13.5,
                  }}>
                    {item.title}
                  </Text>
                  {item.subtitle ? (
                    <Text className="font-outfit" style={{
                      color: TEXT_1, fontSize: 11.5, marginTop: 3, lineHeight: 17,
                    }}>
                      {item.subtitle}
                    </Text>
                  ) : null}
                </View>
                {item.startsAt ? (
                  <Text className="font-outfit" style={{ color: TEXT_3, fontSize: 10.5, fontWeight: '500' }}>
                    {d.toLocaleTimeString('en-IN', TIME_FMT)}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}

      {/* Skills */}
      {event.skills?.length ? (
        <View style={{
          paddingHorizontal: PAD,
          paddingVertical: 24,
          borderBottomWidth: 1,
          borderColor: HAIRLINE,
        }}>
          <SectionLabel>Bring · who's invited</SectionLabel>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {event.skills.map((s) => (
              <View key={s} style={{
                paddingHorizontal: 10, paddingVertical: 5,
                backgroundColor: SURFACE,
                borderWidth: 1, borderColor: HAIRLINE_2,
                borderRadius: 7,
              }}>
                <Text className="font-outfit" style={{ color: TEXT_1, fontSize: 11.5, fontWeight: '500' }}>
                  {s}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* Topic tags (rendered last as supporting context) */}
      {event.topicTags?.length ? (
        <View style={{
          paddingHorizontal: PAD,
          paddingVertical: 24,
          borderBottomWidth: 1,
          borderColor: HAIRLINE,
        }}>
          <SectionLabel>Topics</SectionLabel>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {event.topicTags.map((t) => (
              <View key={t} style={{
                paddingHorizontal: 10, paddingVertical: 5,
                backgroundColor: SURFACE,
                borderWidth: 1, borderColor: HAIRLINE_2,
                borderRadius: 7,
              }}>
                <Text className="font-outfit" style={{ color: TEXT_1, fontSize: 11.5, fontWeight: '500' }}>
                  {t}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function MetaCell({ lbl, val, sub, first }: { lbl: string; val: string; sub: string; first?: boolean }) {
  return (
    <View style={{
      flex: 1,
      paddingLeft: first ? 0 : 14,
      borderLeftWidth: first ? 0 : 1,
      borderColor: HAIRLINE,
    }}>
      <Text className="font-mono" style={{
        color: TEXT_3, fontSize: 10, marginBottom: 4,
        letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: '600',
      }}>
        {lbl}
      </Text>
      <Text className="font-serif" style={{ color: TEXT_0, fontSize: 16, lineHeight: 18 }} numberOfLines={1}>
        {val}
      </Text>
      <Text className="font-outfit" style={{ color: TEXT_2, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
        {sub}
      </Text>
    </View>
  );
}
