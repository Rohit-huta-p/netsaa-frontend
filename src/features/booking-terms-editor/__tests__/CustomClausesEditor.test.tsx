import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CustomClausesEditor } from '../components/CustomClausesEditor';

describe('CustomClausesEditor', () => {
    it('shows empty-state copy when no clauses', () => {
        const { getByText } = render(<CustomClausesEditor clauses={[]} onChange={jest.fn()} />);
        expect(getByText(/No custom clauses yet/i)).toBeTruthy();
    });

    it('renders numbered rows for existing clauses', () => {
        const { getByLabelText } = render(
            <CustomClausesEditor clauses={['First', 'Second']} onChange={jest.fn()} />
        );
        expect(getByLabelText('Clause 1')).toBeTruthy();
        expect(getByLabelText('Clause 2')).toBeTruthy();
    });

    it('Add clause button fires onChange with new empty entry', () => {
        const onChange = jest.fn();
        const { getByLabelText } = render(<CustomClausesEditor clauses={['A']} onChange={onChange} />);
        fireEvent.press(getByLabelText('Add a custom clause'));
        expect(onChange).toHaveBeenCalledWith(['A', '']);
    });

    it('Add clause is disabled at 5', () => {
        const onChange = jest.fn();
        const { getByLabelText } = render(
            <CustomClausesEditor clauses={['A', 'B', 'C', 'D', 'E']} onChange={onChange} />
        );
        fireEvent.press(getByLabelText('Add a custom clause'));
        expect(onChange).not.toHaveBeenCalled();
    });

    it('Remove fires onChange without that index', () => {
        const onChange = jest.fn();
        const { getByLabelText } = render(
            <CustomClausesEditor clauses={['First', 'Second', 'Third']} onChange={onChange} />
        );
        fireEvent.press(getByLabelText('Remove clause 2'));
        expect(onChange).toHaveBeenCalledWith(['First', 'Third']);
    });

    it('Typing fires onChange with the updated value', () => {
        const onChange = jest.fn();
        const { getByLabelText } = render(<CustomClausesEditor clauses={['']} onChange={onChange} />);
        fireEvent.changeText(getByLabelText('Clause 1'), 'Be on time');
        expect(onChange).toHaveBeenCalledWith(['Be on time']);
    });
});
