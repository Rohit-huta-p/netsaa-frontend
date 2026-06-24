// netsa-mobile/src/components/create/blocks/__tests__/MusicBlock.smoke.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import MusicBlock from '../MusicBlock';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }), Link: 'Link' }));

describe('MusicBlock', () => {
  it('renders common fields for Singer', () => {
    const { getByText } = render(
      <MusicBlock artistTypes={['Singer']} value={{}} onChange={jest.fn()} />
    );
    expect(getByText(/For the musician/i)).toBeTruthy();
    expect(getByText(/Equipment provided by hirer/i)).toBeTruthy();
  });

  it('reveals Producer sub-block when Music Producer selected', () => {
    const { getByText } = render(
      <MusicBlock artistTypes={['Music Producer']} value={{}} onChange={jest.fn()} />
    );
    expect(getByText(/Producer details/i)).toBeTruthy();
    expect(getByText(/Turnaround \(days\)\*/)).toBeTruthy();
  });

  it('reveals DJ sub-block when DJ selected', () => {
    const { getByText } = render(
      <MusicBlock artistTypes={['DJ']} value={{}} onChange={jest.fn()} />
    );
    expect(getByText(/DJ details/i)).toBeTruthy();
    expect(getByText(/Set length/i)).toBeTruthy();
  });

  it('reveals Band sub-block when Band selected', () => {
    const { getByText } = render(
      <MusicBlock artistTypes={['Band']} value={{}} onChange={jest.fn()} />
    );
    expect(getByText(/Band details/i)).toBeTruthy();
    expect(getByText(/Band size/i)).toBeTruthy();
  });
});
