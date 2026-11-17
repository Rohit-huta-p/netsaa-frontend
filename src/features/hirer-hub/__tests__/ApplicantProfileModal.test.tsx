import React from 'react';
import { fireEvent, render, within } from '@testing-library/react-native';

// Isolate the modal's own logic (whole-card paging, per-card stage-aware bar,
// counter, callbacks, haptics).
jest.mock('expo-blur', () => ({ BlurView: ({ children }: any) => children ?? null }));
jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(() => Promise.resolve()),
    selectionAsync: jest.fn(() => Promise.resolve()),
    ImpactFeedbackStyle: { Light: 'light' },
}));
jest.mock('@/stores/uiStore', () => ({
    useUiStore: { getState: () => ({ pushFullscreenOverlay: jest.fn(), popFullscreenOverlay: jest.fn() }) },
}));
// The per-page body is tested on its own; here it's a stand-in that prints the name.
jest.mock('../components/ApplicantProfileBody', () => ({
    ApplicantProfileBody: ({ application }: any) => {
        const ReactLocal = require('react');
        const { Text } = require('react-native');
        return ReactLocal.createElement(Text, null, application?.artistSnapshot?.displayName);
    },
}));

import * as Haptics from 'expo-haptics';
import { ApplicantProfileModal } from '../components/ApplicantProfileModal';

// Each page is a whole card with its own bar (jest renders every page), so bar
// assertions are scoped to a card by its testID (the application _id).
const APPS = [
    { _id: 'a1', status: 'applied', artistId: 'u1', artistSnapshot: { displayName: 'Meera' }, coverNote: 'I can lead the sangeet set.' },
    { _id: 'a2', status: 'shortlisted', artistId: 'u2', artistSnapshot: { displayName: 'Kavya' }, coverNote: 'Ten years on stage.' },
    { _id: 'a3', status: 'hired', artistId: 'u3', artistSnapshot: { displayName: 'Priya' }, coverNote: '' },
];

const noopProps = {
    onClose: jest.fn(), onPass: jest.fn(), onShortlist: jest.fn(),
    onHire: jest.fn(), onMessage: jest.fn(), onRemove: jest.fn(), onOpenFullProfile: jest.fn(),
};

describe('ApplicantProfileModal', () => {
    it('gives each card a stage-aware bar (applied → Pass·Shortlist, shortlisted → Pass·Hire, hired → Message·Remove)', () => {
        const { getByTestId } = render(
            <ApplicantProfileModal applications={APPS} initialIndex={0} {...noopProps} />
        );
        const applied = within(getByTestId('a1'));
        expect(applied.getByText('Pass')).toBeTruthy();
        expect(applied.getByText('Shortlist')).toBeTruthy();

        const shortlisted = within(getByTestId('a2'));
        expect(shortlisted.getByText('Pass')).toBeTruthy();
        expect(shortlisted.getByText('Hire')).toBeTruthy();

        const hired = within(getByTestId('a3'));
        expect(hired.getByText('Message')).toBeTruthy();
        expect(hired.getByText('Remove')).toBeTruthy();
    });

    it('shows the page counter at the start index', () => {
        const { getByText } = render(
            <ApplicantProfileModal applications={APPS} initialIndex={0} {...noopProps} />
        );
        expect(getByText('1 / 3')).toBeTruthy();
    });

    it('Shortlist fires with the card id and auto-advances the counter', () => {
        const onShortlist = jest.fn();
        const { getByTestId, getByText } = render(
            <ApplicantProfileModal applications={APPS} initialIndex={0} {...noopProps} onShortlist={onShortlist} />
        );
        fireEvent.press(within(getByTestId('a1')).getByText('Shortlist'));
        expect(onShortlist).toHaveBeenCalledWith('a1');
        expect(getByText('2 / 3')).toBeTruthy();
    });

    it('Pass fires with the card id and auto-advances', () => {
        const onPass = jest.fn();
        const { getByTestId, getByText } = render(
            <ApplicantProfileModal applications={APPS} initialIndex={0} {...noopProps} onPass={onPass} />
        );
        fireEvent.press(within(getByTestId('a1')).getByText('Pass'));
        expect(onPass).toHaveBeenCalledWith('a1');
        expect(getByText('2 / 3')).toBeTruthy();
    });

    it('a chevron pages to the next applicant', () => {
        const { getByLabelText, getByText } = render(
            <ApplicantProfileModal applications={APPS} initialIndex={0} {...noopProps} />
        );
        fireEvent.press(getByLabelText('Next applicant'));
        expect(getByText('2 / 3')).toBeTruthy();
    });

    it('single-item mode (Discussion) hides the chevrons and the counter', () => {
        const { queryByLabelText, queryByText } = render(
            <ApplicantProfileModal applications={[APPS[0]]} initialIndex={0} {...noopProps} />
        );
        expect(queryByLabelText('Next applicant')).toBeNull();
        expect(queryByLabelText('Previous applicant')).toBeNull();
        expect(queryByText('1 / 1')).toBeNull();
    });

    it('fires a selection haptic on paging and an impact haptic on a decision', () => {
        const { getByTestId, getByLabelText } = render(
            <ApplicantProfileModal applications={APPS} initialIndex={0} {...noopProps} />
        );
        (Haptics.selectionAsync as jest.Mock).mockClear();
        (Haptics.impactAsync as jest.Mock).mockClear();
        fireEvent.press(getByLabelText('Next applicant'));
        expect(Haptics.selectionAsync).toHaveBeenCalled();
        fireEvent.press(within(getByTestId('a1')).getByText('Pass'));
        expect(Haptics.impactAsync).toHaveBeenCalled();
    });

    it('Hire hands off to the confirm flow (no auto-advance here)', () => {
        const onHire = jest.fn();
        const { getByTestId } = render(
            <ApplicantProfileModal applications={APPS} initialIndex={0} {...noopProps} onHire={onHire} />
        );
        fireEvent.press(within(getByTestId('a2')).getByText('Hire'));
        expect(onHire).toHaveBeenCalledWith('a2');
    });
});
