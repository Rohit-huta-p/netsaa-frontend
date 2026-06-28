import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService, EventDoc, EventListParams } from '@/services/eventService';

export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (params: EventListParams) => [...eventKeys.lists(), params] as const,
  details: () => [...eventKeys.all, 'detail'] as const,
  detail: (id: string) => [...eventKeys.details(), id] as const,
  suggestions: ['eventSuggestionTags'] as const,
};

export function useEventsList(params: EventListParams = {}) {
  return useQuery({
    queryKey: eventKeys.list(params),
    queryFn: () => eventService.list(params),
    staleTime: 60_000,
  });
}

export function useEvent(id: string | undefined) {
  return useQuery<EventDoc>({
    queryKey: id ? eventKeys.detail(id) : ['events', 'detail', 'noop'],
    queryFn: () => eventService.detail(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: eventService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventKeys.lists() });
    },
  });
}

export function useRegisterForEvent(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: import('@/services/eventService').RegisterPayload) =>
      eventService.register(eventId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
      // Invalidate registration probe so EventCtaBar flips to "Cancel registration"
      qc.invalidateQueries({ queryKey: ['myRegistration', eventId] });
    },
  });
}

export function useCancelMyRegistration(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => eventService.cancelMyRegistration(eventId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
      // Also invalidate the per-user registration probe so EventCtaBar reverts to "Register"
      qc.invalidateQueries({ queryKey: ['myRegistration', eventId] });
    },
  });
}

export function useTicket(registrationId: string | undefined) {
  return useQuery({
    queryKey: ['ticket', registrationId],
    queryFn: () => eventService.getTicket(registrationId!),
    enabled: !!registrationId,
  });
}

export function useCheckIn(eventId: string) {
  return useMutation({
    mutationFn: ({ code, method }: { code: string; method?: 'qr' | 'manual' | 'backup' }) =>
      eventService.checkIn(eventId, code, method),
  });
}
