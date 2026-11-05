/**
 * EventActionsSheet — the ⋯ "Event actions" bottom sheet (manage-event-aminimal.html
 * · frame 12), opened from the hub header ⋯. The events sibling of the gig hub's
 * GigActionsSheet.
 *
 *   Edit event        → composer edit (/events/:id/edit)
 *   Share             → native share of the event link
 *   Preview           → EventPreviewModal (how viewers see it)
 *   Payouts           → /settings/payouts. For a PAID event this is the gold "Set up →"
 *                       nudge until the account is verified; once verified it's a plain
 *                       row. Hidden for free events (nothing to collect).
 *   Accepting RSVPs   → toggle PATCH /events/:id { registrationClosed } (useUpdateEvent)
 *   Settings          → /events/:id/manage/settings
 *   Cancel event      → OrganizerCancellationModal (danger)
 */
import React from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pencil, Share2, Eye, Landmark, Ticket, Settings, XCircle, ChevronRight } from 'lucide-react-native';
import { C, F } from './hubTokens';

type Props = {
  visible: boolean;
  eventTitle: string;
  statusLabel: string;
  isPaid: boolean;
  priceRupees: number;
  payoutVerified: boolean;
  payoutLine?: string;
  acceptingRsvps: boolean;
  seatsTaken: number;
  seatsTotal: number;
  canCancel: boolean;
  onClose: () => void;
  onEdit: () => void;
  onShare: () => void;
  onPreview: () => void;
  onPayouts: () => void;
  onToggleAcceptingRsvps: (next: boolean) => void;
  onSettings: () => void;
  onCancel: () => void;
};

export default function EventActionsSheet({
  visible, eventTitle, statusLabel, isPaid, priceRupees, payoutVerified, payoutLine,
  acceptingRsvps, seatsTaken, seatsTotal, canCancel,
  onClose, onEdit, onShare, onPreview, onPayouts, onToggleAcceptingRsvps, onSettings, onCancel,
}: Props) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;

  const priceLabel = priceRupees > 0 ? `₹${priceRupees.toLocaleString('en-IN')}` : '';

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.58)', justifyContent: 'flex-end' }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: C.sheet,
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            borderTopWidth: 1, borderTopColor: C.hairline,
            paddingBottom: insets.bottom + 12, paddingHorizontal: 20,
          }}
        >
          <View style={{ width: 36, height: 4, borderRadius: 99, backgroundColor: C.t3, alignSelf: 'center', marginTop: 10, marginBottom: 14 }} />
          <Text style={{ fontFamily: F.serif, fontSize: 21, color: C.cream }}>Event actions</Text>
          <Text style={{ fontFamily: F.body, fontSize: 13, color: C.t2, marginTop: 4 }}>{eventTitle} · {statusLabel}</Text>

          <View style={{ marginTop: 14 }}>
            <Row icon={Pencil} tint={C.blue} tintBg="rgba(59,130,246,0.14)" title="Edit event" subtitle="Details, story, cover, agenda" onPress={onEdit} chevron />
            <Row icon={Share2} tint={C.t2} tintBg="rgba(255,255,255,0.06)" title="Share" subtitle="Send the event link" onPress={onShare} chevron />
            <Row icon={Eye} tint={C.t2} tintBg="rgba(255,255,255,0.06)" title="Preview" subtitle="How viewers see it" onPress={onPreview} chevron />

            {/* Payouts — gold "Set up →" nudge for a paid event until verified. */}
            {isPaid ? (
              payoutVerified ? (
                <Row
                  icon={Landmark} tint={C.mint} tintBg={C.mintSoft}
                  title="Payouts"
                  subtitle={payoutLine || 'Verified · how you get paid'}
                  onPress={onPayouts}
                  chevron
                />
              ) : (
                <TouchableOpacity
                  onPress={onPayouts}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Set up payouts"
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 13,
                    backgroundColor: 'rgba(240,182,90,0.08)',
                    borderWidth: 1, borderColor: 'rgba(240,182,90,0.26)',
                    borderRadius: 12, padding: 12, marginVertical: 6,
                  }}
                >
                  <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(240,182,90,0.18)', alignItems: 'center', justifyContent: 'center' }}>
                    <Landmark size={16} color={C.gold} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontFamily: F.semibold, fontSize: 14, color: C.cream }}>Payouts</Text>
                    <Text style={{ fontFamily: F.body, fontSize: 11, color: C.t3, marginTop: 2 }}>
                      {priceLabel ? `Link a bank to collect ${priceLabel} tickets` : 'Link a bank to get paid'}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: F.semibold, fontSize: 12.5, color: C.orange }}>Set up →</Text>
                </TouchableOpacity>
              )
            ) : null}

            <Row
              icon={Ticket} tint={C.orange} tintBg={C.orangeSoft}
              title="Accepting RSVPs"
              subtitle={acceptingRsvps
                ? `${seatsTaken} / ${seatsTotal} · tap to close registration`
                : 'Closed · tap to reopen'}
              toggleOn={acceptingRsvps}
              onToggle={() => onToggleAcceptingRsvps(!acceptingRsvps)}
            />
            <Row icon={Settings} tint={C.t2} tintBg="rgba(255,255,255,0.06)" title="Settings" subtitle="Registration, visibility, discussion" onPress={onSettings} chevron />

            {canCancel ? (
              <Row icon={XCircle} tint={C.coral} tintBg={C.coralSoft} title="Cancel event" subtitle="Refund all · can't be undone" onPress={onCancel} danger chevron />
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Row({
  icon: Icon, tint, tintBg, title, subtitle, onPress, chevron, toggleOn, onToggle, danger,
}: {
  icon: any; tint: string; tintBg: string; title: string; subtitle: string;
  onPress?: () => void; chevron?: boolean; toggleOn?: boolean; onToggle?: () => void; danger?: boolean;
}) {
  const isToggle = typeof toggleOn === 'boolean';
  return (
    <TouchableOpacity
      onPress={isToggle ? onToggle : onPress}
      activeOpacity={0.7}
      accessibilityRole={isToggle ? 'switch' : 'button'}
      accessibilityLabel={title}
      accessibilityState={isToggle ? { checked: !!toggleOn } : undefined}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 13, borderTopWidth: 1, borderTopColor: C.hairSoft }}
    >
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: tintBg, alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={16} color={tint} strokeWidth={1.9} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontFamily: F.medium, fontSize: 14, color: danger ? C.coral : C.cream }}>{title}</Text>
        <Text style={{ fontFamily: F.body, fontSize: 11, color: C.t3, marginTop: 2 }}>{subtitle}</Text>
      </View>
      {isToggle ? (
        <View style={{ width: 42, height: 24, borderRadius: 999, backgroundColor: toggleOn ? C.orange : C.slotOff, justifyContent: 'center' }}>
          <View style={{ position: 'absolute', top: 2, left: toggleOn ? 20 : 2, width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' }} />
        </View>
      ) : chevron ? (
        <ChevronRight size={16} color={danger ? C.coral : C.t3} strokeWidth={1.9} />
      ) : null}
    </TouchableOpacity>
  );
}
