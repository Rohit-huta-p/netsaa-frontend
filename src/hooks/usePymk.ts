import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pymkService } from '@/services/pymkService';

const STALE_HOUR_MS = 60 * 60 * 1000;

export function usePymk(page = 1, pageSize = 10) {
  return useQuery({
    queryKey: ['pymk', page, pageSize],
    queryFn: () => pymkService.list(page, pageSize),
    staleTime: STALE_HOUR_MS,
  });
}

export function useDismissPymk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (artistId: string) => pymkService.dismiss(artistId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pymk'] }),
  });
}
