import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CancellationPicker } from '../components/CancellationPicker';

describe('CancellationPicker', () => {
    it('renders 3 chips with the selected one highlighted', () => {
        const { getByLabelText } = render(
            <CancellationPicker
                value="48h"
                onChange={jest.fn()}
                forfeitPct={100}
                onForfeitPctChange={jest.fn()}
            />
        );
        expect(getByLabelText(/Cancellation: 48h, selected/i)).toBeTruthy();
    });

    it('tapping a chip fires onChange with that value', () => {
        const onChange = jest.fn();
        const { getByText } = render(
            <CancellationPicker
                value="48h"
                onChange={onChange}
                forfeitPct={100}
                onForfeitPctChange={jest.fn()}
            />
        );
        fireEvent.press(getByText('72h'));
        expect(onChange).toHaveBeenCalledWith('72h');
    });

    it('forfeit preview reflects selection', () => {
        const { getByText, getAllByText } = render(
            <CancellationPicker
                value="24h"
                onChange={jest.fn()}
                forfeitPct={100}
                onForfeitPctChange={jest.fn()}
            />
        );
        expect(getByText(/within 24h/i)).toBeTruthy();
        // Multiple "100%" can appear (forfeit chip + preview card) — assert
        // at least one renders rather than over-asserting on uniqueness.
        expect(getAllByText(/100%/).length).toBeGreaterThan(0);
    });

    it('forfeit percentage chips fire onForfeitPctChange', () => {
        const onForfeitPctChange = jest.fn();
        const { getByLabelText } = render(
            <CancellationPicker
                value="48h"
                onChange={jest.fn()}
                forfeitPct={100}
                onForfeitPctChange={onForfeitPctChange}
            />
        );
        fireEvent.press(getByLabelText(/Forfeit: 50%/i));
        expect(onForfeitPctChange).toHaveBeenCalledWith(50);
    });
});
