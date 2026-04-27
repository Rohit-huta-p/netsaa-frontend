import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PaymentStructurePicker } from '../components/PaymentStructurePicker';

describe('PaymentStructurePicker', () => {
    it('renders both options with selected card highlighted', () => {
        const { getByText, getByLabelText } = render(
            <PaymentStructurePicker value="advance_balance" amount={50000} onChange={jest.fn()} />
        );
        expect(getByText('Full upfront')).toBeTruthy();
        expect(getByText('30/70 advance')).toBeTruthy();
        expect(getByLabelText(/Payment structure: 30\/70 advance, selected/i)).toBeTruthy();
    });

    it('selecting full fires onChange("full")', () => {
        const onChange = jest.fn();
        const { getByText } = render(
            <PaymentStructurePicker value="advance_balance" amount={50000} onChange={onChange} />
        );
        fireEvent.press(getByText('Full upfront'));
        expect(onChange).toHaveBeenCalledWith('full');
    });

    it('shows Recommended badge when amount >= 50000 and structure is advance_balance', () => {
        const { getByText } = render(
            <PaymentStructurePicker value="advance_balance" amount={75000} onChange={jest.fn()} />
        );
        expect(getByText(/Recommended/i)).toBeTruthy();
    });

    it('hides Recommended badge when amount < 50000', () => {
        const { queryByText } = render(
            <PaymentStructurePicker value="advance_balance" amount={20000} onChange={jest.fn()} />
        );
        expect(queryByText(/Recommended/i)).toBeNull();
    });

    it('shows split math when 30/70 selected and amount > 0', () => {
        const { getByText } = render(
            <PaymentStructurePicker value="advance_balance" amount={50000} onChange={jest.fn()} />
        );
        expect(getByText(/₹15K/)).toBeTruthy();
        expect(getByText(/₹35K/)).toBeTruthy();
    });
});
