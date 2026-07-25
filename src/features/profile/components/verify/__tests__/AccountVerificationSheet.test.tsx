import React from 'react';
import { render } from '@testing-library/react-native';

// Mocks must precede the import.
jest.mock('@/services/authService', () => ({
    __esModule: true,
    default: { sendEmailCode: jest.fn(), verifyEmailCode: jest.fn() },
}));

// authStore — Zustand-compatible default + named export. User has a verified
// phone but no email yet, so the body should show the add-email idle state.
jest.mock('@/stores/authStore', () => {
    const store = {
        user: { _id: 'u1', phoneNumber: '+91 98765 43210', phoneVerifiedAt: '2026-01-01' },
        accessToken: 'tok',
        setAuth: jest.fn(),
    };
    const useAuthStore: any = (selector?: (s: any) => any) => (selector ? selector(store) : store);
    useAuthStore.getState = () => store;
    return { __esModule: true, default: useAuthStore, useAuthStore };
});

import { AccountVerificationSheet } from '../AccountVerificationSheet';

describe('AccountVerificationSheet', () => {
    it('shows the secure-account header, a read-only Phone secured rung, and a backup-email input', () => {
        const { getByText, getByPlaceholderText } = render(
            <AccountVerificationSheet visible onClose={() => {}} />
        );
        expect(getByText('Secure your account')).toBeTruthy();
        expect(getByText('Phone secured')).toBeTruthy();
        expect(getByText('+91 98765 43210')).toBeTruthy();
        expect(getByPlaceholderText('name@email.com')).toBeTruthy();
    });

    it('renders nothing when not visible', () => {
        const { queryByText } = render(
            <AccountVerificationSheet visible={false} onClose={() => {}} />
        );
        expect(queryByText('Secure your account')).toBeNull();
    });
});
