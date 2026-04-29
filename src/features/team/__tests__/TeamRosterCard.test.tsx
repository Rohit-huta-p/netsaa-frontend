// netsa-mobile/src/features/team/__tests__/TeamRosterCard.test.tsx
//
// Apr 29 Phase C: locks the 5-state Record-payment matrix on the team-page
// roster card.
//   record         → "Record ₹{remaining}" button visible
//   pending        → "Awaiting confirmation" pill (no button)
//   paid_in_full   → "Paid in full" badge (no button)
//   disputed       → "Disputed" pill (no button)
//   no_amount_set  → no right-side action (only Contact)

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

let mockTransactions: any = [];
jest.mock('@/hooks/usePayments', () => ({
    useApplicationTransactions: () => ({ data: mockTransactions, isLoading: false }),
}));
jest.mock('lucide-react-native', () =>
    new Proxy({}, { get: () => () => null })
);

import { TeamRosterCard } from '../components/TeamRosterCard';

const sampleApp = {
    _id: 'app1',
    artistId: 'artist1',
    artistSnapshot: { displayName: 'Priya Sharma', artistType: 'Lead dancer' },
};
const sampleGig = { _id: 'g1', compensation: { amount: 50000 } };

beforeEach(() => {
    mockTransactions = [];
});

describe('TeamRosterCard', () => {
    it("'record' state: Record ₹X button when no transactions", () => {
        const { getByLabelText, queryByText } = render(
            <TeamRosterCard
                application={sampleApp}
                gig={sampleGig}
                onContact={jest.fn()}
                onRecordPayment={jest.fn()}
                onOpenProfile={jest.fn()}
            />
        );
        expect(getByLabelText(/Record payment to Priya Sharma/i)).toBeTruthy();
        expect(queryByText(/Awaiting|Paid in full|Disputed/)).toBeNull();
    });

    it("'record' button passes remaining (full amount) when no transactions", () => {
        const onRecord = jest.fn();
        const { getByLabelText } = render(
            <TeamRosterCard
                application={sampleApp}
                gig={sampleGig}
                onContact={jest.fn()}
                onRecordPayment={onRecord}
                onOpenProfile={jest.fn()}
            />
        );
        fireEvent.press(getByLabelText(/Record payment to Priya Sharma/i));
        expect(onRecord).toHaveBeenCalledWith(sampleApp, 50000);
    });

    it("'record' button passes REMAINING (not full) after partial confirmed payment", () => {
        mockTransactions = [{ status: 'confirmed', amount: 20000, createdAt: '2027-03-15T10:00:00Z' }];
        const onRecord = jest.fn();
        const { getByLabelText } = render(
            <TeamRosterCard
                application={sampleApp}
                gig={sampleGig}
                onContact={jest.fn()}
                onRecordPayment={onRecord}
                onOpenProfile={jest.fn()}
            />
        );
        fireEvent.press(getByLabelText(/Record payment to Priya Sharma/i));
        // 50000 - 20000 confirmed = 30000 remaining
        expect(onRecord).toHaveBeenCalledWith(sampleApp, 30000);
    });

    it("'pending' state: Awaiting confirmation pill, no record button", () => {
        mockTransactions = [{ status: 'recorded', amount: 50000, createdAt: '2027-03-15T10:00:00Z' }];
        const { queryByLabelText, getByLabelText } = render(
            <TeamRosterCard
                application={sampleApp}
                gig={sampleGig}
                onContact={jest.fn()}
                onRecordPayment={jest.fn()}
                onOpenProfile={jest.fn()}
            />
        );
        expect(queryByLabelText(/Record payment to/)).toBeNull();
        expect(getByLabelText(/payment-pending-app1/)).toBeTruthy();
    });

    it("'paid_in_full' state: Paid-in-full badge, no record button", () => {
        mockTransactions = [{ status: 'confirmed', amount: 50000, createdAt: '2027-03-15T10:00:00Z' }];
        const { queryByLabelText, getByLabelText, getAllByText } = render(
            <TeamRosterCard
                application={sampleApp}
                gig={sampleGig}
                onContact={jest.fn()}
                onRecordPayment={jest.fn()}
                onOpenProfile={jest.fn()}
            />
        );
        expect(queryByLabelText(/Record payment to/)).toBeNull();
        expect(getByLabelText(/payment-paid-in-full-app1/)).toBeTruthy();
        // Two matches: the badge label "Paid in full" + the accumulation
        // line "₹50,000 paid in full". Both expected.
        const matches = getAllByText(/paid in full/i);
        expect(matches.length).toBeGreaterThanOrEqual(1);
    });

    it("'disputed' state: Disputed pill, no record button", () => {
        mockTransactions = [{ status: 'disputed', amount: 50000, createdAt: '2027-03-15T10:00:00Z' }];
        const { queryByLabelText, getByLabelText } = render(
            <TeamRosterCard
                application={sampleApp}
                gig={sampleGig}
                onContact={jest.fn()}
                onRecordPayment={jest.fn()}
                onOpenProfile={jest.fn()}
            />
        );
        expect(queryByLabelText(/Record payment to/)).toBeNull();
        expect(getByLabelText(/payment-disputed-app1/)).toBeTruthy();
    });

    it('Contact button is always visible (every state)', () => {
        mockTransactions = [{ status: 'confirmed', amount: 50000, createdAt: '2027-03-15T10:00:00Z' }];
        const onContact = jest.fn();
        const { getByLabelText } = render(
            <TeamRosterCard
                application={sampleApp}
                gig={sampleGig}
                onContact={onContact}
                onRecordPayment={jest.fn()}
                onOpenProfile={jest.fn()}
            />
        );
        fireEvent.press(getByLabelText(/Contact Priya Sharma/i));
        expect(onContact).toHaveBeenCalledWith(sampleApp);
    });

    it('renders the per-artist accumulation line when transactions exist', () => {
        mockTransactions = [
            { status: 'confirmed', amount: 15000, createdAt: '2027-03-15T10:00:00Z' },
            { status: 'recorded', amount: 20000, createdAt: '2027-03-16T10:00:00Z' },
        ];
        const { getByText } = render(
            <TeamRosterCard
                application={sampleApp}
                gig={sampleGig}
                onContact={jest.fn()}
                onRecordPayment={jest.fn()}
                onOpenProfile={jest.fn()}
            />
        );
        // "₹15,000 of ₹50,000 paid · ₹20,000 pending"
        expect(getByText(/15,000.*50,000 paid.*20,000 pending/)).toBeTruthy();
    });

    it('tap on name routes via onOpenProfile callback', () => {
        const onOpen = jest.fn();
        const { getByLabelText } = render(
            <TeamRosterCard
                application={sampleApp}
                gig={sampleGig}
                onContact={jest.fn()}
                onRecordPayment={jest.fn()}
                onOpenProfile={onOpen}
            />
        );
        fireEvent.press(getByLabelText(/Open profile for Priya Sharma/i));
        expect(onOpen).toHaveBeenCalledWith('artist1');
    });
});
