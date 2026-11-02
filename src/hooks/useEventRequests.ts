import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventKeys } from '@/hooks/useEvents';
import {
  approveRegistration,
  declineRegistration,
  type ApproveResult,
} from '@/services/eventService';

// Host approve/decline mutations for pending event registration requests
// (§6a-c/d/e). Kept in their own file (not folded into useEvents) so the
// Requests surface is self-contained and merge-safe. On success both invalidate
// the roster query (['eventRoster', eventId]) so the request drops out of the
// pending bucket, plus the event detail (capacity/counts may shift).

export function useApproveRequest(eventId: string) {
  const qc = useQueryClient();
  return useMutation<ApproveResult, unknown, string>({
    mutationFn: (registrationId: string) => approveRegistration(registrationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eventRoster', eventId] });
      qc.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
    },
  });
}

export function useDeclineRequest(eventId: string) {
  const qc = useQueryClient();
  return useMutation<{ status: string }, unknown, { registrationId: string; reason?: string }>({
    mutationFn: ({ registrationId, reason }) => declineRegistration(registrationId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eventRoster', eventId] });
      qc.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
    },
  });
}
