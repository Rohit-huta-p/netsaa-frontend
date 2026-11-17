import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

// Isolate the modal's own logic (paging, stage-aware bar, counter, callbacks).
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
    it('shows the applied bar (Pass · Shortlist) and the page counter at the start index', () => {
        const { getByText } = render(
            <ApplicantProfileModal applications={APPS} initialIndex={0} {...noopProps} />
        );
        expect(getByText('Pass')).toBeTruthy();
        expect(getByText('Shortlist')).toBeTruthy();
        expect(getByText('1 / 3')).toBeTruthy();
    });

    it('Shortlist fires the callback with the current id, then auto-advances and re-stages the bar', () => {
        const onShortlist = jest.fn();
        const { getByText, queryByText } = render(
            <ApplicantProfileModal applications={APPS} initialIndex={0} {...noopProps} onShortlist={onShortlist} />
        );
        fireEvent.press(getByText('Shortlist'));
        expect(onShortlist).toHaveBeenCalledWith('a1');
        // advanced to a2 (shortlisted) → the bar becomes Pass · Hire
        expect(getByText('Hire')).toBeTruthy();
        expect(queryByText('Shortlist')).toBeNull();
        expect(getByText('2 / 3')).toBeTruthy();
    });

    it('Pass fires the callback and advances', () => {
        const onPass = jest.fn();
        const { getByText } = render(
            <ApplicantProfileModal applications={APPS} initialIndex={0} {...noopProps} onPass={onPass} />
        );
        fireEvent.press(getByText('Pass'));
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

    it('a hired applicant shows the Message · Remove bar', () => {
        const { getByText, queryByText } = render(
            <ApplicantProfileModal applications={[APPS[2]]} initialIndex={0} {...noopProps} />
        );
        expect(getByText('Message')).toBeTruthy();
        expect(getByText('Remove')).toBeTruthy();
        expect(queryByText('Shortlist')).toBeNull();
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
        const { getByLabelText } = render(
            <ApplicantProfileModal applications={APPS} initialIndex={0} {...noopProps} />
        );
        (Haptics.selectionAsync as jest.Mock).mockClear();
        (Haptics.impactAsync as jest.Mock).mockClear();
        fireEvent.press(getByLabelText('Next applicant'));
        expect(Haptics.selectionAsync).toHaveBeenCalled();
        fireEvent.press(getByLabelText('Pass'));
        expect(Haptics.impactAsync).toHaveBeenCalled();
    });

    it('Hire hands off to the confirm flow (no auto-advance here)', () => {
        const onHire = jest.fn();
        const { getByText } = render(
            <ApplicantProfileModal applications={[APPS[1]]} initialIndex={0} {...noopProps} onHire={onHire} />
        );
        fireEvent.press(getByText('Hire'));
        expect(onHire).toHaveBeenCalledWith('a2');
    });
});
