// netsa-mobile/src/features/hirer-hub/__tests__/HubTeamSection.test.tsx
//
// Post contract-rollback (Apr 28): HubTeamSection now mounts
// HubTeamRowPayment (payment-driven) instead of the contract-driven
// HubTeamRow. The previous contract-CTA navigation cases are no longer
// applicable — restore them when contracts come back.
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { HubTeamSection } from '../components/HubTeamSection';

// HubTeamRowPayment loads useApplicationTransactions from usePayments —
// mock at module boundary so authStore + expo-secure-store don't pull in.
let mockTransactions: any = [];
jest.mock('@/hooks/usePayments', () => ({
    useApplicationTransactions: () => ({ data: mockTransactions, isLoading: false }),
}));

beforeEach(() => {
    mockTransactions = [];
});

const sampleApplication = {
    _id: 'a1',
    artistId: 'artist1',
    artistSnapshot: { displayName: 'Priya Sharma' },
};
const sampleGig = { _id: 'g1', compensation: { amount: 50000 } };
const sampleTeamRow = { application: sampleApplication, contract: null };

describe('HubTeamSection', () => {
    it('renders team rows + empty slots', () => {
        const { getByText } = render(
            <HubTeamSection
                teamRows={[sampleTeamRow as any]}
                gig={sampleGig}
                slotsTotal={3}
                pendingApplicantsCount={5}
                onRequestRecordPayment={jest.fn()}
            />
        );
        expect(getByText('Your team')).toBeTruthy();
        expect(getByText('Priya Sharma')).toBeTruthy();
        expect(getByText(/2 more slots needed/)).toBeTruthy();
    });

    it('hides empty slots when team is full', () => {
        const { queryByText } = render(
            <HubTeamSection
                teamRows={[sampleTeamRow as any]}
                gig={sampleGig}
                slotsTotal={1}
                pendingApplicantsCount={0}
                onRequestRecordPayment={jest.fn()}
            />
        );
        expect(queryByText(/more slot/)).toBeNull();
    });

    it('shows "Record payment" CTA when there are no transactions for that hire', () => {
        const onRequest = jest.fn();
        const { getByLabelText } = render(
            <HubTeamSection
                teamRows={[sampleTeamRow as any]}
                gig={sampleGig}
                slotsTotal={1}
                pendingApplicantsCount={0}
                onRequestRecordPayment={onRequest}
            />
        );
        fireEvent.press(getByLabelText(/Record payment to Priya Sharma/i));
        expect(onRequest).toHaveBeenCalledWith(sampleApplication);
    });

    it('shows status pill instead of CTA when transactions exist', () => {
        mockTransactions = [
            { _id: 't1', status: 'recorded', amount: 50000, createdAt: '2027-03-15T10:00:00Z' },
        ];
        const { queryByLabelText, getByText } = render(
            <HubTeamSection
                teamRows={[sampleTeamRow as any]}
                gig={sampleGig}
                slotsTotal={1}
                pendingApplicantsCount={0}
                onRequestRecordPayment={jest.fn()}
            />
        );
        expect(queryByLabelText(/Record payment to/)).toBeNull();
        expect(getByText('Pending confirmation')).toBeTruthy();
    });
});
