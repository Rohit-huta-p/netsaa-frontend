import { renderHook, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { useReducedMotion } from '../useReducedMotion';

jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({ remove: jest.fn() } as any);

it('reflects the OS reduce-motion flag', async () => {
  const { result } = renderHook(() => useReducedMotion());
  await waitFor(() => expect(result.current).toBe(true));
});
