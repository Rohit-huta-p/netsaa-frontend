/**
 * useContractsHirer — contracts where the caller is the hirer.
 *
 * The payment-service endpoint `GET /v1/users/me/contracts` returns the
 * union of contracts where `req.user.id` is either the hirerId or the
 * artistId (verified in contract.controller.ts:125 — `$or:[{hirerId},{artistId}]`).
 * There is no `role` query param, so splitting the union happens
 * client-side: keep only rows where `hirerId === selfId`.
 *
 * Mirrors Plan 2's `useContractsArtist` except for the filter direction.
 */
import { useQuery } from '@tanstack/react-query';
import { contractService } from '../services/paymentService';
import { queryKeys } from '../constants/queryKeys';
import { useAuthStore } from '../stores/authStore';

function unwrapContracts(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.contracts)) return data.contracts;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data?.data?.contracts)) return data.data.contracts;
  return [];
}

export function useContractsHirer(limit = 20) {
  const selfId = useAuthStore((s) => s.user?._id);
  return useQuery({
    queryKey: queryKeys.hirer.contracts(),
    queryFn: async () => {
      const data = await contractService.getUserContracts({ limit });
      const rows = unwrapContracts(data);
      if (!selfId) return rows;
      return rows.filter((c: any) => String(c?.hirerId ?? '') === String(selfId));
    },
    enabled: !!selfId,
    staleTime: 1000 * 60 * 2,
  });
}

export default useContractsHirer;
