import { act } from '@testing-library/react-native';
import { useProfileNudgeStore } from '../profileNudgeStore';

const DAY = 24 * 60 * 60 * 1000;

describe('profileNudgeStore', () => {
  beforeEach(() => {
    useProfileNudgeStore.setState({ playbillDismissedUntil: null, playbillDismissedAtScore: null });
  });

  it('shows the playbill when there are missing items and it was never dismissed', () => {
    expect(useProfileNudgeStore.getState().isPlaybillVisible(80, 2, 0)).toBe(true);
  });

  it('hides the playbill when nothing is missing', () => {
    expect(useProfileNudgeStore.getState().isPlaybillVisible(100, 0, 0)).toBe(false);
  });

  it('dismiss snoozes for 7 days at the current score', () => {
    act(() => useProfileNudgeStore.getState().dismissPlaybill(80));
    const s = useProfileNudgeStore.getState();
    expect(s.playbillDismissedAtScore).toBe(80);
    expect(s.playbillDismissedUntil).not.toBeNull();
    // within snooze, same score → hidden
    expect(s.isPlaybillVisible(80, 2, 1000)).toBe(false);
  });

  it('re-surfaces after the 7-day snooze expires', () => {
    act(() => useProfileNudgeStore.getState().dismissPlaybill(80));
    const until = useProfileNudgeStore.getState().playbillDismissedUntil!;
    expect(useProfileNudgeStore.getState().isPlaybillVisible(80, 2, until + 1)).toBe(true);
  });

  it('re-surfaces early if the score moved >= 10 points since dismissal', () => {
    act(() => useProfileNudgeStore.getState().dismissPlaybill(80));
    expect(useProfileNudgeStore.getState().isPlaybillVisible(92, 1, 1000)).toBe(true); // +12 → show
    expect(useProfileNudgeStore.getState().isPlaybillVisible(85, 1, 1000)).toBe(false); // +5 → still snoozed
  });
});
