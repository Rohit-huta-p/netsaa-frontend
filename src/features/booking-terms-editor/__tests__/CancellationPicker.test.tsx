import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CancellationPicker } from '../components/CancellationPicker';

describe('CancellationPicker', () => {
    it('renders 3 chips with the selected one highlighted', () => {
        const { getByLabelText } = render(
            <CancellationPicker value="48h" onChange={jest.fn()} />
        );
        expect(getByLabelText(/Cancellation: 48h, selected/i)).toBeTruthy();
    });

    it('tapping a chip fires onChange with that value', () => {
        const onChange = jest.fn();
        const { getByText } = render(<CancellationPicker value="48h" onChange={onChange} />);
        fireEvent.press(getByText('72h'));
        expect(onChange).toHaveBeenCalledWith('72h');
    });

    it('forfeit preview reflects selection', () => {
        const { getByText } = render(<CancellationPicker value="24h" onChange={jest.fn()} />);
        expect(getByText(/within 24h/i)).toBeTruthy();
        expect(getByText(/100%/)).toBeTruthy();
    });
});
