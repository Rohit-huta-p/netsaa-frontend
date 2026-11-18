import React from 'react';
import { fireEvent, render, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
// Discussion thread mounted on the Hub's Discussion tab. Capture its props so
// the badge wiring (onMessagesChange) and nudge suppression are testable; the
// real component pulls socketService + gigService + lucide.
let discussionProps: any = null;
jest.mock('@/components/common/DiscussionTab', () => ({
    __esModule: true,
    default: (props: any) => { discussionProps = props; return null; },
}));

import { HirerGigHub } from '../HirerGigHub';

const iso = (ms: number) => new Date(ms).toISOString();

describe('HirerGigHub', () => {
    beforeEach(async () => {
        discussionProps = null;
        await AsyncStorage.clear();
    });

    it('renders the gig header and the three pipeline stage tabs', async () => {
        const { getByText } = render(<HirerGigHub gigId="g1" />);
        expect(getByText('Sangeet Choreography')).toBeTruthy();
        expect(getByText('Applied')).toBeTruthy();
        expect(getByText('Shortlisted')).toBeTruthy();
        expect(getByText('Hired')).toBeTruthy();
        await act(async () => {}); // flush the badge hook's async hydrate
    });

    it('renders the top-level Applicants / Discussion tabs', async () => {
        const { getByText } = render(<HirerGigHub gigId="g1" />);
        expect(getByText('Applicants')).toBeTruthy();
        expect(getByText('Discussion')).toBeTruthy();
        await act(async () => {});
    });

    it('defaults to the Applied stage and shows its applicant in the body', async () => {
        const { getByText, queryByText } = render(<HirerGigHub gigId="g1" />);
        // Applied bucket (a2 Meera) is the untriaged flood; the hired (Priya)
        // and shortlisted (Kavya) bodies are behind their own stage tabs.
        expect(getByText('Meera')).toBeTruthy();
        expect(queryByText('Priya')).toBeNull();
        await act(async () => {});
    });

    it('switching to the Hired stage reveals the cast', async () => {
        const { getByText, getByLabelText, queryByText } = render(<HirerGigHub gigId="g1" />);
        fireEvent.press(getByLabelText('Hired stage'));
        expect(getByText('Priya')).toBeTruthy();
        expect(queryByText('Meera')).toBeNull();
        await act(async () => {});
    });

    it('sticky CTA reflects pending applicant count', async () => {
        const { getByText } = render(<HirerGigHub gigId="g1" />);
        expect(getByText(/Review applicants · 2/)).toBeTruthy();
        await act(async () => {});
    });

    it('wires the Discussion thread: threaded, waiting-nudge hidden, badge feed', async () => {
        render(<HirerGigHub gigId="g1" />);
        await waitFor(() => expect(discussionProps).toBeTruthy());
        expect(discussionProps.threaded).toBe(true);
        expect(discussionProps.hideOwnerWaitingNudge).toBe(true);
        expect(typeof discussionProps.onMessagesChange).toBe('function');
    });

    it('badges new comments, clears on opening Discussion, and hides the sticky CTA there', async () => {
        // Pre-seed the watermark so the baseline is deterministic (comments at or
        // before ms=1000 are "seen"; anything newer badges).
        await AsyncStorage.setItem('hub:discussion:lastSeen:g1', '1000');
        const { getByText, getByLabelText, queryByText, queryByLabelText } = render(<HirerGigHub gigId="g1" />);
        await waitFor(() => expect(discussionProps).toBeTruthy());

        act(() => discussionProps.onMessagesChange([
            { _id: 'm0', authorId: 'u8', createdAt: iso(1000) }, // == baseline, seen
            { _id: 'm1', authorId: 'u9', createdAt: iso(2000) }, // newer → 1 new
        ], false));

        // Badge shows on the Discussion tab; sticky CTA is on the Applicants tab.
        await waitFor(() => expect(getByLabelText('Discussion, 1 new')).toBeTruthy());
        expect(getByText(/Review applicants · 2/)).toBeTruthy();

        // Open Discussion → badge clears, pipeline + sticky CTA gone.
        fireEvent.press(getByLabelText('Discussion, 1 new'));
        await waitFor(() => expect(queryByLabelText('Discussion, 1 new')).toBeNull());
        expect(queryByText(/Review applicants/)).toBeNull();
        expect(queryByLabelText('Applied stage')).toBeNull();
    });
});
