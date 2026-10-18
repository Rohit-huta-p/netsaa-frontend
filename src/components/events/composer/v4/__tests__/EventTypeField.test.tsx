import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import EventTypeField from '../EventTypeField';
import { useComposerStoreV4 } from '../useComposerStoreV4';

beforeEach(() => useComposerStoreV4.getState().reset('workshop'));
const form = () => useComposerStoreV4.getState().form;

describe('EventTypeField', () => {
  it('selecting a preset sets eventType and clears any custom label', () => {
    useComposerStoreV4.getState().update('eventTypeLabel', 'Old custom');
    const { getByLabelText, getByText } = render(<EventTypeField />);
    fireEvent.press(getByLabelText('Choose event type')); // open the sheet
    fireEvent.press(getByText('Audition'));
    expect(form().eventType).toBe('audition');
    expect(form().eventTypeLabel).toBeUndefined();
  });

  it('typing a custom type sets eventType + eventTypeLabel to the typed text', () => {
    const { getByLabelText, getByText, getByPlaceholderText } = render(<EventTypeField />);
    fireEvent.press(getByLabelText('Choose event type'));
    fireEvent.changeText(getByPlaceholderText('Or type your own…'), 'Sound Bath');
    fireEvent.press(getByText('Add'));
    expect(form().eventType).toBe('Sound Bath');
    expect(form().eventTypeLabel).toBe('Sound Bath');
  });

  it('a blank custom entry does nothing', () => {
    const { getByLabelText, getByText, getByPlaceholderText } = render(<EventTypeField />);
    fireEvent.press(getByLabelText('Choose event type'));
    fireEvent.changeText(getByPlaceholderText('Or type your own…'), '   ');
    fireEvent.press(getByText('Add'));
    expect(form().eventType).toBe('workshop'); // unchanged
  });
});
