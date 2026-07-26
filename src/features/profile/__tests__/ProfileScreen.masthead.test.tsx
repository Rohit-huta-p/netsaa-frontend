// src/features/profile/__tests__/ProfileScreen.masthead.test.tsx
//
// Covers the centred identity block: the craft kicker's "cap at three + N" rule,
// the city on its own line, the single green verification pill that replaced the
// Phone/Email/KYC chips, the "+N" popover, and the labelled action pills
// ("Share profile", not a bare "Share").
//
// Scoped to the owner/self-view render path, matching ProfileScreen.reels.test.

import React from 'react';
import { render, fireEvent, within } from '@testing-library/react-native';

// ── expo-router + expo-linear-gradient are mocked globally in jest-setup.ts ──

const mockUser: any = { _id: 'u1', displayName: 'Kiran Shah' };
jest.mock('@/stores/authStore', () => {
    const store = {
        get user() { return (global as any).__mockUser; },
        trustTier: 'new',
        trustScore: 0,
    };
    const useAuthStore: any = (selector?: (s: any) => any) => (selector ? selector(store) : store);
    useAuthStore.getState = () => store;
    return { __esModule: true, useAuthStore };
});

// Owner tests read the auth store; the visitor test reads this instead.
jest.mock('@/hooks/useUser', () => ({
    useUser: (id?: string) => ({
        data: id ? { _id: id, displayName: 'Meera Nair', artistType: ['Dancer'], location: 'Pune' } : undefined,
        isLoading: false,
        error: null,
    }),
}));

jest.mock('@/features/profile/hooks/useConnectionStatus', () => ({
    useConnectionStatus: () => ({
        connectionStatus: 'none',
        isConnectionLoading: false,
        handleConnect: jest.fn(),
        sendRequest: jest.fn(),
        removeConnection: jest.fn(),
        withdrawRequest: jest.fn(),
        blockUser: jest.fn(),
        showRequestSheet: false,
        setShowRequestSheet: jest.fn(),
        showActionMenu: false,
        setShowActionMenu: jest.fn(),
    }),
}));

jest.mock('@/hooks/useConnectionMeta', () => ({
    useMutualConnections: () => ({ data: undefined }),
    useConnectionDegree: () => ({ data: undefined }),
    useMyConnectionsCount: () => ({ data: 128 }),
}));

jest.mock('@/hooks/useSimilar', () => ({ useSimilarRail: () => ({ data: undefined }) }));
jest.mock('@/stores/notificationsStore', () => ({
    useNotificationsStore: () => ({ notifications: [], fetchNotifications: jest.fn() }),
}));
jest.mock('@/components/profile/ProfileStrengthWidget', () => ({ computeOverallScore: () => 100 }));
jest.mock('@/components/profile/SimilarRail', () => ({ SimilarRail: () => null }));
jest.mock('@/features/profile/components/ProfileEditModal', () => ({ ProfileEditModal: () => null }));
jest.mock('@/services/conversationService', () => ({
    __esModule: true,
    default: { createConversation: jest.fn().mockResolvedValue({ _id: 'c1' }) },
}));
jest.mock('@/services/authService', () => ({
    __esModule: true,
    default: { sendEmailCode: jest.fn(), verifyEmailCode: jest.fn() },
}));
jest.mock('@/components/media/NetsaVideoPlayer', () => ({
    __esModule: true,
    default: () => null,
    parseAspectRatio: () => undefined,
}));

import { ProfileScreen } from '../ProfileScreen';

function setUser(overrides: Record<string, any>) {
    (global as any).__mockUser = { ...mockUser, ...overrides };
}

