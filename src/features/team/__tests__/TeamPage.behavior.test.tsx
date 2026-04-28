// netsa-mobile/src/features/team/__tests__/TeamPage.behavior.test.tsx
//
// End-to-end behavior coverage for the team page:
//   - Loading + error + empty-roster states render
//   - Roster lists hired applications only (filters out applied/rejected)
//   - Header has back button + Edit-gig pill (hirer mode)
//   - Mark-as-performed button surfaces a "coming soon" Alert
import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

const sampleGig = {
    _id: 'g1',
    title: 'Sangeet Choreography',
    compensation: { amount: 50000 },
};
const sampleApplications = [
    { _id: 'a1', artistId: 'u1', status: 'hired', artistSnapshot: { displayName: 'Priya' } },
    { _id: 'a2', artistId: 'u2', status: 'applied', artistSnapshot: { displayName: 'Meera' } },
    { _id: 'a3', artistId: 'u3', status: 'hired', artistSnapshot: { displayName: 'Kavya', artistType: 'Backup dancer' } },
];

let mockGig: any = sampleGig;
let mockGigLoading = false;
let mockGigError: any = null;
let mockApps: any = sampleApplications;
let mockAppsLoading = false;
const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('@/hooks/useGigs', () => ({
    useGig: () => ({ data: mockGig, isLoading: mockGigLoading, error: mockGigError }),
    useUpdateGig: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));
jest.mock('@/hooks/useGigApplications', () => ({
    useGigApplications: () => ({ data: mockApps, isLoading: mockAppsLoading, error: null }),
    useUpdateApplicationStatus: () => ({ mutate: jest.fn(), isPending: false }),
}));
jest.mock('@/hooks/usePayments', () => ({
    useApplicationTransactions: () => ({ data: [], isLoading: false }),
    useRecordOfflinePayment: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));
jest.mock('expo-router', () => ({
    useRouter: () => ({ push: mockPush, back: mockBack }),
}));
jest.mock('@/components/MobileTabBar', () => ({
    useMobileTabBarHeight: () => 0,
}));
// Sub-modals carry their own mounted state but we don't exercise them here.
jest.mock('../ContactActionSheet', () => ({
    ContactActionSheet: () => null,
}));
jest.mock('@/features/payments/RecordPaymentModal', () => ({
    RecordPaymentModal: () => null,
}));

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

import { TeamPage } from '../TeamPage';

beforeEach(() => {
    mockGig = sampleGig;
    mockGigLoading = false;
    mockGigError = null;
    mockApps = sampleApplications;
    mockAppsLoading = false;
    mockPush.mockClear();
    mockBack.mockClear();
    (Alert.alert as jest.Mock).mockClear();
});

describe('TeamPage', () => {
    it('renders the title + roster of HIRED applications only', () => {
        const { getByText, queryByText, getAllByLabelText } = render(<TeamPage gigId="g1" />);

        expect(getByText('Sangeet Choreography')).toBeTruthy();
        // 2 hired roster cards rendered (Priya + Kavya). Meera (applied) excluded.
        const cards = getAllByLabelText(/^roster-card-/);
        expect(cards).toHaveLength(2);
        expect(getByText('Priya')).toBeTruthy();
        expect(getByText('Kavya')).toBeTruthy();
        expect(queryByText('Meera')).toBeNull();
        expect(getByText('2 artists hired')).toBeTruthy();
    });

    it('renders the empty-roster state when no one is hired', () => {
        mockApps = sampleApplications.filter((a) => a.status !== 'hired');
        const { getByText, queryAllByLabelText } = render(<TeamPage gigId="g1" />);
        expect(getByText(/No artists hired yet/)).toBeTruthy();
        expect(queryAllByLabelText(/^roster-card-/)).toHaveLength(0);
    });

    it('shows the loading state while data is fetching', () => {
        mockGigLoading = true;
        const { queryByText } = render(<TeamPage gigId="g1" />);
        expect(queryByText('Sangeet Choreography')).toBeNull();
    });

    it("shows error state when gig can't be loaded", () => {
        mockGig = null;
        const { getByText } = render(<TeamPage gigId="g1" />);
        expect(getByText(/Couldn't load gig/i)).toBeTruthy();
    });

    it('Edit-gig pill (hirer mode) routes to /create?gigId=', () => {
        const { getByLabelText } = render(<TeamPage gigId="g1" mode="hirer" />);
        fireEvent.press(getByLabelText('edit-gig-from-team'));
        expect(mockPush).toHaveBeenCalledWith('/(app)/create?gigId=g1');
    });

    it('Mark-as-performed surfaces a "coming soon" Alert', () => {
        const { getByLabelText } = render(<TeamPage gigId="g1" />);
        fireEvent.press(getByLabelText('mark-gig-as-performed'));
        expect(Alert.alert).toHaveBeenCalledWith(
            'Mark as performed — coming soon',
            expect.any(String)
        );
    });

    it('Back button calls router.back()', () => {
        const { getByLabelText } = render(<TeamPage gigId="g1" />);
        fireEvent.press(getByLabelText('Back'));
        expect(mockBack).toHaveBeenCalled();
    });
});
