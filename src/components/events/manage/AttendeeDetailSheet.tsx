/**
 * AttendeeDetailSheet — the host's view of one attendee (manage-event-aminimal.html
 * · frame 4), opened by tapping a Going / Checked-in row. The events sibling of the
 * gig hub's ApplicantDetailScreen.
 *
 * Shows only what the roster row carries — name, status, seats, phone — with the
 * actions:
 *   Message        ✅ backed (app-wide DM via the hub's ContactActionSheet)
 *   Check in       ⚠️ TODO(B2) — one-tap manual check-in by registrationId isn't
 *                     built; routes to the scanner (the backed path) instead.
 *   Mark no-show   ✅ backed (PATCH /registrations/:id/status → 'no-show')
 *   Cancel+refund  ⚠️ TODO(B1) — per-attendee organizer cancel+refund isn't built.
 *
 * Deliberately NOT shown: payment line, ticket code, guest breakdown. Those live
 * behind B3 (the owner-gated per-reg read), which isn't built — so we show nothing
 * rather than fabricate it. Pay-as-fact.
 */
import React from 'react';
import { Modal, View, Text, Pressable, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MessageSquare } from 'lucide-react-native';
import type { EventRosterRow } from '@/services/eventService';
import { initialsOf, seatLabel, relativeTime } from './requestFormat';
import { C, F } from './hubTokens';

type Props = {
  visible: boolean;
  row: EventRosterRow | null;
  onClose: () => void;
  onMessage: (row: EventRosterRow) => void;
  onCheckIn: (row: EventRosterRow) => void;
  onMarkNoShow: (row: EventRosterRow) => void;
  onCancelRefund: (row: EventRosterRow) => void;
  busy?: boolean;
};

const STATUS_LABEL: Record<string, string> = {
  registered: 'Going',
  attended: 'Checked in',
  'no-show': 'No-show',
  cancelled: 'Cancelled',
  approved: 'Awaiting payment',
  pending: 'Requested',
  declined: 'Declined',
};

export default function AttendeeDetailSheet({
  visible, row, onClose, onMessage, onCheckIn, onMarkNoShow, onCancelRefund, busy,
}: Props) {
  if (!row) return null;
  const name = (row.name ?? '').trim() || 'Guest';
  const statusLabel = STATUS_LABEL[row.status] ?? 'Going';
  const ago = relativeTime(row.registeredAt);
  const sub = ago ? `${statusLabel} · registered ${ago}` : statusLabel;
  const attended = row.status === 'attended';
  const phone = (row.phone ?? '').trim();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.58)', justifyContent: 'flex-end' }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: C.sheet,
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            borderTopWidth: 1, borderTopColor: C.hairline,
            paddingHorizontal: 20, paddingBottom: 26,
          }}
        >
          <View style={{ width: 36, height: 4, borderRadius: 99, backgroundColor: C.t3, alignSelf: 'center', marginTop: 10, marginBottom: 16 }} />

          {/* hero */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
            <View
              style={{
                width: 54, height: 54, borderRadius: 27,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: C.hairline,
              }}
            >
              <Text style={{ fontFamily: F.serif, fontSize: 20, color: C.t1 }}>{initialsOf(name)}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ fontFamily: F.serif, fontSize: 22, color: C.cream }}>{name}</Text>
              <Text numberOfLines={1} style={{ fontFamily: F.body, fontSize: 12.5, color: C.t3, marginTop: 3 }}>{sub}</Text>
            </View>
          </View>

          {/* fact rows (roster-only) */}
          <View style={{ marginTop: 16 }}>
            <DetailRow k="Seats" v={seatLabel(row.seats)} />
            {phone ? <DetailRow k="Phone" v={phone} mono /> : null}
          </View>

          {/* primary actions */}
          <View style={{ flexDirection: 'row', gap: 9, marginTop: 18 }}>
            <TouchableOpacity
              onPress={() => onMessage(row)}
              accessibilityRole="button"
              accessibilityLabel={`Message ${name}`}
              style={{
                flex: 1, height: 46, borderRadius: 13,
                borderWidth: 1, borderColor: C.hairline, backgroundColor: 'transparent',
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
              }}
            >
              <MessageSquare size={15} color={C.t2} strokeWidth={1.9} />
              <Text style={{ fontFamily: F.semibold, fontSize: 13.5, color: C.t2 }}>Message</Text>
            </TouchableOpacity>

            {!attended ? (
              <TouchableOpacity
                onPress={() => onCheckIn(row)}
                accessibilityRole="button"
                accessibilityLabel={`Check in ${name}`}
                style={{
                  flex: 1, height: 46, borderRadius: 13,
                  backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Text style={{ fontFamily: F.bold, fontSize: 13.5, color: C.ink }}>Check in</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* quiet foot — mark no-show · cancel+refund */}
          <View
            style={{
              flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 22,
              marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.hairSoft,
            }}
          >
            <TouchableOpacity
              onPress={() => onMarkNoShow(row)}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={`Mark ${name} as a no-show`}
              hitSlop={8}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, opacity: busy ? 0.5 : 1 }}
            >
              {busy ? <ActivityIndicator size="small" color={C.t2} /> : null}
              <Text style={{ fontFamily: F.semibold, fontSize: 12, color: C.t2 }}>Mark no-show</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onCancelRefund(row)}
              accessibilityRole="button"
              accessibilityLabel={`Cancel and refund ${name}`}
              hitSlop={8}
            >
              <Text style={{ fontFamily: F.semibold, fontSize: 12, color: C.coral }}>Cancel + refund</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function DetailRow({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.hairSoft }}>
      <Text style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', color: C.t3, width: 76 }}>{k}</Text>
      <Text style={{ fontFamily: mono ? F.mono : F.body, fontSize: mono ? 12 : 13.5, color: C.t1, flex: 1 }}>{v}</Text>
    </View>
  );
}
