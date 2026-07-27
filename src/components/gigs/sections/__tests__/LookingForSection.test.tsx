// src/components/gigs/sections/__tests__/LookingForSection.test.tsx
//
// Plan 5 v2 — Type/Experience/Age/Height key-value rows + skill chips.

import React from 'react';
import { render } from '@testing-library/react-native';
import { LookingForSection } from '../LookingForSection';

describe('LookingForSection', () => {
    it('renders type + experience + age + height + skills (slots aside removed)', () => {
        const { getByTestId, getByText, queryByText } = render(
            <LookingForSection
                artistTypes={['Dancer']}
                experienceLevel="intermediate"
                genderPreference="female"
                ageRange={{ min: 20, max: 35 }}
                heightRequirements={{ female: { min: '5\'2"', max: '5\'8"' } }}
                requiredSkills={['Bharatanatyam', 'Kathak', 'Mudra', 'Abhinaya']}
                slots={6}
            />
        );

        // Section + skills container present
        expect(getByTestId('looking-for-section')).toBeTruthy();
        expect(getByTestId('looking-for-skills')).toBeTruthy();

        // Row labels + values
        expect(getByText('Type')).toBeTruthy();
        expect(getByText('Experience')).toBeTruthy();
        expect(getByText('Age')).toBeTruthy();
        expect(getByText('Height')).toBeTruthy();
        expect(getByText(/20 – 35 years/)).toBeTruthy();

        // Mid-level for intermediate
        expect(getByText(/Mid-level/)).toBeTruthy();

        // Skills chips render each skill
        expect(getByText('Bharatanatyam')).toBeTruthy();
        expect(getByText('Kathak')).toBeTruthy();
        expect(getByText('Abhinaya')).toBeTruthy();

        // Slots aside removed (#4) — slots now live in the When/Where/Slots meta stack.
        expect(queryByText(/06 slots/)).toBeNull();
    });

    it('hides empty rows and section when nothing to render', () => {
        const { queryByTestId } = render(<LookingForSection />);
        expect(queryByTestId('looking-for-section')).toBeNull();
    });

    it('skips skill block when no skills provided', () => {
        const { queryByTestId } = render(
            <LookingForSection artistTypes={['Singer']} />
        );
        expect(queryByTestId('looking-for-skills')).toBeNull();
    });
});
