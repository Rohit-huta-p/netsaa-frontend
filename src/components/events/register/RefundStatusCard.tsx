/**
 * RefundStatusCard — shown inline after attendee cancels a paid registration.
 *
 * Driven entirely from the POST /v1/registrations/:id/cancel response.
 * There is NO refund-status GET endpoint in Sprint 3 — the 'processed'
 * state arrives later via notifications. Do NOT add a backend poll/endpoint.
 *
 * Sprint 3, Task 7.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { CheckCircle, Clock } from 'lucide-react-native';

interface Props {
  refundAmountPaise: number;
  refundId: string | null;
}

export default function RefundStatusCard({ refundAmountPaise, refundId }: Props) {
  const hasRefund = refundId !== null || refundAmountPaise > 0;

  if (!hasRefund) {
    // Cancelled outside window — no refund
    return (
      <View
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.10)',
          padding: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          marginTop: 10,
        }}
      >
        <CheckCircle size={16} color="#71717a" />
        <Text
          className="font-outfit text-event-textSecondary text-sm flex-1"
          style={{ lineHeight: 18 }}
        >
          Cancelled · no refund (outside window)
        </Text>
      </View>
    );
  }

  const amountRupees = refundAmountPaise / 100;
  const formatted = `₹${amountRupees.toLocaleString('en-IN', {
    minimumFractionDigits: Number.isInteger(amountRupees) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;

  return (
    <View
      style={{
        backgroundColor: 'rgba(255,107,53,0.08)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,107,53,0.25)',
        padding: 14,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginTop: 10,
      }}
    >
      <Clock size={16} color="#FF6B35" style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text
          className="font-outfit font-semibold text-event-brand text-sm"
          style={{ lineHeight: 18 }}
        >
          Refund processing · {formatted}
        </Text>
        <Text
          className="font-outfit text-event-textMuted text-xs"
          style={{ lineHeight: 16, marginTop: 2 }}
        >
          To your payment method · 3–5 business days
        </Text>
      </View>
    </View>
  );
}
