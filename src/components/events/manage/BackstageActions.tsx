/**
 * BackstageActions — the "Backstage" block on the manage overview.
 * (event-manage-living-poster.html · Manage + Day-of frames · `.lab` + `.act` rows)
 *
 * De-carded flush rows under a mono "Backstage" label:
 *   View roster        → /events/:id/manage/roster
 *   Send announcement  → onAnnounce() (the composer owns AnnouncementComposer)
 *   Check-in scanner   → pre-day: dimmed, locked behind a mono date pill;
 *                        day-of: LIVE ("QR scan · open now"), taps to the scanner.
 *                        Deliberately duplicated with the big day-of CTA — the
 *                        scanner must be reachable from Backstage on the day too.
 *
 * The two door CTAs (Open check-in scanner · Add a walk-up) live in the
 * separately exported <DayOfCtas> — the overview composer renders them at the
 * TOP of the sheet on day-of, not inside this block. Both land on
 * /events/:id/manage/check-in (the walk-up sheet lives on the scanner screen);
 * the walk-up CTA only shows when the event opted into walk-ups.
 *
 * No Cancel here — the overview composer places Cancel separately, at the foot.
 */
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Users, Megaphone, Lock, QrCode, Plus, ChevronRight } from 'lucide-react-native';
import type { EventDoc } from '@/services/eventService';

// Inbox-rhythm palette (DOCS/04-design/mockups/INBOX_RHYTHM_DESIGN_SYSTEM.md)
const BG='#060509', SURFACE='rgba(255,255,255,0.04)', HAIR='rgba(255,255,255,0.07)', HAIR2='rgba(255,255,255,0.10)';
const T0='#F3EFE8', T1='#A1A1AA', T2='#71717a', T3='#52525b', T4='#3f3f46', INK='#1A0D06';
const ORANGE='#FF6B35', ORANGE_SOFT='rgba(255,107,53,0.16)', ORANGE_LINE='rgba(255,107,53,0.34)';
const GREEN='#22C55E', BLUE='#5B8DEF', PURPLE='#8B5CF6', YELLOW='#EAB308', RED='#EF4444';
const DSC_CARD='#15131C', DSC_BODY='#D5D0C8', DSC_MUT='#6B6878', DSC_SEND='#F97316';

// Soft icon tints — same 0.16 alpha as ORANGE_SOFT
const BLUE_SOFT = 'rgba(91,141,239,0.16)';
const PURPLE_SOFT = 'rgba(139,92,246,0.16)';
const GREEN_SOFT = 'rgba(34,197,94,0.16)';

