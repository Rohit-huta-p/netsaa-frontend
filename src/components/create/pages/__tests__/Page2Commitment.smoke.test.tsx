// netsa-mobile/src/components/create/pages/__tests__/Page2Commitment.smoke.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import Page2Commitment, { type Page2Value } from '../Page2Commitment';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }), Link: 'Link' }));

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
  it('renders the Date-of-event field + the grouped location card (venue / address / city / state)', () => {
    const { getByText, getAllByText, getByPlaceholderText } = render(
      <Page2Commitment artistTypes={[]} value={baseValue} onChange={jest.fn()} />
    );
    // v2.2 — Date-of-event field shows the two Start/End cards ("Start date"
    // also appears in the picker's hidden ghost label, hence getAllByText).
    expect(getByText(/Date of event/i)).toBeTruthy();
    expect(getAllByText(/Start date/i).length).toBeGreaterThan(0);
    expect(getAllByText(/End date/i).length).toBeGreaterThan(0);
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
