import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Alert } from 'react-native';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({ push: jest.fn(), back: mockBack }),
}));

const mockMutateAsync = jest.fn().mockResolvedValue({});
jest.mock('@/hooks/useGigs', () => ({
    useGig: () => ({
        data: {
            _id: 'g1',
            title: 'Sangeet',
            paymentStructure: 'full',
            cancellationPolicy: '48h',
            compensation: { amount: 50000, negotiable: false },
        },
        isLoading: false,
    }),
    useUpdateGig: () => ({ mutateAsync: mockMutateAsync, isPending: false, error: null }),
}));

// Spy on Alert so handleSave / handleCancel auto-resolve
jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
    if (Array.isArray(buttons)) {
        const action = buttons.find((b) => b.text === 'OK' || b.text === 'Discard');
        action?.onPress?.();
    }
});

import { BookingTermsEditor } from '../BookingTermsEditor';

describe('BookingTermsEditor', () => {
    beforeEach(() => {
        mockBack.mockClear();
        mockMutateAsync.mockClear();
    });

    it('Save is disabled until a field changes', () => {
        const { getByLabelText } = render(<BookingTermsEditor gigId="g1" />);
        const saveBtn = getByLabelText('Save');
        fireEvent.press(saveBtn);
        // Button is disabled, mutateAsync should NOT be called
        expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('Save fires updateGig with dirty fields only', async () => {
        const { getByText, getByLabelText } = render(<BookingTermsEditor gigId="g1" />);
        // Change payment structure full → advance_balance
        fireEvent.press(getByText('30/70 advance'));
        await act(async () => {
            fireEvent.press(getByLabelText('Save'));
        });
        expect(mockMutateAsync).toHaveBeenCalledWith({
            id: 'g1',
            payload: { paymentStructure: 'advance_balance' },
        });
    });

    it('Cancel without changes routes back immediately', () => {
        const { getByLabelText } = render(<BookingTermsEditor gigId="g1" />);
        fireEvent.press(getByLabelText('Cancel'));
        expect(mockBack).toHaveBeenCalled();
    });
});
