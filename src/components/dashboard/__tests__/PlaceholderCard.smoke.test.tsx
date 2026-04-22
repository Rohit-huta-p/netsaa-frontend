import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import PlaceholderCard from '../PlaceholderCard';

describe('PlaceholderCard (smoke)', () => {
  it('renders with title + subtitle without throwing', () => {
    const { getByText } = render(
      <PlaceholderCard
        title="Sub-artist offers"
        subtitle="Lead-artist team features coming in Plan 4"
      />
    );
    expect(getByText('Sub-artist offers')).toBeTruthy();
    expect(getByText('Lead-artist team features coming in Plan 4')).toBeTruthy();
  });

  it('renders custom icon when icon prop provided', () => {
    const { getByText } = render(
      <PlaceholderCard
        title="Reviews received"
        subtitle="Reviews from hirers will appear here after your first completed gig"
        icon={<Text>CUSTOM_ICON</Text>}
      />
    );
    expect(getByText('CUSTOM_ICON')).toBeTruthy();
    expect(getByText('Reviews received')).toBeTruthy();
  });
});
