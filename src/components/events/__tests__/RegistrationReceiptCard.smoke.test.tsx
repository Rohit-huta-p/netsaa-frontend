import { render } from '@testing-library/react-native';
import RegistrationReceiptCard from '../register/RegistrationReceiptCard';

const baseEvent: any = {
    _id: 'evt1',
    title: 'Diwali Dance Showcase',
    startsAt: '2026-06-10T18:00:00+05:30',
    location: { kind: 'in_person', venueName: 'Sahyog Auditorium', address: 'Pune' },
};

const paidEvent: any = {
    ...baseEvent,
    registrationMode: 'paid_ticket',
    pricing: { amount: 499, refundPolicy: 'flex_24h' },
};

const freeEvent: any = {
    ...baseEvent,
    registrationMode: 'free_rsvp',
};

const paidRegistration = {
    _id: 'reg1',
    attendeeCount: 3,
    attendeeName: 'Anjali R',
    ticketAmount: 1497,
    serviceFeeAmount: 35.33,
    paidAmount: 1532.33,
    paymentStatus: 'completed' as const,
    razorpayPaymentId: 'pay_NwYz3oXfa4UPGV',
    paymentCapturedAt: '2026-05-17T19:30:00+05:30',
};

const freeRegistration = {
    _id: 'reg2',
    attendeeCount: 2,
    attendeeName: 'Rohan K',
    guestNames: ['Priya'],
};

describe('RegistrationReceiptCard', () => {
    it('paid event: renders itemization with backend-authoritative amounts', () => {
        const { getByText } = render(
            <RegistrationReceiptCard event={paidEvent} registration={paidRegistration} variant="view" />,
        );
        // Unit price + count line
        expect(getByText(/3 tickets × ₹499/)).toBeTruthy();
        // Service fee line
        expect(getByText(/Service fee/i)).toBeTruthy();
        // Total uses backend paidAmount, not local recompute
        expect(getByText('₹1,532.33')).toBeTruthy();
        // Order ID shortened
        expect(getByText(/pay_NwYz…GV/)).toBeTruthy();
    });

    it('paid event: falls back to local recompute when row lacks ticketAmount', () => {
        const legacyRegistration = { attendeeCount: 3 } as any; // no ticketAmount/paidAmount
        const { getByText } = render(
            <RegistrationReceiptCard event={paidEvent} registration={legacyRegistration} variant="view" />,
        );
        // 3 × 499 = 1497 ticket subtotal; service 2.36% = 35.33; total 1532.33
        expect(getByText(/3 tickets × ₹499/)).toBeTruthy();
        expect(getByText('₹1,532.33')).toBeTruthy();
    });

    it('free event: shows attendee summary, no itemization', () => {
        const { getByText, queryByText } = render(
            <RegistrationReceiptCard event={freeEvent} registration={freeRegistration} variant="view" />,
        );
        expect(getByText('2 spots reserved')).toBeTruthy();
        expect(getByText(/Under Rohan K \+ Priya/)).toBeTruthy();
        expect(getByText(/Free event/)).toBeTruthy();
        expect(queryByText(/Payment summary/i)).toBeNull();
    });

    it('success variant: shows "You\'re in" hero', () => {
        const { getByText } = render(
            <RegistrationReceiptCard event={paidEvent} registration={paidRegistration} variant="success" />,
        );
        expect(getByText("You're in.")).toBeTruthy();
    });

    it('view variant: shows the saved-receipt eyebrow + title', () => {
        const { getByText, queryByText } = render(
            <RegistrationReceiptCard event={paidEvent} registration={paidRegistration} variant="view" />,
        );
        expect(getByText(/Your registration/i)).toBeTruthy();
        expect(getByText('Diwali Dance Showcase')).toBeTruthy();
        expect(queryByText("You're in.")).toBeNull();
    });

    it('flex_24h refund policy: shows flexible copy', () => {
        const { getByText } = render(
            <RegistrationReceiptCard event={paidEvent} registration={paidRegistration} variant="view" />,
        );
        expect(getByText(/Flexible refund policy/i)).toBeTruthy();
        expect(getByText(/Full refund up to 24h/)).toBeTruthy();
    });

    it('firm refund policy: shows no-refund copy', () => {
        const firmEvent = { ...paidEvent, pricing: { amount: 499, refundPolicy: 'firm' } };
        const { getByText } = render(
            <RegistrationReceiptCard event={firmEvent} registration={paidRegistration} variant="view" />,
        );
        expect(getByText(/No-refund policy/i)).toBeTruthy();
    });

    it('custom refund policy: shows organizer note', () => {
        const customEvent = {
            ...paidEvent,
            pricing: {
                amount: 499,
                refundPolicy: 'custom',
                refundCustomNote: 'Full refund up to 7 days before, 50% within 7 days.',
            },
        };
        const { getByText } = render(
            <RegistrationReceiptCard event={customEvent} registration={paidRegistration} variant="view" />,
        );
        expect(getByText(/Custom refund policy/i)).toBeTruthy();
        expect(getByText(/Full refund up to 7 days before/)).toBeTruthy();
    });

    describe('ticket markup', () => {
        it('single ticket → ADMIT ONE band', () => {
            const single = { ...paidRegistration, attendeeCount: 1 };
            const { getByText } = render(
                <RegistrationReceiptCard event={paidEvent} registration={single} variant="view" />,
            );
            expect(getByText('ADMIT ONE')).toBeTruthy();
        });

        it('multi ticket → ADMIT N band', () => {
            const { getByText } = render(
                <RegistrationReceiptCard event={paidEvent} registration={paidRegistration} variant="view" />,
            );
            expect(getByText('ADMIT 3')).toBeTruthy();
        });

        it('paid event → TICKET band slug, free event → FREE PASS band slug', () => {
            const { getByText: paid } = render(
                <RegistrationReceiptCard event={paidEvent} registration={paidRegistration} variant="view" />,
            );
            expect(paid('TICKET')).toBeTruthy();

            const { getByText: free } = render(
                <RegistrationReceiptCard event={freeEvent} registration={freeRegistration} variant="view" />,
            );
            expect(free('FREE PASS')).toBeTruthy();
        });

        it('stub shows 6-char ticket reference (uppercase) + attendee name', () => {
            const { getByText } = render(
                <RegistrationReceiptCard event={paidEvent} registration={paidRegistration} variant="view" />,
            );
            // Razorpay payment_id ends in "a4UPGV" — uppercased last 6
            expect(getByText('A4UPGV')).toBeTruthy();
            expect(getByText('Anjali R')).toBeTruthy();
        });

        it('falls back to _id tail when no razorpayPaymentId / ticketCode', () => {
            const minimalRegistration = { _id: 'abc1234567890wxyz', attendeeCount: 1, attendeeName: 'Test User' };
            const { getByText } = render(
                <RegistrationReceiptCard event={freeEvent} registration={minimalRegistration} variant="view" />,
            );
            expect(getByText('90WXYZ')).toBeTruthy();
        });

        it('online event → shows platform + link-in-confirmation copy', () => {
            const onlineEvent = {
                ...freeEvent,
                location: { kind: 'online', onlinePlatform: 'Zoom' },
            };
            const { getByText } = render(
                <RegistrationReceiptCard event={onlineEvent as any} registration={freeRegistration} variant="view" />,
            );
            expect(getByText('Zoom')).toBeTruthy();
            expect(getByText(/Link in your confirmation/i)).toBeTruthy();
        });
    });
});
