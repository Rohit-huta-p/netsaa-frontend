import { render } from '@testing-library/react-native';
import DiscoveryFeed from '../discovery/DiscoveryFeed';

jest.mock('@/hooks/useEvents', () => ({
  useEventsList: () => ({ data: { events: [], total: 0, page: 1, limit: 8 }, isLoading: false }),
}));

describe('DiscoveryFeed', () => {
  it('renders 7 rails', () => {
    const { getByText } = render(<DiscoveryFeed />);
    expect(getByText('Featured this week')).toBeTruthy();
    expect(getByText('Near you')).toBeTruthy();
    expect(getByText('From people you follow')).toBeTruthy();
    expect(getByText('Workshops')).toBeTruthy();
    expect(getByText('Open auditions')).toBeTruthy();
    expect(getByText('Masterclasses')).toBeTruthy();
    expect(getByText('New this week')).toBeTruthy();
  });
});
