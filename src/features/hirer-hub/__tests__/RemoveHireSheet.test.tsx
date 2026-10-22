// src/features/hirer-hub/__tests__/RemoveHireSheet.test.tsx
//
// The Remove-hire confirm sheet spells out the cascade (slot reopens, back to
// shortlist, artist notified, no payment impact) and only on "Remove & reopen
// slot" fires the demote (hired -> shortlisted). "Keep hired" just closes.

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RemoveHireSheet } from '../components/RemoveHireSheet';

const sample = {
    _id: 'app1',
    artistId: 'u1',
    status: 'hired',
    artistSnapshot: { displayName: 'Meera Desai', artistType: 'Dancer', primaryCity: 'Pune' },
};

describe('RemoveHireSheet', () => {
    it('returns null when not visible', () => {
        const { toJSON } = render(
            <RemoveHireSheet visible={false} application={sample} hiredCount={2} slotsTotal={4} onClose={jest.fn()} onConfirm={jest.fn()} />
        );
        expect(toJSON()).toBeNull();
    });

    it('returns null when there is no application', () => {
        const { toJSON } = render(
            <RemoveHireSheet visible application={null} hiredCount={2} slotsTotal={4} onClose={jest.fn()} onConfirm={jest.fn()} />
        );
        expect(toJSON()).toBeNull();
    });

    it('renders the cascade: slot math, shortlist, notify-by-first-name, no payment', () => {
        const { getByText } = render(
            <RemoveHireSheet visible application={sample} hiredCount={2} slotsTotal={4} onClose={jest.fn()} onConfirm={jest.fn()} />
        );
        expect(getByText('Remove from the cast?')).toBeTruthy();
        // who-row sub line
        expect(getByText('Hired · Dancer · Pune')).toBeTruthy();
        expect(getByText('Reopens 1 slot')).toBeTruthy();
        expect(getByText(/Hired goes 2 → 1 of 4 · 3 slots open again/)).toBeTruthy();
        expect(getByText('Back to your shortlist')).toBeTruthy();
        // notify line uses the FIRST name only (no pronoun guess)
        expect(getByText('Meera is notified')).toBeTruthy();
        expect(getByText('No payment impact')).toBeTruthy();
    });

    it('Keep hired closes without demoting', () => {
        const onClose = jest.fn();
        const onConfirm = jest.fn();
        const { getByLabelText } = render(
            <RemoveHireSheet visible application={sample} hiredCount={2} slotsTotal={4} onClose={onClose} onConfirm={onConfirm} />
        );
        fireEvent.press(getByLabelText('Keep Meera Desai hired'));
        expect(onClose).toHaveBeenCalled();
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it('Remove & reopen slot confirms with the application id', () => {
        const onConfirm = jest.fn();
        const { getByLabelText } = render(
            <RemoveHireSheet visible application={sample} hiredCount={2} slotsTotal={4} onClose={jest.fn()} onConfirm={onConfirm} />
        );
        fireEvent.press(getByLabelText('Remove Meera Desai and reopen the slot'));
        expect(onConfirm).toHaveBeenCalledWith('app1');
    });

    it('falls back to a generic slot line when slotsTotal is unknown (0)', () => {
        const { getByText, queryByText } = render(
            <RemoveHireSheet visible application={sample} hiredCount={1} slotsTotal={0} onClose={jest.fn()} onConfirm={jest.fn()} />
        );
        expect(getByText('The slot reopens for applications')).toBeTruthy();
        expect(queryByText(/of 0/)).toBeNull();
    });
});
