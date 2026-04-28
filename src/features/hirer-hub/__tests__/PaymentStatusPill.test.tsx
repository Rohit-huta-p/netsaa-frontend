// netsa-mobile/src/features/hirer-hub/__tests__/PaymentStatusPill.test.tsx
//
// Locks the status → label mapping and the "no transactions" silent path.
import React from 'react';
import { render } from '@testing-library/react-native';
import { PaymentStatusPill } from '../components/PaymentStatusPill';

describe('PaymentStatusPill', () => {
    it('renders nothing when transactions is empty/null', () => {
        const { queryByText } = render(<PaymentStatusPill transactions={[]} />);
        expect(queryByText(/Pending|Confirmed|Disputed/i)).toBeNull();

        const { queryByText: queryByText2 } = render(<PaymentStatusPill transactions={null} />);
        expect(queryByText2(/Pending|Confirmed|Disputed/i)).toBeNull();
    });

    it('shows "Pending confirmation" for the latest recorded transaction', () => {
        const { getByText } = render(
            <PaymentStatusPill
                transactions={[
                    { status: 'recorded', createdAt: '2027-03-15T10:00:00Z' },
                ]}
            />
        );
        expect(getByText('Pending confirmation')).toBeTruthy();
    });

    it('shows "Confirmed" when the latest is confirmed', () => {
        const { getByText } = render(
            <PaymentStatusPill
                transactions={[
                    { status: 'confirmed', createdAt: '2027-03-16T10:00:00Z' },
                    { status: 'recorded', createdAt: '2027-03-15T10:00:00Z' },
                ]}
            />
        );
        expect(getByText('Confirmed')).toBeTruthy();
    });

    it('shows "Disputed" for disputed transactions', () => {
        const { getByText } = render(
            <PaymentStatusPill transactions={[{ status: 'disputed' }]} />
        );
        expect(getByText('Disputed')).toBeTruthy();
    });

    it('reads the most recent createdAt when multiple transactions exist', () => {
        const { getByText } = render(
            <PaymentStatusPill
                transactions={[
                    { status: 'recorded', createdAt: '2027-03-15T10:00:00Z' },
                    { status: 'confirmed', createdAt: '2027-03-20T10:00:00Z' },
                    { status: 'disputed', createdAt: '2027-03-12T10:00:00Z' },
                ]}
            />
        );
        // Newest (2027-03-20) is confirmed → label "Confirmed".
        expect(getByText('Confirmed')).toBeTruthy();
    });
});
