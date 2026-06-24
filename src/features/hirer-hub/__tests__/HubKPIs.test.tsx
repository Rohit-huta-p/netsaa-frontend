import React from 'react';
import { render } from '@testing-library/react-native';
import { HubKPIs } from '../components/HubKPIs';

// Gig-hub redesign v1: HubKPIs is a 4-cell hairline band —
// Applied (+new) · Slots · Budget · Days left. Budget shows the gig's stated
// compensation (a number, safe under PAYMENTS-DISABLED); per-artist paid/due
// is NOT surfaced here until on-platform Razorpay ships.
describe('HubKPIs', () => {
    it('renders the 4-cell band with formatted values', () => {
        const { getByText, queryByText } = render(
            <HubKPIs kpis={{
                appliedCount: 14,
                newCount: 3,
                hiredCount: 3,
                slotsTotal: 6,
                budgetAmount: 50000,
                daysLeft: 11,
                paidAmount: 0,
                dueAmount: 0,
            }} />
        );
        expect(getByText('Applied')).toBeTruthy();
        expect(getByText('14')).toBeTruthy();   // applied count
        expect(getByText('Slots')).toBeTruthy();
        expect(getByText('3')).toBeTruthy();     // hired count
        expect(getByText('/6')).toBeTruthy();    // slots total
        expect(getByText('Budget')).toBeTruthy();
        expect(getByText('₹50K')).toBeTruthy();
        expect(getByText('Days left')).toBeTruthy();
        expect(getByText('11')).toBeTruthy();
        // Per-artist paid/due is not surfaced in the band (PAYMENTS-DISABLED).
        expect(queryByText('Paid · Due')).toBeNull();
    });

    it('renders an em dash for missing budget / event date', () => {
        const { getAllByText } = render(
            <HubKPIs kpis={{
                appliedCount: 0,
                newCount: 0,
                hiredCount: 0,
                slotsTotal: 1,
                budgetAmount: 0,
                daysLeft: null,
                paidAmount: 0,
                dueAmount: 0,
            }} />
        );
        // Budget (₹0 → —) and Days left (null → —) both render an em dash.
        expect(getAllByText('—').length).toBeGreaterThanOrEqual(2);
    });
});
