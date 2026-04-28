// netsa-mobile/src/components/dashboard/artist/__tests__/PaymentsToConfirmStrip.smoke.test.tsx
//
// Locks the empty-state silence + the populated-list render.
import React from 'react';
import { render } from '@testing-library/react-native';

let mockData: any = { data: { transactions: [] } };
let mockLoading = false;

jest.mock('@/hooks/usePayments', () => ({
    useUserTransactions: () => ({ data: mockData, isLoading: mockLoading }),
}));
jest.mock('@/stores/authStore', () => ({
    useAuthStore: (selector?: (s: any) => any) => {
        const store = { user: { _id: 'artist1' } };
        return selector ? selector(store) : store;
    },
}));
jest.mock('@/features/payments/ConfirmPaymentModal', () => ({
    ConfirmPaymentModal: () => null,
}));

import PaymentsToConfirmStrip from '../PaymentsToConfirmStrip';

beforeEach(() => {
    mockData = { data: { transactions: [] } };
    mockLoading = false;
});

describe('PaymentsToConfirmStrip (artist dashboard)', () => {
    it('renders the loading state while fetching', () => {
        mockLoading = true;
        const { getByLabelText } = render(<PaymentsToConfirmStrip />);
        expect(getByLabelText('payments-to-confirm-loading')).toBeTruthy();
    });

    it('renders nothing (null) when no pending confirmations', () => {
        const { toJSON } = render(<PaymentsToConfirmStrip />);
        expect(toJSON()).toBeNull();
    });

    it('lists pending confirmations where the artist is the payee', () => {
        mockData = {
            data: {
                transactions: [
                    {
                        _id: 't1',
                        amount: 50000,
                        status: 'recorded',
                        toUserId: 'artist1',
                        offlineDetails: { method: 'upi', referenceId: 'UPI/xyz' },
                    },
                    // Different payee — should be filtered out
                    {
                        _id: 't2',
                        amount: 15000,
                        status: 'recorded',
                        toUserId: 'someone-else',
                        offlineDetails: { method: 'cash' },
                    },
                ],
            },
        };
        const { getByLabelText, queryByLabelText, getByText } = render(
            <PaymentsToConfirmStrip />
        );
        expect(getByLabelText('payment-to-confirm-0')).toBeTruthy();
        expect(queryByLabelText('payment-to-confirm-1')).toBeNull();
        expect(getByText('₹50,000')).toBeTruthy();
        expect(getByText(/UPI · UPI\/xyz/)).toBeTruthy();
    });
});
