import { render, fireEvent, screen } from '@testing-library/react-native';
import { PYMKCarousel } from '../PYMKCarousel';
import React from 'react';

const sampleItems = [
  { _id: 'a1', displayName: 'Priya', artistType: 'Kathak', reasons: ['2 mutuals'] },
  { _id: 'a2', displayName: 'Aditi', artistType: 'Singer', reasons: ['From contacts'] },
];

describe('PYMKCarousel', () => {
  it('renders items with displayName + artistType + first reason', () => {
    render(
      <PYMKCarousel items={sampleItems} onConnect={() => {}} onDismiss={() => {}} onSeeAll={() => {}} />
    );
    expect(screen.getByText('Priya')).toBeTruthy();
    expect(screen.getByText('Kathak')).toBeTruthy();
    expect(screen.getByText('2 mutuals')).toBeTruthy();
    expect(screen.getByText('Aditi')).toBeTruthy();
    expect(screen.getByText('From contacts')).toBeTruthy();
  });

  it('returns null when items is empty', () => {
    const { toJSON } = render(
      <PYMKCarousel items={[]} onConnect={() => {}} onDismiss={() => {}} onSeeAll={() => {}} />
    );
    expect(toJSON()).toBeNull();
  });

  it('fires onDismiss when X tapped', () => {
    const onDismiss = jest.fn();
    render(
      <PYMKCarousel items={sampleItems} onConnect={() => {}} onDismiss={onDismiss} onSeeAll={() => {}} />
    );
    fireEvent.press(screen.getByTestId('pymk-dismiss-a1'));
    expect(onDismiss).toHaveBeenCalledWith('a1');
  });

  it('fires onConnect when Connect tapped', () => {
    const onConnect = jest.fn();
    render(
      <PYMKCarousel items={sampleItems} onConnect={onConnect} onDismiss={() => {}} onSeeAll={() => {}} />
    );
    fireEvent.press(screen.getAllByText('Connect')[0]);
    expect(onConnect).toHaveBeenCalledWith('a1');
  });

  it('fires onSeeAll when "See all →" tapped', () => {
    const onSeeAll = jest.fn();
    render(
      <PYMKCarousel items={sampleItems} onConnect={() => {}} onDismiss={() => {}} onSeeAll={onSeeAll} />
    );
    fireEvent.press(screen.getByText('See all →'));
    expect(onSeeAll).toHaveBeenCalled();
  });
});
