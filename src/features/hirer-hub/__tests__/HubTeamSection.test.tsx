import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { HubTeamSection } from '../components/HubTeamSection';

// Mock router.push so we can spy on view-intent navigation
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

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

describe('HubTeamRow (via HubTeamSection)', () => {
    beforeEach(() => {
        mockPush.mockClear();
    });

    it('view intent routes to /contracts/[id]', () => {
        // signed + advance paid + future event → action.intent === 'view'
        const viewRow = {
            application: { _id: 'av', artistSnapshot: { displayName: 'Aanya' } },
            contract: {
                _id: 'cv',
                status: 'active',
                paidAmount: 15000,
                paymentMethod: 'on_platform',
                terms: { amount: 50000, paymentStructure: 'advance_balance', dates: { start: new Date(Date.now() + 7 * 86_400_000).toISOString() } },
            },
        };
        const { getByLabelText } = render(
            <HubTeamSection teamRows={[viewRow as any]} slotsTotal={1} pendingApplicantsCount={0} />
        );
        fireEvent.press(getByLabelText(/View for Aanya/i));
        expect(mockPush).toHaveBeenCalledWith('/(app)/contracts/cv');
    });

    it('deferred intent (pay-advance) opens Coming soon alert', () => {
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        const payRow = {
            application: { _id: 'ap', artistSnapshot: { displayName: 'Ravi' } },
            contract: {
                _id: 'cp',
                status: 'active',
                paidAmount: 0,
                paymentMethod: 'on_platform',
                terms: { amount: 50000, paymentStructure: 'advance_balance', dates: { start: new Date(Date.now() + 7 * 86_400_000).toISOString() } },
            },
        };
        const { getByLabelText } = render(
            <HubTeamSection teamRows={[payRow as any]} slotsTotal={1} pendingApplicantsCount={0} />
        );
        fireEvent.press(getByLabelText(/Pay .* for Ravi/i));
        expect(alertSpy).toHaveBeenCalledWith('Coming soon', expect.stringContaining('follow-up release'));
        expect(mockPush).not.toHaveBeenCalled();
        alertSpy.mockRestore();
    });

    it('falls back to "Artist" when displayName is empty', () => {
        const noNameRow = {
            application: { _id: 'an', artistSnapshot: { displayName: '   ' } },
            contract: {
                _id: 'cn',
                status: 'active',
                paidAmount: 15000,
                paymentMethod: 'on_platform',
                terms: { amount: 50000, paymentStructure: 'advance_balance', dates: { start: new Date(Date.now() + 7 * 86_400_000).toISOString() } },
            },
        };
        const { getByText } = render(
            <HubTeamSection teamRows={[noNameRow as any]} slotsTotal={1} pendingApplicantsCount={0} />
        );
        expect(getByText('Artist')).toBeTruthy();
    });
});
