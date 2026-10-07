// src/components/gigs/sections/__tests__/SectionHeading.test.tsx
//
// Locks the "V1 Accent Tick" decision (2026-10-07): a leading bar on main
// gig-detail section headings — orange for the apply-decision trio
// (What you'll do · Who we're looking for · Compensation), grey for quiet
// sections, and NONE on "About the gig".

import React from 'react';
import { render } from '@testing-library/react-native';
import { SectionHeading } from '../SectionHeading';
import { AboutSection } from '../AboutSection';
import { WhatYoullDoSection } from '../WhatYoullDoSection';
import { LookingForSection } from '../LookingForSection';
import { CompensationPerksSection } from '../CompensationPerksSection';

describe('SectionHeading — accent tick', () => {
    it('renders no tick by default', () => {
        const { queryByTestId, getByText } = render(
            <SectionHeading>About the gig</SectionHeading>
        );
        expect(getByText('About the gig')).toBeTruthy();
        expect(queryByTestId('section-heading-tick')).toBeNull();
    });

    it('renders an orange tick for accent="main"', () => {
        const { getByTestId } = render(
            <SectionHeading accent="main">What you'll do</SectionHeading>
        );
        const tick = getByTestId('section-heading-tick');
        expect(tick).toBeTruthy();
        expect(String(tick.props.className)).toContain('bg-orange-500');
    });

    it('renders a grey tick for accent="quiet"', () => {
        const { getByTestId } = render(
            <SectionHeading accent="quiet">Terms</SectionHeading>
        );
        expect(String(getByTestId('section-heading-tick').props.className)).toContain(
            'bg-zinc-600'
        );
    });
});

describe('gig-detail sections — locked tick wiring', () => {
    it('"About the gig" has NO tick', () => {
        const { queryByTestId } = render(
            <AboutSection description="A 3-song fusion piece." />
        );
        expect(queryByTestId('section-heading-tick')).toBeNull();
    });

    it('the main trio is ticked', () => {
        expect(
            render(
                <WhatYoullDoSection responsibilities={['Perform a duo']} />
            ).getByTestId('section-heading-tick')
        ).toBeTruthy();

        expect(
            render(
                <LookingForSection artistTypes={['Dancer']} />
            ).getByTestId('section-heading-tick')
        ).toBeTruthy();

        expect(
            render(
                <CompensationPerksSection amount={18000} />
            ).getByTestId('section-heading-tick')
        ).toBeTruthy();
    });
});
