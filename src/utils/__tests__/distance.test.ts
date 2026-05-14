// src/utils/__tests__/distance.test.ts
//
// Plan 5 — distance utility for gig detail page redesign.
// Covers haversine math, formatting bands (m / 1-decimal km / int km),
// outlier rejection, city soft-match, and the full describeDistance
// precedence order (precise > city > null).

import {
    haversineKm,
    formatDistanceKm,
    citySoftMatch,
    describeDistance,
} from '../distance';

describe('haversineKm', () => {
    it('returns 0 for identical points', () => {
        expect(haversineKm({ lat: 18.52, lng: 73.86 }, { lat: 18.52, lng: 73.86 })).toBe(0);
    });

    it('Pune ↔ Mumbai is roughly 120 km', () => {
        // Pune (18.5204, 73.8567) ↔ Mumbai (19.0760, 72.8777)
        const km = haversineKm(
            { lat: 18.5204, lng: 73.8567 },
            { lat: 19.076, lng: 72.8777 }
        );
        expect(km).toBeGreaterThan(115);
        expect(km).toBeLessThan(125);
    });

    it('Pune ↔ Delhi is roughly 1170 km', () => {
        const km = haversineKm(
            { lat: 18.5204, lng: 73.8567 },
            { lat: 28.6139, lng: 77.209 }
        );
        expect(km).toBeGreaterThan(1150);
        expect(km).toBeLessThan(1200);
    });

    it('order of arguments does not affect result', () => {
        const a = { lat: 12.97, lng: 77.59 };
        const b = { lat: 19.07, lng: 72.87 };
        expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 5);
    });
});

describe('formatDistanceKm', () => {
    it('formats sub-kilometre as metres', () => {
        expect(formatDistanceKm(0.85)).toBe('850 m');
        expect(formatDistanceKm(0.05)).toBe('50 m');
        expect(formatDistanceKm(0)).toBe('0 m');
    });

    it('formats 1-9.9 km with one decimal', () => {
        expect(formatDistanceKm(1.4)).toBe('1.4 km');
        expect(formatDistanceKm(9.9)).toBe('9.9 km');
    });

    it('formats 10+ km as integer', () => {
        expect(formatDistanceKm(12)).toBe('12 km');
        expect(formatDistanceKm(120.4)).toBe('120 km');
        expect(formatDistanceKm(120.6)).toBe('121 km');
    });

    it('returns null for outlier > 5000 km (likely bad geocode)', () => {
        expect(formatDistanceKm(5001)).toBeNull();
        expect(formatDistanceKm(20000)).toBeNull();
    });

    it('returns null for invalid inputs', () => {
        expect(formatDistanceKm(NaN)).toBeNull();
        expect(formatDistanceKm(-1)).toBeNull();
        expect(formatDistanceKm(Infinity)).toBeNull();
    });
});

describe('citySoftMatch', () => {
    it('returns "in your city" when strings match (case-insensitive)', () => {
        expect(citySoftMatch('Pune', 'pune')).toBe('in your city');
        expect(citySoftMatch('  PUNE  ', 'Pune')).toBe('in your city');
    });

    it('returns null when cities differ', () => {
        expect(citySoftMatch('Pune', 'Mumbai')).toBeNull();
    });

    it('returns null for empty / missing input', () => {
        expect(citySoftMatch(null, 'Pune')).toBeNull();
        expect(citySoftMatch('Pune', undefined)).toBeNull();
        expect(citySoftMatch('', 'Pune')).toBeNull();
        expect(citySoftMatch('   ', 'Pune')).toBeNull();
    });
});

describe('describeDistance', () => {
    it('returns precise distance when both gig.geo and viewerCoords are set', () => {
        const out = describeDistance(
            { geo: { lat: 18.5204, lng: 73.8567 }, city: 'Pune' },
            { lat: 19.076, lng: 72.8777 },
            'Mumbai'
        );
        // Pune ↔ Mumbai ≈ 120 km → integer band
        expect(out).toMatch(/^1[12]\d km$/);
    });

    it('falls back to city soft-match when gig has no geo', () => {
        expect(
            describeDistance({ city: 'Pune' }, null, 'Pune')
        ).toBe('in your city');
    });

    it('falls back to city soft-match when viewer has no coords', () => {
        expect(
            describeDistance(
                { geo: { lat: 18.5204, lng: 73.8567 }, city: 'Pune' },
                null,
                'Pune'
            )
        ).toBe('in your city');
    });

    it('returns null when neither precise nor city signal works', () => {
        expect(
            describeDistance({ city: 'Pune' }, null, 'Mumbai')
        ).toBeNull();
        expect(describeDistance(undefined, null, 'Pune')).toBeNull();
        expect(describeDistance({}, null, null)).toBeNull();
    });
});
