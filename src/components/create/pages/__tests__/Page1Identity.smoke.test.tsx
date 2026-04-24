// netsa-mobile/src/components/create/pages/__tests__/Page1Identity.smoke.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Page1Identity from '../Page1Identity';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }), Link: 'Link' }));

describe('Page1Identity', () => {
  it('renders title + performer chips + event function', () => {
    const { getByPlaceholderText, getByText } = render(
      <Page1Identity value={{ title: '', artistTypes: [], eventFunction: '' }} onChange={jest.fn()} />
    );
    expect(getByPlaceholderText(/dancers for sangeet/i)).toBeTruthy();
    expect(getByText('Dancer')).toBeTruthy();
    expect(getByText('Music Producer')).toBeTruthy();
  });

  it('caps performer type selection at 3', () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <Page1Identity
        value={{ title: '', artistTypes: ['Singer', 'DJ', 'Dancer'], eventFunction: '' }}
        onChange={onChange}
      />
    );
    fireEvent.press(getByText('Actor'));
    // onChange should NOT have been called with 4 types
    const calls = onChange.mock.calls.map((c) => c[0].artistTypes?.length ?? 0);
    expect(calls.every((n) => n <= 3)).toBe(true);
  });
});
