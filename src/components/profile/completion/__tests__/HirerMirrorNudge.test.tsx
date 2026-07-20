import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HirerMirrorNudge from '../HirerMirrorNudge';
import * as hook from '../useProfileCompletion';
import { useProfileNudgeStore } from '@/stores/profileNudgeStore';

const photoGap = {
  id: 'photo', label: 'Profile Photo', chipLabel: 'Photo', section: 'media',
  question: 'Add a photo so hirers recognise you.', inputType: 'media',
  playbillSlot: 'portrait', mirrorRelevant: true,
} as any;

const withGap = {
  score: 40, applyReady: false, tier: 'new' as const, nextBest: null,
  missing: [photoGap], blanks: [photoGap], mirrorGaps: [photoGap],
} as any;

describe('HirerMirrorNudge', () => {
  beforeEach(() => {
    useProfileNudgeStore.setState({
      mirrorShownThisSession: false,
      mirrorCtaTappedThisSession: false,
      mirrorLastShownAt: null,
    });
  });

  it('renders the mirror verdict when there are mirror gaps and the store is fresh', () => {
    jest.spyOn(hook, 'useProfileCompletion').mockReturnValue(withGap);
    const { getByText } = render(<HirerMirrorNudge />);
    expect(getByText("There's not much for hirers to go on yet.")).toBeTruthy();
  });

  it('renders null when there are no mirror gaps and the profile is apply-ready', () => {
    jest.spyOn(hook, 'useProfileCompletion').mockReturnValue({
      ...withGap, mirrorGaps: [], applyReady: true,
    });
    const { toJSON } = render(<HirerMirrorNudge />);
    expect(toJSON()).toBeNull();
  });

  it('pressing "Become this" opens the Interview and marks the CTA tapped', () => {
    jest.spyOn(hook, 'useProfileCompletion').mockReturnValue(withGap);
    const { getByText } = render(<HirerMirrorNudge />);
    fireEvent.press(getByText(/Become this/));
    expect(getByText(/your story/i)).toBeTruthy();
    expect(useProfileNudgeStore.getState().mirrorCtaTappedThisSession).toBe(true);
  });
});
