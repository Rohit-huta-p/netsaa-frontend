import { render, screen, fireEvent } from '@testing-library/react-native';
import { TypeaheadDropdown } from '../TypeaheadDropdown';
import React from 'react';

const baseData = {
  people: [{ _id: 'p1', displayName: 'Priya', artistType: 'Kathak' }],
  gigs:   [{ _id: 'g1', title: 'Sangeet', city: 'Pune' }],
  events: [{ _id: 'e1', title: 'Workshop', eventType: 'masterclass' }],
  intent: { dominantVertical: 'people', confidence: 0.7 },
  order: ['people', 'gigs', 'events'] as const,
};

describe('TypeaheadDropdown', () => {
  it('renders all three section items', () => {
    render(<TypeaheadDropdown data={baseData as any} query="ka" onSelect={() => {}} onSeeAll={() => {}} />);
    expect(screen.getByText('Priya')).toBeTruthy();
    expect(screen.getByText('Sangeet')).toBeTruthy();
    expect(screen.getByText('Workshop')).toBeTruthy();
  });

  it('respects data.order when reordering sections', () => {
    const gigsFirst = { ...baseData, order: ['gigs', 'people', 'events'] as const };
    const { getAllByTestId } = render(
      <TypeaheadDropdown data={gigsFirst as any} query="sangeet" onSelect={() => {}} onSeeAll={() => {}} />
    );
    const sectionTitles = getAllByTestId('typeahead-section-title').map(n => n.props.children);
    expect(sectionTitles[0]).toContain('Gigs');
  });

  it('fires onSelect when an item is tapped', () => {
    const onSelect = jest.fn();
    render(<TypeaheadDropdown data={baseData as any} query="ka" onSelect={onSelect} onSeeAll={() => {}} />);
    fireEvent.press(screen.getByText('Priya'));
    expect(onSelect).toHaveBeenCalledWith('people', expect.objectContaining({ _id: 'p1' }));
  });

  it('fires onSeeAll for the global enter hint', () => {
    const onSeeAll = jest.fn();
    render(<TypeaheadDropdown data={baseData as any} query="ka" onSelect={() => {}} onSeeAll={onSeeAll} />);
    fireEvent.press(screen.getByText(/See all results for "ka"/));
    expect(onSeeAll).toHaveBeenCalledWith('ka', undefined);
  });

  it('fires onSeeAll with vertical when section "See all →" tapped', () => {
    const onSeeAll = jest.fn();
    render(<TypeaheadDropdown data={baseData as any} query="ka" onSelect={() => {}} onSeeAll={onSeeAll} />);
    fireEvent.press(screen.getAllByText('See all →')[0]);
    expect(onSeeAll).toHaveBeenCalled();
    // First "See all →" in the rendered order should map to the first section in data.order.
    expect(onSeeAll.mock.calls[0][1]).toBe('people');
  });

  it('hides a section with zero items', () => {
    const empty = { ...baseData, gigs: [] };
    render(<TypeaheadDropdown data={empty as any} query="ka" onSelect={() => {}} onSeeAll={() => {}} />);
    expect(screen.queryByText('Sangeet')).toBeNull();
    expect(screen.queryByText('Gigs · top 2')).toBeNull();
  });
});
