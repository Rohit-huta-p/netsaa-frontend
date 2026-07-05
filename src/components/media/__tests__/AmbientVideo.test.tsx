import { render } from '@testing-library/react-native';

const mockPlayer: any = {
  play: jest.fn(),
  pause: jest.fn(),
  muted: false,
  loop: false,
  status: 'readyToPlay',
};
let mockRm = false;
let mockFocused = true;

jest.mock('expo-video', () => ({
  useVideoPlayer: (_src: any, setup?: (p: any) => void) => {
    setup?.(mockPlayer);
    return mockPlayer;
  },
  VideoView: () => null,
}));
jest.mock('expo', () => ({ useEvent: (_p: any, _name: string, initial: any) => initial }));
jest.mock('@/hooks/useReducedMotion', () => ({ useReducedMotion: () => mockRm }));
jest.mock('@react-navigation/native', () => ({ useIsFocused: () => mockFocused }));

import AmbientVideo from '../AmbientVideo';

beforeEach(() => {
  mockPlayer.play.mockClear();
  mockPlayer.pause.mockClear();
  mockPlayer.muted = false;
  mockPlayer.loop = false;
  mockPlayer.status = 'readyToPlay';
  mockRm = false;
  mockFocused = true;
});

it('autoplays a muted, looping backdrop when active & focused — with no controls', () => {
  const { queryByLabelText } = render(<AmbientVideo playbackId="pb_1" />);
  expect(mockPlayer.play).toHaveBeenCalled();
  // setup callback made it a silent loop
  expect(mockPlayer.muted).toBe(true);
  expect(mockPlayer.loop).toBe(true);
  // "living poster" = zero interactive chrome
  expect(queryByLabelText('Play')).toBeNull();
  expect(queryByLabelText('Fullscreen')).toBeNull();
  expect(queryByLabelText('Mute')).toBeNull();
});

it('holds the still poster (never autoplays) when OS reduce-motion is on', () => {
  mockRm = true;
  render(<AmbientVideo playbackId="pb_1" />);
  expect(mockPlayer.play).not.toHaveBeenCalled();
  expect(mockPlayer.pause).toHaveBeenCalled();
});

it('does not play an off-screen carousel page (active=false)', () => {
  render(<AmbientVideo playbackId="pb_1" active={false} />);
  expect(mockPlayer.play).not.toHaveBeenCalled();
  expect(mockPlayer.pause).toHaveBeenCalled();
});

it('pauses when the screen loses focus', () => {
  mockFocused = false;
  render(<AmbientVideo playbackId="pb_1" />);
  expect(mockPlayer.play).not.toHaveBeenCalled();
  expect(mockPlayer.pause).toHaveBeenCalled();
});
