/**
 * useContractsArtist — React Query hook for the artist-home Contracts
 * strip. Wraps contractService.getUserContracts.
 *
 * RETURN SHAPE
 * ------------
 * Pass-through of useQuery over the payment-service response for
 * GET /v1/users/me/contracts. Consumers defensively read `data?.data`
 * (the service returns the raw axios response body).
 *
 * KEY + STALE
 * -----------
 * queryKey: queryKeys.artist.contracts()
 * staleTime: 2 minutes — contracts change when signed / amended /
 *   declined. Not high frequency.
 *
 * LIMIT
 * -----
 * Optional `limit` param is forwarded via contractService.getUserContracts.
 * Plan 3 Task 16 widened the service signature to include `limit`, so no
 * cast is required anymore.
 *
 * INVALIDATION CONTRACT
 * ---------------------
 * Sign/decline/amend mutations MUST invalidate:
 *   queryClient.invalidateQueries({ queryKey: queryKeys.artist.contracts() })
 *
 * ERROR SEMANTICS
 * ---------------
 * Errors surface through `error`. SectionCard renders retry UI.
 *
 * TODO(plan-2): once a section component uses this hook, confirm the
 * exact field names on each contract (status enum values, etc.).
 */

import { useQuery } from '@tanstack/react-query';
import { contractService } from '../services/paymentService';
import { queryKeys } from '../constants/queryKeys';

export function useContractsArtist(limit?: number) {
  return useQuery({
    queryKey: queryKeys.artist.contracts(),
    queryFn: () =>
      contractService.getUserContracts(
        limit !== undefined ? { limit } : undefined
      ),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export default useContractsArtist;
