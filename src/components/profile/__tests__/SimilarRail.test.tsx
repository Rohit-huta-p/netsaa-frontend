// src/components/profile/__tests__/SimilarRail.test.tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SimilarRail } from '../SimilarRail';
import React from 'react';

describe('SimilarRail', () => {
  it('returns null when <3 items', () => {
    const { toJSON } = render(
      <SimilarRail items={[{ _id: 'a' }, { _id: 'b' }]} total={2} onSeeAll={() => {}} onItemPress={() => {}} />
    );
    expect(toJSON()).toBeNull();
  });

  it('renders header + see-all CTA when >=3 items', () => {
    const onSeeAll = jest.fn();
    render(
      <SimilarRail
        items={Array(4).fill(0).map((_, i) => ({ _id: `a${i}`, displayName: `Name${i}`, artistType: 'Kathak' }))}
        total={20}
        onSeeAll={onSeeAll}
        onItemPress={() => {}}
      />
    );
    expect(screen.getByText('People also viewed')).toBeTruthy();
    fireEvent.press(screen.getByText(/Show all 20/));
    expect(onSeeAll).toHaveBeenCalled();
  });

  it('fires onItemPress with peer id', () => {
    const onItemPress = jest.fn();
    render(
      <SimilarRail
        items={Array(4).fill(0).map((_, i) => ({ _id: `a${i}`, displayName: `Name${i}` }))}
        total={4}
        onSeeAll={() => {}}
        onItemPress={onItemPress}
      />
    );
    fireEvent.press(screen.getByText('Name0'));
    expect(onItemPress).toHaveBeenCalledWith('a0');
  });
});
