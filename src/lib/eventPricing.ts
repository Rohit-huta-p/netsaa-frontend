/**
 * Event payment pricing math — mirror of events-service .env constants:
 *   NETSA_FEE_PERCENT=0.5
 *   PAYMENT_PROCESSING_FEE_PERCENT=2.36
 *
 * Keep these aligned. The authoritative numbers come from the backend in the
 * POST /register response — these helpers are for client-side previews
 * (register sheet itemization, composer earnings calculator).
 *
 * All amounts in rupees (₹). Rounded to paise (2 decimals).
 */

export const NETSA_FEE_PERCENT = 0.5;
export const PROCESSING_FEE_PERCENT = 2.36;

const roundPaise = (n: number): number => Math.round(n * 100) / 100;

export interface CustomerBreakdown {
    /** Ticket price × seats. What the organizer earns gross. */
    ticketSubtotal: number;
    /** Payment processing fee added on top. Covers Razorpay MDR (worst case ~2.36%). */
    serviceFee: number;
    /** What the customer pays. */
    total: number;
}

export interface OrganizerBreakdown {
    /** Customer pays this. */
    customerPays: number;
    /** Razorpay processing fee. Customer pays, gateway collects. */
    serviceFee: number;
    /** NETSA platform fee (0.5% of ticket subtotal). */
    netsaFee: number;
    /** What lands in the organizer's account after the instant split. */
    organizerNet: number;
}

/**
 * Compute what the customer sees: ticket subtotal + service fee + total.
 */
export function computeCustomerBreakdown(unitPriceRupees: number, seats: number): CustomerBreakdown {
    const ticketSubtotal = roundPaise(unitPriceRupees * seats);
    const serviceFee = roundPaise(ticketSubtotal * (PROCESSING_FEE_PERCENT / 100));
    const total = roundPaise(ticketSubtotal + serviceFee);
    return { ticketSubtotal, serviceFee, total };
}

export interface EventOffer {
    spotId?: string;
    name: string;
    price: number;                 // rupees, below the base
    audience: 'everyone' | 'group';
    endsAt?: string | Date | null;
    seatLimit?: number;
    minSeats?: number;
}

export interface EffectiveOffer {
    baseUnitRupees: number;        // undiscounted per-ticket price
    unitRupees: number;            // what we preview charging per ticket
    appliedOffer?: { name: string; unitRupees: number; baseUnitRupees: number; audience: 'everyone' | 'group' };
}

/**
 * Display mirror of the backend resolver (events-service/src/services/offerPricing.ts): the
 * cheapest offer the buyer qualifies for (not past `endsAt`, audience/minSeats fits, spot matches),
 * else the base price. `seatLimit` is NOT enforced here — the server counts seats authoritatively;
 * the sheet only previews the best time/audience/spot-eligible offer. The backend price is final.
 */
export function resolveEffectiveOffer(
    input: { spots?: { _id?: string; name?: string; price?: number }[]; pricing?: { amount?: number } | null; ticketPrice?: number; offers?: EventOffer[] },
    opts: { spotId?: string | null; seats: number; now?: Date },
): EffectiveOffer {
    const now = opts.now ?? new Date();
    const seats = Math.max(1, Math.floor(opts.seats || 1));
    const spot = opts.spotId ? (input.spots ?? []).find((s) => String(s._id ?? s.name) === String(opts.spotId)) : undefined;
    const baseUnitRupees = spot ? (spot.price ?? 0) : (input.pricing?.amount ?? input.ticketPrice ?? 0);
    if (baseUnitRupees <= 0) return { baseUnitRupees, unitRupees: baseUnitRupees };

    const qualifies = (o: EventOffer): boolean => {
        if (typeof o.price !== 'number' || o.price < 0 || o.price >= baseUnitRupees) return false;
        if (o.endsAt && new Date(o.endsAt).getTime() <= now.getTime()) return false;
        if (o.spotId && (!spot || String(o.spotId) !== String(spot._id ?? spot.name))) return false;
        if (o.audience === 'group') { const min = o.minSeats && o.minSeats > 1 ? o.minSeats : 2; if (seats < min) return false; }
        return true;
    };
    const candidates = (input.offers ?? []).filter(qualifies);
    if (!candidates.length) return { baseUnitRupees, unitRupees: baseUnitRupees };
    const best = candidates.reduce((a, b) => (b.price < a.price ? b : a));
    return { baseUnitRupees, unitRupees: best.price, appliedOffer: { name: best.name, unitRupees: best.price, baseUnitRupees, audience: best.audience } };
}

/**
 * Compute what the organizer earns per registration (per seat or per N seats).
 * Use `seats=1` in the composer mini-calculator to show per-ticket earnings.
 */
export function computeOrganizerBreakdown(unitPriceRupees: number, seats: number = 1): OrganizerBreakdown {
    const cust = computeCustomerBreakdown(unitPriceRupees, seats);
    const netsaFee = roundPaise(cust.ticketSubtotal * (NETSA_FEE_PERCENT / 100));
    const organizerNet = roundPaise(cust.ticketSubtotal - netsaFee);
    return {
        customerPays: cust.total,
        serviceFee: cust.serviceFee,
        netsaFee,
        organizerNet,
    };
}

/**
 * Format ₹ amount. Drops `.00` when integer for readability.
 *   formatRupees(1497)    -> "₹1,497"
 *   formatRupees(35.33)   -> "₹35.33"
 *   formatRupees(1532.33) -> "₹1,532.33"
 */
export function formatRupees(amount: number): string {
    const isInt = Number.isInteger(amount);
    return `₹${amount.toLocaleString('en-IN', {
        minimumFractionDigits: isInt ? 0 : 2,
        maximumFractionDigits: 2,
    })}`;
}
