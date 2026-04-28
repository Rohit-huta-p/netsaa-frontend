// src/features/contract-pdf/__tests__/contractTemplate.test.ts
import { renderContractHtml } from '../templates/contractTemplate';

const baseData = {
    title: 'Sangeet Choreography',
    gigSubtitle: 'Sangeet · Pune · Mar 15, 2027',
    hirerName: 'Sharma Wedding',
    artistName: 'Priya Sharma',
    amount: 50000,
    paymentStructure: 'advance_balance' as const,
    cancellationPolicy: '48h' as const,
    cancellationForfeitPct: 100,
    customClauses: [],
    scopeOfWork: 'Lead 6 dancers · 3 song fusion',
    eventDate: '2027-03-15T18:00:00Z',
    venue: 'JW Marriott',
    city: 'Pune',
    isPreview: false,
};

describe('renderContractHtml', () => {
    it('returns a complete HTML document', () => {
        const html = renderContractHtml(baseData);
        expect(html).toContain('<!doctype html>');
        expect(html).toContain('<title>Contract · Sangeet Choreography</title>');
        expect(html).toContain('Sharma Wedding');
        expect(html).toContain('Priya Sharma');
        expect(html).toContain('₹50,000');
    });

    it('shows the Preview watermark when isPreview is true', () => {
        const html = renderContractHtml({ ...baseData, isPreview: true });
        expect(html).toMatch(/Preview · not yet signed/);
    });

    it('renders the 30/70 split block for advance_balance', () => {
        const html = renderContractHtml(baseData);
        expect(html).toMatch(/30\/70 advance/);
        expect(html).toMatch(/₹15,000/);
        expect(html).toMatch(/₹35,000/);
    });

    it('omits the 30/70 split block for full upfront', () => {
        const html = renderContractHtml({ ...baseData, paymentStructure: 'full' });
        expect(html).not.toMatch(/30\/70 advance/);
    });

    it('renders custom clauses as a numbered list', () => {
        const html = renderContractHtml({
            ...baseData,
            customClauses: ['Arrive 1h early', 'Bring own jewelry'],
        });
        expect(html).toMatch(/<h2>Custom clauses<\/h2>/);
        expect(html).toContain('Arrive 1h early');
        expect(html).toContain('Bring own jewelry');
    });

    it('escapes user content (defends against script injection)', () => {
        const html = renderContractHtml({
            ...baseData,
            scopeOfWork: '<script>alert("x")</script>Lead dancers',
        });
        expect(html).not.toContain('<script>alert');
        expect(html).toContain('&lt;script&gt;');
    });

    it('shows pending placeholder when no signatures present', () => {
        const html = renderContractHtml({ ...baseData, isPreview: true });
        // Both sigs absent + preview mode
        expect(html).toMatch(/Signature pending — applies at hire/);
    });

    it('shows signed timestamp when signatures present', () => {
        const html = renderContractHtml({
            ...baseData,
            hirerSignedAt: '2027-03-01T10:00:00Z',
            artistSignedAt: '2027-03-02T11:00:00Z',
        });
        expect(html).toMatch(/Signed .*2027/);
    });

    it('renders forfeit percentage as a structured field', () => {
        const html = renderContractHtml({ ...baseData, cancellationForfeitPct: 50 });
        // Structured fact (Window + Forfeit field labels) is always rendered
        expect(html).toMatch(/<div class="field-label">Window<\/div>/);
        expect(html).toMatch(/<div class="field-label">Forfeit<\/div>/);
        expect(html).toMatch(/50%/);
    });

    it('renders the cancellation narrative paragraph only when cancellationCustomText is set', () => {
        const withText = renderContractHtml({
            ...baseData,
            cancellationCustomText: 'No refunds within 1 week. Half refund within 30 days.',
        });
        expect(withText).toContain('No refunds within 1 week. Half refund within 30 days.');
    });

    it('omits the cancellation narrative paragraph when cancellationCustomText is empty/undefined', () => {
        const withoutText = renderContractHtml({ ...baseData });
        // No paragraph after the field-grid; only the structured Window + Forfeit fields
        expect(withoutText).not.toMatch(/the artist forfeits/i);
        expect(withoutText).toMatch(/<div class="field-label">Window<\/div>/);

        const empty = renderContractHtml({ ...baseData, cancellationCustomText: '   ' });
        // Whitespace-only text is treated as empty
        expect(empty).not.toMatch(/<p class="terms-paragraph" style="margin-top: 8pt;">/);
    });

    it('escapes the hirer-authored cancellation narrative', () => {
        const html = renderContractHtml({
            ...baseData,
            cancellationCustomText: '<script>x</script>No refunds.',
        });
        expect(html).not.toContain('<script>x</script>');
        expect(html).toContain('&lt;script&gt;');
    });
});
