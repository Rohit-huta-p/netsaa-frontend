// netsa-mobile/src/components/create/blocks/__tests__/VisualBlock.smoke.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import VisualBlock from '../VisualBlock';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }), Link: 'Link' }));
jest.mock('@ptomasroos/react-native-multi-slider', () => 'MultiSlider');

describe('VisualBlock', () => {
  it('renders skills + collapsed physical fit; roleType HIDDEN by default (no eventFunction)', () => {
    const { getByText, queryByText } = render(
      <VisualBlock value={{}} onChange={jest.fn()} sliderWidth={300} />
    );
    expect(getByText(/Required skills/)).toBeTruthy();
    expect(getByText(/Physical fit filters/)).toBeTruthy();
    // Role type only renders for casting/film/photo contexts, NOT default.
    expect(queryByText(/Role type/)).toBeNull();
    // Physical block contents hidden until expanded.
    expect(queryByText(/Gender preference/)).toBeNull();
  });

  it('reveals roleType when eventFunction is a casting/film context', () => {
    const { getByText } = render(
      <VisualBlock value={{}} onChange={jest.fn()} sliderWidth={300} eventFunction="Film shoot" />
    );
    expect(getByText(/Role type/)).toBeTruthy();
  });

  it('does NOT reveal roleType for wedding contexts', () => {
    const { queryByText } = render(
      <VisualBlock value={{}} onChange={jest.fn()} sliderWidth={300} eventFunction="Sangeet" />
    );
    expect(queryByText(/Role type/)).toBeNull();
  });

  it('expands physical fit on tap', () => {
    const { getByText, queryByText } = render(
      <VisualBlock value={{}} onChange={jest.fn()} sliderWidth={300} />
    );
    fireEvent.press(getByText(/Physical fit filters/));
    expect(queryByText(/Gender preference/)).toBeTruthy();
  });
});
