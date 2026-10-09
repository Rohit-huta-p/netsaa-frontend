// netsa-mobile/src/components/create/pages/__tests__/Page2Commitment.smoke.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import Page2Commitment, { type Page2Value } from '../Page2Commitment';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }), Link: 'Link' }));

// DatePickerInput transitively pulls in react-native-ui-datepicker which
// embeds PNGs Jest can't parse. Stub with a host-component string so the
// label text renders via props and assertions stay readable.
jest.mock('@/components/ui/DatePickerInput', () => ({
  DatePickerInput: 'DatePickerInput',
}));

const baseValue: Page2Value = {
  startDate: '',
  city: '',
  state: 'Maharashtra',
  compensationModel: 'fixed',
  compensationStructure: 'fixed',
  negotiable: false,
};

describe('Page2Commitment', () => {
  it('renders date + the grouped location card (venue / address / city / state)', () => {
    const { getByText, getByPlaceholderText } = render(
      <Page2Commitment artistTypes={[]} value={baseValue} onChange={jest.fn()} />
    );
    // v2: compensation/negotiate moved to the dedicated Compensation step.
    // DatePicker is string-mocked, so assert on the InputGroup/card labels.
    // "Date" + "Location" carry a required asterisk in a nested Text node, so
    // match by substring rather than exact string.
    expect(getByText(/Date/)).toBeTruthy();
    expect(getByText(/Location/)).toBeTruthy();
    expect(getByText('Venue')).toBeTruthy();
    expect(getByText('Address')).toBeTruthy();
    expect(getByText('City')).toBeTruthy();
    expect(getByText('State')).toBeTruthy();
    // City free-text well (grouped card).
    expect(getByPlaceholderText(/Pune/)).toBeTruthy();
    // Optional end-date reveal is offered.
    expect(getByText(/Add end date/i)).toBeTruthy();
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
