import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Many applied applicants (stable order: equal rating + equal appliedAt → input
// order preserved) so the screen's stage tabs, count header and list render.
const makeApps = (n: number, status = 'applied') =>
    Array.from({ length: n }).map((_, i) => ({
        _id: `a${i}`,
        status,
        appliedAt: '2026-10-01T10:00:00Z',
        artistId: `u${i}`,
        artistSnapshot: { displayName: `Artist ${i}`, primaryCity: 'Pune', specialities: ['Theatre'] },
    }));

const mockData = {
    gig: { _id: 'g1', title: 'Corporate gala', organizerId: 'owner1', location: { city: 'Pune' }, artistTypes: ['Actor'] },
    isLoading: false,
    error: null,
    appliedApplicants: makeApps(45),
    shortlistedApplicants: makeApps(3, 'shortlisted'),
    teamRows: [],
    applications: makeApps(45),
    pendingApplicants: makeApps(45),
    stageCounts: { applied: 45, shortlisted: 3, hired: 0 },
    kpis: { slotsTotal: 5, hiredCount: 0 },
};

jest.mock('../hooks/useGigHubData', () => ({ useGigHubData: () => mockData }));
jest.mock('expo-router', () => ({
    useRouter: () => ({ back: jest.fn(), canGoBack: () => true, push: jest.fn(), replace: jest.fn() }),
}));
jest.mock('@/hooks/useGigApplications', () => ({
    useUpdateApplicationStatus: () => ({ mutate: jest.fn(), isPending: false }),
}));
// Owner of the mock gig, so the owner gate lets the screen render.
jest.mock('@/stores/authStore', () => ({ __esModule: true, default: (sel: any) => sel({ user: { _id: 'owner1' } }) }));
// Stub the shared modal surface (pulls gesture-handler / blur / reanimated).
jest.mock('../components/GigApplicantActionModals', () => ({ GigApplicantActionModals: () => null }));

import { GigApplicantsAllScreen } from '../GigApplicantsAllScreen';

describe('GigApplicantsAllScreen', () => {
    it('renders the header, the three stage tabs, the stage count and applicant rows', () => {
        const { getByText, getByLabelText } = render(<GigApplicantsAllScreen gigId="g1" initialStage="applied" />);
        expect(getByText('All applicants')).toBeTruthy();
        expect(getByLabelText('Applied stage')).toBeTruthy();
        expect(getByLabelText('Shortlisted stage')).toBeTruthy();
        expect(getByLabelText('Hired stage')).toBeTruthy();
        expect(getByText('New applicants · 45')).toBeTruthy();
        expect(getByText('Artist 0')).toBeTruthy(); // first row rendered
    });

    it('switching to the Shortlisted stage swaps the list header + count', () => {
        const { getByLabelText, getByText } = render(<GigApplicantsAllScreen gigId="g1" initialStage="applied" />);
        fireEvent.press(getByLabelText('Shortlisted stage'));
        expect(getByText('Your picks · 3')).toBeTruthy();
    });

    it('lands on the stage passed in (shortlisted)', () => {
        const { getByText } = render(<GigApplicantsAllScreen gigId="g1" initialStage="shortlisted" />);
        expect(getByText('Your picks · 3')).toBeTruthy();
    });
});
