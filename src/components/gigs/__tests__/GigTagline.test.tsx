// src/components/gigs/__tests__/GigTagline.test.tsx
//
// Plan 5 v2 — small derive line under the gig title.

import React from 'react';
import { render } from '@testing-library/react-native';
import { GigTagline } from '../GigTagline';

function flatten(host: any): string {
    const flat: string[] = [];
    const walk = (n: any) => {
        if (n == null) return;
        if (typeof n === 'string' || typeof n === 'number') return flat.push(String(n));
        if (Array.isArray(n)) return n.forEach(walk);
        if (n?.props?.children !== undefined) walk(n.props.children);
    };
    walk(host.props.children);
    return flat.join('');
}

describe('GigTagline', () => {
    it('joins tag · artist types · city · short date with middle dots', () => {
        const { getByTestId } = render(
            <GigTagline
                tags={['3-song fusion']}
                artistTypes={['Bharatanatyam', 'Bollywood']}
                city="Pune"
                // Mid-day UTC so en-IN locale (+5:30) still lands on the same date.
                startDate="2026-05-12T08:00:00Z"
            />
        );
        const flat = flatten(getByTestId('gig-tagline'));
        expect(flat).toContain('3-song fusion');
        expect(flat).toContain('Bharatanatyam & Bollywood');
        expect(flat).toContain('Pune');
        expect(flat).toContain('12 May');
        expect(flat.split(' · ').length).toBeGreaterThanOrEqual(4);
    });

    it('joins 3 artist types with comma + ampersand', () => {
        const { getByTestId } = render(
            <GigTagline artistTypes={['Singer', 'Dancer', 'Actor']} city="Mumbai" />
        );
        const flat = flatten(getByTestId('gig-tagline'));
        expect(flat).toContain('Singer, Dancer & Actor');
    });

    it('renders nothing when all inputs are empty', () => {
        const { queryByTestId } = render(<GigTagline />);
        expect(queryByTestId('gig-tagline')).toBeNull();
    });
});
