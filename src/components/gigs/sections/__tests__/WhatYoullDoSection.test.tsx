// src/components/gigs/sections/__tests__/WhatYoullDoSection.test.tsx
//
// Plan 5 v2 — bullets sourced from new Gig.responsibilities[] field.

import React from 'react';
import { render } from '@testing-library/react-native';
import { WhatYoullDoSection } from '../WhatYoullDoSection';

describe('WhatYoullDoSection', () => {
    it('renders one bullet per responsibility', () => {
        const { getByTestId, getByText } = render(
            <WhatYoullDoSection
                responsibilities={[
                    'Perform a 3-song fusion piece live at the sangeet ceremony',
                    'Attend 3 rehearsals in the week leading up to May 12',
                    'Be camera-ready for hall lighting and a video crew',
                ]}
            />
        );
        expect(getByTestId('what-youll-do-section')).toBeTruthy();
        expect(getByText(/Perform a 3-song fusion/)).toBeTruthy();
        expect(getByText(/Attend 3 rehearsals/)).toBeTruthy();
        expect(getByText(/camera-ready/)).toBeTruthy();
    });

    it('returns null for empty / undefined responsibilities', () => {
        const { queryByTestId } = render(<WhatYoullDoSection />);
        expect(queryByTestId('what-youll-do-section')).toBeNull();
        const { queryByTestId: q2 } = render(
            <WhatYoullDoSection responsibilities={[]} />
        );
        expect(q2('what-youll-do-section')).toBeNull();
    });
});
