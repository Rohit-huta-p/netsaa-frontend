import React from 'react';
import { render } from '@testing-library/react-native';
import { HubTeamSection } from '../components/HubTeamSection';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

const sampleTeamRow = {
    application: {
        _id: 'a1',
        artistSnapshot: { displayName: 'Priya Sharma' },
    },
    contract: {
        _id: 'c1',
        status: 'active',
        paidAmount: 15000,
        paymentMethod: 'on_platform',
        terms: { amount: 50000, paymentStructure: 'advance_balance', dates: { start: new Date(Date.now() + 7 * 86_400_000).toISOString() } },
    },
};

describe('HubTeamSection', () => {
    it('renders team rows + empty slots', () => {
        const { getByText } = render(
            <HubTeamSection teamRows={[sampleTeamRow as any]} slotsTotal={3} pendingApplicantsCount={5} />
        );
        expect(getByText('Your team')).toBeTruthy();
        expect(getByText('Priya Sharma')).toBeTruthy();
        expect(getByText(/2 more slots needed/)).toBeTruthy();
    });

    it('hides empty slots when team is full', () => {
        const { queryByText } = render(
            <HubTeamSection teamRows={[sampleTeamRow as any]} slotsTotal={1} pendingApplicantsCount={0} />
        );
        expect(queryByText(/more slot/)).toBeNull();
    });
});
