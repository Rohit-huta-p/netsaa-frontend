import React from 'react';
import { render } from '@testing-library/react-native';
import { HubBookingTermsCard } from '../components/HubBookingTermsCard';

describe('HubBookingTermsCard', () => {
    it('renders summary fields', () => {
        const { getByText } = render(
            <HubBookingTermsCard
                paymentStructure="advance_balance"
                cancellationPolicy="48h"
                leadAmount={50000}
                subArtistAmount={15000}
                customClausesCount={2}
                activeContractsCount={3}
            />
        );
        expect(getByText('30/70 advance')).toBeTruthy();
        expect(getByText('48h notice')).toBeTruthy();
        expect(getByText(/2 added/)).toBeTruthy();
        expect(getByText(/3 existing contracts/)).toBeTruthy();
    });

    it('hides propagation note when 0 active contracts', () => {
        const { queryByText } = render(
            <HubBookingTermsCard activeContractsCount={0} leadAmount={1000} />
        );
        expect(queryByText(/existing contract/)).toBeNull();
    });
});
