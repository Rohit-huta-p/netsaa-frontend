import { useQuery } from '@tanstack/react-query';
import authService from '../services/authService';
import { useAuthStore } from '../stores/authStore';
import { queryKeys } from '../constants/queryKeys';

export function useProfileViews() {
  const myId = useAuthStore((s) => s.user?._id);
  return useQuery({
    queryKey: queryKeys.artist.profileViews(),
    queryFn: () => authService.getMyProfileViews(),
    enabled: !!myId,
    staleTime: 1000 * 60 * 5,
  });
}

export default useProfileViews;
