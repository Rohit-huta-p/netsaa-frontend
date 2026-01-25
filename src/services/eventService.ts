import axios from 'axios';
import { Platform } from 'react-native';
import { IEvent, CreateEventDTO } from '../types/event';

// Use env var or production fallback
const getBaseUrl = () => {
    return process.env.EXPO_PUBLIC_API_EVENT_URL || 'https://netsaa-events-service.onrender.com/v1';
};

const API = axios.create({
    baseURL: getBaseUrl(),
});

// Add auth interceptor
import useAuthStore from '../stores/authStore';

API.interceptors.request.use(async (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const eventService = {
    getEvents: async (params?: any) => {
        // Default limit to 50 if not specified to ensure more events are visible
        const finalParams = { limit: 50, ...params };
        const response = await API.get<{ data: IEvent[], meta: any }>('/events', { params: finalParams });
        return response.data;
    },

    getEventById: async (id: string) => {
        const response = await API.get<{ data: IEvent }>(`/events/${id}`);
        return response.data;
    },

    createEvent: async (eventData: CreateEventDTO) => {
        const response = await API.post<{ data: IEvent }>('/events', eventData);
        return response.data;
    },

    publishEvent: async (id: string) => {
        const response = await API.post<{ data: IEvent }>(`/events/${id}/publish`);
        return response.data;
    },

    getOrganizerEvents: async (organizerId: string) => {
        const response = await API.get<{ data: IEvent[], meta: any }>('/organizers/me/events', { params: { organizerId } });
        return response.data;
    },

    deleteEvent: async (id: string) => {
        const response = await API.delete<{ data: {}, meta: any }>(`/events/${id}`);
        return response.data;
    },

    updateEvent: async (id: string, payload: Partial<IEvent>) => {
        const response = await API.patch<{ data: IEvent }>(`/events/${id}`, payload);
        return response.data;
    },

    getTicketTypes: async (eventId: string) => {
        const response = await API.get<{ data: any[] }>(`/events/${eventId}/ticket-types`);
        return response.data;
    },

    registerForEvent: async (id: string, payload: { userId: string; ticketTypeId?: string; quantity?: number }) => {
        const response = await API.post<{ data: any }>(`/events/${id}/register`, payload);
        return response.data;
    },

    getEventRegistrations: async (id: string) => {
        // Need IEventRegistration in types if we want strict typing here, but any implies flexible for now
        // or import IEventRegistration
        const response = await API.get<{ data: any[] }>(`/events/${id}/registrations`);
        return response.data;
    },

    getUserRegistrations: async () => {
        const response = await API.get<{ data: any[] }>('/users/me/event-registrations');
        return response.data;
    },

    updateRegistrationStatus: async (registrationId: string, status: string) => {
        const response = await API.patch<{ data: any }>(`/registrations/${registrationId}/status`, { status });
        return response.data;
    },

    reserveTickets: async (eventId: string, payload: { ticketTypeId?: string; quantity: number }) => {
        const response = await API.post<{ success: boolean; data: any; message: string }>(`/events/${eventId}/reserve`, payload);
        return response.data;
    },

    cancelReservation: async (reservationId: string) => {
        const response = await API.post<{ success: boolean; message: string }>(`/reservations/${reservationId}/cancel`);
        return response.data;
    },

    createPaymentIntent: async (eventId: string, payload: { reservationId: string }) => {
        const response = await API.post<{ success: boolean; clientSecret?: string; paymentIntentId?: string; message: string }>(`/events/${eventId}/checkout`, payload);
        return response.data;
    },

    finalizeRegistration: async (eventId: string, payload: { reservationId: string; paymentIntentId?: string }) => {
        const response = await API.post<{ success: boolean; data: any; message: string }>(`/events/${eventId}/finalize`, payload);
        return response.data;
    },

    getEventDiscussion: async (eventId: string, params?: any) => {
        const response = await API.get<{ data: any[], meta: any }>(`/events/${eventId}/discussion`, { params });
        return response.data;
    },

    postEventDiscussion: async (eventId: string, text: string) => {
        const response = await API.post<{ data: any }>(`/events/${eventId}/discussion`, { text });
        return response.data;
    },

    getSavedEvents: async () => {
        const response = await API.get<{ data: any[] }>('/users/me/saved-events');
        return response.data;
    },

    saveEvent: async (id: string) => {
        const response = await API.post<{ data: any }>(`/events/${id}/save`);
        return response.data;
    },
};

export default eventService;
