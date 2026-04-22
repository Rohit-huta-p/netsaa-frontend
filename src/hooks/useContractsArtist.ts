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
 * The payment-service accepts `?limit=N` per Lane A's deviation note.
 * contractService.getUserContracts's existing signature uses `pageSize`
 * — both map to the same backend cap so we send `limit` via a typed
 * extension param.
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
      // The existing contractService type accepts { status, page, pageSize }.
      // Backend (Lane A) shortcut accepts `limit` directly; pass through by
      // casting since the backend ignores unknown params gracefully and
      // we don't want to widen the service signature here (out of scope
      // for 2a.1).
      contractService.getUserContracts(
        limit !== undefined ? ({ limit } as any) : undefined
      ),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export default useContractsArtist;
