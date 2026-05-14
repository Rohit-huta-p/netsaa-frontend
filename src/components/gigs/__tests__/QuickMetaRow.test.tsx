// src/components/gigs/__tests__/QuickMetaRow.test.tsx
//
// Plan 5 v2 — editorial 3-column stat line (When · Where · Slots).
// Replaces the prior 2-col icon row. Distance still appended to the
// Where sub-line (precise via haversine, or "in your city" soft-match).

import React from 'react';
import { render } from '@testing-library/react-native';
import { QuickMetaRow } from '../QuickMetaRow';

const PUNE_GEO = { lat: 18.5204, lng: 73.8567 };
const MUMBAI_GEO = { lat: 19.076, lng: 72.8777 };

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

describe('QuickMetaRow — v2 editorial stat line', () => {
    it('renders the 3-column stat container', () => {
        const { getByTestId } = render(
            <QuickMetaRow
                location={{ city: 'Pune', state: 'Maharashtra' }}
                schedule={{ startDate: '2026-05-12T19:30:00Z' }}
                slots={6}
            />
        );
        expect(getByTestId('quick-meta-row')).toBeTruthy();
    });

    it('renders precise distance when both gig.geo + viewerCoords are set', () => {
        const { getByTestId } = render(
            <QuickMetaRow
                location={{
                    venueName: 'JW Marriott',
                    city: 'Pune',
                    state: 'Maharashtra',
                    geo: PUNE_GEO,
                }}
                schedule={{ startDate: '2026-05-12T19:30:00Z' }}
                slots={6}
                viewerCoords={MUMBAI_GEO}
                viewerCity="Mumbai"
            />
        );
        const sub = flatten(getByTestId('quickmeta-location-sub'));
        // Pune ↔ Mumbai ~ 120 km
        expect(sub).toMatch(/Pune · 1[12]\d km/);
    });

    it('falls back to "in your city" when gig has no geo but cities match', () => {
        const { getByTestId } = render(
            <QuickMetaRow
                location={{
                    venueName: 'Some venue',
                    city: 'Pune',
                    state: 'Maharashtra',
                }}
                schedule={{ startDate: '2026-05-12T19:30:00Z' }}
                slots={6}
                viewerCoords={null}
                viewerCity="Pune"
            />
        );
        const sub = flatten(getByTestId('quickmeta-location-sub'));
        expect(sub).toContain('in your city');
    });

    it('renders only city/state when no distance signal available', () => {
        const { getByTestId } = render(
            <QuickMetaRow
                location={{
                    venueName: 'Some venue',
                    city: 'Pune',
                    state: 'Maharashtra',
                }}
                schedule={{ startDate: '2026-05-12T19:30:00Z' }}
                slots={6}
                viewerCoords={null}
                viewerCity="Mumbai"
            />
        );
        const sub = flatten(getByTestId('quickmeta-location-sub'));
        expect(sub).toBe('Pune, Maharashtra');
    });

    it('renders "Open" when slots are unset', () => {
        const { getByTestId } = render(
            <QuickMetaRow
                location={{ city: 'Pune' }}
                schedule={{ startDate: '2026-05-12T19:30:00Z' }}
            />
        );
        const all = flatten(getByTestId('quick-meta-row'));
        expect(all).toContain('Open');
    });

    it('renders singular form for 1 slot', () => {
        const { getByTestId } = render(
            <QuickMetaRow
                location={{ city: 'Pune' }}
                schedule={{ startDate: '2026-05-12T19:30:00Z' }}
                slots={1}
            />
        );
        const all = flatten(getByTestId('quick-meta-row'));
        expect(all).toContain('1 artist');
        expect(all).not.toContain('1 artists');
    });

    it('handles undefined location + schedule gracefully', () => {
        const { getByTestId } = render(<QuickMetaRow />);
        // Should mount without throwing
        expect(getByTestId('quick-meta-row')).toBeTruthy();
        const all = flatten(getByTestId('quick-meta-row'));
        expect(all).toContain('TBD');
    });
});
