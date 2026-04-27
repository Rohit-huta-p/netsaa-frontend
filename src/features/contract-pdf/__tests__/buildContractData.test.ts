// src/features/contract-pdf/__tests__/buildContractData.test.ts
import { buildFromGig, buildFromContract } from '../utils/buildContractData';

describe('buildFromGig', () => {
    it('produces preview data with placeholder names', () => {
        const out = buildFromGig({
            _id: 'g1',
            title: 'Sangeet Choreography',
            eventFunction: 'Sangeet',
            description: 'Lead 6 dancers · 3 song fusion',
            schedule: { startDate: new Date('2027-03-15').toISOString() },
            location: { city: 'Pune', venue: 'JW Marriott' },
            compensation: { amount: 50000 },
            paymentStructure: 'advance_balance',
            cancellationPolicy: '48h',
            cancellationForfeitPct: 75,
            customClauses: ['Arrive 1h early', 'Bring own jewelry'],
        }, {});

        expect(out.title).toBe('Sangeet Choreography');
        expect(out.amount).toBe(50000);
        expect(out.paymentStructure).toBe('advance_balance');
        expect(out.cancellationForfeitPct).toBe(75);
        expect(out.customClauses).toEqual(['Arrive 1h early', 'Bring own jewelry']);
        expect(out.isPreview).toBe(true);
        expect(out.hirerName).toMatch(/hirer/i);
        expect(out.artistName).toMatch(/artist/i);
    });

    it('falls back to defaults when gig has no booking-terms fields', () => {
        const out = buildFromGig({ title: 'X', compensation: { amount: 1000 } }, {});
        expect(out.paymentStructure).toBe('full');
        expect(out.cancellationPolicy).toBe('48h');
        expect(out.cancellationForfeitPct).toBe(100);
        expect(out.customClauses).toEqual([]);
    });
});

describe('buildFromContract', () => {
    it('extracts data from a sealed contract', () => {
        const out = buildFromContract({
            _id: 'c1',
            hirerSnapshot: { displayName: 'Sharma Wedding' },
            artistSnapshot: { displayName: 'Priya Sharma' },
            hirerSignature: { signedAt: '2027-03-01T10:00:00Z' },
            artistSignature: { signedAt: '2027-03-02T11:00:00Z' },
            terms: {
                gigTitle: 'Sangeet Choreography',
                amount: 50000,
                paymentStructure: 'advance_balance',
                customTerms: '01. Arrive 1h early\n02. Bring own jewelry',
                scopeOfWork: 'Lead 6 dancers',
                dates: { start: '2027-03-15T18:00:00Z' },
                location: { city: 'Pune', venue: 'JW Marriott' },
            },
        });
        expect(out.title).toBe('Sangeet Choreography');
        expect(out.hirerName).toBe('Sharma Wedding');
        expect(out.artistName).toBe('Priya Sharma');
        expect(out.customClauses).toEqual(['Arrive 1h early', 'Bring own jewelry']);
        expect(out.contractId).toBe('c1');
        expect(out.hirerSignedAt).toBeTruthy();
        expect(out.artistSignedAt).toBeTruthy();
        expect(out.isPreview).toBe(false);
    });

    it('handles missing snapshots gracefully', () => {
        const out = buildFromContract({ terms: {} });
        expect(out.title).toBe('Untitled gig');
        expect(out.hirerName).toBe('Hirer');
        expect(out.artistName).toBe('Artist');
        expect(out.customClauses).toEqual([]);
    });
});
