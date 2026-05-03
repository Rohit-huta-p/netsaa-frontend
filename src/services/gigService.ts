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

    getOrganizerGigs: async (params?: { status?: 'draft' | 'published' | 'closed'; limit?: number }): Promise<GigsListResponse> => {
        // Backend resolves identity from req.user._id; no organizerId param needed.
        const res = await API.get('/organizers/me/gigs', { params });
        return res.data;
    },

    getOrganizerApplicants: async (params?: {
        status?: 'applied' | 'shortlisted' | 'hired' | 'rejected' | 'withdrawn';
        gigId?: string;
        limit?: number;
    }): Promise<any> => {
        const res = await API.get('/organizers/me/applicants', { params });
        return res.data;
    },

    updateGig: async (id: string, payload: Partial<Gig>): Promise<GigResponse> => {
        console.log(payload);
        const res = await API.patch(`/gigs/${id}`, payload);
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

    updateApplicationStatus: async (
        applicationId: string,
        status: string,
        paymentMethod?: 'on_platform' | 'off_platform'
    ): Promise<any> => {
        const body: Record<string, unknown> = { status };
        if (paymentMethod) body.paymentMethod = paymentMethod;
        const res = await API.patch(`/applications/${applicationId}/status`, body);
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

    /**
     * Toggle pin on a gig discussion comment. Organizer-only — backend
     * returns 403 for non-owners. Pin cap of 3 per gig is enforced server
     * side; the oldest pinned comment auto-unpins when a 4th is pinned.
     */
    togglePinGigComment: async (gigId: string, commentId: string): Promise<any> => {
        const res = await API.put(`/gigs/${gigId}/discussion/${commentId}/pin`);
        return res.data;
    },

    /**
     * Soft-delete a gig discussion comment. Authority enforced server side:
     * author OR gig organizer OR platform admin. Returns the masked comment
     * (text replaced with "[deleted]") plus deletedReason for UI labeling.
     */
    deleteGigComment: async (gigId: string, commentId: string): Promise<any> => {
        const res = await API.delete(`/gigs/${gigId}/discussion/${commentId}`);
        return res.data;
    },

    getSavedGigs: async (params?: { limit?: number }): Promise<any> => {
        const res = await API.get('/users/me/saved-gigs', { params });
        return res.data;
    },

    getUserApplications: async (params?: { status?: string; limit?: number }): Promise<any> => {
        const res = await API.get('/users/me/gig-applications', { params });
        return res.data;
    },

    /**
     * Withdraw the current user's gig application.
     * Backend: PATCH /v1/applications/:id/withdraw (gigs-service routes.ts:34)
     * Atomic on the backend — only succeeds if the application belongs to
     * the caller and is in a withdrawable status (applied or shortlisted).
     */
    withdrawApplication: async (id: string): Promise<any> => {
        const res = await API.patch(`/applications/${id}/withdraw`);
        return res.data;
    },

    rephraseText: async (text: string): Promise<{ original: string; rephrased: string }> => {
        const res = await API.post('/ai/rephrase', { text });
        return res.data.data;
    }
};

export default gigService;
