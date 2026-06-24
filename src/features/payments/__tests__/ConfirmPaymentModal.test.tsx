// netsa-mobile/src/features/payments/__tests__/ConfirmPaymentModal.test.tsx
//
// Smoke + behavior coverage for the Confirm Payment modal (artist side).
// Locks:
//   - Renders amount + method + reference from the supplied transaction.
//   - "Confirm received" fires useConfirmOfflinePayment with the txn id.
//   - "Dispute" expands the reason input; submitting fires
//     useDisputeOfflinePayment with the typed reason.
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

const mockConfirm = jest.fn().mockResolvedValue({ data: { status: 'confirmed' } });
const mockDispute = jest.fn().mockResolvedValue({ data: { status: 'disputed' } });

jest.mock('@/hooks/usePayments', () => ({
    useConfirmOfflinePayment: () => ({
        mutateAsync: (...args: any[]) => mockConfirm(...args),
        isPending: false,
    }),
    useDisputeOfflinePayment: () => ({
        mutateAsync: (...args: any[]) => mockDispute(...args),
        isPending: false,
    }),
}));

jest.mock('lucide-react-native', () => {
    return new Proxy(
        {},
        { get: () => () => null }
    );
});

jest.spyOn(require('react-native').Alert, 'alert').mockImplementation(() => {});

import { ConfirmPaymentModal } from '../ConfirmPaymentModal';

const sampleTxn = {
    _id: 'tx-1',
    amount: 50000,
    offlineDetails: {
        method: 'upi',
        referenceId: 'UPI/123456',
        note: 'Payment for Sangeet',
        userReportedPaidAt: '2027-03-15T10:00:00.000Z',
    },
};

beforeEach(() => {
    mockConfirm.mockClear();
    mockDispute.mockClear();
});

describe('ConfirmPaymentModal', () => {
    it('renders the transaction details from props', () => {
        const { getByText, getByLabelText } = render(
            <ConfirmPaymentModal
                visible
                onClose={jest.fn()}
                transaction={sampleTxn as any}
                hirerName="Sharma Wedding"
            />
        );

        expect(getByLabelText('confirm-amount').props.children).toContain('50,000');
        expect(getByText('UPI')).toBeTruthy();
        expect(getByText('UPI/123456')).toBeTruthy();
        expect(getByText('Payment for Sangeet')).toBeTruthy();
    });

    it('"Confirm received" fires the confirm mutation with the txn id', async () => {
        const onConfirmed = jest.fn();
        const { getByLabelText } = render(
            <ConfirmPaymentModal
                visible
                onClose={jest.fn()}
                transaction={sampleTxn as any}
                onConfirmed={onConfirmed}
            />
        );

        fireEvent.press(getByLabelText('confirm-payment-received'));

        await waitFor(() => {
            expect(mockConfirm).toHaveBeenCalledWith('tx-1');
            expect(onConfirmed).toHaveBeenCalled();
        });
    });

    it('Dispute → submit fires dispute mutation with reason', async () => {
        const { getByLabelText } = render(
            <ConfirmPaymentModal
                visible
                onClose={jest.fn()}
                transaction={sampleTxn as any}
            />
        );

        fireEvent.press(getByLabelText('open-dispute'));
        fireEvent.changeText(getByLabelText('dispute-reason'), 'Wrong amount');
        fireEvent.press(getByLabelText('submit-dispute'));

        await waitFor(() => {
            expect(mockDispute).toHaveBeenCalledWith({
                id: 'tx-1',
                reason: 'Wrong amount',
            });
        });
    });
});
