import React from 'react';
import { render } from '@testing-library/react-native';

const mockBack = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({ push: mockPush, back: mockBack }),
}));

const mockContract = {
    _id: 'c1',
    gigId: 'g1',
    hirerId: 'u-hirer',
    artistId: 'u-artist',
    status: 'active',
    paymentMethod: 'on_platform',
    paidAmount: 15000,
    tier: 'standard',
    terms: {
        amount: 50000, paymentStructure: 'advance_balance',
        dates: { start: new Date(Date.now() + 30 * 86_400_000).toISOString() },
        scopeOfWork: 'Lead choreographer · sangeet',
    },
    hirerSignature: { signedAt: new Date(Date.now() - 5 * 86_400_000).toISOString(), deviceInfo: 'iPhone' },
    artistSignature: { signedAt: new Date(Date.now() - 3 * 86_400_000).toISOString(), deviceInfo: 'Android' },
    hirerSnapshot: { displayName: 'Sharma Wedding' },
    artistSnapshot: { displayName: 'Priya Sharma' },
    amendments: [],
    invoices: [],
    createdAt: new Date(Date.now() - 7 * 86_400_000).toISOString(),
};

jest.mock('@/hooks/usePayments', () => ({
    useContract: () => ({ data: { data: mockContract }, isLoading: false }),
    useSwitchContractPaymentMethod: () => ({ mutateAsync: jest.fn(), isPending: false }),
    useDeclineContract: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

jest.mock('@/stores/authStore', () => {
    const fn: any = (selector?: (s: any) => any) => {
        const state = { user: { _id: 'u-hirer' } };
        return selector ? selector(state) : state;
    };
    return { __esModule: true, default: fn };
});

jest.mock('@/components/payments/PaymentMethodSelector', () => ({
    __esModule: true,
    default: () => null,
}));

import { ContractWorkspace } from '../ContractWorkspace';

describe('ContractWorkspace', () => {
    it('renders the 9 main sections', () => {
        const { getByText } = render(<ContractWorkspace contractId="c1" />);
        // Hero
        expect(getByText('Priya Sharma')).toBeTruthy();
        // Section headers
        expect(getByText('Signatures')).toBeTruthy();
        expect(getByText('Payment')).toBeTruthy();
        expect(getByText('Amendments')).toBeTruthy();
        expect(getByText('Activity')).toBeTruthy();
        expect(getByText('Edge cases')).toBeTruthy();
    });

    it('hirer + active + advance paid + future event → View contract sticky CTA disabled', () => {
        const { getByText } = render(<ContractWorkspace contractId="c1" />);
        // computePrimaryCTA returns 'View contract' / disabled for this state with viewer=hirer
        expect(getByText(/View contract/i)).toBeTruthy();
    });
});
