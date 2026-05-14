import { useQuery } from '@tanstack/react-query';
import { eventService } from '@/services/eventService';

export function useTopicTagSuggestions(limit = 20) {
  return useQuery({
    queryKey: ['eventTopicTagSuggestions', limit],
    queryFn: () => eventService.suggestionTags(limit),
    staleTime: 5 * 60_000,
  });
}
