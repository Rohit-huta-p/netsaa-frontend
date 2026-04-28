// netsa-mobile/src/features/payments/__tests__/RecordPaymentModal.test.tsx
//
// Smoke + behavior coverage for the Record Payment modal. Locks:
//   - The form renders with the prefilled amount and method picker.
//   - Submitting fires useRecordOfflinePayment with the right payload
//     (applicationId + toUserId + amount + method).
//   - Method chip change is reflected in the submitted payload.
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

const mockRecordOffline = jest.fn().mockResolvedValue({ data: { _id: 'tx-1' } });

jest.mock('@/hooks/usePayments', () => ({
    useRecordOfflinePayment: () => ({
        mutateAsync: (...args: any[]) => mockRecordOffline(...args),
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

import { RecordPaymentModal } from '../RecordPaymentModal';

beforeEach(() => {
    mockRecordOffline.mockClear();
});

describe('RecordPaymentModal', () => {
    const baseProps = {
        visible: true,
        onClose: jest.fn(),
        applicationId: 'app-1',
        artistId: 'artist-1',
        defaultAmount: 50000,
        gigId: 'gig-1',
        artistName: 'Priya',
    };

    it('renders the form with the default amount + method chips', () => {
        const { getByLabelText, getAllByLabelText } = render(<RecordPaymentModal {...baseProps} />);
        const input = getByLabelText('payment-amount');
        expect(input.props.value).toBe('50000');

        // 7 method chips
        expect(getByLabelText('payment-method-upi')).toBeTruthy();
        expect(getByLabelText('payment-method-cash')).toBeTruthy();
        expect(getByLabelText('payment-method-bank_transfer')).toBeTruthy();
    });

    it("submits with the right payload (default UPI method)", async () => {
        const { getByLabelText } = render(<RecordPaymentModal {...baseProps} />);
        fireEvent.press(getByLabelText('submit-record-payment'));

        await waitFor(() => {
            expect(mockRecordOffline).toHaveBeenCalledTimes(1);
        });
        expect(mockRecordOffline.mock.calls[0][0]).toEqual({
            applicationId: 'app-1',
            gigId: 'gig-1',
            toUserId: 'artist-1',
            amount: 50000,
            method: 'upi',
            referenceId: undefined,
            note: undefined,
        });
    });

    it('submits with the chosen method when the chip changes', async () => {
        const { getByLabelText } = render(<RecordPaymentModal {...baseProps} />);
        fireEvent.press(getByLabelText('payment-method-cash'));
        fireEvent.press(getByLabelText('submit-record-payment'));

        await waitFor(() => {
            expect(mockRecordOffline).toHaveBeenCalledTimes(1);
        });
        expect(mockRecordOffline.mock.calls[0][0]).toEqual(
            expect.objectContaining({ method: 'cash' })
        );
    });

    it('blocks submit when amount is invalid', async () => {
        const { getByLabelText, queryByText } = render(
            <RecordPaymentModal {...baseProps} defaultAmount={0} />
        );

        fireEvent.changeText(getByLabelText('payment-amount'), '-100');
        fireEvent.press(getByLabelText('submit-record-payment'));

        await waitFor(() => {
            expect(queryByText(/Enter a valid amount/i)).toBeTruthy();
        });
        expect(mockRecordOffline).not.toHaveBeenCalled();
    });
});
