// src/features/hirer-hub/__tests__/HubTeamSection.test.tsx
//
// "The cast" body: hired artists render as card D (hired state); every still-
// open slot gets its own row with a Fill shortcut, closed off by a "Fill from
// shortlist" button. Message/Remove on a cast card fire the Hub handlers;
// Remove opens the Remove-hire confirm sheet upstream.
//
// The slot bar + "N of M" header that used to live here now sit in HubOverview
// (see HubOverview.test.tsx) — this section is just the cast body.

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { HubTeamSection } from '../components/HubTeamSection';

const sampleApp = {
    _id: 'a1',
    artistId: 'artist1',
    status: 'hired',
    artistSnapshot: { displayName: 'Priya Sharma', artistType: 'Dancer', primaryCity: 'Pune', specialities: ['Kathak'] },
};
const sampleTeamRow = { application: sampleApp, contract: null };

describe('HubTeamSection — the cast body', () => {
    it('renders a card per hire and a row per still-open slot', () => {
        const { getByText, getAllByText } = render(
            <HubTeamSection
                teamRows={[sampleTeamRow as any]}
                slotsTotal={3}
                venueCity="Pune"
                onFillSlot={jest.fn()}
            />
        );
        expect(getByText('Priya Sharma')).toBeTruthy();
        // 1 filled of 3 → two open slots
        expect(getAllByText('Open slot')).toHaveLength(2);
        expect(getByText('Slot 2 of 3')).toBeTruthy();
        expect(getByText('Slot 3 of 3')).toBeTruthy();
        expect(getByText('Fill from shortlist')).toBeTruthy();
    });

    it('Fill on an open slot fires onFillSlot', () => {
        const onFillSlot = jest.fn();
        const { getByLabelText } = render(
            <HubTeamSection
                teamRows={[sampleTeamRow as any]}
                slotsTotal={3}
                onFillSlot={onFillSlot}
            />
        );
        fireEvent.press(getByLabelText('Fill slot 2'));
        expect(onFillSlot).toHaveBeenCalled();
    });

    it('Message + Remove on a cast card fire the Hub handlers with the application id', () => {
        const onMessage = jest.fn();
        const onRemove = jest.fn();
        const { getByLabelText } = render(
            <HubTeamSection
                teamRows={[sampleTeamRow as any]}
                slotsTotal={1}
                onMessage={onMessage}
                onRemove={onRemove}
            />
        );
        fireEvent.press(getByLabelText('Message Priya Sharma'));
        expect(onMessage).toHaveBeenCalledWith('a1');
        fireEvent.press(getByLabelText('Remove Priya Sharma'));
        expect(onRemove).toHaveBeenCalledWith('a1');
    });

    it('hides open-slot rows and the fill button when the cast is full', () => {
        const { queryByText } = render(
            <HubTeamSection
                teamRows={[sampleTeamRow as any]}
                slotsTotal={1}
                onFillSlot={jest.fn()}
            />
        );
        expect(queryByText('Open slot')).toBeNull();
        expect(queryByText('Fill from shortlist')).toBeNull();
    });
});
