// src/features/profile/__tests__/PerformerProfile.reels.test.tsx
//
// Focused coverage for a Fix-1 regression: PerformerProfile (the client's
// public-profile view of an artist) built a `media` array with a ready
// reel's `muxPlaybackId`, but the showcase render had no `onPress` — tapping
// a video item did nothing and NetsaVideoPlayer never mounted. This proves
// tapping a ready-reel showcase item mounts NetsaVideoPlayer with the correct
// playbackId (mirrors the pattern ProfileScreen.reels.test.tsx exercises for
// the self-view).

import React from 'react';
import { Image } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

// ── expo-router + expo-linear-gradient are mocked globally in jest-setup.ts,
// but the global mock's `Stack: 'Stack'` (a bare string) makes `<Stack.Screen>`
// resolve to undefined — PerformerProfile is the only profile/media component
// that renders <Stack.Screen>, so override it locally with a real object shape. ──
jest.mock('expo-router', () => ({
    useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
    Stack: { Screen: () => null },
}));

// jest.mock factories are hoisted above module-scope const/let declarations
// (babel-plugin-jest-hoist), so they must not close over out-of-scope
// consts. Mirror ProfileScreen.reels.test.tsx's pattern: a `store` object
// created and mutated entirely inside the factory.
jest.mock('@/hooks/useUser', () => {
    const store: { data: any } = { data: undefined };
    const useUser: any = () => ({ data: store.data, isLoading: false, error: null });
    useUser.__setData = (d: any) => { store.data = d; };
    return { __esModule: true, useUser };
});

jest.mock('@/features/profile/hooks/useConnectionStatus', () => ({
    useConnectionStatus: () => ({
        connectionStatus: 'none',
        isConnectionLoading: false,
        sendRequest: jest.fn(),
        withdrawRequest: jest.fn(),
        handleConnect: jest.fn(),
        removeConnection: jest.fn(),
        blockUser: jest.fn(),
        showRequestSheet: false,
        setShowRequestSheet: jest.fn(),
        showActionMenu: false,
        setShowActionMenu: jest.fn(),
    }),
}));

jest.mock('@/services/conversationService', () => ({
    __esModule: true,
    default: { createConversation: jest.fn().mockResolvedValue({ _id: 'c1' }) },
}));

jest.mock('@/components/MobileTabBar', () => ({
    useMobileTabBarHeight: () => 64,
}));

// The player itself is exercised by NetsaVideoPlayer's own tests. Stub it
// here so we can assert the tapped showcase item hands it the right playbackId.
const mockNetsaVideoPlayerSpy = jest.fn();
jest.mock('@/components/media/NetsaVideoPlayer', () => ({
    __esModule: true,
    default: (props: any) => {
        mockNetsaVideoPlayerSpy(props);
        const { View } = require('react-native');
        return <View testID="netsa-video-player" />;
    },
}));

import { PerformerProfile } from '../PerformerProfile';
import { useUser } from '@/hooks/useUser';

const READY_REEL = {
    muxPlaybackId: 'mux_visitor_1',
    status: 'ready' as const,
    thumbnailUrl: 'https://image.mux.com/mux_visitor_1/thumbnail.jpg',
    duration: 9,
};

const baseUser = {
    _id: 'artist-1',
    displayName: 'Ananya Iyer',
    galleryUrls: ['https://img.example/photo1.jpg'],
    videoReels: [READY_REEL],
};

/** Find the showcase <Image> whose source.uri matches, then walk up to its
 * nearest onPress-bearing ancestor and press it — mirrors the helper in
 * ProfileScreen.reels.test.tsx. */
function pressShowcaseItemByUri(utils: ReturnType<typeof render>, uri: string) {
    const images = utils.UNSAFE_getAllByType(Image);
    const match = images.find((img) => img.props.source?.uri === uri);
    if (!match) throw new Error(`No showcase <Image> found with source.uri === ${uri}`);
    let node: any = match.parent;
    while (node && typeof node.props.onPress !== 'function') node = node.parent;
    if (!node) throw new Error(`No pressable ancestor found for showcase item ${uri}`);
    fireEvent.press(node);
}

describe('PerformerProfile — tapping a ready reel plays it via NetsaVideoPlayer', () => {
    beforeEach(() => {
        mockNetsaVideoPlayerSpy.mockClear();
        (useUser as any).__setData(baseUser);
    });

    it('mounts NetsaVideoPlayer with the reel muxPlaybackId when its showcase item is pressed', () => {
        const utils = render(<PerformerProfile userId="artist-1" />);

        expect(utils.queryByTestId('netsa-video-player')).toBeNull();

        pressShowcaseItemByUri(utils, READY_REEL.thumbnailUrl);

        expect(utils.getByTestId('netsa-video-player')).toBeTruthy();
        expect(mockNetsaVideoPlayerSpy).toHaveBeenCalledWith(
            expect.objectContaining({ playbackId: 'mux_visitor_1' })
        );
    });

    it('a photo showcase item does not mount NetsaVideoPlayer when pressed', () => {
        const utils = render(<PerformerProfile userId="artist-1" />);

        pressShowcaseItemByUri(utils, 'https://img.example/photo1.jpg');

        expect(mockNetsaVideoPlayerSpy).not.toHaveBeenCalled();
    });
});
