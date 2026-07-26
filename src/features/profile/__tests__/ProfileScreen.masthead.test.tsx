// src/features/profile/__tests__/ProfileScreen.masthead.test.tsx
//
// Covers the left-masthead identity block: the craft kicker's "cap at two + N"
// rule, the "+N" popover that reveals the hidden crafts, and the labelled
// action pills ("Share profile", not a bare "Share").
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

jest.mock('@/hooks/useUser', () => ({
    useUser: () => ({ data: undefined, isLoading: false, error: null }),
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
jest.mock('@/components/media/NetsaVideoPlayer', () => ({
    __esModule: true,
    default: () => null,
    parseAspectRatio: () => undefined,
}));

import { ProfileScreen } from '../ProfileScreen';

function setUser(overrides: Record<string, any>) {
    (global as any).__mockUser = { ...mockUser, ...overrides };
}

describe('ProfileScreen — left masthead', () => {
    it('shows every craft when there are two or fewer (no "+N")', () => {
        setUser({ artistType: ['Dancer', 'Actor'], location: 'Pune' });
        const { getByText, queryByText } = render(<ProfileScreen userId="u1" isOwner />);

        // Kicker is a single Text: "DANCER · ACTOR · PUNE"
        expect(getByText(/DANCER · ACTOR/)).toBeTruthy();
        expect(queryByText(/\+\d/)).toBeNull();
    });

    it('caps the kicker at two crafts and carries the rest as "+N"', () => {
        setUser({ artistType: ['Dancer', 'Actor', 'Choreographer', 'Model'], location: 'Pune' });
        const { getByText, queryByText } = render(<ProfileScreen userId="u1" isOwner />);

        expect(getByText(' +2')).toBeTruthy();
        // The capped-away crafts must NOT be in the kicker line.
        expect(queryByText(/CHOREOGRAPHER/)).toBeNull();
    });

    it('reveals only the hidden crafts when "+N" is tapped, and hides them again', () => {
        setUser({ artistType: ['Dancer', 'Actor', 'Choreographer', 'Model'], location: 'Pune' });
        const utils = render(<ProfileScreen userId="u1" isOwner />);

        expect(utils.queryByTestId('craft-popover')).toBeNull();

        fireEvent.press(utils.getByText(' +2'));

        // Scope to the popover: the crafts also appear as chips in the Skills
        // section further down the profile, so a global query would be ambiguous.
        const pop = within(utils.getByTestId('craft-popover'));
        expect(pop.getByText('Also works as')).toBeTruthy();
        expect(pop.getByText('Choreographer')).toBeTruthy();
        expect(pop.getByText('Model')).toBeTruthy();
        // The two already shown in the kicker are not repeated in the card.
        expect(pop.queryByText('Dancer')).toBeNull();
        expect(pop.queryByText('Actor')).toBeNull();

        fireEvent.press(utils.getByText(' +2'));
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
});
