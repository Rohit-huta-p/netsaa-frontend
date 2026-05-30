import { useQuery } from '@tanstack/react-query';
import { similarService } from '@/services/similarService';

const STALE_DAY_MS = 24 * 60 * 60 * 1000;

export function useSimilarRail(artistId: string, limit = 6) {
  return useQuery({
    queryKey: ['similar', 'rail', artistId, limit],
    queryFn: () => similarService.rail(artistId, limit),
    enabled: !!artistId,
    staleTime: STALE_DAY_MS,
  });
}

export function useSimilarPage(artistId: string, page: number, pageSize = 20) {
  return useQuery({
    queryKey: ['similar', 'page', artistId, page, pageSize],
    queryFn: () => similarService.page(artistId, page, pageSize),
    enabled: !!artistId,
  });
}
