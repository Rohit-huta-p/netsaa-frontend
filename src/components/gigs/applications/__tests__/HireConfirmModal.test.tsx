// src/components/gigs/applications/__tests__/HireConfirmModal.test.tsx
//
// Verifies the PRD §8.3.2 Stage 2 contract-creation bridge:
//   - Tapping "Confirm Hire" while on-platform is selected fires the
//     createContract mutation FIRST, then flips the application status.
//   - Off-platform requires explicit acknowledgement before the
//     Confirm button is enabled.

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// Hoist mocks for the two mutations the modal relies on
const mockCreateContract = jest
    .fn()
    .mockResolvedValue({ data: { _id: 'contract-1', status: 'sent' } });

const mockUpdateApplicationStatus = jest
    .fn()
    .mockResolvedValue({ _id: 'app-1', status: 'hired' });

jest.mock('@/hooks/usePayments', () => ({
    useCreateContract: () => ({
        mutateAsync: (...args: any[]) => mockCreateContract(...args),
    }),
}));

jest.mock('@/hooks/useGigApplications', () => ({
    useUpdateApplicationStatus: () => ({
        mutateAsync: (...args: any[]) => mockUpdateApplicationStatus(...args),
    }),
}));

// Visual-only stubs so the test environment renders without native deps
jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
jest.mock('lucide-react-native', () => {
    return new Proxy(
        {},
        {
            get: (_t, name) => () => null,
        },
    );
});

// Quiet the Alert that fires after a successful hire
jest.spyOn(require('react-native').Alert, 'alert').mockImplementation(() => {});

import { HireConfirmModal } from '../HireConfirmModal';

const sampleGig = {
    _id: 'gig-123',
    title: 'Wedding Sangeet Dance Lead',
    description: 'Lead choreographer + 4 dancers for sangeet night',
    schedule: {
        startDate: '2026-12-12T18:00:00.000Z',
        endDate: '2026-12-12T22:00:00.000Z',
    },
    location: {
        city: 'Pune',
        state: 'Maharashtra',
        venueName: 'Hyatt Regency',
    },
    compensation: {
        amount: 45000,
        currency: 'INR',
    },
    termsAndConditions:
        'Cancellations within 48h of event date forfeit the full booking amount.',
};

const sampleApplication = {
    _id: 'app-1',
    artistId: 'artist-1',
    artistSnapshot: { displayName: 'Riya Sharma' },
};

beforeEach(() => {
    mockCreateContract.mockClear();
    mockUpdateApplicationStatus.mockClear();
});

describe('HireConfirmModal', () => {
    it('on Confirm Hire with on-platform, calls createContract then updateApplicationStatus', async () => {
        const onClose = jest.fn();
        const { getByLabelText } = render(
            <HireConfirmModal
                visible
                gig={sampleGig}
                application={sampleApplication}
                onClose={onClose}
            />,
        );

        fireEvent.press(getByLabelText('confirm-hire'));

        await waitFor(() => {
            expect(mockCreateContract).toHaveBeenCalledTimes(1);
        });

        // 1. createContract was called with the right shape
        const payload = mockCreateContract.mock.calls[0][0];
        expect(payload).toEqual(
            expect.objectContaining({
                gigId: 'gig-123',
                artistId: 'artist-1',
                paymentMethod: 'on_platform',
            }),
        );
        expect(payload.terms).toEqual(
            expect.objectContaining({
                gigTitle: 'Wedding Sangeet Dance Lead',
                amount: 45000,
                paymentStructure: 'full',
                scopeOfWork: expect.any(String),
            }),
        );
        expect(payload.terms.dates).toEqual(
            expect.objectContaining({
                start: expect.any(String),
                end: expect.any(String),
            }),
        );
        expect(payload.terms.location).toEqual(
            expect.objectContaining({ city: 'Pune' }),
        );

        // 2. updateApplicationStatus was called next with status 'hired'
        await waitFor(() => {
            expect(mockUpdateApplicationStatus).toHaveBeenCalledTimes(1);
        });
        expect(mockUpdateApplicationStatus.mock.calls[0][0]).toEqual(
            expect.objectContaining({
                applicationId: 'app-1',
                status: 'hired',
            }),
        );

        // 3. modal closes after the happy path
        await waitFor(() => {
            expect(onClose).toHaveBeenCalled();
        });
    });

    it('off-platform requires acknowledgement before Confirm enables', async () => {
        const { getByLabelText } = render(
            <HireConfirmModal
                visible
                gig={sampleGig}
                application={sampleApplication}
                onClose={jest.fn()}
            />,
        );

        // Pick the off-platform card
        fireEvent.press(getByLabelText('Pay Riya Sharma directly'));

        // Tapping confirm without ack should NOT fire the mutation
        const confirmBtn = getByLabelText('confirm-hire');
        fireEvent.press(confirmBtn);

        // Give any rejected promises a chance to settle
        await waitFor(() => {
            expect(mockCreateContract).not.toHaveBeenCalled();
        });

        // Tap the acknowledgement checkbox — Confirm should now be live
        fireEvent.press(getByLabelText('off-platform-ack'));
        fireEvent.press(confirmBtn);

        await waitFor(() => {
            expect(mockCreateContract).toHaveBeenCalledTimes(1);
        });
        expect(mockCreateContract.mock.calls[0][0]).toEqual(
            expect.objectContaining({ paymentMethod: 'off_platform' }),
        );
    });
});
