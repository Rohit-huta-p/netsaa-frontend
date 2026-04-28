// netsa-mobile/src/features/hirer-hub/__tests__/HubTeamRowPayment.test.tsx
//
// Locks the Apr 29 row redesign: contact button (replaces Record payment),
// role sub-line, name-tap to profile, row-tap to team page, status pill
// when transactions exist.
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

let mockTransactions: any = [];
const mockPush = jest.fn();

jest.mock('@/hooks/usePayments', () => ({
    useApplicationTransactions: () => ({ data: mockTransactions, isLoading: false }),
}));
jest.mock('expo-router', () => ({
    useRouter: () => ({ push: mockPush }),
}));

import { HubTeamRowPayment } from '../components/HubTeamRowPayment';

const sampleApp = {
    _id: 'app1',
    artistId: 'artist1',
    artistSnapshot: { displayName: 'Priya Sharma', artistType: 'Lead dancer' },
};
const sampleGig = { _id: 'g1', compensation: { amount: 50000 } };

beforeEach(() => {
    mockTransactions = [];
    mockPush.mockClear();
});

describe('HubTeamRowPayment', () => {
    it('renders Contact button (no Record-payment CTA)', () => {
        const onRequest = jest.fn();
        const { getByLabelText, queryByLabelText } = render(
            <HubTeamRowPayment
                application={sampleApp}
                gig={sampleGig}
                onRequestContact={onRequest}
            />
        );

        expect(getByLabelText(/Contact Priya Sharma/i)).toBeTruthy();
        // Record-payment was removed in the redesign.
        expect(queryByLabelText(/Record payment/i)).toBeNull();
    });

    it('contact tap fires onRequestContact with the application', () => {
        const onRequest = jest.fn();
        const { getByLabelText } = render(
            <HubTeamRowPayment
                application={sampleApp}
                gig={sampleGig}
                onRequestContact={onRequest}
            />
        );

        fireEvent.press(getByLabelText(/Contact Priya Sharma/i));
        expect(onRequest).toHaveBeenCalledWith(sampleApp);
    });

    it('name tap routes to artist profile', () => {
        const { getByLabelText } = render(
            <HubTeamRowPayment
                application={sampleApp}
                gig={sampleGig}
                onRequestContact={jest.fn()}
            />
        );
        fireEvent.press(getByLabelText(/Open profile for Priya Sharma/i));
        expect(mockPush).toHaveBeenCalledWith('/(app)/profile/artist1');
    });

    it('row-body tap routes to the team page', () => {
        const { getByLabelText } = render(
            <HubTeamRowPayment
                application={sampleApp}
                gig={sampleGig}
                onRequestContact={jest.fn()}
            />
        );
        fireEvent.press(getByLabelText('team-row-app1'));
        expect(mockPush).toHaveBeenCalledWith('/(app)/gigs/g1/team');
    });

    it('renders the role sub-line when artistType is set', () => {
        const { getByText } = render(
            <HubTeamRowPayment
                application={sampleApp}
                gig={sampleGig}
                onRequestContact={jest.fn()}
            />
        );
        expect(getByText('Lead dancer')).toBeTruthy();
    });

    it('shows status pill when transactions exist (CTA still present — Contact never disappears)', () => {
        mockTransactions = [
            { _id: 't1', status: 'recorded', amount: 50000, createdAt: '2027-03-15T10:00:00Z' },
        ];
        const { getByText, getByLabelText } = render(
            <HubTeamRowPayment
                application={sampleApp}
                gig={sampleGig}
                onRequestContact={jest.fn()}
            />
        );

        expect(getByText('Pending confirmation')).toBeTruthy();
        // Contact button stays visible regardless of payment state.
        expect(getByLabelText(/Contact Priya Sharma/i)).toBeTruthy();
    });

    it('falls back to "Artist" when displayName is missing', () => {
        const { getByLabelText } = render(
            <HubTeamRowPayment
                application={{ _id: 'app1', artistId: 'artist1', artistSnapshot: undefined }}
                gig={sampleGig}
                onRequestContact={jest.fn()}
            />
        );
        expect(getByLabelText(/Contact Artist/i)).toBeTruthy();
    });

    it('renders the gig amount', () => {
        const { getByText } = render(
            <HubTeamRowPayment
                application={sampleApp}
                gig={sampleGig}
                onRequestContact={jest.fn()}
            />
        );
        expect(getByText(/50,000/)).toBeTruthy();
    });
});
