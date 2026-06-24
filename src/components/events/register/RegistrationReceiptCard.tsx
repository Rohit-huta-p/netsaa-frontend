/**
 * RegistrationReceiptCard — post-payment / post-RSVP confirmation view.
 *
 * Rendered in two surfaces:
 *   1. Inside EventRegisterSheetV2 after a successful registration (replaces
 *      the previous 1.4s "you're in" flash). User dismisses manually.
 *   2. As a standalone screen at /events/[id]/registered for revisiting the
 *      order details later (saved receipts, support reference).
 *
 * Data contract:
 *   - registration: EventRegistration row from useMyRegistration. For paid
 *     events, must include ticketAmount, serviceFeeAmount, paidAmount,
 *     razorpayPaymentId, paymentCapturedAt. For free events, those are
 *     undefined and the itemization block hides.
 *   - event: EventDoc from useEvent. Provides title, when, where, pricing
 *     refund policy.
 *
 * Pricing math:
 *   When the registration row carries explicit ticketAmount + serviceFeeAmount
 *   (backend authoritative), display those. Otherwise (legacy rows or paid
 *   rows that pre-date Plan 8 backend), fall back to recomputing from
 *   event.pricing.amount × attendeeCount via the shared eventPricing helper.
 *
 * Refund policy copy:
 *   Mirrors CancelRegistrationDialog. flex_24h / firm / custom each have a
 *   one-liner organizer-policy summary so the user knows what they signed up
 *   for without opening a separate dialog.
 */
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { formatRupees, computeCustomerBreakdown } from '@/lib/eventPricing';
import { eventTokens } from '@/lib/eventTokens';
import type { EventDoc } from '@/services/eventService';

interface Registration {
    _id?: string;
    attendeeName?: string;
    attendeeCount?: number;
    guestNames?: string[];
    visibility?: 'public' | 'private';
    notes?: string;
    paidAmount?: number;
    ticketAmount?: number;
    serviceFeeAmount?: number;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    paymentCapturedAt?: string | Date;
    paymentStatus?: 'pending' | 'completed' | 'refunded' | 'failed';
    registeredAt?: string | Date;
    ticketCode?: string;
}

interface Props {
    event: EventDoc;
    registration: Registration;
    /** "success" pops a fresh confirmation hero. "view" is the saved-receipt mode (no hero). */
    variant?: 'success' | 'view';
    onDismiss?: () => void;
    onViewEvent?: () => void;
}

/** Split start date into a date line and a time line for the ticket. */
function formatEventStartParts(startsAt?: string): { date: string; time: string } {
    if (!startsAt) return { date: '—', time: '' };
    const d = new Date(startsAt);
    if (Number.isNaN(d.getTime())) return { date: '—', time: '' };
    const date = d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
    const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
    return { date, time };
}

/** Split location into a primary line (venue or platform) and a secondary line (city or fallback). */
function locationParts(event: EventDoc): { primary: string; secondary: string } {
    const loc = event.location;
    if (!loc) return { primary: 'Location TBA', secondary: '' };
    if (loc.kind === 'online') {
        return {
            primary: loc.onlinePlatform ?? 'Online event',
            secondary: 'Link in your confirmation',
        };
    }
    return {
        primary: loc.venueName ?? 'Venue TBA',
        secondary: loc.address ?? '',
    };
}

