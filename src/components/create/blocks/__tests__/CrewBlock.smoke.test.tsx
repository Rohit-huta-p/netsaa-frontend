// netsa-mobile/src/components/create/blocks/__tests__/CrewBlock.smoke.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import CrewBlock from '../CrewBlock';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }), Link: 'Link' }));

describe('CrewBlock', () => {
  it('renders deliverables, style refs, equipment toggle', () => {
    const { getByText } = render(<CrewBlock value={{}} onChange={jest.fn()} />);
    expect(getByText(/Deliverables/)).toBeTruthy();
    expect(getByText(/Style references/)).toBeTruthy();
    expect(getByText(/Equipment provided by hirer/)).toBeTruthy();
  });
});
