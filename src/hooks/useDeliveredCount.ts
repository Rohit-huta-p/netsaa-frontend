import { useQuery } from '@tanstack/react-query';
import { contractService } from '../services/paymentService';
import { useAuthStore } from '../stores/authStore';
import { queryKeys } from '../constants/queryKeys';
import { countDeliveredContracts } from './artistNumbers.helpers';

/**
 * Delivered = completed contracts where I am the artist. The endpoint returns
 * contracts where I'm hirer OR artist, so `select` filters client-side.
 * KNOWN LIMIT: aggregates the most recent 100 completed contracts.
 */
export function useDeliveredCount() {
  const myId = useAuthStore((s) => s.user?._id);
  return useQuery({
    queryKey: queryKeys.artist.deliveredCount(),
    queryFn: () => contractService.getUserContracts({ status: 'completed', pageSize: 100 }),
    enabled: !!myId,
    staleTime: 1000 * 60 * 2,
    select: (raw) => countDeliveredContracts(raw, myId ?? ''),
  });
}

export default useDeliveredCount;
