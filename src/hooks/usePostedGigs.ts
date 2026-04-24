import { useQuery } from '@tanstack/react-query';
import gigService from '../services/gigService';
import { queryKeys } from '../constants/queryKeys';

export function usePostedGigs(filter?: 'draft' | 'published' | 'closed', limit = 5) {
  return useQuery({
    queryKey: queryKeys.hirer.postedGigs(filter),
    queryFn: () => gigService.getOrganizerGigs({ status: filter, limit }),
    staleTime: 1000 * 30,
  });
}

export default usePostedGigs;
