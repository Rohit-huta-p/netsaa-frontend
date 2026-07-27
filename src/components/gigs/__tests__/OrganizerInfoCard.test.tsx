// src/components/gigs/__tests__/OrganizerInfoCard.test.tsx
//
// Gig detail — producer card. V4 redesign: name + blue verified tick + a
// single dynamic "N gigs hosted" line (star rating + reply-speed removed).

import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
    useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

import { OrganizerInfoCard } from '../OrganizerInfoCard';

describe('OrganizerInfoCard — Plan 5 trust signals', () => {
    it('renders gigsHosted when > 0', () => {
        const { getByTestId } = render(
            <OrganizerInfoCard
                organizerId="org-1"
                displayName="Priya Productions"
                rating={4.8}
                gigsHosted={24}
            />
        );
        expect(getByTestId('organizer-gigs-hosted').props.children.join('')).toContain('24');
        expect(getByTestId('organizer-gigs-hosted').props.children.join('')).toContain('gigs hosted');
    });

    it('uses singular "gig" when count is 1', () => {
        const { getByTestId } = render(
            <OrganizerInfoCard organizerId="org-1" gigsHosted={1} />
        );
        const text = getByTestId('organizer-gigs-hosted').props.children.join('');
        expect(text).toContain('1 gig hosted');
    });

    it('hides gigsHosted line when count is 0', () => {
        const { queryByTestId } = render(
            <OrganizerInfoCard organizerId="org-1" gigsHosted={0} />
        );
        expect(queryByTestId('organizer-gigs-hosted')).toBeNull();
    });

    it('hides gigsHosted line when undefined', () => {
        const { queryByTestId } = render(
            <OrganizerInfoCard organizerId="org-1" />
        );
        expect(queryByTestId('organizer-gigs-hosted')).toBeNull();
    });

    it('renders a blue verified tick only when isVerified', () => {
        const { getByTestId, queryByTestId, rerender } = render(
            <OrganizerInfoCard organizerId="org-1" isVerified />
        );
        expect(getByTestId('organizer-verified-tick')).toBeTruthy();
        rerender(<OrganizerInfoCard organizerId="org-1" />);
        expect(queryByTestId('organizer-verified-tick')).toBeNull();
    });

    it('no longer renders a reply-speed line', () => {
        const { queryByTestId } = render(
            <OrganizerInfoCard organizerId="org-1" avgReplyMinutes={30} />
        );
        expect(queryByTestId('organizer-reply-speed')).toBeNull();
    });
});
