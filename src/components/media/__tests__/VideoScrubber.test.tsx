import { render } from '@testing-library/react-native';
import VideoScrubber, { fracFromX } from '../VideoScrubber';

describe('fracFromX', () => {
  it('clamps a tap x to 0..1 of the track width', () => {
    expect(fracFromX(50, 100)).toBeCloseTo(0.5);
    expect(fracFromX(-5, 100)).toBe(0);
    expect(fracFromX(200, 100)).toBe(1);
    expect(fracFromX(10, 0)).toBe(0);
  });
});

it('renders without crashing at a given progress', () => {
  render(<VideoScrubber progress={0.5} onSeek={() => {}} />);
});
