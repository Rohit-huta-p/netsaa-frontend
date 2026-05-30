import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePymk, useDismissPymk } from '../usePymk';
import React from 'react';

jest.mock('@/services/pymkService', () => ({
  pymkService: {
    list:    jest.fn().mockResolvedValue({ items: [{ _id: 'a' }], total: 1, page: 1, pageSize: 10, strategy: 'graph', computedAt: null }),
    dismiss: jest.fn().mockResolvedValue(undefined),
  },
}));

const makeWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

describe('usePymk', () => {
  it('fetches list', async () => {
    const { result } = renderHook(() => usePymk(1, 10), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.data?.items).toHaveLength(1));
  });
});

describe('useDismissPymk', () => {
  it('calls dismiss service', async () => {
    const { result } = renderHook(() => useDismissPymk(), { wrapper: makeWrapper() });
    await act(async () => { await result.current.mutateAsync('a1'); });
    const { pymkService } = require('@/services/pymkService');
    expect(pymkService.dismiss).toHaveBeenCalledWith('a1');
  });
});
