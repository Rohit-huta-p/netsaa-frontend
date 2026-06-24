// src/components/gigs/__tests__/PayHero.test.tsx
//
// Plan 5 v2 — large brand-orange pay number with aux line beneath it.
// Replaces the old "Total Compensation" sidebar block on mobile.

import React from 'react';
import { render } from '@testing-library/react-native';
import { PayHero } from '../PayHero';

function flatten(host: any): string {
    const flat: string[] = [];
    const walk = (node: any) => {
        if (node == null) return;
        if (typeof node === 'string' || typeof node === 'number') {
            flat.push(String(node));
            return;
        }
        if (Array.isArray(node)) return node.forEach(walk);
        if (node?.props?.children !== undefined) walk(node.props.children);
    };
    walk(host.props.children);
    return flat.join('');
}

describe('PayHero', () => {
    it('renders a fixed amount with INR formatting', () => {
        const { getByTestId } = render(<PayHero amount={50000} />);
        const flat = flatten(getByTestId('pay-hero'));
        expect(flat).toContain('50,000');
    });

    it('renders the default aux label "per artist"', () => {
        const { getByTestId } = render(<PayHero amount={50000} />);
        const flat = flatten(getByTestId('pay-hero-aux'));
        expect(flat).toContain('per artist');
    });

    it('appends "negotiable" when negotiable=true', () => {
        const { getByTestId } = render(
            <PayHero amount={50000} negotiable />
        );
        const flat = flatten(getByTestId('pay-hero-aux'));
        expect(flat).toContain('negotiable');
    });

    it('omits negotiable when false / undefined', () => {
        const { getByTestId } = render(<PayHero amount={50000} />);
        const flat = flatten(getByTestId('pay-hero-aux'));
        expect(flat).not.toContain('negotiable');
    });

    it('honours auxLabel override', () => {
        const { getByTestId } = render(
            <PayHero amount={50000} auxLabel="per shoot · 3 looks" />
        );
        const flat = flatten(getByTestId('pay-hero-aux'));
        expect(flat).toContain('per shoot');
    });

    it('renders min/max range when only minAmount + maxAmount are set', () => {
        const { getByTestId } = render(
            <PayHero minAmount={30000} maxAmount={60000} />
        );
        const flat = flatten(getByTestId('pay-hero'));
        expect(flat).toContain('30,000');
        expect(flat).toContain('60,000');
    });

    it('renders "From X" when only minAmount is set', () => {
        const { getByTestId } = render(<PayHero minAmount={20000} />);
        const flat = flatten(getByTestId('pay-hero'));
        expect(flat).toContain('20,000');
    });

    it('renders fallback "To be discussed" when no amount is given', () => {
        const { getByTestId } = render(<PayHero />);
        const flat = flatten(getByTestId('pay-hero'));
        expect(flat).toContain('To be discussed');
    });
});
