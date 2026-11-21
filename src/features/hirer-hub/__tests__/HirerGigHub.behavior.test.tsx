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
// Mutable so a test can swap in a bigger applied list (reset in beforeEach).
let mockApps: any[];
const mockSampleContracts = [
    { _id: 'c1', gigId: 'g1', artistId: 'u1', status: 'active', paidAmount: 15000,
      paymentMethod: 'on_platform',
      terms: { amount: 50000, paymentStructure: 'advance_balance', dates: { start: mockSampleGig.schedule.startDate } },
    },
];

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, back: jest.fn(), canGoBack: () => true, replace: jest.fn() }) }));
jest.mock('@/hooks/useGigs', () => ({
    useGig: () => ({ data: mockSampleGig, isLoading: false, error: null }),
    useUpdateGig: () => ({ mutate: jest.fn(), isPending: false }),
}));
jest.mock('@/hooks/useGigApplications', () => ({
    useGigApplications: () => ({ data: mockApps, isLoading: false, error: null }),
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
        mockApps = mockSampleApps;
        mockPush.mockClear();
        await AsyncStorage.clear();
    });

    it('caps the Applied preview at 5 and "See all" pushes the full-list route', async () => {
        mockApps = Array.from({ length: 7 }).map((_, i) => ({
            _id: `ap${i}`, artistId: `u${i}`, status: 'applied',
            appliedAt: '2026-10-10T10:00:00Z',
            artistSnapshot: { displayName: `Applicant ${i}`, primaryCity: 'Pune' },
        }));
        const { getByLabelText } = render(<HirerGigHub gigId="g1" />);
        // 7 applied → the preview caps at 5 + surfaces a "See all 7" row.
        fireEvent.press(getByLabelText('See all 7 applicants'));
        expect(mockPush).toHaveBeenCalledWith('/(app)/gigs/g1/applicants?stage=applied');
        await act(async () => {});
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

    it('shows Essentials ABOVE the Applicants/Discussion tabs, on both tabs', async () => {
        const { getByText, toJSON } = render(<HirerGigHub gigId="g1" />);
        // Essentials present (When/Where/Pay/Scope/Posted rows + Edit gig link).
        expect(getByText('When')).toBeTruthy();
        expect(getByText('Edit gig')).toBeTruthy();

        // Order: Essentials sits ABOVE the tab selector, so its "When" label
        // renders before the "Applicants" tab label.
        const flat: string[] = [];
        const walk = (n: any) => {
            if (n == null) return;
            if (typeof n === 'string') { flat.push(n); return; }
            if (Array.isArray(n)) { n.forEach(walk); return; }
            if (n.children) walk(n.children);
        };
        walk(toJSON());
        expect(flat.indexOf('When')).toBeGreaterThanOrEqual(0);
        expect(flat.indexOf('When')).toBeLessThan(flat.indexOf('Applicants'));

        // Still shows on the Discussion tab (it's in the overview, above the tabs).
        fireEvent.press(getByText('Discussion'));
        expect(getByText('When')).toBeTruthy();
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
