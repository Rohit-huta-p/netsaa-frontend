import { computeStickyCTA } from '../utils/computeStickyCTA';

describe('computeStickyCTA', () => {
    it('11 pending applicants → Review applicants · 11', () => {
        const out = computeStickyCTA({
            pendingApplicantsCount: 11,
            urgentTeamRowCount: 0,
        });
        expect(out.label).toMatch(/Review applicants/i);
        expect(out.label).toContain('11');
        expect(out.intent).toBe('review-applicants');
    });

    it('0 applicants but 1 urgent team action → urgent label', () => {
        const out = computeStickyCTA({
            pendingApplicantsCount: 0,
            urgentTeamRowCount: 1,
            firstUrgentLabel: 'Pay ₹4.5K · Aanya',
        });
        expect(out.label).toBe('Pay ₹4.5K · Aanya');
        expect(out.intent).toBe('urgent-team');
    });

    it('0 applicants + 0 urgent → Manage team', () => {
        const out = computeStickyCTA({ pendingApplicantsCount: 0, urgentTeamRowCount: 0 });
        expect(out.label).toBe('Manage team');
        expect(out.intent).toBe('manage-team');
    });

    it('applicants take priority over urgent team rows', () => {
        const out = computeStickyCTA({
            pendingApplicantsCount: 5, urgentTeamRowCount: 3,
            firstUrgentLabel: 'Pay X',
        });
        expect(out.intent).toBe('review-applicants');
    });

    it('1 applicant → singular label', () => {
        const out = computeStickyCTA({ pendingApplicantsCount: 1, urgentTeamRowCount: 0 });
        expect(out.label).toMatch(/applicant/i);
        expect(out.label).toContain('1');
    });
});
