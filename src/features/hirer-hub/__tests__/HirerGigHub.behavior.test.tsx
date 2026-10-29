import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

const mockSampleGig = {
    _id: 'g1', title: 'Sangeet Choreography', status: 'published',
    eventFunction: 'Sangeet', location: { city: 'Pune', venueName: 'JW Marriott' },
    artistTypes: ['Dancer'],
    headcount: 6,
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
jest.mock('@/hooks/useGigs', () => ({
    useGig: () => ({ data: mockSampleGig, isLoading: false, error: null }),
    useUpdateGig: () => ({ mutate: jest.fn(), isPending: false }),
}));
jest.mock('@/hooks/useGigApplications', () => ({
    useGigApplications: () => ({ data: mockSampleApps, isLoading: false, error: null }),
    useUpdateApplicationStatus: () => ({ mutate: jest.fn(), isPending: false }),
}));
jest.mock('@/hooks/usePayments', () => ({
    useUserContracts: () => ({ data: { data: { contracts: mockSampleContracts } }, isLoading: false, error: null }),
    useApplicationTransactions: () => ({ data: [], isLoading: false }),
}));
jest.mock('@/components/gigs/applications/HireConfirmModal', () => ({
    HireConfirmModal: () => null,
}));
jest.mock('@/features/team/ContactActionSheet', () => ({
    ContactActionSheet: () => null,
}));
// MobileTabBar imports expo-linear-gradient (ESM-only) — stub the hook so
// the bottom-nav offset wiring doesn't drag native bindings into the test.
jest.mock('@/components/MobileTabBar', () => ({
    useMobileTabBarHeight: () => 0,
}));
// Discussion section mounted on the Hub. The component pulls socketService +
// gigService + lucide. Stub it to keep this behaviour test focused on the Hub.
jest.mock('@/components/common/DiscussionTab', () => ({
    __esModule: true,
    default: () => null,
}));

import { HirerGigHub } from '../HirerGigHub';

describe('HirerGigHub', () => {
    it('renders the gig header and the three pipeline stage tabs', () => {
        const { getByText } = render(<HirerGigHub gigId="g1" />);
        expect(getByText('Sangeet Choreography')).toBeTruthy();
        expect(getByText('Applied')).toBeTruthy();
        expect(getByText('Shortlisted')).toBeTruthy();
        expect(getByText('Hired')).toBeTruthy();
    });

    it('defaults to the Applied stage and shows its applicant in the body', () => {
        const { getByText, queryByText } = render(<HirerGigHub gigId="g1" />);
        // Applied bucket (a2 Meera) is the untriaged flood; the hired (Priya)
        // and shortlisted (Kavya) bodies are behind their own stage tabs.
        expect(getByText('Meera')).toBeTruthy();
        expect(queryByText('Priya')).toBeNull();
    });

    it('switching to the Hired stage reveals the cast', () => {
        const { getByText, getByLabelText, queryByText } = render(<HirerGigHub gigId="g1" />);
        fireEvent.press(getByLabelText('Hired stage'));
        expect(getByText('Priya')).toBeTruthy();
        expect(queryByText('Meera')).toBeNull();
    });

    it('sticky CTA reflects pending applicant count', () => {
        const { getByText } = render(<HirerGigHub gigId="g1" />);
        expect(getByText(/Review applicants · 2/)).toBeTruthy();
    });
});
