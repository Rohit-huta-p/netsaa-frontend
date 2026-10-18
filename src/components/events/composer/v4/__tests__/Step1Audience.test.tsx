import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import Step1Event from '../steps/Step1Event';
import { useComposerStoreV4 } from '../useComposerStoreV4';

beforeEach(() => useComposerStoreV4.getState().reset('workshop'));
const form = () => useComposerStoreV4.getState().form;

describe('Step1 — "Who\'s it for" audience selection', () => {
  it('accumulates multiple specific types (up to 3)', () => {
    const { getByText } = render(<Step1Event />);
    fireEvent.press(getByText('Dancer'));
    fireEvent.press(getByText('Actor'));
    fireEvent.press(getByText('Musician'));
    expect(form().whoFor).toEqual(['Dancer', 'Actor', 'Musician']);
    expect(form().openToAll).toBe(false);
  });

  it('"All creatives" is mutually exclusive with specific types (clears them, never hides them)', () => {
    const { getByText } = render(<Step1Event />);
    fireEvent.press(getByText('Dancer'));
    fireEvent.press(getByText('Actor'));
    fireEvent.press(getByText('All creatives'));
    expect(form().openToAll).toBe(true);
    expect(form().whoFor).toEqual([]);
  });

  it('picking a specific type while "All creatives" is on switches back to specifics', () => {
    const { getByText } = render(<Step1Event />);
    fireEvent.press(getByText('All creatives'));
    fireEvent.press(getByText('Dancer'));
    expect(form().openToAll).toBe(false);
    expect(form().whoFor).toEqual(['Dancer']);
  });

  it('typing a custom artist type and submitting adds it', () => {
    const { getByPlaceholderText } = render(<Step1Event />);
    const input = getByPlaceholderText('Pick or type an artist type…');
    fireEvent.changeText(input, 'Choreographer');
    fireEvent(input, 'submitEditing');
    expect(form().whoFor).toEqual(['Choreographer']);
  });
});
