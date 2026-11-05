/**
 * AttendeeRow — one attendee on the host hub's Going / Checked-in / Waitlist spine
 * (manage-event-aminimal.html · frames 1–3). The events sibling of the gig hub's
 * HubApplicantRow: avatar + name-led body + a small, per-stage trailing action.
 *
 *   going            → tap the row (kebab) to open the attendee sheet; new-dot on
 *                      recent registrations.
 *   attended         → a done ✓ avatar + a quiet "checked in" tag (no timestamp —
 *                      roster carries registeredAt, not checkedInAt; readiness §3/B4).
 *   pending-checkin  → day-of, not in yet → a white "Check in" button. Manual
 *                      one-tap check-in is B2 (not built) → the button routes to
 *                      the scanner, the backed path. TODO(B2).
 *   waitlist         → #position pill + Promote (only #1 is live, and only when a
 *                      seat is free; the API promotes the top of the queue only).
 *
 * Reuses requestFormat (initialsOf / seatLabel / relativeTime) so copy matches the
 * Requests tab. Pay-as-fact: no cash/amount tag on the row — that lived behind B3
 * (the per-reg read), which isn't built, so the roster row carries no payment.
 */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check, MoreHorizontal } from 'lucide-react-native';
import type { EventRosterRow } from '@/services/eventService';
import { initialsOf, seatLabel, relativeTime } from './requestFormat';
import { C, F } from './hubTokens';

export type AttendeeRowVariant = 'going' | 'attended' | 'pending-checkin' | 'waitlist';

type Props = {
  row: EventRosterRow;
  variant: AttendeeRowVariant;
  /** new-dot — a registration that landed in the last 24h. */
  isNew?: boolean;
  /** waitlist: this row is #1 and a seat is free → Promote is live. */
  canPromote?: boolean;
  /** waitlist: a promote round-trip is in flight (this row or any). */
  promoting?: boolean;
  onPress?: () => void;
  onPromote?: () => void;
  onCheckIn?: () => void;
  first?: boolean;
};

export default function AttendeeRow({
  row, variant, isNew, canPromote, promoting, onPress, onPromote, onCheckIn, first,
}: Props) {
  const name = (row.name ?? '').trim() || 'Guest';
  const attended = variant === 'attended';

  const sub = (() => {
    if (variant === 'waitlist') {
      const joined = relativeTime(row.joinedAt ?? row.registeredAt);
      return [seatLabel(row.seats), joined ? `joined ${joined}` : null].filter(Boolean).join('  ·  ');
    }
    if (variant === 'pending-checkin') return `${seatLabel(row.seats)}  ·  not in yet`;
    if (attended) return seatLabel(row.seats);
    const ago = relativeTime(row.registeredAt);
    return [seatLabel(row.seats), ago].filter(Boolean).join('  ·  ');
  })();

  const tappable = variant === 'going' || attended;

  const Wrapper: any = tappable && onPress ? TouchableOpacity : View;
  const wrapperProps = tappable && onPress
    ? { onPress, activeOpacity: 0.7, accessibilityRole: 'button' as const, accessibilityLabel: `${name}, ${sub}` }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: C.hairSoft,
      }}
    >
      {/* avatar — initials, or a done ✓ for an attended row */}
      <View
        style={{
          width: 42, height: 42, borderRadius: 21,
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: attended ? C.mintSoft : 'rgba(255,255,255,0.06)',
          borderWidth: 1, borderColor: attended ? C.mintLine : C.hairline,
        }}
      >
        {attended ? (
          <Check size={18} color={C.mint} strokeWidth={2.6} />
        ) : (
          <Text style={{ fontFamily: F.serif, fontSize: 16, color: C.t1 }}>{initialsOf(name)}</Text>
        )}
      </View>

      {/* body */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text numberOfLines={1} style={{ fontFamily: F.semibold, fontSize: 14.5, color: C.cream, letterSpacing: -0.2, flexShrink: 1 }}>
            {name}
          </Text>
          {isNew ? (
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.orange, marginLeft: 7 }} />
          ) : null}
        </View>
        <Text numberOfLines={1} style={{ fontFamily: F.body, fontSize: 12, color: C.t3, marginTop: 3 }}>
          {sub}
        </Text>
      </View>

      {/* trailing — per variant */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, flexShrink: 0 }}>
        {variant === 'going' ? (
          <View
            style={{
              width: 30, height: 30, borderRadius: 9,
              borderWidth: 1, borderColor: C.hairline,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <MoreHorizontal size={16} color={C.t2} />
          </View>
        ) : null}

        {attended ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Check size={11} color={C.mint} strokeWidth={2.6} />
            <Text style={{ fontFamily: F.mono, fontSize: 9.5, color: C.mint, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              in
            </Text>
          </View>
        ) : null}

        {variant === 'pending-checkin' ? (
          <TouchableOpacity
            onPress={onCheckIn}
            accessibilityRole="button"
            accessibilityLabel={`Check in ${name}`}
            hitSlop={6}
            style={{
              height: 30, paddingHorizontal: 13, borderRadius: 9,
              backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: F.bold, fontSize: 12, color: C.ink }}>Check in</Text>
          </TouchableOpacity>
        ) : null}

        {variant === 'waitlist' ? (
          <>
            <Text
              style={{
                fontFamily: F.mono, fontSize: 9, color: C.orange,
                backgroundColor: C.orangeSoft, borderRadius: 5,
                paddingHorizontal: 6, paddingVertical: 2, overflow: 'hidden',
              }}
            >
              #{row.position ?? '—'}
            </Text>
            <TouchableOpacity
              onPress={onPromote}
              disabled={!canPromote || promoting}
              accessibilityRole="button"
              accessibilityLabel={`Promote ${name}`}
              accessibilityState={{ disabled: !canPromote || promoting }}
              hitSlop={6}
              style={{
                height: 30, paddingHorizontal: 11, borderRadius: 9,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: canPromote ? C.orangeSoft : 'transparent',
                borderWidth: 1, borderColor: canPromote ? C.orangeLine : C.hairline,
                opacity: !canPromote || promoting ? 0.45 : 1,
              }}
            >
              <Text style={{ fontFamily: F.semibold, fontSize: 12, color: canPromote ? C.orange : C.t3 }}>
                {promoting && canPromote ? 'Promoting…' : 'Promote'}
              </Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    </Wrapper>
  );
}
