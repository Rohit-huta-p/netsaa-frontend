// src/components/gigs/sections/__tests__/CompensationPerksSection.test.tsx
//
// Plan 5 v2 — recap pay number + perks chips. No 30/70 split, no
// PAID-VIA-NETSA eyebrow.

import React from 'react';
import { render } from '@testing-library/react-native';
import { CompensationPerksSection } from '../CompensationPerksSection';

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

describe('CompensationPerksSection', () => {
    it('renders pay + perks chips', () => {
        const { getByTestId } = render(
            <CompensationPerksSection
                amount={50000}
                perks={['All meals', 'Travel from airport', 'Stage equipment']}
            />
        );
        const flat = flatten(getByTestId('compensation-section'));
        expect(flat).toContain('50,000');
        expect(flat).toContain('per artist');
        expect(flat).toContain('All meals');
        expect(flat).toContain('Travel from airport');
    });

    it('renders min/max range when set', () => {
        const { getByTestId } = render(
            <CompensationPerksSection minAmount={30000} maxAmount={60000} />
        );
        const flat = flatten(getByTestId('compensation-section'));
        expect(flat).toContain('30,000');
        expect(flat).toContain('60,000');
    });

    it('returns null when no pay AND no perks', () => {
        const { queryByTestId } = render(<CompensationPerksSection />);
        expect(queryByTestId('compensation-section')).toBeNull();
    });

    it('renders perks-only when pay is missing', () => {
        const { getByTestId } = render(
            <CompensationPerksSection perks={['Green room', 'Costuming']} />
        );
        expect(getByTestId('compensation-perks')).toBeTruthy();
    });

    it('does NOT render "30/70 split" or "PAID VIA NETSA" anywhere', () => {
        const { getByTestId } = render(
            <CompensationPerksSection
                amount={50000}
                perks={['All meals']}
            />
        );
        const flat = flatten(getByTestId('compensation-section'));
        expect(flat).not.toContain('30/70');
        expect(flat).not.toContain('PAID VIA NETSA');
        expect(flat.toLowerCase()).not.toContain('paid via netsa');
    });
});
