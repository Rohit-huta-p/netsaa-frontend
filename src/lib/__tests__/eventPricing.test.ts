import {
    computeCustomerBreakdown,
    computeOrganizerBreakdown,
    formatRupees,
    NETSA_FEE_PERCENT,
    PROCESSING_FEE_PERCENT,
} from '../eventPricing';

describe('eventPricing', () => {
    describe('constants', () => {
        it('mirrors backend .env NETSA_FEE_PERCENT', () => {
            // Keep in sync with events-service/.env
            expect(NETSA_FEE_PERCENT).toBe(0.5);
        });

        it('mirrors backend .env PAYMENT_PROCESSING_FEE_PERCENT', () => {
            // Keep in sync with events-service/.env
            expect(PROCESSING_FEE_PERCENT).toBe(2.36);
        });
    });

    describe('computeCustomerBreakdown', () => {
        it('computes single-ticket breakdown for ₹499', () => {
            const b = computeCustomerBreakdown(499, 1);
            expect(b.ticketSubtotal).toBe(499);
            // 499 × 0.0236 = 11.7764 → 11.78
            expect(b.serviceFee).toBe(11.78);
            // 499 + 11.78 = 510.78
            expect(b.total).toBe(510.78);
        });

        it('computes 3-ticket breakdown for ₹499 each', () => {
            const b = computeCustomerBreakdown(499, 3);
            expect(b.ticketSubtotal).toBe(1497);
            // 1497 × 0.0236 = 35.3292 → 35.33
            expect(b.serviceFee).toBe(35.33);
            expect(b.total).toBe(1532.33);
        });

        it('returns zero fee for free events (₹0 ticket)', () => {
            const b = computeCustomerBreakdown(0, 1);
            expect(b.ticketSubtotal).toBe(0);
            expect(b.serviceFee).toBe(0);
            expect(b.total).toBe(0);
        });

        it('handles round-number tickets like ₹100', () => {
            const b = computeCustomerBreakdown(100, 1);
            expect(b.ticketSubtotal).toBe(100);
            // 100 × 0.0236 = 2.36
            expect(b.serviceFee).toBe(2.36);
            expect(b.total).toBe(102.36);
        });
    });

    describe('computeOrganizerBreakdown', () => {
        it('computes per-ticket earnings for ₹499', () => {
            const o = computeOrganizerBreakdown(499, 1);
            expect(o.customerPays).toBe(510.78);
            expect(o.serviceFee).toBe(11.78);
            // 499 × 0.005 = 2.495 → 2.50
            expect(o.netsaFee).toBe(2.5);
            // 499 - 2.50 = 496.50
            expect(o.organizerNet).toBe(496.5);
        });

        it('defaults seats to 1 for composer preview', () => {
            const o = computeOrganizerBreakdown(499);
            expect(o.organizerNet).toBe(496.5);
        });

        it('scales for multiple seats', () => {
            const o = computeOrganizerBreakdown(499, 3);
            // 1497 - (1497 × 0.005) = 1497 - 7.485 → 7.49 → 1489.51
            expect(o.netsaFee).toBe(7.49);
            expect(o.organizerNet).toBe(1489.51);
        });
    });

    describe('formatRupees', () => {
        it('drops decimals for integer amounts', () => {
            expect(formatRupees(1497)).toBe('₹1,497');
            expect(formatRupees(499)).toBe('₹499');
        });

        it('shows 2 decimals for fractional amounts', () => {
            expect(formatRupees(35.33)).toBe('₹35.33');
            expect(formatRupees(1532.33)).toBe('₹1,532.33');
        });

        it('uses Indian number grouping', () => {
            // 1,00,000 not 100,000
            expect(formatRupees(100000)).toBe('₹1,00,000');
        });
    });
});
