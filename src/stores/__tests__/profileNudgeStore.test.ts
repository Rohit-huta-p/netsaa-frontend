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

describe('mirror eligibility', () => {
  beforeEach(() => {
    useProfileNudgeStore.setState({ mirrorLastShownAt: null, mirrorShownThisSession: false, mirrorCtaTappedThisSession: false });
  });

  it('is eligible when hasGapTrigger is true and state is fresh', () => {
    expect(useProfileNudgeStore.getState().isMirrorEligible(true, 1000)).toBe(true);
  });

  it('is not eligible when hasGapTrigger is false, even with fresh state', () => {
    expect(useProfileNudgeStore.getState().isMirrorEligible(false, 1000)).toBe(false);
  });

  it('is not eligible again this session after markMirrorShown', () => {
    act(() => useProfileNudgeStore.getState().markMirrorShown());
    expect(useProfileNudgeStore.getState().isMirrorEligible(true)).toBe(false);
  });

  it('is not eligible this session after markMirrorCtaTapped', () => {
    act(() => useProfileNudgeStore.getState().markMirrorCtaTapped());
    expect(useProfileNudgeStore.getState().isMirrorEligible(true)).toBe(false);
  });

  it('is not eligible when now is within 24h of mirrorLastShownAt', () => {
    useProfileNudgeStore.setState({ mirrorLastShownAt: 1000 });
    expect(useProfileNudgeStore.getState().isMirrorEligible(true, 1000 + DAY - 1)).toBe(false);
  });

  it('is eligible again once now is >= 24h after mirrorLastShownAt', () => {
    useProfileNudgeStore.setState({ mirrorLastShownAt: 1000 });
    expect(useProfileNudgeStore.getState().isMirrorEligible(true, 1000 + DAY)).toBe(true);
  });
});
