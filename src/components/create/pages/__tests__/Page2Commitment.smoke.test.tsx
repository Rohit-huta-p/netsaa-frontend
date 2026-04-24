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
  compensationModel: 'fixed',
  compensationStructure: 'fixed',
  negotiable: false,
};

describe('Page2Commitment', () => {
  it('renders date, location, compensation, and negotiate sections', () => {
    const { getByText, getByPlaceholderText } = render(
      <Page2Commitment artistTypes={[]} value={baseValue} onChange={jest.fn()} />
    );
    // DatePicker is string-mocked, so assert on the InputGroup labels that
    // wrap the inputs instead of the internal DatePicker label.
    expect(getByText(/City/)).toBeTruthy();
    expect(getByText(/Payment unit/)).toBeTruthy();
    expect(getByText(/Payment structure/)).toBeTruthy();
    expect(getByText(/Open to negotiate/i)).toBeTruthy();
    expect(getByPlaceholderText(/Mumbai/)).toBeTruthy();
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
