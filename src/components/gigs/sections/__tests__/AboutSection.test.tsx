// src/components/gigs/sections/__tests__/AboutSection.test.tsx

import React from 'react';
import { render } from '@testing-library/react-native';
import { AboutSection } from '../AboutSection';

describe('AboutSection', () => {
    it('renders the heading + description body', () => {
        const { getByTestId, getByText } = render(
            <AboutSection description="A 3-song fusion choreography for the sangeet of Aarav & Riya." />
        );
        expect(getByTestId('about-section')).toBeTruthy();
        expect(getByText(/3-song fusion/)).toBeTruthy();
    });

    it('returns null for empty / whitespace-only description', () => {
        const { queryByTestId } = render(<AboutSection description="   " />);
        expect(queryByTestId('about-section')).toBeNull();
        const { queryByTestId: q2 } = render(<AboutSection />);
        expect(q2('about-section')).toBeNull();
    });
});
