import { useQuery } from '@tanstack/react-query';
import { searchService } from '@/services/searchService';

const MIN_LENGTH = 2;
const STALE_MINUTES = 5;

export function useSearchTypeahead(query: string) {
  return useQuery({
    queryKey: ['search', 'typeahead', query],
    queryFn: () => searchService.typeahead(query),
    enabled: query.trim().length >= MIN_LENGTH,
    staleTime: STALE_MINUTES * 60 * 1000,
  });
}
