import React from 'react';
import { render } from '@testing-library/react-native';
import { HubKPIs } from '../components/HubKPIs';

// PAYMENTS-DISABLED (Apr 30): Paid · Due cell removed from HubKPIs.
// Lakh-boundary + truncation + zero-state cases dropped because
// they only exercised the inrShort formatter via the now-removed
// cell. The formatter helper is still exported in the component
// file and recoverable; restore the dropped cases when the cell
// returns alongside on-platform Razorpay.

describe('HubKPIs', () => {
    it('renders Applied + Hired cells with formatted values', () => {
        const { getByText, queryByText } = render(
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
        // Paid · Due cell hidden post Apr-30 PAYMENTS-DISABLED rollback.
        expect(queryByText('Paid · Due')).toBeNull();
        expect(queryByText('₹15K')).toBeNull();
        expect(queryByText('₹35K')).toBeNull();
    });
});
