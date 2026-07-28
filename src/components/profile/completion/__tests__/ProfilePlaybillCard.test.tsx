import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ProfilePlaybillCard from '../ProfilePlaybillCard';
import * as hook from '../useProfileCompletion';
import { useProfileNudgeStore } from '@/stores/profileNudgeStore';

const partial = {
  score: 80, applyReady: false, tier: 'rising' as const, nextBest: null,
  missing: [
    { id: 'photo', label: 'Profile Photo', chipLabel: 'Photo', section: 'media', question: 'q', inputType: 'media', playbillSlot: 'portrait' },
    { id: 'bio', label: 'Bio', chipLabel: 'Bio', section: 'about', question: 'q', inputType: 'text', playbillSlot: 'quote' },
  ],
  blanks: [
    { id: 'photo', label: 'Profile Photo', chipLabel: 'Photo', section: 'media', question: 'q', inputType: 'media', playbillSlot: 'portrait' },
    { id: 'bio', label: 'Bio', chipLabel: 'Bio', section: 'about', question: 'q', inputType: 'text', playbillSlot: 'quote' },
  ],
} as any;

describe('ProfilePlaybillCard', () => {
  beforeEach(() => {
    useProfileNudgeStore.setState({ playbillDismissedUntil: null, playbillDismissedAtScore: null });
  });

  it('renders "2 blanks left" for a partial profile', () => {
    jest.spyOn(hook, 'useProfileCompletion').mockReturnValue(partial);
    const { getByText } = render(<ProfilePlaybillCard />);
    expect(getByText(/2 blanks left/i)).toBeTruthy();
  });

  it('renders nothing when the profile is complete', () => {
    jest.spyOn(hook, 'useProfileCompletion').mockReturnValue({ ...partial, score: 100, missing: [], blanks: [], applyReady: true });
    const { toJSON } = render(<ProfilePlaybillCard />);
    expect(toJSON()).toBeNull();
  });

  it('dismiss snoozes the card', () => {
    jest.spyOn(hook, 'useProfileCompletion').mockReturnValue(partial);
    const { getByLabelText, toJSON } = render(<ProfilePlaybillCard />);
    fireEvent.press(getByLabelText('dismiss'));
    expect(useProfileNudgeStore.getState().playbillDismissedAtScore).toBe(80);
    expect(toJSON()).toBeNull();
  });

  it('pressing the card body opens the interview sheet', () => {
    jest.spyOn(hook, 'useProfileCompletion').mockReturnValue(partial);
    const { getByText } = render(<ProfilePlaybillCard />);
    fireEvent.press(getByText(/2 blanks left/i));
    expect(getByText(/your story/i)).toBeTruthy();
  });
});
