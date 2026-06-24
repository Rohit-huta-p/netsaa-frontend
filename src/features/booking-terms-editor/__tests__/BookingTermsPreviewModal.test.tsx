import React from 'react';
import { render } from '@testing-library/react-native';
import { BookingTermsPreviewModal } from '../components/BookingTermsPreviewModal';

describe('BookingTermsPreviewModal', () => {
    it('returns null when not visible', () => {
        const { toJSON } = render(
            <BookingTermsPreviewModal
                visible={false}
                paymentStructure="full"
                cancellationPolicy="48h"
                amount={50000}
                negotiable={false}
                onClose={jest.fn()}
            />
        );
        expect(toJSON()).toBeNull();
    });

    it('renders structured fields when visible', () => {
        const { getByText } = render(
            <BookingTermsPreviewModal
                visible={true}
                paymentStructure="advance_balance"
                cancellationPolicy="48h"
                amount={50000}
                negotiable={true}
                termsAndConditions="Show up sober."
                onClose={jest.fn()}
            />
        );
        expect(getByText(/30\/70 advance/i)).toBeTruthy();
        expect(getByText(/48h/i)).toBeTruthy();
        expect(getByText(/Negotiable/i)).toBeTruthy();
        expect(getByText('Show up sober.')).toBeTruthy();
    });

    it('omits the freeform paragraph when termsAndConditions is empty', () => {
        const { queryByText } = render(
            <BookingTermsPreviewModal
                visible={true}
                paymentStructure="full"
                cancellationPolicy="24h"
                amount={10000}
                negotiable={false}
                onClose={jest.fn()}
            />
        );
        expect(queryByText(/Additional terms/i)).toBeNull();
    });
});
