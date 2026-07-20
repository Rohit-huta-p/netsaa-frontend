// src/components/gigs/__tests__/GigApplyModal.gate.test.tsx
//
// Task 7 — proves the apply flow opens the inline ProfileInterviewSheet
// (Surface E) on a server-side PROFILE_INCOMPLETE response, instead of
// bouncing the user out to the blocking ProfileCompletionModal.
//
// Unlike the sibling GigApplyModal.success/contract-preview tests, this
// suite deliberately does NOT mock '@/components/profile/completion' (or
// ProfileCompletionModal) — the REAL ProfileInterviewSheet must render so
// its question text is assertable on screen.

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

const mockMutate = jest.fn((_vars: any, opts: any) =>
    opts.onError({
        response: {
            data: {
                meta: {
                    message: 'PROFILE_INCOMPLETE',
                    score: 40,
                    missing: ['Profile Photo', 'Artist Type'],
                },
            },
        },
    })
);
jest.mock('@/hooks/useGigApplications', () => ({
    useApplyToGig: () => ({
        mutate: mockMutate,
        mutateAsync: jest.fn(),
        isPending: false,
    }),
}));
jest.mock('@/services/draftService', () => ({
    __esModule: true,
    draftService: { get: jest.fn(), upsert: jest.fn(), remove: jest.fn() },
    generateDraftId: () => 'draft-test',
}));
// NOTE: deliberately keeps `useLocalSearchParams` in the factory, unlike
// the sibling success/contract-preview mocks. GigApplyModal unconditionally
// calls useEventFunnelSource() -> useLocalSearchParams() on every render;
// a factory that omits it throws "useLocalSearchParams is not a function"
// before the component ever mounts — a pre-existing sibling-test bug
// unrelated to the profile gate under test here (see task report).
jest.mock('expo-router', () => ({
    useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
    useLocalSearchParams: () => ({}),
}));
jest.mock('@/stores/authStore', () => ({
    __esModule: true,
    default: () => ({ user: { _id: 'u1' } }),
    useAuthStore: () => ({ user: { _id: 'u1' } }),
}));
jest.mock('expo-linear-gradient', () => {
    const { View } = require('react-native');
    return { LinearGradient: View };
});

import { GigApplyModal } from '../GigApplyModal';

describe('GigApplyModal — profile-incomplete gate opens inline interview', () => {
    beforeEach(() => {
        mockMutate.mockClear();
    });

    it('opens the ProfileInterviewSheet (not a bounce modal) on PROFILE_INCOMPLETE', async () => {
        const { getByText, getByTestId, getByPlaceholderText, findByText } = render(
            <GigApplyModal
                visible
                onClose={jest.fn()}
                gigId="g1"
                gigTitle="Sangeet"
                gigAmount={50000}
            />
        );

        // Step 1 -> step 2. handleNext requires a non-empty cover note.
        fireEvent.changeText(
            getByPlaceholderText(/I have 5 years of experience/i),
            'Great fit for this gig.'
        );
        fireEvent.press(getByText('Review Terms'));

        // Step 2 — accept terms (gigAmount=50000 => "standard" tier, so no
        // premium scroll guard blocks the checkbox), then submit.
        fireEvent.press(getByTestId('apply-terms-checkbox'));
        fireEvent.press(getByText('Submit Application'));

        // mutate -> onError -> PROFILE_INCOMPLETE -> setProfileModalVisible(true).
        // ProfileInterviewSheet renders fields[0] first. enrichMissing(['Profile
        // Photo', 'Artist Type']) => [photo, artistType]; photo's question is
        // "Add a photo so hirers recognise you." The art-form question (index 1)
        // is not on screen yet, so we assert the FIRST field's question — this
        // still proves the inline interview opened instead of a bounce modal.
        expect(await findByText(/add a photo/i)).toBeTruthy();
    });
});
