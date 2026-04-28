// netsa-mobile/src/components/dashboard/hirer/__tests__/PaymentsStrip.smoke.test.tsx
//
// Smoke + behavior coverage for the hirer's wired PaymentsStrip.
// Replaces the prior coming-soon stub test now that Phase 3B-skeleton
// connects this strip to real off-platform transactions.
import React from 'react';
import { render } from '@testing-library/react-native';

let mockData: any = { data: { transactions: [] } };
let mockLoading = false;

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }), Link: 'Link' }));
jest.mock('@/hooks/usePayments', () => ({
    useUserTransactions: () => ({ data: mockData, isLoading: mockLoading }),
}));

import PaymentsStrip from '../PaymentsStrip';

beforeEach(() => {
    mockData = { data: { transactions: [] } };
    mockLoading = false;
});

describe('PaymentsStrip (hirer dashboard)', () => {
    it('shows the loading state while fetching', () => {
        mockLoading = true;
        const { getByLabelText } = render(<PaymentsStrip />);
        expect(getByLabelText('payments-loading')).toBeTruthy();
    });

    it('shows the empty state when no transactions', () => {
        const { getByLabelText, getByText } = render(<PaymentsStrip />);
        expect(getByLabelText('payments-empty')).toBeTruthy();
        expect(getByText(/No payments yet/i)).toBeTruthy();
    });

    it('renders summary + recent transactions when data exists', () => {
        mockData = {
            data: {
                transactions: [
                    {
                        _id: 't1',
                        amount: 50000,
                        status: 'confirmed',
                        type: 'offline_record',
                        offlineDetails: { method: 'upi' },
                        createdAt: '2027-03-15T10:00:00Z',
                    },
                    {
                        _id: 't2',
                        amount: 15000,
                        status: 'recorded',
                        type: 'offline_record',
                        offlineDetails: { method: 'cash' },
                        createdAt: '2027-03-14T10:00:00Z',
                    },
                ],
            },
        };
        const { getAllByText, getByText, getByLabelText } = render(<PaymentsStrip />);

        // Total paid = sum of confirmed transactions = 50000.
        // The amount also shows up in the recent row, so use getAllByText.
        const paidMatches = getAllByText('₹50,000');
        expect(paidMatches.length).toBeGreaterThan(0);
        // Recent row for the second transaction (cash, 15000)
        expect(getByText('₹15,000')).toBeTruthy();
        // Pending = 1 (the recorded one)
        expect(getByText('1')).toBeTruthy();
        // Records = 2
        expect(getByText('2')).toBeTruthy();
        // Recent rows render
        expect(getByLabelText('payment-recent-0')).toBeTruthy();
        expect(getByLabelText('payment-recent-1')).toBeTruthy();
    });
});
