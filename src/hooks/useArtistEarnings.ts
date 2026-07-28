import { useQuery } from '@tanstack/react-query';
import { transactionService } from '../services/paymentService';
import { useAuthStore } from '../stores/authStore';
import { queryKeys } from '../constants/queryKeys';
import { aggregateEarnings } from './artistNumbers.helpers';

/**
 * Earnings for the KPI grid, aggregated client-side from the transactions feed.
 * KNOWN LIMIT: sums the most recent 100 transactions (endpoint has no date/aggregate).
 */
export function useArtistEarnings() {
  const myId = useAuthStore((s) => s.user?._id);
  return useQuery({
    queryKey: queryKeys.artist.earnings(),
    queryFn: () => transactionService.getUserTransactions({ pageSize: 100 }),
    enabled: !!myId,
    staleTime: 1000 * 60 * 2,
    select: (raw) => aggregateEarnings(raw, myId ?? '', new Date()),
  });
}

export default useArtistEarnings;
