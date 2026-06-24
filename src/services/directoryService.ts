// src/services/directoryService.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const BASE = process.env.EXPO_PUBLIC_API_URL || 'https://netsaa-backend.onrender.com/api';
const API = axios.create({ baseURL: BASE });

API.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export interface DirectoryPerson {
    _id: string;
    displayName: string;
    profileImageUrl?: string;
    /** Raw User.role — 'client' for agencies (their org category is what makes them an agency). */
    role: 'artist' | 'creative_lead' | 'client';
    /** Directory bucket. 'agency' = a client whose org is an agency. Drives the badge + toRole. */
    kind: 'artist' | 'creative_lead' | 'agency';
    artType?: string;
    headline?: string;
    city?: string;
    trustTier?: string;
    /** Agencies only — their service tags (from the Organizer doc). */
    services?: string[];
}

export interface TalentFilters {
    artTypes: string[];
    city: string[];
    trust: 'any' | 'trusted' | 'verified';
    hasMedia: boolean;
    experience: string[];
    gender: string | null;
    sort: 'relevance' | 'trust' | 'experience';
}

export const EMPTY_FILTERS: TalentFilters = {
    artTypes: [],
    city: [],
    trust: 'any',
    hasMedia: false,
    experience: [],
    gender: null,
    sort: 'relevance',
};

/** Count of active *filter* facets (sort excluded — it reorders, doesn't filter). */
export const activeFilterCount = (f: TalentFilters): number =>
    (f.artTypes.length ? 1 : 0) +
    (f.city.length ? 1 : 0) +
    (f.trust !== 'any' ? 1 : 0) +
    (f.hasMedia ? 1 : 0) +
    (f.experience.length ? 1 : 0) +
    (f.gender ? 1 : 0);

export interface DirectoryResult {
    people: DirectoryPerson[];
    total: number;
}

export const directoryService = {
    list: async (args: {
        q?: string;
        role?: string | null;
        filters?: TalentFilters;
        page?: number;
        pageSize?: number; // pass 1 for a count-only preview
    } = {}): Promise<DirectoryResult> => {
        const { q, role, filters = EMPTY_FILTERS, page, pageSize } = args;
        const params: Record<string, any> = {};
        if (q) params.q = q;
        if (role) params.role = role;
        if (filters.artTypes.length) params.artType = filters.artTypes.join(',');
        if (filters.city.length) params.city = filters.city.join(',');
        if (filters.trust !== 'any') params.trust = filters.trust;
        if (filters.hasMedia) params.hasMedia = '1';
        if (filters.experience.length) params.experienceLevel = filters.experience.join(',');
        if (filters.gender) params.gender = filters.gender;
        if (filters.sort !== 'relevance') params.sort = filters.sort;
        if (page) params.page = page;
        if (pageSize) params.pageSize = pageSize;

        const res = await API.get('/users/directory', { params });
        return {
            people: (res.data?.data?.people ?? []) as DirectoryPerson[],
            total: (res.data?.data?.total ?? 0) as number,
        };
    },
};
