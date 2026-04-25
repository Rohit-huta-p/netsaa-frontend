// src/features/profile/components/edit/__tests__/EditModalPrimitives.test.tsx

import React, { useState } from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Field, Input, MiniField } from '../EditModalPrimitives';

describe('EditModalPrimitives', () => {
    it('Field renders its label and children', () => {
        const { getByText, getByPlaceholderText } = render(
            <Field label="Display Name">
                <Input value="" onChangeText={() => {}} placeholder="Type here" />
            </Field>
        );
        expect(getByText('Display Name')).toBeTruthy();
        expect(getByPlaceholderText('Type here')).toBeTruthy();
    });

    it('Input keeps the same node identity across parent re-renders (no re-mount)', () => {
        function Parent() {
            const [v, setV] = useState('');
            return <Input value={v} onChangeText={setV} placeholder="Name" />;
        }
        const { getByPlaceholderText } = render(<Parent />);
        const before = getByPlaceholderText('Name');
        fireEvent.changeText(before, 'A');
        const after = getByPlaceholderText('Name');
        // Same instance proves the component wasn't unmounted/remounted.
        // If Input were declared inside Parent, this would fail.
        expect(before).toBe(after);
    });

    it('MiniField renders its label and children', () => {
        const { getByText, getByPlaceholderText } = render(
            <MiniField label="Role">
                <Input value="" onChangeText={() => {}} placeholder="Lead" />
            </MiniField>
        );
        expect(getByText('Role')).toBeTruthy();
        expect(getByPlaceholderText('Lead')).toBeTruthy();
    });
});
