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
                customText=""
                onCustomTextChange={jest.fn()}
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
                customText=""
                onCustomTextChange={jest.fn()}
            />
        );
        fireEvent.press(getByText('72h'));
        expect(onChange).toHaveBeenCalledWith('72h');
    });

    it('forfeit preview reflects selection', () => {
        const { getAllByText } = render(
            <CancellationPicker
                value="24h"
                onChange={jest.fn()}
                forfeitPct={100}
                onForfeitPctChange={jest.fn()}
                customText=""
                onCustomTextChange={jest.fn()}
            />
        );
        // The structured-fact card shows "{forfeitPct}% · {window} window"
        // (no "artist keeps full advance" narrative anymore).
        expect(getAllByText(/within window/i).length).toBeGreaterThan(0);
        // 100% may appear in chip + preview card — assert at least one renders
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
                customText=""
                onCustomTextChange={jest.fn()}
            />
        );
        fireEvent.press(getByLabelText(/Forfeit: 50%/i));
        expect(onForfeitPctChange).toHaveBeenCalledWith(50);
    });

    it('renders the custom text textarea', () => {
        const { getByLabelText } = render(
            <CancellationPicker
                value="48h"
                onChange={jest.fn()}
                forfeitPct={100}
                onForfeitPctChange={jest.fn()}
                customText=""
                onCustomTextChange={jest.fn()}
            />
        );
        expect(getByLabelText('Cancellation custom text')).toBeTruthy();
    });

    it('typing fires onCustomTextChange', () => {
        const onCustomTextChange = jest.fn();
        const { getByLabelText } = render(
            <CancellationPicker
                value="48h"
                onChange={jest.fn()}
                forfeitPct={100}
                onForfeitPctChange={jest.fn()}
                customText=""
                onCustomTextChange={onCustomTextChange}
            />
        );
        fireEvent.changeText(getByLabelText('Cancellation custom text'), 'No refunds.');
        expect(onCustomTextChange).toHaveBeenCalledWith('No refunds.');
    });

    it('"Use suggested wording" button pre-fills with auto-generated copy', () => {
        const onCustomTextChange = jest.fn();
        const { getByLabelText } = render(
            <CancellationPicker
                value="48h"
                onChange={jest.fn()}
                forfeitPct={75}
                onForfeitPctChange={jest.fn()}
                customText=""
                onCustomTextChange={onCustomTextChange}
            />
        );
        fireEvent.press(getByLabelText('Use suggested wording'));
        expect(onCustomTextChange).toHaveBeenCalledWith(expect.stringMatching(/48h/));
        expect(onCustomTextChange).toHaveBeenCalledWith(expect.stringMatching(/75%/));
    });

    it('"Use suggested wording" button hidden when customText non-empty', () => {
        const { queryByLabelText } = render(
            <CancellationPicker
                value="48h"
                onChange={jest.fn()}
                forfeitPct={100}
                onForfeitPctChange={jest.fn()}
                customText="No refunds."
                onCustomTextChange={jest.fn()}
            />
        );
        expect(queryByLabelText('Use suggested wording')).toBeNull();
    });
});
