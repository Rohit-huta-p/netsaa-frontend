import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { SearchBar } from '../SearchBar';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/services/searchService', () => ({
  searchService: {
    typeahead: jest.fn().mockResolvedValue({
      people: [{ _id: 'p1', displayName: 'Priya' }],
      gigs: [], events: [],
      intent: { dominantVertical: 'people', confidence: 0.7 },
      order: ['people', 'gigs', 'events'],
    }),
  },
}));

const wrap = (node: React.ReactNode) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{node}</QueryClientProvider>;
};

describe('SearchBar', () => {
  it('shows dropdown after typing ≥2 chars + focus', async () => {
    render(wrap(<SearchBar />));
    const input = screen.getByTestId('searchbar-input');
    fireEvent(input, 'focus');
    fireEvent.changeText(input, 'ka');
    await waitFor(() => expect(screen.queryByText('Priya')).toBeTruthy());
  });
});
