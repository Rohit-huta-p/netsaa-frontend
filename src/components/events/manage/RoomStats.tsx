/**
 * RoomStats — the "Living Poster" centered room block for the manage overview.
 * (event-manage-living-poster.html · Manage + Day-of frames · `.lab.center` + `.stats` + `.payline`)
 *
 * De-carded, per the inbox-rhythm system: a centered mono label
 * ("The room · 6 to a full house"), a flush 3-up stats row separated by
 * vertical hairlines (Seats · Waitlist-or-CheckedIn · Earned), then one
 * centered mono payout line driven by `usePayoutAccount()`:
 *   verified            → "HDFC ••1234 · verified · payout ~2 days after"
 *   submitted/pending   → "verifying payouts…"
 *   not set up / failed → "Set up payouts to get paid →" (taps to /settings/payouts,
 *                         the screen that hosts PayoutStatusCard + PayoutSetupWizard)
 *
 * Honest data: the Day-of "Checked in" count isn't on EventDoc (check-ins live
 * in the registration/ticket collections), so it renders "—" rather than a
 * fabricated number. Earnings reuse OverviewStatsGrid's exact derivation.
 */
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import type { EventDoc } from '@/services/eventService';
import type { PayoutStatus } from '@/services/payoutService';
import { usePayoutAccount } from '@/hooks/usePayoutAccount';
import { formatRupees } from '@/lib/eventPricing';

// Inbox-rhythm palette (DOCS/designs/INBOX_RHYTHM_DESIGN_SYSTEM.md)
const BG='#060509', SURFACE='rgba(255,255,255,0.04)', HAIR='rgba(255,255,255,0.07)', HAIR2='rgba(255,255,255,0.10)';
const T0='#F3EFE8', T1='#A1A1AA', T2='#71717a', T3='#52525b', T4='#3f3f46', INK='#1A0D06';
const ORANGE='#FF6B35', ORANGE_SOFT='rgba(255,107,53,0.16)', ORANGE_LINE='rgba(255,107,53,0.34)';
const GREEN='#22C55E', BLUE='#5B8DEF', PURPLE='#8B5CF6', YELLOW='#EAB308', RED='#EF4444';
const DSC_CARD='#15131C', DSC_BODY='#D5D0C8', DSC_MUT='#6B6878', DSC_SEND='#F97316';

const NETSA_FEE = 0.005; // 0.5% — mirrors eventPricing (same as OverviewStatsGrid)

interface RoomStatsProps {
  event: EventDoc;
  dayOf: boolean;
}

export default function RoomStats({ event, dayOf }: RoomStatsProps) {
  const router = useRouter();
  const { data: payout, isLoading: payoutLoading, isError: payoutError } = usePayoutAccount();

  const total = event.capacity?.total ?? 0;
  const registered = event.capacity?.registeredCount ?? 0;
  const slotsLeft = Math.max(0, total - registered);
  const waitlist = event.waitlistCount ?? 0;

  // Earnings — OverviewStatsGrid's exact derivation: registered × ticket price,
  // minus the 0.5% NETSA fee, paid events only.
  const isPaid = event.registrationMode === 'paid_ticket';
  const ticketPrice = (event as any).pricing?.amount ?? (event as any).ticketPrice ?? 0;
  const organizerNet = isPaid ? Math.round(registered * ticketPrice * (1 - NETSA_FEE)) : 0;

  const roomLabel = `The room · ${slotsLeft > 0 ? `${slotsLeft} to a full house` : 'full house'}`;

  // Loading → no line yet (avoid a "set up payouts" flash); error/empty → not_started,
  // same treatment as PayoutStatusCard.
  const payoutStatus: PayoutStatus | null = payoutLoading
    ? null
    : payoutError || !payout
      ? 'not_started'
      : payout.status;

  return (
    <View>
      <Text style={styles.lab}>{roomLabel}</Text>

      {/* Flush 3-up stats — vertical hairlines between cells, no card */}
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.n} numberOfLines={1} adjustsFontSizeToFit>
            {registered}
            {total ? <Text style={styles.nSmall}>/{total}</Text> : null}
          </Text>
          <Text style={styles.k}>Seats</Text>
        </View>

        {dayOf ? (
          <View style={[styles.stat, styles.statDivided]}>
            {/* Checked-in count isn't on EventDoc — honest "—" until it is. */}
            <Text style={styles.n} numberOfLines={1}>—</Text>
            <Text style={styles.k}>Checked in</Text>
          </View>
        ) : (
          <View style={[styles.stat, styles.statDivided]}>
            <Text style={styles.n} numberOfLines={1}>{waitlist}</Text>
            <Text style={styles.k}>Waitlist</Text>
          </View>
        )}

        <View style={[styles.stat, styles.statDivided]}>
          <Text style={styles.n} numberOfLines={1} adjustsFontSizeToFit>
            {isPaid ? formatRupees(organizerNet) : 'Free'}
          </Text>
          <Text style={styles.k}>Earned</Text>
        </View>
      </View>

      {/* Payout line — one centered mono line, switched on payout status */}
      {payoutStatus === 'verified' ? (
        <Text style={styles.payline}>
          {payout?.bankName ?? 'Bank'} ••{payout?.bankLast4 ?? ''} ·{' '}
          <Text style={styles.paylineVerified}>verified</Text> · payout ~2 days after
        </Text>
      ) : payoutStatus === 'submitted' || payoutStatus === 'pending_kyc' ? (
        <Text style={[styles.payline, { color: YELLOW }]}>verifying payouts…</Text>
      ) : payoutStatus !== null ? (
        <Pressable
          onPress={() => router.push('/settings/payouts')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Set up payouts to get paid"
        >
          <Text style={[styles.payline, { color: ORANGE }]}>Set up payouts to get paid →</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // .lab.center — mono 9.5px · tracking .2em · uppercase · margin 24/12
  lab: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 9.5,
    letterSpacing: 1.9,
    textTransform: 'uppercase',
    color: T3,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  stats: { flexDirection: 'row' },
  stat: { flex: 1, alignItems: 'center' },
  statDivided: { borderLeftWidth: 1, borderLeftColor: HAIR },
  // .stat .n — serif 24 · small unit serif 13 in T3
  n: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 24,
    lineHeight: 26,
    color: T0,
  },
  nSmall: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 13,
    color: T3,
  },
  // .stat .k — mono 8 · tracking .12em · uppercase
  k: {
    fontFamily: 'SpaceMono-Regular',
    fontSize: 8,
    letterSpacing: 0.96,
    textTransform: 'uppercase',
    color: T3,
    marginTop: 6,
  },
  // .payline — mono 10 · centered · tracking .02em
  payline: {
    fontFamily: 'SpaceMono-Regular',
    fontSize: 10,
    letterSpacing: 0.2,
    color: T3,
    textAlign: 'center',
    marginTop: 14,
  },
  paylineVerified: {
    fontFamily: 'SpaceMono-Bold',
    color: GREEN,
  },
});