function formatPaidAt(paidAt?: string | Date): string {
    if (!paidAt) return '';
    const d = typeof paidAt === 'string' ? new Date(paidAt) : paidAt;
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function refundPolicySummary(event: EventDoc): { label: string; body: string } | null {
    const pricing = (event as any).pricing;
    if (!pricing) return null;
    const policy = pricing.refundPolicy ?? 'flex_24h';
    if (policy === 'flex_24h')
        return {
            label: 'Flexible refund policy',
            body: 'Full refund up to 24h before event start. After that, the registration is non-refundable.',
        };
    if (policy === 'firm')
        return {
            label: 'No-refund policy',
            body: 'This event has a firm policy. Cancellations after this point do not receive a refund.',
        };
    if (policy === 'custom')
        return {
            label: 'Custom refund policy',
            body: pricing.refundCustomNote ?? 'See the organizer for refund terms.',
        };
    return null;
}

/**
 * Trim a Razorpay payment_id / order_id to a short display form.
 *   pay_NwYz3oXfa4UPGV  →  pay_NwYz…GV
 */
function shortId(id?: string): string {
    if (!id) return '—';
    if (id.length <= 12) return id;
    return `${id.slice(0, 8)}…${id.slice(-2)}`;
}

/** 6-character ticket reference for the stub. Prefers backend ticketCode, then razorpayPaymentId tail, then _id tail. */
function ticketRef(registration: Registration): string {
    if (registration.ticketCode) return registration.ticketCode.toUpperCase().slice(-6);
    if (registration.razorpayPaymentId) return registration.razorpayPaymentId.slice(-6).toUpperCase();
    if (registration._id) return registration._id.slice(-6).toUpperCase();
    return '——————';
}

export default function RegistrationReceiptCard({
    event,
    registration,
    variant = 'view',
    onDismiss,
    onViewEvent,
}: Props) {
    const isPaid = event.registrationMode === 'paid_ticket';
    const count = registration.attendeeCount ?? 1;

    // Itemization — prefer authoritative values from the registration row.
    // Fall back to local recompute if older rows lack the new fields.
    let ticketSubtotal: number | undefined;
    let serviceFee: number | undefined;
    let total: number | undefined;

    if (isPaid) {
        if (typeof registration.ticketAmount === 'number') {
            ticketSubtotal = registration.ticketAmount;
            serviceFee = registration.serviceFeeAmount ?? 0;
            total = registration.paidAmount ?? ticketSubtotal + serviceFee;
        } else {
            const unitPrice = (event as any).pricing?.amount ?? 0;
            const b = computeCustomerBreakdown(unitPrice, count);
            ticketSubtotal = b.ticketSubtotal;
            serviceFee = b.serviceFee;
            total = b.total;
        }
    }

    const unitPrice = (event as any).pricing?.amount ?? 0;
    const refundCopy = refundPolicySummary(event);
    const orderDisplay = shortId(registration.razorpayPaymentId ?? registration.razorpayOrderId);
    const paidAtCopy = isPaid ? formatPaidAt(registration.paymentCapturedAt ?? registration.registeredAt) : '';

    const whenParts = formatEventStartParts(event.startsAt);
    const whereParts = locationParts(event);
    const ref = ticketRef(registration);
    const bandWord = count > 1 ? `ADMIT ${count}` : 'ADMIT ONE';
    const bandSlug = isPaid ? 'TICKET' : 'FREE PASS';
    const attendeeName = registration.attendeeName ?? 'Guest';

    return (
        <ScrollView
            contentContainerStyle={{ paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
            className="px-6"
        >
            {/* SUCCESS HERO */}
            {variant === 'success' ? (
                <View className="items-center pt-4 pb-5 gap-2">
                    <View className="w-16 h-16 rounded-full items-center justify-center bg-event-brand/15">
                        <Check size={32} color={eventTokens.brand} strokeWidth={2.5} />
                    </View>
                    <Text className="font-serif text-event-textPrimary text-3xl mt-1">You're in.</Text>
                    <Text className="font-outfit text-event-textSecondary text-sm text-center px-6 leading-5">
                        We sent confirmation by push. The organizer can reach you on your phone if anything changes.
                    </Text>
                </View>
            ) : (
                <View className="pt-4 pb-3">
                    <Text className="font-mono text-event-textMuted text-[10px] uppercase tracking-widest">
                        Your registration
                    </Text>
                    <Text className="font-serif text-event-textPrimary text-2xl mt-1" numberOfLines={2}>
                        {event.title}
                    </Text>
                </View>
            )}

            {/* TICKET — event meta as a physical-ticket-style card.
              * Orange body against the dark modal so it pops; dark text on
              * orange clears WCAG AA (≈6.5:1). Dashed perforation with two
              * inset circular notches mimics a real torn ticket. The stub
              * carries the 6-char reference and attendee name. */}
            <View style={styles.ticket}>
                {/* Top band */}
                <View style={styles.ticketBand}>
                    <Text style={styles.ticketBandText}>{bandWord}</Text>
                    <View style={styles.ticketBandDivider} />
                    <Text style={styles.ticketBandText}>{bandSlug}</Text>
                </View>

                {/* WHEN / WHERE columns */}
                <View style={styles.ticketBody}>
                    <View style={styles.ticketCol}>
                        <Text style={styles.ticketLabel}>WHEN</Text>
                        <Text style={styles.ticketValue} numberOfLines={1}>
                            {whenParts.date}
                        </Text>
                        {whenParts.time ? <Text style={styles.ticketSub}>{whenParts.time}</Text> : null}
                    </View>
                    <View style={styles.ticketDivider} />
                    <View style={styles.ticketCol}>
                        <Text style={styles.ticketLabel}>WHERE</Text>
                        <Text style={styles.ticketValue} numberOfLines={1}>
                            {whereParts.primary}
                        </Text>
                        {whereParts.secondary ? (
                            <Text style={styles.ticketSub} numberOfLines={1}>
                                {whereParts.secondary}
                            </Text>
                        ) : null}
                    </View>
                </View>

                {/* Perforation — two punched holes + dashed line. Holes use the
                  * modal's near-black bg so they read as cutouts. */}
                <View style={styles.perforationRow}>
                    <View style={styles.notchLeft} />
                    <View style={styles.dashedLine} />
                    <View style={styles.notchRight} />
                </View>

                {/* Stub — REF + NAME */}
                <View style={styles.ticketStub}>
                    <View>
                        <Text style={styles.stubLabel}>REF</Text>
                        <Text style={styles.stubValue}>{ref}</Text>
                    </View>
                    <View style={styles.stubNameCol}>
                        <Text style={styles.stubLabel}>NAME</Text>
                        <Text style={styles.stubValue} numberOfLines={1}>
                            {attendeeName}
                        </Text>
                    </View>
                </View>
            </View>

            {/* ITEMIZATION — PAID ONLY */}
            {isPaid && total !== undefined ? (
                <View className="rounded-2xl bg-event-surface border border-event-brand/30 px-4 py-4 mb-4">
                    <Text className="font-mono text-event-textMuted text-[10px] uppercase tracking-widest mb-3">
                        Payment summary
                    </Text>

                    <View className="flex-row items-center justify-between mb-2">
                        <Text className="font-outfit text-event-textSecondary text-sm">
                            {count} {count === 1 ? 'ticket' : 'tickets'} × {formatRupees(unitPrice)}
                        </Text>
                        <Text className="font-outfit text-event-textPrimary text-sm">
                            {formatRupees(ticketSubtotal ?? 0)}
                        </Text>
                    </View>
                    {(serviceFee ?? 0) > 0 ? (
                        <View className="flex-row items-center justify-between mb-2">
                            <Text className="font-outfit text-event-textSecondary text-sm">Service fee</Text>
                            <Text className="font-outfit text-event-textPrimary text-sm">
                                {formatRupees(serviceFee ?? 0)}
                            </Text>
                        </View>
                    ) : null}
                    <View className="h-px bg-event-border my-2" />
                    <View className="flex-row items-center justify-between mb-2">
                        <Text className="font-outfit text-event-textPrimary text-sm font-semibold">Total paid</Text>
                        <Text className="font-serif text-event-textPrimary text-2xl">{formatRupees(total)}</Text>
                    </View>

                    <View className="h-px bg-event-border my-2" />
                    <View className="flex-row items-center justify-between">
                        <Text className="font-outfit text-event-textMuted text-xs">Order</Text>
                        <Text className="font-mono text-event-textSecondary text-xs">{orderDisplay}</Text>
                    </View>
                    {paidAtCopy ? (
                        <View className="flex-row items-center justify-between mt-1">
                            <Text className="font-outfit text-event-textMuted text-xs">Paid</Text>
                            <Text className="font-outfit text-event-textSecondary text-xs">{paidAtCopy}</Text>
                        </View>
                    ) : null}
                </View>
            ) : null}

            {/* FREE — attendee summary in lieu of itemization */}
            {!isPaid ? (
                <View className="rounded-2xl bg-event-surface border border-event-border px-4 py-4 mb-4">
                    <Text className="font-mono text-event-textMuted text-[10px] uppercase tracking-widest mb-2">
                        Your reservation
                    </Text>
                    <Text className="font-outfit text-event-textPrimary text-base">
                        {count === 1 ? '1 spot reserved' : `${count} spots reserved`}
                    </Text>
                    {registration.attendeeName ? (
                        <Text className="font-outfit text-event-textSecondary text-sm mt-1">
                            Under {registration.attendeeName}
                            {registration.guestNames?.length
                                ? ` + ${registration.guestNames.filter(Boolean).join(', ')}`
                                : ''}
                        </Text>
                    ) : null}
                    <Text className="font-outfit text-event-textMuted text-xs mt-2">
                        Free event · no payment.
                    </Text>
                </View>
            ) : null}

            {/* REFUND POLICY */}
            {isPaid && refundCopy ? (
                <View className="rounded-2xl bg-event-surface border border-event-border px-4 py-3 mb-4">
                    <Text className="font-mono text-event-textMuted text-[10px] uppercase tracking-widest mb-1">
                        {refundCopy.label}
                    </Text>
                    <Text className="font-outfit text-event-textSecondary text-xs leading-5">{refundCopy.body}</Text>
                </View>
            ) : null}

            {/* CTAs */}
            <View className="flex-row gap-3 mt-2">
                {onViewEvent ? (
                    <Pressable
                        onPress={onViewEvent}
                        className="flex-1 rounded-2xl py-4 items-center bg-event-surface border border-event-border"
                    >
                        <Text className="font-outfit font-semibold text-event-textPrimary text-sm">View event</Text>
                    </Pressable>
                ) : null}
                {onDismiss ? (
                    <Pressable
                        onPress={onDismiss}
                        className="flex-1 rounded-2xl py-4 items-center bg-event-brand"
                    >
                        <Text className="font-outfit font-bold text-white text-sm">Done</Text>
                    </Pressable>
                ) : null}
            </View>
        </ScrollView>
    );
}

// ─── Ticket styles ──────────────────────────────────────────────────────────
// Inline StyleSheet rather than NativeWind because:
//   1. The notch cutouts need exact pixel positioning (negative margins
//      to extend past the ticket's rounded edges).
//   2. The orange ticket bg + darker band aren't in the eventTokens palette
//      as Tailwind utilities, so we'd be writing inline colors anyway.
//   3. Matches the editorial-tile pattern used in EventMoneyBlock /
//      OverviewKpis (StyleSheet, DM Serif headline, Space Mono labels).
const TICKET_BG = '#FF6B35';        // brand orange
const TICKET_BAND_BG = '#7A2E12';   // darker orange-brown for high contrast
const TICKET_INK = '#0B0A0F';       // near-black — ~6.5:1 contrast on orange
const TICKET_INK_SOFT = 'rgba(11,10,15,0.55)';
const TICKET_INK_LINE = 'rgba(11,10,15,0.35)';
const TICKET_STUB_OVERLAY = 'rgba(11,10,15,0.10)';
const MODAL_BG = '#0B0A0F';         // matches eventTokens.bg — punch-through

const styles = StyleSheet.create({
    ticket: {
        backgroundColor: TICKET_BG,
        borderRadius: 18,
        marginTop: 10,
        marginBottom: 18,
        // Faint orange glow lifts the ticket off the dark modal.
        shadowColor: TICKET_BG,
        shadowOpacity: 0.35,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 4,
    },
    ticketBand: {
        backgroundColor: TICKET_BAND_BG,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
    },
    ticketBandText: {
        fontFamily: 'SpaceMono-Regular',
        fontSize: 11,
        letterSpacing: 2,
        color: '#FFC9B0',
    },
    ticketBandDivider: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#FFC9B0',
        opacity: 0.5,
    },
    ticketBody: {
        flexDirection: 'row',
        alignItems: 'stretch',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 20,
        gap: 16,
    },
    ticketCol: {
        flex: 1,
        gap: 4,
    },
    ticketDivider: {
        width: 1,
        backgroundColor: 'rgba(11,10,15,0.18)',
        marginVertical: 2,
    },
    ticketLabel: {
        fontFamily: 'SpaceMono-Regular',
        fontSize: 10,
        letterSpacing: 1.5,
        color: TICKET_INK_SOFT,
    },
    ticketValue: {
        fontFamily: 'DMSerifDisplay_400Regular',
        fontSize: 22,
        letterSpacing: -0.5,
        color: TICKET_INK,
        marginTop: 2,
    },
    ticketSub: {
        fontFamily: 'Outfit-Regular',
        fontSize: 13,
        color: 'rgba(11,10,15,0.75)',
    },
    perforationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 18,
    },
    notchLeft: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: MODAL_BG,
        marginLeft: -9, // extends past ticket left edge to look like a cutout
    },
    notchRight: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: MODAL_BG,
        marginRight: -9, // extends past ticket right edge
    },
    dashedLine: {
        flex: 1,
        marginHorizontal: 6,
        borderTopWidth: 1.5,
        borderColor: TICKET_INK_LINE,
        borderStyle: 'dashed',
    },
    ticketStub: {
        backgroundColor: TICKET_STUB_OVERLAY,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 18,
        borderBottomLeftRadius: 18,
        borderBottomRightRadius: 18,
    },
    stubLabel: {
        fontFamily: 'SpaceMono-Regular',
        fontSize: 9,
        letterSpacing: 1.5,
        color: TICKET_INK_SOFT,
    },
    stubValue: {
        fontFamily: 'Outfit-Bold',
        fontSize: 16,
        color: TICKET_INK,
        marginTop: 2,
    },
    stubNameCol: {
        alignItems: 'flex-end',
        flex: 1,
        marginLeft: 20,
    },
});
