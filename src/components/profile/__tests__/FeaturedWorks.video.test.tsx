// src/components/profile/__tests__/FeaturedWorks.video.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Mock NetsaVideoPlayer so we can assert FeaturedWorks renders it (not
// react-native-video) for a 'ready' reel.
jest.mock('@/components/media/NetsaVideoPlayer', () => ({
    __esModule: true,
    default: (p: any) => {
        const { Text } = require('react-native');
        return <Text>player:{p.playbackId}</Text>;
    },
}));

// FeaturedWorks always mounts MediaViewerModal (for the photos path) even
// when the videos tab is active; it needs a SafeAreaProvider ancestor that
// this lightweight render doesn't set up. Stub just the insets hook.
jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

import { FeaturedWorks } from '../FeaturedWorks';

const baseProps = {
    galleryUrls: [] as string[],
    hasPhotos: false,
    isEditable: false,
    isDesktop: false,
    isOrganizer: false,
};

describe('FeaturedWorks — video reels', () => {
    it('renders NetsaVideoPlayer for a ready reel', () => {
        const reels = [{ muxPlaybackId: 'pb_1', status: 'ready' as const }];
        const { getByText } = render(
            <FeaturedWorks {...baseProps} videoReels={reels as any} />
        );

        // Switch to the "videos" tab.
        fireEvent.press(getByText('Videos'));

        expect(getByText('player:pb_1')).toBeTruthy();
    });

    it('shows a processing state for a processing reel (no player mounted)', () => {
        const reels = [{ muxPlaybackId: '', status: 'processing' as const }];
        const { getByText, queryByText } = render(
            <FeaturedWorks {...baseProps} videoReels={reels as any} />
        );

        fireEvent.press(getByText('Videos'));

        expect(queryByText(/player:/)).toBeNull();
        expect(getByText(/processing/i)).toBeTruthy();
    });
});
