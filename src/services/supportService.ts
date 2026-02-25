import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import type {
    SupportTicket,
    SupportMessage,
    HelpArticle,
    CreateTicketPayload,
    SendMessagePayload,
    UpdateStatusPayload,
    ApiResponse,
} from '../types/support';

const getBaseUrl = () => {
    return process.env.EXPO_PUBLIC_API_SUPPORT_URL || 'https://netsaa-support-service.onrender.com/api/support';
};

const API = axios.create({ baseURL: getBaseUrl() });

// Request Interceptor: Attach Token
API.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const supportService = {
    // ─── Tickets ───

    createTicket: async (payload: CreateTicketPayload): Promise<ApiResponse<SupportTicket>> => {
        const res = await API.post('/tickets', payload);
        return res.data;
    },

    getMyTickets: async (params?: { page?: number; limit?: number }): Promise<ApiResponse<SupportTicket[]>> => {
        const res = await API.get('/tickets/me', { params });
        return res.data;
    },

    getTicketById: async (id: string): Promise<ApiResponse<SupportTicket>> => {
        const res = await API.get(`/tickets/${id}`);
        return res.data;
    },

    updateTicketStatus: async (id: string, payload: UpdateStatusPayload): Promise<ApiResponse<SupportTicket>> => {
        const res = await API.patch(`/tickets/${id}/status`, payload);
        return res.data;
    },

    // ─── Messages ───

    sendMessage: async (ticketId: string, payload: SendMessagePayload): Promise<ApiResponse<SupportMessage>> => {
        const res = await API.post(`/tickets/${ticketId}/message`, payload);
        return res.data;
    },

    getMessages: async (ticketId: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<SupportMessage[]>> => {
        const res = await API.get(`/tickets/${ticketId}/messages`, { params });
        return res.data;
    },

    // ─── Articles ───

    searchArticles: async (params: {
        q?: string;
        audience?: string;
        category?: string;
        tab?: string;
        page?: number;
        limit?: number;
    }): Promise<ApiResponse<HelpArticle[]>> => {
        const res = await API.get('/articles', { params });
        return res.data;
    },

    getArticleBySlug: async (slug: string): Promise<ApiResponse<HelpArticle>> => {
        const res = await API.get(`/articles/${slug}`);
        return res.data;
    },

    getArticlePreview: async (slug: string): Promise<ApiResponse<HelpArticle>> => {
        const res = await API.get(`/articles/${slug}/preview`);
        return res.data;
    },
};

export default supportService;
