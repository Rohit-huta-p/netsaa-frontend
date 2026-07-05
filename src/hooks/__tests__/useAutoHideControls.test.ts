import { renderHook, act } from '@testing-library/react-native';
import { useAutoHideControls } from '../useAutoHideControls';

jest.useFakeTimers();

it('hides after the interval when active, and reveal() brings it back', () => {
  const { result } = renderHook(() => useAutoHideControls(true, 3000));
  expect(result.current.visible).toBe(true);
  act(() => { jest.advanceTimersByTime(3000); });
  expect(result.current.visible).toBe(false);
  act(() => { result.current.reveal(); });
  expect(result.current.visible).toBe(true);
});

it('stays visible when inactive (paused)', () => {
  const { result } = renderHook(() => useAutoHideControls(false, 3000));
  act(() => { jest.advanceTimersByTime(5000); });
  expect(result.current.visible).toBe(true);
});
