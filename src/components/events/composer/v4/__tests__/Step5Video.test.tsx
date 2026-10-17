import React from 'react';
import { render } from '@testing-library/react-native';

// Native modules the media hook imports — mock before importing the component.
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images', Videos: 'Videos', All: 'All' },
}));
jest.mock('@/utils/upload', () => ({ uploadMediaFlow: jest.fn(), uploadVideoFlow: jest.fn() }));

import Step5Describe from '../steps/Step5Describe';
import { useComposerStoreV4 } from '../useComposerStoreV4';
import type { MediaItemV4 } from '../composerForm';

const seedVideos = (videos: MediaItemV4[]) => {
  useComposerStoreV4.getState().reset('workshop');
  useComposerStoreV4.getState().update('videos', videos);
};

describe('Step5Describe — video section', () => {
  it('offers the Add video affordance when under the cap', () => {
    seedVideos([]);
    expect(render(<Step5Describe />).getByText('Add video')).toBeTruthy();
  });

  it('renders the processing and errored reel states from store state', () => {
    seedVideos([
      { kind: 'video', url: '', status: 'processing', uploadId: 'a' },
      { kind: 'video', url: '', status: 'errored', uploadId: 'b' },
    ]);
    const { getByText } = render(<Step5Describe />);
    expect(getByText('Processing…')).toBeTruthy();
    expect(getByText('Upload failed')).toBeTruthy();
  });

  it('hides Add video once two reels exist (the cap)', () => {
    seedVideos([
      { kind: 'video', url: '', status: 'ready', muxPlaybackId: 'p1', uploadId: 'a', thumbnailUrl: 't1' },
      { kind: 'video', url: '', status: 'ready', muxPlaybackId: 'p2', uploadId: 'b', thumbnailUrl: 't2' },
    ]);
    expect(render(<Step5Describe />).queryByText('Add video')).toBeNull();
  });
});
