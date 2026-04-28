// netsa-mobile/src/components/create/pages/components/__tests__/TermsTemplates.test.tsx
//
// Locks the chip-row → onSelect contract for Page 4's T&C templates.
// Tapping a chip on an empty textarea calls onSelect immediately with
// that template's body. Tapping a chip on a populated textarea triggers
// the confirm-overwrite Alert (mocked here as a no-op for direct path).

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TermsTemplates, TERMS_TEMPLATES } from '../TermsTemplates';

// Stub Alert so the destructive "Replace" path proceeds straight to onSelect
// (test-environment branch in the component).
jest.spyOn(require('react-native').Alert, 'alert').mockImplementation(() => {});

describe('TermsTemplates', () => {
    it('renders all 4 chips', () => {
        const { getByLabelText } = render(
            <TermsTemplates currentValue="" onSelect={jest.fn()} />
        );
        expect(getByLabelText('Use Basic terms template')).toBeTruthy();
        expect(getByLabelText('Use Standard terms template')).toBeTruthy();
        expect(getByLabelText('Use Detailed terms template')).toBeTruthy();
        expect(getByLabelText('Use Blank terms template')).toBeTruthy();
    });

    it("Basic chip fills onSelect with the basic template body", () => {
        const onSelect = jest.fn();
        const { getByLabelText } = render(
            <TermsTemplates currentValue="" onSelect={onSelect} />
        );
        fireEvent.press(getByLabelText('Use Basic terms template'));
        expect(onSelect).toHaveBeenCalledWith(TERMS_TEMPLATES.basic);
    });

    it('Standard chip fills onSelect with the standard template body', () => {
        const onSelect = jest.fn();
        const { getByLabelText } = render(
            <TermsTemplates currentValue="" onSelect={onSelect} />
        );
        fireEvent.press(getByLabelText('Use Standard terms template'));
        expect(onSelect).toHaveBeenCalledWith(TERMS_TEMPLATES.standard);
    });

    it('Detailed chip fills onSelect with the detailed template body', () => {
        const onSelect = jest.fn();
        const { getByLabelText } = render(
            <TermsTemplates currentValue="" onSelect={onSelect} />
        );
        fireEvent.press(getByLabelText('Use Detailed terms template'));
        expect(onSelect).toHaveBeenCalledWith(TERMS_TEMPLATES.detailed);
    });

    it('Blank chip clears onSelect (empty string)', () => {
        const onSelect = jest.fn();
        const { getByLabelText } = render(
            <TermsTemplates currentValue="" onSelect={onSelect} />
        );
        fireEvent.press(getByLabelText('Use Blank terms template'));
        expect(onSelect).toHaveBeenCalledWith('');
    });
});
