// src/services/requirementService.ts
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const getBaseUrl = () =>
    process.env.EXPO_PUBLIC_API_GIGS_URL || 'https://netsaa-gigs-service.onrender.com/v1';

const API = axios.create({ baseURL: getBaseUrl() });

API.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export interface RequirementPayload {
    title: string;
    occasionText: string;
    description: string;
    city: string;
    eventDate: string; // ISO
    budgetMin?: number | null;
    budgetMax?: number | null;
    photos?: string[];
}

// ─── FEED FILTERS ────────────────────────────────────────────────────────────
// Drives the "Find work" feed (Creative Leads + agency clients). Mirrors the
// Talent directory's TalentFilters shape: multi-select city/occasion, a single
// minimum-budget threshold, and a sort. `sort` reorders rather than filters, so
// it's excluded from activeReqFilterCount.
export interface RequirementFilters {
    cities: string[];
    occasions: string[];
    minBudget: number | null;
    sort: 'newest' | 'event' | 'budget';
}

export const EMPTY_REQ_FILTERS: RequirementFilters = {
    cities: [],
    occasions: [],
    minBudget: null,
    sort: 'newest',
};

/** Count of active *filter* facets (sort excluded — it reorders, doesn't filter). */
export const activeReqFilterCount = (f: RequirementFilters): number =>
    (f.cities.length ? 1 : 0) + (f.occasions.length ? 1 : 0) + (f.minBudget ? 1 : 0);

export interface RequirementFeedResult {
    requirements: any[];
    total: number;
}

// A proposal the viewer has SENT, joined with its requirement basics (GET /proposals/mine).
export type ProposalStatus = 'sent' | 'viewed' | 'accepted' | 'declined' | 'withdrawn';
export type SentProposal = {
    _id: string;
    requirementId: string;
    quoteAmount?: number | null;
    status: ProposalStatus;
    createdAt: string;
    pitch?: string;
    requirement?: {
        _id: string;
        title?: string;
        occasionText?: string;
        city?: string;
        eventDate?: string;
        status?: string;
        budgetMin?: number | null;
        budgetMax?: number | null;
        clientSnapshot?: { displayName?: string; city?: string; hirerType?: string };
    } | null;
};

export const requirementService = {
    create: async (payload: RequirementPayload) => {
        const res = await API.post('/requirements', payload);
        return res.data; // { meta, data: requirement }
    },
    mine: async () => {
        const res = await API.get('/requirements/mine');
        return res.data?.data?.requirements ?? [];
    },
    feed: async (args: {
        q?: string;
        filters?: RequirementFilters;
        page?: number;
        pageSize?: number; // pass 1 for a count-only preview
    } = {}): Promise<RequirementFeedResult> => {
        const { q, filters = EMPTY_REQ_FILTERS, page, pageSize } = args;
        const params: Record<string, any> = {};
        if (q) params.q = q;
        if (filters.cities.length) params.city = filters.cities.join(',');
        if (filters.occasions.length) params.occasion = filters.occasions.join(',');
        if (filters.minBudget) params.minBudget = filters.minBudget;
        if (filters.sort !== 'newest') params.sort = filters.sort;
        if (page) params.page = page;
        if (pageSize) params.pageSize = pageSize;

        const res = await API.get('/requirements', { params });
        return {
            requirements: res.data?.data?.requirements ?? [],
            total: res.data?.data?.total ?? 0,
        };
    },
    detail: async (id: string) => {
        const res = await API.get(`/requirements/${id}`);
        return res.data?.data;
    },
    propose: async (id: string, body: { pitch: string; quoteAmount?: number | null; portfolioLinks?: string[] }) => {
        const res = await API.post(`/requirements/${id}/proposals`, body);
        return res.data;
    },
    proposals: async (id: string) => {
        const res = await API.get(`/requirements/${id}/proposals`);
        return res.data?.data?.proposals ?? [];
    },
    // The viewer's OWN sent proposals (lead side), each joined to its requirement.
    myProposals: async (): Promise<SentProposal[]> => {
        const res = await API.get('/proposals/mine');
        return res.data?.data?.proposals ?? [];
    },
    patchProposal: async (proposalId: string, action: 'accept' | 'decline' | 'withdraw') => {
        const res = await API.patch(`/proposals/${proposalId}`, { action });
        return res.data;
    },
    edit: async (id: string, patch: Partial<RequirementPayload>) => {
        const res = await API.patch(`/requirements/${id}`, patch);
        return res.data;
    },
    changeStatus: async (id: string, action: 'stop' | 'reopen' | 'cancel' | 'book') => {
        const res = await API.patch(`/requirements/${id}/status`, { action });
        return res.data;
    },
};
