// src/components/gigs/applications/__tests__/HireConfirmModal.test.tsx
//
// Post contract-rollback (Apr 28): Confirm Hire is now a thin status flip
// with the chosen payment method recorded on the application. No contract
// artifact is created. Tests:
//   - On confirm with on-platform: updateApplicationStatus called with
//     status='hired' + paymentMethod='on_platform', cache invalidates,
//     modal closes.
//   - Off-platform requires explicit acknowledgement before Confirm fires.

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

const mockUpdateApplicationStatus = jest
    .fn()
    .mockResolvedValue({ _id: 'app-1', status: 'hired' });

const mockInvalidateQueries = jest.fn();

jest.mock('@/hooks/useGigApplications', () => ({
    useUpdateApplicationStatus: () => ({
        mutateAsync: (...args: any[]) => mockUpdateApplicationStatus(...args),
    }),
}));

jest.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({
        invalidateQueries: (...args: any[]) => mockInvalidateQueries(...args),
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
    mockUpdateApplicationStatus.mockClear();
    mockInvalidateQueries.mockClear();
});

describe('HireConfirmModal (post contract-rollback)', () => {
    it("on Confirm Hire with on-platform, calls updateApplicationStatus with status='hired' + paymentMethod", async () => {
        const onClose = jest.fn();
        const onHired = jest.fn();
        const { getByLabelText } = render(
            <HireConfirmModal
                visible
                gig={sampleGig}
                application={sampleApplication}
                onClose={onClose}
                onHired={onHired}
            />,
        );

        fireEvent.press(getByLabelText('confirm-hire'));

        await waitFor(() => {
            expect(mockUpdateApplicationStatus).toHaveBeenCalledTimes(1);
        });

        expect(mockUpdateApplicationStatus.mock.calls[0][0]).toEqual({
            applicationId: 'app-1',
            status: 'hired',
            paymentMethod: 'on_platform',
        });

        // Modal closes + onHired fires after the happy path
        await waitFor(() => {
            expect(onClose).toHaveBeenCalled();
            expect(onHired).toHaveBeenCalled();
        });
    });

    it('on successful hire, invalidates gigApplications cache', async () => {
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
            expect(onClose).toHaveBeenCalled();
        });

        const calledKeys = mockInvalidateQueries.mock.calls.map(
            (c) => c[0]?.queryKey,
        );
        expect(calledKeys).toEqual(
            expect.arrayContaining([['gigApplications', 'gig-123']]),
        );
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

        await waitFor(() => {
            expect(mockUpdateApplicationStatus).not.toHaveBeenCalled();
        });

        // Tap the acknowledgement checkbox — Confirm should now be live
        fireEvent.press(getByLabelText('off-platform-ack'));
        fireEvent.press(confirmBtn);

        await waitFor(() => {
            expect(mockUpdateApplicationStatus).toHaveBeenCalledTimes(1);
        });
        expect(mockUpdateApplicationStatus.mock.calls[0][0]).toEqual(
            expect.objectContaining({ paymentMethod: 'off_platform' }),
        );
    });
});
