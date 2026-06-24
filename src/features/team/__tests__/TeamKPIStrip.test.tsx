// netsa-mobile/src/features/team/__tests__/TeamKPIStrip.test.tsx
//
// Locks the gig-wide aggregation: total agreed = perArtist × hireCount,
// confirmed/pending/remaining sum across all hires correctly via
// useQueries.

import React from 'react';
import { render } from '@testing-library/react-native';

const mockQueryResults: any = new Map<string, any>();

jest.mock('@tanstack/react-query', () => ({
    useQueries: ({ queries }: any) =>
        queries.map((q: any) => {
            const id = q.queryKey?.[2];
            return {
                data: mockQueryResults.get(id) ?? [],
                isLoading: false,
            };
        }),
}));

jest.mock('@/services/paymentService', () => ({
    transactionService: { listForApplication: jest.fn() },
}));

import { TeamKPIStrip } from '../components/TeamKPIStrip';

beforeEach(() => {
    mockQueryResults.clear();
});

describe('TeamKPIStrip', () => {
    it('total agreed = perArtist × applicationIds.length', () => {
        const { getAllByText } = render(
            <TeamKPIStrip applicationIds={['a1', 'a2', 'a3']} perArtistAmount={50000} />
        );
        // 50000 × 3 = 150000. The same value also appears in Remaining
        // (no transactions seeded) so we expect at least one match.
        const matches = getAllByText('₹1,50,000');
        expect(matches.length).toBeGreaterThanOrEqual(1);
    });

    it('confirmed sums across all applications', () => {
        mockQueryResults.set('a1', [{ status: 'confirmed', amount: 30000 }]);
        mockQueryResults.set('a2', [{ status: 'completed', amount: 50000 }]);
        const { getByText } = render(
            <TeamKPIStrip applicationIds={['a1', 'a2']} perArtistAmount={50000} />
        );
        // confirmed = 30000 + 50000 = 80000
        expect(getByText('₹80,000')).toBeTruthy();
    });

    it('pending sums separately from confirmed', () => {
        mockQueryResults.set('a1', [{ status: 'recorded', amount: 50000 }]);
        mockQueryResults.set('a2', [{ status: 'confirmed', amount: 30000 }]);
        const { getByText } = render(
            <TeamKPIStrip applicationIds={['a1', 'a2']} perArtistAmount={50000} />
        );
        // pending = 50000, confirmed = 30000, total = 100000, remaining = 100000 - 50000 - 30000 = 20000
        expect(getByText('₹50,000')).toBeTruthy(); // pending
        expect(getByText('₹30,000')).toBeTruthy(); // confirmed
        expect(getByText('₹20,000')).toBeTruthy(); // remaining
    });

    it('renders all 4 KPI labels', () => {
        const { getByText } = render(
            <TeamKPIStrip applicationIds={['a1']} perArtistAmount={50000} />
        );
        expect(getByText(/Total agreed/i)).toBeTruthy();
        expect(getByText(/Confirmed paid/i)).toBeTruthy();
        expect(getByText(/Pending/i)).toBeTruthy();
        expect(getByText(/Remaining/i)).toBeTruthy();
    });

    it('renders zero state cleanly when no applications', () => {
        const { getByText, getAllByText } = render(
            <TeamKPIStrip applicationIds={[]} perArtistAmount={50000} />
        );
        // 0 applications × 50000 = 0 total. Confirmed/pending/remaining all 0.
        // 4 cells show ₹0
        expect(getAllByText('₹0').length).toBe(4);
        expect(getByText(/Total agreed/i)).toBeTruthy();
    });
});
