// netsa-mobile/src/features/team/__tests__/TeamRosterCard.test.tsx
//
// PAYMENTS-DISABLED (Apr 29): the 5-state matrix + per-artist payment
// accumulation line + Record-payment button are gone from the card.
// Tests reduced to: Contact button always present, name tap routes to
// profile, role/amount sub-line renders, fallback to "Artist".

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

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

describe('TeamRosterCard', () => {
    it('renders avatar + name + amount + role + Contact button', () => {
        const { getByLabelText, getByText } = render(
            <TeamRosterCard
                application={sampleApp}
                gig={sampleGig}
                onContact={jest.fn()}
                onOpenProfile={jest.fn()}
            />
        );
        expect(getByLabelText(/Contact Priya Sharma/i)).toBeTruthy();
        expect(getByText(/50,000/)).toBeTruthy();
        expect(getByText(/Lead dancer/)).toBeTruthy();
    });

    it('Contact tap fires onContact with the application', () => {
        const onContact = jest.fn();
        const { getByLabelText } = render(
            <TeamRosterCard
                application={sampleApp}
                gig={sampleGig}
                onContact={onContact}
                onOpenProfile={jest.fn()}
            />
        );
        fireEvent.press(getByLabelText(/Contact Priya Sharma/i));
        expect(onContact).toHaveBeenCalledWith(sampleApp);
    });

    it('name tap routes via onOpenProfile callback', () => {
        const onOpen = jest.fn();
        const { getByLabelText } = render(
            <TeamRosterCard
                application={sampleApp}
                gig={sampleGig}
                onContact={jest.fn()}
                onOpenProfile={onOpen}
            />
        );
        fireEvent.press(getByLabelText(/Open profile for Priya Sharma/i));
        expect(onOpen).toHaveBeenCalledWith('artist1');
    });

    it('falls back to "Artist" when displayName is missing', () => {
        const { getByLabelText } = render(
            <TeamRosterCard
                application={{ _id: 'app1', artistId: 'artist1', artistSnapshot: undefined }}
                gig={sampleGig}
                onContact={jest.fn()}
                onOpenProfile={jest.fn()}
            />
        );
        expect(getByLabelText(/Contact Artist/i)).toBeTruthy();
    });
});
