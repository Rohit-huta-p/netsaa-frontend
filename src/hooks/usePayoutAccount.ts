import { useQuery } from '@tanstack/react-query';
import { payoutService } from '@/services/payoutService';

export function usePayoutAccount() {
  return useQuery({ queryKey: ['payoutAccount', 'me'], queryFn: () => payoutService.getMine() });
}
