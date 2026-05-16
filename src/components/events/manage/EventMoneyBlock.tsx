/**
 * EventMoneyBlock — paid-event revenue summary.
 *
 * Renders only when registrationMode === 'paid_ticket'. Free RSVPs
 * skip this entirely.
 *
 * Shows:
 *   - Revenue gross (registered count × ticket price)
 *   - Revenue net (gross × (1 - platform fee), default 12% per PRD §3)
 *   - Refunds outstanding (TODO: pulls from refund queue once endpoint ships)
 *   - Payout status pill
 *
 * Currency math uses paise normalization heuristic (under 1000 = rupees,
 * over = paise). Refund-queue + payout-status data is stubbed at zero
 * until the corresponding endpoints land. The block stays useful even
 * with the stubs because gross + net populate from the event document
 * alone.
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { EventDoc } from '@/services/eventService';

const PLATFORM_FEE_PCT = 0.12; // PRD §3 — 12% platform cut on events (hirer-side).

function formatRupees(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return '₹0';
  // Format with Indian numbering (lakh/crore separators).
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 1)}L`;
  }
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

function readTicketAmountRupees(event: EventDoc): number {
  const pricing = (event as any).pricing;
  if (!pricing || typeof pricing.amount !== 'number') return 0;
  return pricing.amount < 1000 ? pricing.amount : Math.round(pricing.amount / 100);
}

interface Props {
  event: EventDoc;
  /** Future: hook return for outstanding refund total (paise or rupees, normalize). */
  refundsOutstandingRupees?: number;
  /** Future: hook return for payout status. */
  payoutStatus?: 'pending' | 'in_progress' | 'paid' | 'on_hold';
}

const PAYOUT_LABEL: Record<NonNullable<Props['payoutStatus']>, string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  paid: 'Paid',
  on_hold: 'On hold',
};

const PAYOUT_COLOR: Record<NonNullable<Props['payoutStatus']>, string> = {
  pending: '#6B6878',
  in_progress: '#F59E0B',
  paid: '#22C55E',
  on_hold: '#EF4444',
};

export default function EventMoneyBlock({
  event,
  refundsOutstandingRupees = 0,
  payoutStatus = 'pending',
}: Props) {
  if (event.registrationMode !== 'paid_ticket') return null;

  const { gross, net, ticketRupees } = useMemo(() => {
    const ticket = readTicketAmountRupees(event);
    const registered = event.capacity?.registeredCount ?? 0;
    const g = ticket * registered;
    return {
      gross: g,
      net: Math.round(g * (1 - PLATFORM_FEE_PCT)),
      ticketRupees: ticket,
    };
  }, [event]);

  const payoutText = PAYOUT_LABEL[payoutStatus];
  const payoutColor = PAYOUT_COLOR[payoutStatus];

  return (
    <View style={styles.container}>
      <View style={styles.headRow}>
        <Text style={styles.h3}>Money</Text>
        <Text style={styles.eyebrow}>₹{ticketRupees.toLocaleString('en-IN')} / seat</Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.tile}>
          <Text style={styles.tileLabel}>GROSS</Text>
          <Text style={styles.tileNum}>{formatRupees(gross)}</Text>
          <Text style={styles.tileSub}>{event.capacity?.registeredCount ?? 0} paid</Text>
        </View>

        <View style={styles.tile}>
          <Text style={styles.tileLabel}>NET (after fee)</Text>
          <Text style={styles.tileNum}>{formatRupees(net)}</Text>
          <Text style={styles.tileSub}>12% platform</Text>
        </View>

        <View style={styles.tile}>
          <Text style={styles.tileLabel}>REFUNDS</Text>
          <Text style={[styles.tileNum, refundsOutstandingRupees > 0 && styles.tileNumUrgent]}>
            {formatRupees(refundsOutstandingRupees)}
          </Text>
          <Text style={styles.tileSub}>{refundsOutstandingRupees > 0 ? 'outstanding' : 'none open'}</Text>
        </View>

        <View style={styles.tile}>
          <Text style={styles.tileLabel}>PAYOUT</Text>
          <View style={styles.payoutPillRow}>
            <View style={[styles.payoutDot, { backgroundColor: payoutColor }]} />
            <Text style={[styles.tileNumSmall, { color: payoutColor }]}>{payoutText}</Text>
          </View>
          <Text style={styles.tileSub}>via Razorpay Route</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#11111A',
    borderColor: 'rgba(243,239,232,0.09)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  h3: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 22,
    letterSpacing: -0.5,
    color: '#F3EFE8',
  },
  eyebrow: {
    fontFamily: 'SpaceMono-Regular',
    fontSize: 11,
    color: '#F59E0B',
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderColor: 'rgba(243,239,232,0.05)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  tileLabel: {
    fontSize: 9,
    letterSpacing: 1.4,
    fontFamily: 'Outfit-Bold',
    color: '#6B6878',
  },
  tileNum: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 22,
    letterSpacing: -0.5,
    color: '#F3EFE8',
  },
  tileNumSmall: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 14,
  },
  tileNumUrgent: { color: '#F59E0B' },
  tileSub: {
    fontFamily: 'Outfit-Regular',
    fontSize: 10,
    color: '#6B6878',
  },
  payoutPillRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  payoutDot: { width: 6, height: 6, borderRadius: 99 },
});
