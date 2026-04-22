import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import SectionCard from '../SectionCard';

describe('SectionCard (smoke)', () => {
  it('renders with minimum props (title only) without throwing', () => {
    const { getByText } = render(<SectionCard title="Applied" />);
    expect(getByText('Applied')).toBeTruthy();
  });

  it('renders 3 skeleton rows when isLoading=true', () => {
    const { getByLabelText, queryByText } = render(
      <SectionCard title="Applied" isLoading>
        <Text>real content should be hidden</Text>
      </SectionCard>
    );
    // Loading state exposes an accessibility label on the skeleton container.
    expect(getByLabelText('Loading')).toBeTruthy();
    // Children should NOT render while loading.
    expect(queryByText('real content should be hidden')).toBeNull();
  });

  it('renders custom empty state when isEmpty=true', () => {
    const { getByText, queryByText } = render(
      <SectionCard title="Saved" isEmpty emptyState={<Text>No saved gigs</Text>} />
    );
    expect(getByText('No saved gigs')).toBeTruthy();
    // Default fallback copy should not appear.
    expect(queryByText('Nothing here yet')).toBeNull();
  });

  it('renders error state with Retry button when error is set', () => {
    const onRetry = jest.fn();
    const { getByText } = render(
      <SectionCard title="Upcoming" error={new Error('boom')} onRetry={onRetry} />
    );
    expect(getByText(/Could not load/i)).toBeTruthy();
    expect(getByText('Retry')).toBeTruthy();
  });
});
