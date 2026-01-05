import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import eventService from '../services/eventService';
import { CreateEventDTO, IEvent } from '../types/event';
import { useRouter } from 'expo-router';

// Keys
export const eventKeys = {
    all: ['events'] as const,
    lists: () => [...eventKeys.all, 'list'] as const,
    list: (filters: any) => [...eventKeys.lists(), { ...filters }] as const,
    details: () => [...eventKeys.all, 'detail'] as const,
    detail: (id: string) => [...eventKeys.details(), id] as const,
    organizer: (organizerId: string) => [...eventKeys.all, 'organizer', organizerId] as const,
};

// Queries
export const useEvents = (params?: any) => {
    return useQuery({
        queryKey: eventKeys.list(params),
        queryFn: () => eventService.getEvents(params).then(res => res.data),
    });
};

export const useOrganizerEvents = (organizerId: string) => {
    return useQuery({
        queryKey: eventKeys.organizer(organizerId),
        queryFn: () => eventService.getOrganizerEvents(organizerId).then(res => res.data),
        enabled: !!organizerId,
    });
};

export const useEvent = (id: string) => {
    return useQuery({
        queryKey: eventKeys.detail(id),
        queryFn: () => eventService.getEventById(id).then(res => res.data),
        enabled: !!id,
    });
};

// Mutations
export const useCreateEvent = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateEventDTO) => eventService.createEvent(data).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
        },
    });
};

export const usePublishEvent = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => eventService.publishEvent(id),
        onSuccess: (data, id) => {
            queryClient.invalidateQueries({ queryKey: eventKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
        },
    });
};

export const useDeleteEvent = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => eventService.deleteEvent(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
            queryClient.invalidateQueries({ queryKey: eventKeys.all });
        },
    });
};

export const useUpdateEvent = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (variables: { id: string; payload: Partial<IEvent> }) =>
            eventService.updateEvent(variables.id, variables.payload),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: eventKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
        },
    });
};

export const useRegisterForEvent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (variables: { id: string; payload: { userId: string; ticketTypeId?: string; quantity?: number } }) =>
            eventService.registerForEvent(variables.id, variables.payload),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: eventKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ['my-registrations'] });
        },
    });
};

export const useEventRegistrations = (id: string) => {
    return useQuery({
        queryKey: [...eventKeys.detail(id), 'registrations'],
        queryFn: () => eventService.getEventRegistrations(id).then(res => res.data),
        enabled: !!id,
    });
};


export const useEventTicketTypes = (id: string) => {
    return useQuery({
        queryKey: [...eventKeys.detail(id), 'tickets'],
        queryFn: () => eventService.getTicketTypes(id).then(res => res.data),
        enabled: !!id,
    });
};

export const useMyRegistrations = () => {
    return useQuery({
        queryKey: ['my-registrations'],
        queryFn: () => eventService.getUserRegistrations().then(res => res.data),
    });
};

export const useUpdateRegistrationStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (variables: { registrationId: string; status: string; eventId: string }) =>
            eventService.updateRegistrationStatus(variables.registrationId, variables.status),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: [...eventKeys.detail(variables.eventId), 'registrations'] });
            queryClient.invalidateQueries({ queryKey: eventKeys.detail(variables.eventId) });
        },
    });
};