/** "Mar 14" — the locked check-in row's date pill. */
function startDateLabel(startsAt?: string): string {
  if (!startsAt) return 'TBD';
  const d = new Date(startsAt);
  if (Number.isNaN(d.getTime())) return 'TBD';
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

interface BackstageActionsProps {
  event: EventDoc;
  dayOf: boolean;
  onAnnounce(): void;
}

export default function BackstageActions({ event, dayOf, onAnnounce }: BackstageActionsProps) {
  const router = useRouter();

  const registered = event.capacity?.registeredCount ?? 0;
  const waitlist = event.waitlistCount ?? 0;

  const openCheckIn = () => router.push(`/events/${event._id}/manage/check-in`);

  return (
    <View>
      <Text style={styles.lab}>Backstage</Text>

      <ActionRow
        first
        icon={<Users size={16} color={BLUE} />}
        tint={BLUE_SOFT}
        title="View roster"
        sub={`${registered} confirmed · ${waitlist} waitlist`}
        onPress={() => router.push(`/events/${event._id}/manage/roster`)}
      />

      <ActionRow
        icon={<Megaphone size={16} color={PURPLE} />}
        tint={PURPLE_SOFT}
        title="Send announcement"
        sub="push · email · SMS"
        onPress={onAnnounce}
      />

      {dayOf ? (
        /* Day-of — the scanner row goes LIVE (deliberately duplicated with the
           big CTA at the sheet top; the day's key tool stays reachable here) */
        <ActionRow
          icon={<QrCode size={16} color={GREEN} />}
          tint={GREEN_SOFT}
          title="Check-in scanner"
          sub="QR scan · open now"
          onPress={openCheckIn}
        />
      ) : (
        /* Pre-day — dimmed, locked behind the mono date pill */
        <View style={styles.row}>
          <View style={[styles.ci, { backgroundColor: GREEN_SOFT }]}>
            <Lock size={16} color={GREEN} />
          </View>
          <View style={styles.bd}>
            <Text style={[styles.t, { color: T2 }]}>Check-in scanner</Text>
            <Text style={styles.s}>unlocks on the day</Text>
          </View>
          <Text style={styles.lockPill}>{startDateLabel(event.startsAt)}</Text>
        </View>
      )}
    </View>
  );
}

/**
 * DayOfCtas — the two door actions for the day of the event.
 * (event-manage-living-poster.html · Day-of frame `.bigcta`/`.subcta`)
 *
 * Rendered by the overview composer at the TOP of the sheet (above RoomStats)
 * when dayOf — not inside the Backstage block. Both land on the scanner
 * screen; "Add a walk-up" only shows when the event allows walk-ups (matches
 * the walk-up feature's own gating).
 */
export function DayOfCtas({ event }: { event: EventDoc }) {
  const router = useRouter();

  const openCheckIn = () => router.push(`/events/${event._id}/manage/check-in`);

  return (
    <View>
      <Pressable
        onPress={openCheckIn}
        style={styles.bigCta}
        accessibilityRole="button"
        accessibilityLabel="Open check-in scanner"
      >
        <QrCode size={17} color={INK} />
        <Text style={styles.bigCtaText}>Open check-in scanner</Text>
      </Pressable>
      {event.walkupsAllowed === true ? (
        <Pressable
          onPress={openCheckIn}
          style={styles.subCta}
          accessibilityRole="button"
          accessibilityLabel="Add a walk-up"
        >
          <Plus size={15} color={ORANGE} />
          <Text style={styles.subCtaText}>Add a walk-up</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ActionRow({
  first,
  icon,
  tint,
  title,
  sub,
  onPress,
}: {
  first?: boolean;
  icon: React.ReactNode;
  tint: string;
  title: string;
  sub: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, first && { borderTopWidth: 0 }]}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${sub}`}
    >
      <View style={[styles.ci, { backgroundColor: tint }]}>{icon}</View>
      <View style={styles.bd}>
        <Text style={styles.t}>{title}</Text>
        <Text style={styles.s}>{sub}</Text>
      </View>
      <ChevronRight size={16} color={T3} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // .bigcta — 50px white bar, ink text
  bigCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 13,
    backgroundColor: T0,
    marginTop: 2,
  },
  bigCtaText: { fontFamily: 'Outfit-Bold', fontSize: 14, color: INK },
  // .subcta — 44px orange-soft bar
  subCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ORANGE_LINE,
    backgroundColor: ORANGE_SOFT,
    marginTop: 9,
  },
  subCtaText: { fontFamily: 'Outfit-Bold', fontSize: 12.5, color: ORANGE },
  // .lab — mono 9.5 · tracking .2em · uppercase · margin 24/12
  lab: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 9.5,
    letterSpacing: 1.9,
    textTransform: 'uppercase',
    color: T3,
    marginTop: 24,
    marginBottom: 12,
  },
  // .act — flush hairline rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: HAIR,
  },
  ci: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bd: { flex: 1, minWidth: 0 },
  t: { fontFamily: 'Outfit-Medium', fontSize: 13.5, color: T0 },
  s: { fontFamily: 'Outfit-Regular', fontSize: 10.5, color: T3, marginTop: 2 },
  // .lockpill — mono date chip on the locked row
  lockPill: {
    fontFamily: 'SpaceMono-Regular',
    fontSize: 8,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: T3,
    borderWidth: 1,
    borderColor: HAIR2,
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
});
