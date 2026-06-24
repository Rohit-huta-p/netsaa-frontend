// src/services/inviteService.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const BASE =
    process.env.EXPO_PUBLIC_API_GIGS_URL || 'https://netsaa-gigs-service.onrender.com/v1';

const API = axios.create({ baseURL: BASE });

API.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export type InviteCreateBody = {
    toUserId: string;
    toRole: 'artist' | 'creative_lead' | 'agency';
    requirementId?: string;
    note?: string;
};

export const inviteService = {
    /** POST /invites — client sends an invite (requirement-attached or context-free) */
    create: async (body: InviteCreateBody) => {
        const res = await API.post('/invites', body);
        return res.data; // { meta, data: invite }
    },

    /** GET /invites/received — all invites where I am the recipient */
    received: async () => {
        const res = await API.get('/invites/received');
        return res.data?.data?.invites ?? [];
    },

    /** GET /invites/sent — all invites I (the client) have sent. Used to mark
     *  the invite sheet's requirement rows as "Invited" so the action has
     *  lasting feedback instead of surfacing a 409 only on submit. */
    sent: async (): Promise<SentInvite[]> => {
        const res = await API.get('/invites/sent');
        return res.data?.data?.invites ?? [];
    },

    /** PATCH /invites/:id/respond — accept or decline (recipient) */
    respond: async (id: string, action: 'accept' | 'decline') => {
        const res = await API.patch(`/invites/${id}/respond`, { action });
        return res.data;
    },

    /** PATCH /invites/:id/withdraw — sender pulls back a still-pending invite,
     *  freeing the slot so they can re-invite. */
    withdraw: async (id: string) => {
        const res = await API.patch(`/invites/${id}/withdraw`);
        return res.data;
    },
};

export type SentInvite = {
    _id: string;
    toUserId: string;
    toRole?: 'artist' | 'creative_lead' | 'agency';
    // Denormalized recipient captured server-side at invite time (mirrors fromSnapshot)
    // so the sent list can show the performer, not just requirement context.
    toSnapshot?: { displayName?: string; avatarUrl?: string | null; city?: string };
    requirementId: string | null;
    requirementTitle?: string;
    requirementSnapshot?: RequirementSnapshot | null;
    status: 'sent' | 'viewed' | 'accepted' | 'declined' | 'withdrawn';
    createdAt?: string;
};

/** Statuses the server's partial unique index treats as a live invite (these
 *  block a re-invite for the same client+recipient+requirement tuple). */
export const LIVE_INVITE_STATUSES = ['sent', 'viewed', 'accepted'] as const;

export type RequirementSnapshot = {
    title: string;
    budgetMin?: number | null;
    budgetMax?: number | null;
    eventDate?: string | null;   // ISO date; single date in v1
    city?: string | null;
    craft?: string | null;
    invitedCount?: number | null;
};

export type Invite = {
    _id: string;
    fromClientId: string;
    fromSnapshot: { displayName: string; city?: string; avatarUrl?: string | null };
    toUserId: string;
    toRole: 'artist' | 'creative_lead' | 'agency';
    requirementId?: string | null;
    requirementTitle?: string;              // deprecated — fallback when snapshot absent
    requirementSnapshot?: RequirementSnapshot | null;
    note?: string;
    status: 'sent' | 'viewed' | 'accepted' | 'declined' | 'withdrawn';
    createdAt: string;
};
