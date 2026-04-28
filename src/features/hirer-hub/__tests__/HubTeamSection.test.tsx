// netsa-mobile/src/features/hirer-hub/__tests__/HubTeamSection.test.tsx
//
// Apr 29 redesign: HubTeamSection passes onRequestContact (not
// onRequestRecordPayment) to each row. Record-payment moved to the
// dedicated team page; rows surface a contact icon instead.
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { HubTeamSection } from '../components/HubTeamSection';

let mockTransactions: any = [];
jest.mock('@/hooks/usePayments', () => ({
    useApplicationTransactions: () => ({ data: mockTransactions, isLoading: false }),
}));
jest.mock('expo-router', () => ({
    useRouter: () => ({ push: jest.fn() }),
}));

beforeEach(() => {
    mockTransactions = [];
});

const sampleApplication = {
    _id: 'a1',
    artistId: 'artist1',
    artistSnapshot: { displayName: 'Priya Sharma' },
};
const sampleGig = { _id: 'g1', compensation: { amount: 50000 } };
const sampleTeamRow = { application: sampleApplication, contract: null };

describe('HubTeamSection', () => {
    it('renders team rows + empty slots', () => {
        const { getByText } = render(
            <HubTeamSection
                teamRows={[sampleTeamRow as any]}
                gig={sampleGig}
                slotsTotal={3}
                pendingApplicantsCount={5}
                onRequestContact={jest.fn()}
            />
        );
        expect(getByText('Your team')).toBeTruthy();
        expect(getByText('Priya Sharma')).toBeTruthy();
        expect(getByText(/2 more slots needed/)).toBeTruthy();
    });

    it('hides empty slots when team is full', () => {
        const { queryByText } = render(
            <HubTeamSection
                teamRows={[sampleTeamRow as any]}
                gig={sampleGig}
                slotsTotal={1}
                pendingApplicantsCount={0}
                onRequestContact={jest.fn()}
            />
        );
        expect(queryByText(/more slot/)).toBeNull();
    });

    it('contact tap fires onRequestContact with the application', () => {
        const onRequest = jest.fn();
        const { getByLabelText } = render(
            <HubTeamSection
                teamRows={[sampleTeamRow as any]}
                gig={sampleGig}
                slotsTotal={1}
                pendingApplicantsCount={0}
                onRequestContact={onRequest}
            />
        );
        fireEvent.press(getByLabelText(/Contact Priya Sharma/i));
        expect(onRequest).toHaveBeenCalledWith(sampleApplication);
    });

    it('status pill renders when transactions exist (contact icon stays)', () => {
        mockTransactions = [
            { _id: 't1', status: 'confirmed', amount: 50000, createdAt: '2027-03-15T10:00:00Z' },
        ];
        const { getByText, getByLabelText } = render(
            <HubTeamSection
                teamRows={[sampleTeamRow as any]}
                gig={sampleGig}
                slotsTotal={1}
                pendingApplicantsCount={0}
                onRequestContact={jest.fn()}
            />
        );
        expect(getByText('Confirmed')).toBeTruthy();
        // Contact icon is always present.
        expect(getByLabelText(/Contact Priya Sharma/i)).toBeTruthy();
    });
});
