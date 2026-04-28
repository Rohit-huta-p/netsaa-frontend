// netsa-mobile/src/features/hirer-hub/__tests__/HubTeamRowPayment.test.tsx
//
// Locks the conditional CTA + status-pill behavior on the new payment row.
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

let mockTransactions: any = [];

jest.mock('@/hooks/usePayments', () => ({
    useApplicationTransactions: () => ({ data: mockTransactions, isLoading: false }),
}));

import { HubTeamRowPayment } from '../components/HubTeamRowPayment';

const sampleApp = {
    _id: 'app1',
    artistId: 'artist1',
    artistSnapshot: { displayName: 'Priya Sharma' },
};
const sampleGig = { _id: 'g1', compensation: { amount: 50000 } };

beforeEach(() => {
    mockTransactions = [];
});

describe('HubTeamRowPayment', () => {
    it('shows "Record payment" CTA when no transactions exist', () => {
        const onRequest = jest.fn();
        const { getByLabelText, queryByText } = render(
            <HubTeamRowPayment
                application={sampleApp}
                gig={sampleGig}
                onRequestRecordPayment={onRequest}
            />
        );

        expect(getByLabelText(/Record payment to Priya Sharma/i)).toBeTruthy();
        expect(queryByText(/Pending|Confirmed|Disputed/)).toBeNull();
    });

    it('CTA tap fires onRequestRecordPayment with the application', () => {
        const onRequest = jest.fn();
        const { getByLabelText } = render(
            <HubTeamRowPayment
                application={sampleApp}
                gig={sampleGig}
                onRequestRecordPayment={onRequest}
            />
        );

        fireEvent.press(getByLabelText(/Record payment to Priya Sharma/i));
        expect(onRequest).toHaveBeenCalledWith(sampleApp);
    });

    it('hides CTA + shows status pill when transactions exist', () => {
        mockTransactions = [
            { _id: 't1', status: 'recorded', amount: 50000, createdAt: '2027-03-15T10:00:00Z' },
        ];
        const { queryByLabelText, getByText } = render(
            <HubTeamRowPayment
                application={sampleApp}
                gig={sampleGig}
                onRequestRecordPayment={jest.fn()}
            />
        );

        expect(queryByLabelText(/Record payment to/)).toBeNull();
        expect(getByText('Pending confirmation')).toBeTruthy();
    });

    it('falls back to "Artist" when displayName is missing', () => {
        const onRequest = jest.fn();
        const { getByLabelText } = render(
            <HubTeamRowPayment
                application={{ _id: 'app1', artistId: 'artist1', artistSnapshot: undefined }}
                gig={sampleGig}
                onRequestRecordPayment={onRequest}
            />
        );
        expect(getByLabelText(/Record payment to Artist/i)).toBeTruthy();
    });

    it('renders the gig amount in the row', () => {
        const { getByText } = render(
            <HubTeamRowPayment
                application={sampleApp}
                gig={sampleGig}
                onRequestRecordPayment={jest.fn()}
            />
        );
        expect(getByText(/50,000/)).toBeTruthy();
    });
});
