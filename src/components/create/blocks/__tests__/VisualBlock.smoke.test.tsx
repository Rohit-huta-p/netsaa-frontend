// netsa-mobile/src/components/create/blocks/__tests__/VisualBlock.smoke.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import VisualBlock from '../VisualBlock';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }), Link: 'Link' }));
jest.mock('@ptomasroos/react-native-multi-slider', () => 'MultiSlider');

describe('VisualBlock', () => {
  it('renders role type + skills always, physical fit collapsed', () => {
    const { getByText, queryByText } = render(
      <VisualBlock value={{}} onChange={jest.fn()} sliderWidth={300} />
    );
    expect(getByText(/Role type/)).toBeTruthy();
    expect(getByText(/Required skills/)).toBeTruthy();
    expect(getByText(/Physical fit filters/)).toBeTruthy();
    // Physical block contents hidden
    expect(queryByText(/Gender preference/)).toBeNull();
  });

  it('expands physical fit on tap', () => {
    const { getByText, queryByText } = render(
      <VisualBlock value={{}} onChange={jest.fn()} sliderWidth={300} />
    );
    fireEvent.press(getByText(/Physical fit filters/));
    expect(queryByText(/Gender preference/)).toBeTruthy();
  });
});
