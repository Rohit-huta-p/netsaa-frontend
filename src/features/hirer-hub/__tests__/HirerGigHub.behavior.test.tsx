import React from 'react';
import { render } from '@testing-library/react-native';

const mockSampleGig = {
    _id: 'g1', title: 'Sangeet Choreography', status: 'published',
    eventFunction: 'Sangeet', location: { city: 'Pune', venue: 'JW Marriott' },
    schedule: { startDate: new Date(Date.now() + 30 * 86_400_000).toISOString() },
    compensation: { structure: 'advance_balance', amount: 50000, subArtistAmount: 15000 },
    requirements: { headcount: 6 },
    createdAt: new Date(Date.now() - 14 * 86_400_000).toISOString(),
    description: '6 dancers · 3-song fusion',
};
const mockSampleApps = [
    { _id: 'a1', artistId: 'u1', status: 'hired', artistSnapshot: { displayName: 'Priya' } },
    { _id: 'a2', artistId: 'u2', status: 'applied', artistSnapshot: { displayName: 'Meera' } },
    { _id: 'a3', artistId: 'u3', status: 'shortlisted', artistSnapshot: { displayName: 'Kavya' } },
];
const mockSampleContracts = [
    { _id: 'c1', gigId: 'g1', artistId: 'u1', status: 'active', paidAmount: 15000,
      paymentMethod: 'on_platform',
      terms: { amount: 50000, paymentStructure: 'advance_balance', dates: { start: mockSampleGig.schedule.startDate } },
    },
];

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), back: jest.fn() }) }));
jest.mock('@/hooks/useGigs', () => ({ useGig: () => ({ data: mockSampleGig, isLoading: false, error: null }) }));
jest.mock('@/hooks/useGigApplications', () => ({
    useGigApplications: () => ({ data: mockSampleApps, isLoading: false, error: null }),
    useUpdateApplicationStatus: () => ({ mutate: jest.fn(), isPending: false }),
}));
jest.mock('@/hooks/usePayments', () => ({
    useUserContracts: () => ({ data: { data: { contracts: mockSampleContracts } }, isLoading: false, error: null }),
    // HubTeamRowPayment fetches per-row transactions via this hook (Phase 3B-skeleton).
    useApplicationTransactions: () => ({ data: [], isLoading: false }),
}));
jest.mock('@/components/gigs/applications/HireConfirmModal', () => ({
    HireConfirmModal: () => null,
}));
jest.mock('@/features/payments/RecordPaymentModal', () => ({
    RecordPaymentModal: () => null,
}));
// MobileTabBar imports expo-linear-gradient (ESM-only) — stub the hook so
// the bottom-nav offset wiring doesn't drag native bindings into the test.
jest.mock('@/components/MobileTabBar', () => ({
    useMobileTabBarHeight: () => 0,
}));

import { HirerGigHub } from '../HirerGigHub';

describe('HirerGigHub', () => {
    it('renders all main sections (post contract-rollback)', () => {
        // CONTRACTS-DISABLED: "Booking terms" section assertion removed — the
        // Hub no longer mounts HubBookingTermsCard until the contract artifact
        // is restored. Restore the assertion when the gating is reverted.
        const { getByText } = render(<HirerGigHub gigId="g1" />);
        expect(getByText('Sangeet Choreography')).toBeTruthy();
        expect(getByText('Your team')).toBeTruthy();
        expect(getByText('Applicants')).toBeTruthy();
    });

    it('sticky CTA reflects pending applicant count', () => {
        const { getByText } = render(<HirerGigHub gigId="g1" />);
        expect(getByText(/Review applicants · 2/)).toBeTruthy();
    });
});
