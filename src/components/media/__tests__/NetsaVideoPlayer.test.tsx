import { render, fireEvent } from '@testing-library/react-native';

const mockPlayer: any = {
  play: jest.fn(), pause: jest.fn(), replace: jest.fn(), replay: jest.fn(),
  muted: true, playing: false, status: 'readyToPlay', currentTime: 0, duration: 48,
};
jest.mock('expo-video', () => ({ useVideoPlayer: () => mockPlayer, VideoView: () => null }));
jest.mock('expo', () => ({
  useEvent: (_p: any, _name: string, initial: any) => initial,
  useEventListener: jest.fn(),
}));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: () => null }));
jest.mock('@/hooks/useReducedMotion', () => ({ useReducedMotion: () => false }));

import NetsaVideoPlayer from '../NetsaVideoPlayer';

beforeEach(() => { mockPlayer.play.mockClear(); mockPlayer.muted = true; });

it('idle shows Play; tapping it starts playback unmuted', () => {
  const { getByLabelText } = render(<NetsaVideoPlayer playbackId="pb_1" />);
  fireEvent.press(getByLabelText('Play'));
  expect(mockPlayer.play).toHaveBeenCalled();
  expect(mockPlayer.muted).toBe(false);
});

it('renders the retry affordance in the error state', () => {
  mockPlayer.status = 'error';
  const { getByLabelText } = render(<NetsaVideoPlayer playbackId="pb_1" />);
  expect(getByLabelText('Retry')).toBeTruthy();
  mockPlayer.status = 'readyToPlay';
});
