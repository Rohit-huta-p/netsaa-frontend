import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  eventService,
  EventDoc,
  EventListParams,
  promoteWaitlist,
  publishEvent,
  updateRegistrationStatus,
  checkInByRegistration,
  cancelRegistrationByOrganizer,
  type WaitlistPromoteResult,
  type RegistrationStatusUpdate,
  type CheckInByRegistrationResult,
  type RegistrationCancelResult,
} from '@/services/eventService';

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
    // Keep the current results on screen while the next (debounced) search loads,
    // instead of tearing the list down to a full-screen loader on every keystroke —
    // that re-render janks the JS thread and freezes the search input. Matches useGigs.
    placeholderData: keepPreviousData,
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

export function useCancelRegistration() {
  return useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => eventService.cancelRegistration(id, reason) });
}

export function useCancelEvent(eventId: string) {
  return useMutation({ mutationFn: (reason: string) => eventService.cancelEvent(eventId, reason) });
}

export function useJoinWaitlist(eventId: string) {
  return useMutation({ mutationFn: (p: { quantity: number; attendeeSnapshot: { fullName: string; phone: string; email?: string } }) => eventService.joinWaitlist(eventId, p.quantity, p.attendeeSnapshot) });
}

export function useLeaveWaitlist(eventId: string) {
  return useMutation({ mutationFn: () => eventService.leaveWaitlist(eventId) });
}

export function useUpdateEvent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<import('@/services/eventService').EventDoc>) =>
      eventService.update(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventKeys.detail(id) });
      qc.invalidateQueries({ queryKey: ['eventRoster', id] });
    },
  });
}

/** Delete an event (host only). Used to discard an auto-saved composer draft. Invalidates the host's event lists so it drops out immediately. */
export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation<void, unknown, string>({
    mutationFn: (id: string) => eventService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventKeys.lists() });
    },
  });
}

export function useWalkupAdd(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { fullName: string; phone: string; quantity: number; payment: 'free' | 'cash' }) =>
      eventService.addWalkup(eventId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
      qc.invalidateQueries({ queryKey: ['eventRoster', eventId] });
    },
  });
}

// Host hub mutations (Manage-Event A·Minimal). Each invalidates the roster +
// detail queries so the spine counts, capacity bar and rows reflect the change.

/**
 * Promote the top waitlist entry into the one free seat. Succeeds only if a seat
 * is free, else the mutation rejects with a 409 — the Requests/Waitlist UI reads
 * err.response.status via waitlistPromoteErrorMessage and surfaces it inline.
 */
export function useWaitlistPromote(eventId: string) {
  const qc = useQueryClient();
  return useMutation<WaitlistPromoteResult, unknown, void>({
    mutationFn: () => promoteWaitlist(eventId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eventRoster', eventId] });
      qc.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
    },
  });
}

/** Publish a draft event (draft → live). Invalidates the detail query so the hub re-renders as the live room. */
export function usePublishEvent(eventId: string) {
  const qc = useQueryClient();
  return useMutation<Partial<EventDoc>, unknown, void>({
    mutationFn: () => publishEvent(eventId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
    },
  });
}

/** Flip a registration's status (attendee sheet "Mark no-show"). Registration-only — see updateRegistrationStatus. */
export function useUpdateRegistrationStatus(eventId: string) {
  const qc = useQueryClient();
  return useMutation<{ status: string }, unknown, { registrationId: string; status: RegistrationStatusUpdate }>({
    mutationFn: ({ registrationId, status }) => updateRegistrationStatus(registrationId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eventRoster', eventId] });
      qc.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
    },
  });
}

/**
 * Manually check an attendee in by registrationId (attendee sheet "Check in" /
 * Checked-in spine). Flips the registration → attended and its ticket(s) →
 * checked_in server-side; invalidates the roster + detail so the row jumps to the
 * Checked-in spine. 409 (already in / not checkable) rejects — the hub reads it via
 * checkInErrorMessage.
 */
export function useCheckInByRegistration(eventId: string) {
  const qc = useQueryClient();
  return useMutation<CheckInByRegistrationResult, unknown, { registrationId: string }>({
    mutationFn: ({ registrationId }) => checkInByRegistration(eventId, registrationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eventRoster', eventId] });
      qc.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
    },
  });
}

/**
 * Organizer cancel + refund one attendee (attendee sheet "Cancel + refund"). Flips
 * the registration → cancelled, voids its ticket(s), frees the seat and (paid only)
 * initiates a refund; invalidates the roster + detail so the row leaves the active
 * spine. 409 (not cancellable) rejects — the hub reads it via cancelRegistrationErrorMessage.
 */
export function useCancelRegistrationByOrganizer(eventId: string) {
  const qc = useQueryClient();
  return useMutation<RegistrationCancelResult, unknown, { registrationId: string; reason: string }>({
    mutationFn: ({ registrationId, reason }) => cancelRegistrationByOrganizer(eventId, registrationId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eventRoster', eventId] });
      qc.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
    },
  });
}
