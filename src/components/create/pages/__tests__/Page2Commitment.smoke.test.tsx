// netsa-mobile/src/components/create/pages/__tests__/Page2Commitment.smoke.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import Page2Commitment, { type Page2Value } from '../Page2Commitment';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }), Link: 'Link' }));

// DatePickerInput pulls in the calendar modal (PNG assets Jest can't parse);
// string-mock it — we assert on the InputGroup labels, not picker internals.
jest.mock('@/components/ui/DatePickerInput', () => ({ DatePickerInput: 'DatePickerInput' }));

const baseValue: Page2Value = {
  startDate: '',
  dateMode: 'range',
  city: '',
  state: 'Maharashtra',
  compensationModel: 'fixed',
  compensationStructure: 'fixed',
  negotiable: false,
};

describe('Page2Commitment', () => {
  it('renders the event-dates + deadline fields + the grouped location card (venue / address / city / state)', () => {
    const { getByText, getByPlaceholderText } = render(
      <Page2Commitment artistTypes={[]} value={baseValue} onChange={jest.fn()} />
    );
    // Event dates (start → end) + the Application deadline now live in this step.
    expect(getByText(/Event dates/i)).toBeTruthy();
    expect(getByText(/Application deadline/i)).toBeTruthy();
    expect(getByText(/Location/)).toBeTruthy();
    expect(getByText('Venue')).toBeTruthy();
    expect(getByText('Address')).toBeTruthy();
    expect(getByText('City')).toBeTruthy();
    expect(getByText('State')).toBeTruthy();
    // City free-text well (grouped card).
    expect(getByPlaceholderText(/Pune/)).toBeTruthy();
  });

  it('reveals language preference chips when performer includes Singer', () => {
    const { getByText, queryByText } = render(
      <Page2Commitment artistTypes={['Singer']} value={baseValue} onChange={jest.fn()} />
    );
    expect(getByText(/Language preference/i)).toBeTruthy();
    // Not shown for non-audience-facing types
    const { queryByText: queryByTextNoLang } = render(
      <Page2Commitment artistTypes={['Photographer']} value={baseValue} onChange={jest.fn()} />
    );
    expect(queryByTextNoLang(/Language preference/i)).toBeNull();
  });
});
