import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NotificationFilterTabs } from '../NotificationFilterTabs';

const counts = { all: 9, gigs: 4, events: 3, network: 2 };

test('renders all four tabs with their counts', () => {
  const { getByText } = render(
    <NotificationFilterTabs active="all" counts={counts} onChange={() => {}} />
  );
  ['All', 'Gigs', 'Events', 'Network'].forEach((l) => expect(getByText(l)).toBeTruthy());
  expect(getByText('9')).toBeTruthy();
  expect(getByText('4')).toBeTruthy();
});

test('pressing a tab calls onChange with its key', () => {
  const onChange = jest.fn();
  const { getByText } = render(
    <NotificationFilterTabs active="all" counts={counts} onChange={onChange} />
  );
  fireEvent.press(getByText('Gigs'));
  expect(onChange).toHaveBeenCalledWith('gigs');
});

test('active tab is marked selected for a11y', () => {
  const { getByLabelText } = render(
    <NotificationFilterTabs active="events" counts={counts} onChange={() => {}} />
  );
  expect(getByLabelText('Events, 3 notifications').props.accessibilityState.selected).toBe(true);
  expect(getByLabelText('All, 9 notifications').props.accessibilityState.selected).toBe(false);
});
