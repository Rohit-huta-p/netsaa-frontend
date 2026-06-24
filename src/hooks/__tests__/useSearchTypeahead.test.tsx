import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSearchTypeahead } from '../useSearchTypeahead';
import React from 'react';

jest.mock('@/services/searchService', () => ({
  searchService: {
    typeahead: jest.fn().mockResolvedValue({
      people: [{ _id: 'p1' }], gigs: [], events: [],
      intent: { dominantVertical: 'people' },
      order: ['people', 'gigs', 'events'],
    }),
  },
}));

const makeWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

describe('useSearchTypeahead', () => {
  it('returns data when query length >= 2', async () => {
    const { result } = renderHook(() => useSearchTypeahead('ka'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.data?.people).toHaveLength(1));
  });

  it('does NOT fire when query length < 2', async () => {
    const { searchService } = require('@/services/searchService');
    searchService.typeahead.mockClear();
    renderHook(() => useSearchTypeahead('k'), { wrapper: makeWrapper() });
    // Small wait to ensure no fetch
    await new Promise(r => setTimeout(r, 50));
    expect(searchService.typeahead).not.toHaveBeenCalled();
  });
});
