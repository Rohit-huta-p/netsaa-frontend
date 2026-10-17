// src/components/gigs/__tests__/GigApplyModal.contract-preview.test.tsx
//
// Guards that the old tiered CONTRACT CEREMONY stays retired. The apply sheet
// is now a single "make your case" screen (V2) — no "Review Terms" step, no
// booking-terms agreement, no contract-preview card. These assertions lock
// that in and smoke-test that the sheet still renders with / without a gig.
import React from 'react';
import { render } from '@testing-library/react-native';

// Mocks must precede the import.
jest.mock('@/hooks/useGigApplications', () => ({
    useApplyToGig: () => ({ mutate: jest.fn(), mutateAsync: jest.fn(), isPending: false }),
}));
jest.mock('@/services/draftService', () => ({
    __esModule: true,
    draftService: { get: jest.fn(), upsert: jest.fn(), remove: jest.fn() },
    generateDraftId: () => 'draft-test',
}));
jest.mock('expo-router', () => ({
    useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
    useLocalSearchParams: () => ({}),
}));
jest.mock('@/stores/authStore', () => ({
    __esModule: true,
    default: () => ({ user: { _id: 'u1' } }),
    useAuthStore: () => ({ user: { _id: 'u1' } }),
}));
jest.mock('expo-print', () => ({
    printToFileAsync: jest.fn().mockResolvedValue({ uri: 'file:///tmp/contract.pdf' }),
}));
jest.mock('expo-sharing', () => ({
    isAvailableAsync: jest.fn().mockResolvedValue(true),
    shareAsync: jest.fn().mockResolvedValue(undefined),
}));
// expo-linear-gradient ships untranspiled ESM; stub it for jest.
jest.mock('expo-linear-gradient', () => {
    const { View } = require('react-native');
    return { LinearGradient: View };
});
import { GigApplyModal } from '../GigApplyModal';

const sampleGig = {
    _id: 'g1',
    title: 'Sangeet Choreography',
    compensation: { amount: 50000, negotiable: false },
    paymentStructure: 'advance_balance',
    cancellationPolicy: '48h',
    cancellationForfeitPct: 100,
    customClauses: ['Arrive 1h early'],
    termsAndConditions: 'Be respectful.',
    organizerSnapshot: { displayName: 'Sharma Wedding' },
    location: { city: 'Pune' },
    schedule: { startDate: new Date('2027-03-15').toISOString() },
    description: 'Lead 6 dancers',
};

describe('GigApplyModal — contract ceremony removed', () => {
    it('renders the single-screen apply sheet with a full gig prop, no ceremony', () => {
        const { queryByText, getByTestId } = render(
            <GigApplyModal
                visible={true}
                onClose={jest.fn()}
                gigId="g1"
                gigTitle="Sangeet Choreography"
                gigAmount={50000}
                gig={sampleGig as any}
            />
        );
        // The single-screen submit CTA is present…
        expect(getByTestId('apply-submit-btn')).toBeTruthy();
        // …and none of the retired contract-ceremony surfaces are.
        expect(queryByText(/Review Terms/i)).toBeNull();
        expect(queryByText(/agree to .*booking terms/i)).toBeNull();
        expect(queryByText(/Booking contract/i)).toBeNull();
    });

    it('still renders without a gig prop', () => {
        const { getByTestId } = render(
            <GigApplyModal
                visible={true}
                onClose={jest.fn()}
                gigId="g1"
                gigTitle="Sangeet Choreography"
                gigAmount={50000}
            />
        );
        expect(getByTestId('apply-submit-btn')).toBeTruthy();
    });
});
