// netsa-mobile/src/features/hirer-hub/__tests__/HubTeamRowPayment.test.tsx
//
// PAYMENTS-DISABLED (Apr 29): payment status pill + transactions hook
// removed from the row. Tests check the surviving behavior: avatar +
// name + amount + role + Contact button + tap-to-team-page.

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

const mockPush = jest.fn();
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
    mockPush.mockClear();
});

describe('HubTeamRowPayment', () => {
    it('renders Contact button, name, amount, role', () => {
        const { getByLabelText, getByText } = render(
            <HubTeamRowPayment
                application={sampleApp}
                gig={sampleGig}
                onRequestContact={jest.fn()}
            />
        );
        expect(getByLabelText(/Contact Priya Sharma/i)).toBeTruthy();
        expect(getByText(/50,000/)).toBeTruthy();
        expect(getByText('Lead dancer')).toBeTruthy();
    });

    it('Contact tap fires onRequestContact with the application', () => {
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

    it('falls back to "Artist" when displayName missing', () => {
        const { getByLabelText } = render(
            <HubTeamRowPayment
                application={{ _id: 'app1', artistId: 'artist1', artistSnapshot: undefined }}
                gig={sampleGig}
                onRequestContact={jest.fn()}
            />
        );
        expect(getByLabelText(/Contact Artist/i)).toBeTruthy();
    });
});
