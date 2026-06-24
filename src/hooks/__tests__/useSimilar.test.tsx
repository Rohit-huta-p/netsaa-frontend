import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSimilarRail, useSimilarPage } from '../useSimilar';
import React from 'react';

jest.mock('@/services/similarService', () => ({
  similarService: {
    rail: jest.fn().mockResolvedValue({ items: [{ _id: 'p1' }], total: 1, computedAt: null }),
    page: jest.fn().mockResolvedValue({ items: [{ _id: 'p2' }], total: 25, computedAt: null }),
  },
}));

const makeWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

describe('useSimilarRail', () => {
  it('fetches rail', async () => {
    const { result } = renderHook(() => useSimilarRail('artist1'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.data?.items?.[0]._id).toBe('p1'));
  });

  it('is disabled when artistId empty', async () => {
    const { similarService } = require('@/services/similarService');
    similarService.rail.mockClear();
    renderHook(() => useSimilarRail(''), { wrapper: makeWrapper() });
    await new Promise(r => setTimeout(r, 50));
    expect(similarService.rail).not.toHaveBeenCalled();
  });
});

describe('useSimilarPage', () => {
  it('fetches a page', async () => {
    const { result } = renderHook(() => useSimilarPage('artist1', 2, 20), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.data?.total).toBe(25));
  });
});
