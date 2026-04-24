// netsa-mobile/src/components/create/blocks/__tests__/ModelBlock.smoke.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import ModelBlock from '../ModelBlock';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }), Link: 'Link' }));

describe('ModelBlock', () => {
  it('renders all required fields (shoot type + nudity levels)', () => {
    const { getByText } = render(<ModelBlock value={{}} onChange={jest.fn()} />);
    expect(getByText(/Shoot type/)).toBeTruthy();
    expect(getByText(/Nudity level/)).toBeTruthy();
    // Spot-check one shoot type chip and one nudity level
    expect(getByText('Fashion')).toBeTruthy();
    expect(getByText('Partial')).toBeTruthy();
  });

  it('renders measurements block', () => {
    const { getByText, getByPlaceholderText } = render(<ModelBlock value={{}} onChange={jest.fn()} />);
    expect(getByText(/Measurements/)).toBeTruthy();
    expect(getByPlaceholderText('Height')).toBeTruthy();
  });
});
