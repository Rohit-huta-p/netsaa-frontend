// netsa-mobile/src/components/create/pages/__tests__/Page3Fit.smoke.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import Page3Fit, { type Page3Value } from '../Page3Fit';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }), Link: 'Link' }));
// VisualBlock transitively imports MultiSlider which drags in native bindings;
// stub it out so the dispatcher path for Group B renders without crashing.
jest.mock('@ptomasroos/react-native-multi-slider', () => 'MultiSlider');

const emptyValue: Page3Value = {
  music: {},
  model: {},
  visual: {},
  crew: {},
};

describe('Page3Fit', () => {
  it('renders MusicBlock for Singer', () => {
    const { getByText, queryByText } = render(
      <Page3Fit
        artistTypes={['Singer']}
        value={emptyValue}
        onChange={jest.fn()}
        sliderWidth={300}
      />
    );
    expect(getByText(/For the musician/i)).toBeTruthy();
    expect(queryByText(/For the model/i)).toBeNull();
  });

  it('renders ModelBlock for Model', () => {
    const { getByText, queryByText } = render(
      <Page3Fit
        artistTypes={['Model']}
        value={emptyValue}
        onChange={jest.fn()}
        sliderWidth={300}
      />
    );
    expect(getByText(/For the model/i)).toBeTruthy();
    expect(queryByText(/For the musician/i)).toBeNull();
  });

  it('renders both Music and Model when Singer + Model selected', () => {
    const { getByText } = render(
      <Page3Fit
        artistTypes={['Singer', 'Model']}
        value={emptyValue}
        onChange={jest.fn()}
        sliderWidth={300}
      />
    );
    expect(getByText(/For the musician/i)).toBeTruthy();
    expect(getByText(/For the model/i)).toBeTruthy();
  });
});
