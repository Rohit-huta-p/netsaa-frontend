import React from 'react';
import { render } from '@testing-library/react-native';
import TodayQueueArtist from '../TodayQueueArtist';

jest.mock('@/hooks/useActionQueueArtist', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import useActionQueueArtist from '@/hooks/useActionQueueArtist';
const mockedHook = useActionQueueArtist as jest.MockedFunction<typeof useActionQueueArtist>;

describe('TodayQueueArtist (smoke)', () => {
  it('renders rows when items exist', () => {
    mockedHook.mockReturnValue({
      items: [
        {
          id: '1',
          category: 'hirer_reply',
          title: 'Hirer needs a reply on Sangeet Sandhya',
          subtitle: 'Status: shortlisted',
          href: '/applications/1',
        },
        {
          id: '2',
          category: 'event_starting_soon',
          title: 'Pune Dance Collective workshop in 4h',
          subtitle: 'Sahyog Auditorium',
          href: '/events/x',
          hoursUntil: 4,
        },
      ],
      totalCount: 2,
      isLoading: false,
    });

    const { getByText } = render(<TodayQueueArtist />);
    expect(getByText(/Hirer needs a reply/i)).toBeTruthy();
    expect(getByText(/Pune Dance Collective/i)).toBeTruthy();
    expect(getByText('TODAY')).toBeTruthy();
    expect(getByText(/things waiting on you/i)).toBeTruthy();
  });

  it('renders nothing when queue is empty', () => {
    mockedHook.mockReturnValue({ items: [], totalCount: 0, isLoading: false });
    const { queryByText } = render(<TodayQueueArtist />);
    expect(queryByText('TODAY')).toBeNull();
  });
});
