import axios from 'axios';
import { Platform } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { Gig, GigResponse, GigsListResponse } from '../types/gig';

// Use env var or production fallback
export const getBaseUrl = () => {
    return process.env.EXPO_PUBLIC_API_GIGS_URL || 'https://netsaa-gigs-service.onrender.com/v1';
};

const API = axios.create({
    baseURL: getBaseUrl(),
});

// Request Interceptor: Attach Token
API.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const gigService = {
    createGig: async (payload: Partial<Gig>): Promise<GigResponse> => {
        console.log("payload: ", payload);
        const res = await API.post('/gigs', payload);
        return res.data;
    },

    getAllGigs: async (params?: any): Promise<GigsListResponse> => {
        const res = await API.get('/gigs', { params });
        return res.data;
    },

    getGigById: async (id: string): Promise<GigResponse> => {
        const res = await API.get(`/gigs/${id}`);
        return res.data;
    },

    applyToGig: async (id: string, payload: { coverNote: string, portfolioLinks?: string[] }): Promise<GigResponse> => {
        const res = await API.post(`/gigs/${id}/apply`, payload);
        return res.data;
    },

    saveGig: async (id: string): Promise<any> => {
        const res = await API.post(`/gigs/${id}/save`);
        return res.data;
    },

    getOrganizerGigs: async (organizerId: string): Promise<GigsListResponse> => {
        const res = await API.get('/organizers/me/gigs', { params: { organizerId } });
        return res.data;
    },

    updateGig: async (id: string, payload: Partial<Gig>): Promise<GigResponse> => {
        console.log(payload);
        const res = await API.put(`/gigs/${id}`, payload);
        return res.data;
    },

    deleteGig: async (id: string): Promise<any> => {
        const res = await API.delete(`/gigs/${id}`);
        return res.data;
    },

    getGigApplications: async (gigId: string): Promise<any[]> => {
        const res = await API.get(`/organizers/me/gigs/${gigId}/applications`);
        return res.data.data;
    },

    updateApplicationStatus: async (applicationId: string, status: string): Promise<any> => {
        const res = await API.patch(`/applications/${applicationId}/status`, { status });
        return res.data.data;
    },

    getGigDiscussion: async (gigId: string, params?: any): Promise<any> => {
        const res = await API.get(`/gigs/${gigId}/discussion`, { params });
        return res.data;
    },

    postGigDiscussion: async (gigId: string, text: string): Promise<any> => {
        const res = await API.post(`/gigs/${gigId}/discussion`, { text });
        return res.data;
    },

    getSavedGigs: async (): Promise<any> => {
        const res = await API.get('/users/me/saved-gigs');
        return res.data;
    },

    getUserApplications: async (): Promise<any> => {
        const res = await API.get('/users/me/gig-applications');
        return res.data;
    }
};

export default gigService;
