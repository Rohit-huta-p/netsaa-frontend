// src/features/profile/__tests__/ProfileScreen.reels.test.tsx
//
// Focused coverage for the ProfileScreen → videoReels + NetsaVideoPlayer
// convergence: a `ready` reel should surface in the media-viewer as a real
// NetsaVideoPlayer (mocked here), not a static <Image> + fake "Video" badge.
//
// Scoped to the owner/self-view (isOwner: true) render path — the visitor
// path pulls in useConnectionStatus's async effects, SimilarRail, and
// mutual/degree connection queries, which are out of scope for this reels
// assertion and are exercised by other profile behavior tests.

import React from 'react';
import { Image } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

// ── expo-router + expo-linear-gradient are mocked globally in jest-setup.ts ──

jest.mock('@/stores/authStore', () => {
    const store = {
        user: { _id: 'u1', displayName: 'Priya Rao', videoReels: [] as any[] },
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
    useMyConnectionsCount: () => ({ data: 0 }),
}));

jest.mock('@/hooks/useSimilar', () => ({
    useSimilarRail: () => ({ data: undefined }),
}));

jest.mock('@/stores/notificationsStore', () => ({
    useNotificationsStore: () => ({ notifications: [], fetchNotifications: jest.fn() }),
}));

jest.mock('@/components/profile/ProfileStrengthWidget', () => ({
    computeOverallScore: () => 100,
}));

jest.mock('@/components/profile/SimilarRail', () => ({
    SimilarRail: () => null,
}));

// ProfileEditModal is heavy (its own upload/edit-sheet machinery) and is
// covered by its own test suite. Stub it here and capture the `profileData`
// it's given so we can assert `videoReels` is threaded through.
// (jest.mock factories may only reference vars prefixed `mock` — hoisting.)
const mockProfileEditModalSpy = jest.fn();
jest.mock('@/features/profile/components/ProfileEditModal', () => ({
    ProfileEditModal: (props: any) => {
        mockProfileEditModalSpy(props);
        return null;
    },
}));

// The player itself is exercised by NetsaVideoPlayer's own tests. Stub it
// here so we can assert the VIEWER hands it the right playbackId.
const mockNetsaVideoPlayerSpy = jest.fn();
jest.mock('@/components/media/NetsaVideoPlayer', () => ({
    __esModule: true,
    default: (props: any) => {
        mockNetsaVideoPlayerSpy(props);
        const { View } = require('react-native');
        return <View testID="netsa-video-player" />;
    },
}));

import { ProfileScreen } from '../ProfileScreen';
import { useAuthStore } from '@/stores/authStore';

/**
 * BentoSlot's Pressable carries no accessibilityLabel/testID, so the most
 * robust way to open a specific media item in the viewer is: find the <Image>
 * bento poster whose source.uri matches the item, then walk up the tree to
 * its nearest onPress-bearing ancestor (the Pressable wrapping it) and press
 * that.
 */
function pressBentoPosterByUri(utils: ReturnType<typeof render>, uri: string) {
    const images = utils.UNSAFE_getAllByType(Image);
    const match = images.find((img) => img.props.source?.uri === uri);
    if (!match) throw new Error(`No bento <Image> found with source.uri === ${uri}`);
    let node: any = match.parent;
    while (node && typeof node.props.onPress !== 'function') node = node.parent;
    if (!node) throw new Error(`No pressable ancestor found for bento poster ${uri}`);
    fireEvent.press(node);
}

const READY_REEL = {
    muxPlaybackId: 'mux_abc123',
    status: 'ready' as const,
    thumbnailUrl: 'https://image.mux.com/mux_abc123/thumbnail.jpg',
    duration: 12,
};
const PROCESSING_REEL = {
    muxPlaybackId: 'mux_pending',
    status: 'processing' as const,
};

function setAuthUser(overrides: Record<string, any>) {
    const store = (useAuthStore as any).getState();
    store.user = { _id: 'u1', displayName: 'Priya Rao', videoReels: [], ...overrides };
}

describe('ProfileScreen — self-view converges to videoReels + NetsaVideoPlayer', () => {
    beforeEach(() => {
        mockProfileEditModalSpy.mockClear();
        mockNetsaVideoPlayerSpy.mockClear();
        setAuthUser({});
    });

    it('renders a NetsaVideoPlayer (not a static Image + fake badge) for a ready reel opened in the viewer', () => {
        setAuthUser({ galleryUrls: ['https://img.example/photo1.jpg'], videoReels: [READY_REEL] });

        const utils = render(<ProfileScreen userId="u1" isOwner={true} />);

        // Open the viewer on the reel's bento poster (identified by its Mux
        // thumbnail URL, which is the bento/viewer `url` for a video item).
        pressBentoPosterByUri(utils, READY_REEL.thumbnailUrl);

        expect(utils.getByTestId('netsa-video-player')).toBeTruthy();
        expect(mockNetsaVideoPlayerSpy).toHaveBeenCalledWith(
            expect.objectContaining({ playbackId: 'mux_abc123' })
        );
        // The old fake "Video" play-badge text must be gone from the viewer.
        expect(utils.queryByText('Video')).toBeNull();
    });

    it('excludes non-ready reels (processing/errored) from the viewable media', () => {
        setAuthUser({ galleryUrls: [], videoReels: [PROCESSING_REEL] });

        const { getByText } = render(<ProfileScreen userId="u1" isOwner={true} />);

        // No ready media at all → portfolio shows the "No media yet" placeholder,
        // proving the processing reel was excluded from allMedia/bento.
        expect(getByText('No media yet')).toBeTruthy();
    });

    it('passes videoReels through to the edit modal profileData (hydrates existing reels)', () => {
        setAuthUser({ galleryUrls: [], videoReels: [READY_REEL] });

        render(<ProfileScreen userId="u1" isOwner={true} />);

        expect(mockProfileEditModalSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                profileData: expect.objectContaining({
                    videoReels: [READY_REEL],
                }),
            })
        );
    });

    it('portfolio count text uses the ready-reel count, not legacy videoUrls', () => {
        setAuthUser({
            galleryUrls: ['https://img.example/photo1.jpg'],
            videoUrls: ['https://legacy.example/old-video.mp4', 'https://legacy.example/old-video-2.mp4'],
            videoReels: [READY_REEL],
        });

        const { getByText } = render(<ProfileScreen userId="u1" isOwner={true} />);

        // 1 photo + 1 ready reel — NOT "2 videos" (which is what the stale
        // videoUrls array would have produced).
        expect(getByText('1 photos · 1 videos')).toBeTruthy();
    });
});
