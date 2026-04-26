import React from 'react';
import { render } from '@testing-library/react-native';
import { HubKPIs } from '../components/HubKPIs';

describe('HubKPIs', () => {
    it('renders 3 cells with formatted values', () => {
        const { getByText } = render(
            <HubKPIs kpis={{
                appliedCount: 14,
                hiredCount: 3,
                slotsTotal: 6,
                paidAmount: 15000,
                dueAmount: 35000,
            }} />
        );
        expect(getByText('Applied')).toBeTruthy();
        expect(getByText('14')).toBeTruthy();
        expect(getByText('Hired')).toBeTruthy();
        expect(getByText('3')).toBeTruthy();
        expect(getByText('/6')).toBeTruthy();
        expect(getByText('Paid · Due')).toBeTruthy();
        expect(getByText('₹15K')).toBeTruthy();
        expect(getByText('₹35K')).toBeTruthy();
    });

    it('formats lakh boundary correctly (99,999 → ₹1L not ₹100K)', () => {
        const { getByText, queryByText } = render(
            <HubKPIs kpis={{
                appliedCount: 0, hiredCount: 0, slotsTotal: 1,
                paidAmount: 99999, dueAmount: 0,
            }} />
        );
        expect(getByText('₹1L')).toBeTruthy();
        expect(queryByText('₹100K')).toBeNull();
        expect(queryByText('₹100.0K')).toBeNull();
    });

    it('truncates rather than rounds (15,499 → ₹15.4K)', () => {
        const { getByText, queryByText } = render(
            <HubKPIs kpis={{
                appliedCount: 0, hiredCount: 0, slotsTotal: 1,
                paidAmount: 15499, dueAmount: 0,
            }} />
        );
        expect(getByText('₹15.4K')).toBeTruthy();
        expect(queryByText('₹15.5K')).toBeNull();
    });

    it('handles zero gracefully', () => {
        const { getAllByText } = render(
            <HubKPIs kpis={{
                appliedCount: 0, hiredCount: 0, slotsTotal: 1,
                paidAmount: 0, dueAmount: 0,
            }} />
        );
        // Both paid and due render as ₹0
        expect(getAllByText('₹0').length).toBeGreaterThanOrEqual(2);
    });
});
