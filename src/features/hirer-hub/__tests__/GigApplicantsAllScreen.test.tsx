import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Many applied applicants (stable order: equal rating + equal appliedAt → input
// order preserved) so the screen's stage tabs, count header and list render.
// All in Pune (the gig's venue city) so the venue-city pre-select keeps them.
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
    Redirect: () => null,
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
    it('renders the header, stage tabs, the filter bar + live count, and rows', () => {
        const { getByText, getByLabelText, getByTestId } = render(<GigApplicantsAllScreen gigId="g1" initialStage="applied" />);
        expect(getByText('All applicants')).toBeTruthy();
        expect(getByLabelText('Applied stage')).toBeTruthy();
        expect(getByLabelText('Shortlisted stage')).toBeTruthy();
        expect(getByLabelText('Hired stage')).toBeTruthy();
        // Filter bar shows (45 ≥ 3); venue-city pre-select keeps all 45 Pune rows.
        expect(getByTestId('applicant-filters-button')).toBeTruthy();
        expect(getByLabelText('Showing 45 of 45')).toBeTruthy();
        expect(getByText('Artist 0')).toBeTruthy(); // first row rendered
    });

    it('venue city is pre-selected as a removable chip (the local default)', () => {
        const { getByLabelText } = render(<GigApplicantsAllScreen gigId="g1" initialStage="applied" />);
        expect(getByLabelText('Remove filter Pune')).toBeTruthy();
    });

    it('switching to the Shortlisted stage swaps the list + live count', () => {
        const { getByLabelText } = render(<GigApplicantsAllScreen gigId="g1" initialStage="applied" />);
        fireEvent.press(getByLabelText('Shortlisted stage'));
        expect(getByLabelText('Showing 3 of 3')).toBeTruthy();
    });

    it('lands on the stage passed in (shortlisted)', () => {
        const { getByLabelText } = render(<GigApplicantsAllScreen gigId="g1" initialStage="shortlisted" />);
        expect(getByLabelText('Showing 3 of 3')).toBeTruthy();
    });

    // ---- Visible name search (lifted out of the Filters sheet) --------------

    it('shows the visible name search and filters the list', () => {
        mockData.appliedApplicants = makeApps(45);
        const { getByLabelText, getByText, queryByText } = render(<GigApplicantsAllScreen gigId="g1" initialStage="applied" />);
        fireEvent.changeText(getByLabelText('Search applicants by name'), 'Artist 7');
        expect(getByText('Artist 7')).toBeTruthy();
        expect(queryByText('Artist 8')).toBeNull();
    });

    it('seeds the visible field from initialName (?q carried from the hub)', () => {
        mockData.appliedApplicants = makeApps(45);
        const { getByLabelText } = render(<GigApplicantsAllScreen gigId="g1" initialStage="applied" initialName="Artist 3" />);
        expect(getByLabelText('Search applicants by name').props.value).toBe('Artist 3');
    });

    it('name is NOT a filter chip and NOT in the Filters badge count', () => {
        mockData.appliedApplicants = makeApps(45); // all Pune → venue-city pre-selects (facet count 1)
        const { getByLabelText, queryByLabelText } = render(<GigApplicantsAllScreen gigId="g1" initialStage="applied" />);
        fireEvent.changeText(getByLabelText('Search applicants by name'), 'Artist 2');
        expect(queryByLabelText('Remove filter "Artist 2"')).toBeNull(); // field owns the name
        expect(getByLabelText('Filters, 1 active')).toBeTruthy();        // only the Pune facet, not +1 for name
    });

    it('out-of-town name + venue-city filter → name-aware empty state that keeps the name', () => {
        mockData.appliedApplicants = [
            ...makeApps(5), // Pune
            { _id: 'delhi1', status: 'applied', appliedAt: '2026-10-01T10:00:00Z', artistId: 'ud', artistSnapshot: { displayName: 'Rajesh Delhi', primaryCity: 'Delhi', specialities: ['Theatre'] } },
        ];
        const { getByLabelText, getByText, queryByText } = render(<GigApplicantsAllScreen gigId="g1" initialStage="applied" />);
        // Pune is pre-selected; a Delhi-only name returns nothing under AND.
        fireEvent.changeText(getByLabelText('Search applicants by name'), 'Rajesh');
        expect(getByText(/No applicants match .Rajesh. within your filters/)).toBeTruthy();
        expect(getByLabelText('Search applicants by name')).toBeTruthy(); // field survives zero results
        // Dropping the facets (keeping the name) surfaces the out-of-town match.
        fireEvent.press(getByLabelText('Clear filters, keep name'));
        expect(getByText('Rajesh Delhi')).toBeTruthy();
        expect(queryByText('Artist 0')).toBeNull(); // name still filters
    });

    it('a passed card survives a filter change (PR #188 Undo-regression guard)', () => {
        // Small applied set so the passed card (pinned to the end of the list)
        // stays within FlatList's initial render window in jsdom.
        mockData.appliedApplicants = makeApps(3);
        const { getByText, getByLabelText, queryByText } = render(<GigApplicantsAllScreen gigId="g1" initialStage="applied" />);
        expect(getByText('Artist 0')).toBeTruthy();
        // Pass Artist 0 — it stays on screen, dimmed, with Undo.
        fireEvent.press(getByLabelText('Pass Artist 0'));
        expect(getByText('Artist 0')).toBeTruthy();
        // Change the filter (remove the pre-selected Pune city) — the passed card
        // must NOT disappear (the regression was it getting dropped/un-undoable).
        fireEvent.press(getByLabelText('Remove filter Pune'));
        expect(queryByText('Artist 0')).toBeTruthy();
        expect(getByLabelText('Undo pass for Artist 0')).toBeTruthy();
    });
});
