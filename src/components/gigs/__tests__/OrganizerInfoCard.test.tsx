// src/components/gigs/__tests__/OrganizerInfoCard.test.tsx
//
// Plan 5 — gig detail redesign. Renders the producer card with the new
// gigsHosted + avgReplyMinutes fields surfaced alongside the rating row.

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

    it('renders reply speed in minutes when < 60m', () => {
        const { getByTestId } = render(
            <OrganizerInfoCard organizerId="org-1" avgReplyMinutes={45} />
        );
        expect(getByTestId('organizer-reply-speed').props.children).toBe('Replies in <45m');
    });

    it('renders reply speed in hours with 1 decimal when 1-9.9h', () => {
        const { getByTestId } = render(
            <OrganizerInfoCard organizerId="org-1" avgReplyMinutes={150} />
        );
        // 150min / 60 = 2.5h → "Replies in <2.5h"
        expect(getByTestId('organizer-reply-speed').props.children).toBe('Replies in <2.5h');
    });

    it('hides reply speed when > 24h (stale signal)', () => {
        const { queryByTestId } = render(
            <OrganizerInfoCard organizerId="org-1" avgReplyMinutes={25 * 60} />
        );
        expect(queryByTestId('organizer-reply-speed')).toBeNull();
    });

    it('hides reply speed when undefined', () => {
        const { queryByTestId } = render(
            <OrganizerInfoCard organizerId="org-1" />
        );
        expect(queryByTestId('organizer-reply-speed')).toBeNull();
    });

    it('renders both gigsHosted and reply speed together when both set', () => {
        const { getByTestId } = render(
            <OrganizerInfoCard
                organizerId="org-1"
                gigsHosted={12}
                avgReplyMinutes={30}
            />
        );
        expect(getByTestId('organizer-gigs-hosted')).toBeTruthy();
        expect(getByTestId('organizer-reply-speed')).toBeTruthy();
    });
});
