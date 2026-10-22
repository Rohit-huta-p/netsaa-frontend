// src/features/hirer-hub/__tests__/HubTeamSection.test.tsx
//
// "The cast": hired artists render as card D (hired state), framed by a slot
// bar, with a row per still-open slot (Fill → applicants). Message/Remove on a
// cast card fire the Hub handlers; Remove opens the Remove-hire confirm sheet.

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

describe('HubTeamSection — the cast', () => {
    it('renders the cast header, a card per hire, the slot bar note, and open-slot rows', () => {
        const { getByText, getAllByText, getByLabelText } = render(
            <HubTeamSection
                teamRows={[sampleTeamRow as any]}
                slotsTotal={3}
                venueCity="Pune"
                onFillSlot={jest.fn()}
            />
        );
        expect(getByText('The cast')).toBeTruthy();
        expect(getByText('Priya Sharma')).toBeTruthy();
        expect(getByText(/1 of 3 slots filled · 2 open/i)).toBeTruthy();
        // two open slots → two "Open slot" rows
        expect(getAllByText('Open slot')).toHaveLength(2);
        expect(getByText('Slot 2 of 3')).toBeTruthy();
        expect(getByText('Slot 3 of 3')).toBeTruthy();
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

    it('hides open-slot rows when the cast is full', () => {
        const { queryByText, getByText } = render(
            <HubTeamSection
                teamRows={[sampleTeamRow as any]}
                slotsTotal={1}
                onFillSlot={jest.fn()}
            />
        );
        expect(queryByText('Open slot')).toBeNull();
        expect(getByText(/1 of 1 slots filled/i)).toBeTruthy();
    });
});