describe('ProfileScreen — identity masthead', () => {
    it('shows every craft when there are three or fewer (no "+N")', () => {
        setUser({ artistType: ['Dancer', 'Actor', 'Choreographer'], location: 'Pune' });
        const { getByText, queryByText } = render(<ProfileScreen userId="u1" isOwner />);

        expect(getByText(/DANCER · ACTOR · CHOREOGRAPHER/)).toBeTruthy();
        expect(queryByText(/\+\d/)).toBeNull();
    });

    it('puts the city on its own line, not in the craft kicker', () => {
        setUser({ artistType: ['Dancer', 'Actor'], location: 'Pune' });
        const { getByText, queryByText } = render(<ProfileScreen userId="u1" isOwner />);

        // City is its own element...
        expect(getByText('PUNE')).toBeTruthy();
        // ...and is NOT appended to the craft line.
        expect(queryByText(/ACTOR · PUNE/)).toBeNull();
    });

    it('caps the kicker at three crafts and carries the rest as "+N"', () => {
        setUser({ artistType: ['Dancer', 'Actor', 'Choreographer', 'Model'], location: 'Pune' });
        const { getByText, queryByText } = render(<ProfileScreen userId="u1" isOwner />);

        expect(getByText(' +1')).toBeTruthy();
        // The capped-away craft must NOT be in the kicker line.
        expect(queryByText(/MODEL/)).toBeNull();
    });

    it('shows a single green verification pill instead of the Phone/Email/KYC chips', () => {
        setUser({ artistType: ['Dancer'], location: 'Pune' });
        const { getByText, queryByText } = render(<ProfileScreen userId="u1" isOwner />);

        expect(getByText('Verify account')).toBeTruthy();
        expect(queryByText('Phone')).toBeNull();
        expect(queryByText('Email')).toBeNull();
        expect(queryByText('KYC')).toBeNull();
    });

    it('reads "Verified" once phone and email are both confirmed', () => {
        setUser({ artistType: ['Dancer'], location: 'Pune', phoneVerifiedAt: '2026-01-01', emailVerifiedAt: '2026-01-02' });
        const { getByText, queryByText } = render(<ProfileScreen userId="u1" isOwner />);

        expect(getByText('Verified')).toBeTruthy();
        expect(queryByText('Verify account')).toBeNull();
    });

    it('opens the account-verification sheet when the green pill is tapped', () => {
        setUser({ artistType: ['Dancer'], location: 'Pune' });
        const utils = render(<ProfileScreen userId="u1" isOwner />);

        // Sheet is closed until asked for.
        expect(utils.queryByText('Secure your account')).toBeNull();

        fireEvent.press(utils.getByLabelText('Verify your account'));
        expect(utils.getByText('Secure your account')).toBeTruthy();
    });

    it('reveals only the hidden crafts when "+N" is tapped, and hides them again', () => {
        setUser({ artistType: ['Dancer', 'Actor', 'Choreographer', 'Model'], location: 'Pune' });
        const utils = render(<ProfileScreen userId="u1" isOwner />);

        expect(utils.queryByTestId('craft-popover')).toBeNull();

        fireEvent.press(utils.getByText(' +1'));

        // Scope to the popover: the crafts also appear as chips in the Skills
        // section further down the profile, so a global query would be ambiguous.
        const pop = within(utils.getByTestId('craft-popover'));
        expect(pop.getByText('Also works as')).toBeTruthy();
        expect(pop.getByText('Model')).toBeTruthy();
        // The three already shown in the kicker are not repeated in the card.
        expect(pop.queryByText('Dancer')).toBeNull();
        expect(pop.queryByText('Actor')).toBeNull();
        expect(pop.queryByText('Choreographer')).toBeNull();

        fireEvent.press(utils.getByText(' +1'));
        expect(utils.queryByTestId('craft-popover')).toBeNull();
    });

    it('labels the share action "Share profile", not "Share"', () => {
        setUser({ artistType: ['Dancer'], location: 'Pune' });
        const { getByText, queryByText } = render(<ProfileScreen userId="u1" isOwner />);

        expect(getByText('Share profile')).toBeTruthy();
        expect(getByText('Edit profile')).toBeTruthy();
        expect(queryByText('Share')).toBeNull();
        // Settings is icon-only now — no text label.
        expect(queryByText('Settings')).toBeNull();
    });

    it('renders the connection count as a link into the network', () => {
        setUser({ artistType: ['Dancer'], location: 'Pune' });
        const { getByText, getByLabelText } = render(<ProfileScreen userId="u1" isOwner />);

        expect(getByLabelText('Open network')).toBeTruthy();
        expect(getByText('128')).toBeTruthy();
    });

    // ── visitor view: one primary pill, no standalone Message ──
    it('a visitor who is NOT connected sees Connect and no Message pill', () => {
        setUser({ artistType: ['Dancer'], location: 'Pune' });
        const { getByText, queryByText } = render(<ProfileScreen userId="u2" isOwner={false} />);

        expect(getByText('Connect')).toBeTruthy();
        // The standalone Message pill is gone — Message only appears once connected.
        expect(queryByText('Message')).toBeNull();
    });
});
