/**
 * EventMoneyBlock — paid-event revenue summary.
 *
 * Renders only when registrationMode === 'paid_ticket'. Free RSVPs
 * skip this entirely.
 *
 * Shows (per RAZORPAY_PRICING_UX.md Tier 2):
 *   - GROSS         — registered count × ticket price (organizer-earned subtotal)
 *   - NETSA FEE     — gross × 0.5% (platform cut, taken via Razorpay split)
 *   - NET           — gross − NETSA fee (settles to organizer's bank)
 *   - PAYOUT pill   — Razorpay Route settlement state (Pending / In progress / Paid)
 *
 * Service fee (2.36% paid by customer on top, covers Razorpay MDR) is NOT
 * shown here because the organizer never sees it — it flows from customer to
 * gateway, never touching the organizer's settlement. Customer-facing
 * itemization lives in RegistrationReceiptCard + EventRegisterSheetV2.
 *
 * Pricing constants imported from `src/lib/eventPricing.ts`, which mirrors
 * `events-service/.env`. Update both if the platform fee changes.
 *
 * Refund-tile was removed pending the refunds endpoint (Plan 8 follow-up).
 * Payout status is still stubbed; wires up when Razorpay Route settlement
 * webhooks ship.
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { EventDoc } from '@/services/eventService';
import { NETSA_FEE_PERCENT } from '@/lib/eventPricing';

const NETSA_FEE_FRACTION = NETSA_FEE_PERCENT / 100; // 0.5% → 0.005

/** Compact rupee formatter for narrow KPI tiles. ₹1.5L instead of ₹1,50,000. */
function formatRupeesCompact(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return '₹0';
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(amount % 10_000_000 === 0 ? 0 : 1)}Cr`;
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(amount % 100_000 === 0 ? 0 : 1)}L`;
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

function readTicketAmountRupees(event: EventDoc): number {
  const pricing = (event as any).pricing;
  if (!pricing || typeof pricing.amount !== 'number') return 0;
  // events-service stores pricing.amount in rupees (see events-service
  // Event schema + razorpay.service.ts:createEventOrder which does the
  // ×100 conversion to paise at order-create time). Use the value as-is.
  return pricing.amount;
}

interface Props {
  event: EventDoc;
  /** Future: hook return for payout status (settlement webhook not yet wired). */
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

export default function EventMoneyBlock({ event, payoutStatus = 'pending' }: Props) {
  if (event.registrationMode !== 'paid_ticket') return null;

  const { gross, netsaFee, net, ticketRupees, registered } = useMemo(() => {
    const ticket = readTicketAmountRupees(event);
    const reg = event.capacity?.registeredCount ?? 0;
    const g = ticket * reg;
    const fee = Math.round(g * NETSA_FEE_FRACTION * 100) / 100;
    return {
      gross: g,
      netsaFee: fee,
      net: Math.round((g - fee) * 100) / 100,
      ticketRupees: ticket,
      registered: reg,
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
          <Text style={styles.tileNum}>{formatRupeesCompact(gross)}</Text>
          <Text style={styles.tileSub}>{registered} paid · revenue</Text>
        </View>

        <View style={styles.tile}>
          <Text style={styles.tileLabel}>NETSA FEE</Text>
          <Text style={styles.tileNum}>{formatRupeesCompact(netsaFee)}</Text>
          <Text style={styles.tileSub}>{NETSA_FEE_PERCENT}% platform</Text>
        </View>

        <View style={styles.tile}>
          <Text style={styles.tileLabel}>NET TO YOU</Text>
          <Text style={[styles.tileNum, styles.tileNumBrand]}>{formatRupeesCompact(net)}</Text>
          <Text style={styles.tileSub}>after NETSA fee</Text>
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
  tileNumBrand: { color: '#FF6B35' },
  tileSub: {
    fontFamily: 'Outfit-Regular',
    fontSize: 10,
    color: '#6B6878',
  },
  payoutPillRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  payoutDot: { width: 6, height: 6, borderRadius: 99 },
});
