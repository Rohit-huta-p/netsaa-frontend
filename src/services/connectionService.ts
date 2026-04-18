import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const getBaseUrl = () => {
    // EXPO_PUBLIC_API_URL already ends with /api (e.g., http://localhost:5001/api)
    if (process.env.EXPO_PUBLIC_API_URL) return `${process.env.EXPO_PUBLIC_API_URL}/connections`;
    // if (Platform.OS === 'web') return 'http://localhost:5001/api/connections';
    return 'http://10.197.171.107:5001/api/connections';
};

const API = axios.create({
    baseURL: getBaseUrl(),
});

API.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const connectionService = {
    /**
     * Send a connection request to a user
     */
    sendConnectionRequest: async (recipientId: string, message?: string, context?: string) => {
        const { data } = await API.post('/request', { recipientId, message, context });
        return data;
    },

    /**
     * Accept a connection request
     */
    acceptConnectionRequest: async (connectionId: string) => {
        const { data } = await API.patch(`/${connectionId}/accept`);
        return data;
    },

    /**
     * Reject a connection request
     */
    rejectConnectionRequest: async (connectionId: string) => {
        const { data } = await API.patch(`/${connectionId}/reject`);
        return data;
    },

    /**
     * Block a connection
     */
    blockConnection: async (connectionId: string) => {
        const { data } = await API.patch(`/${connectionId}/block`);
        return data;
    },

    /**
     * Remove an accepted connection
     */
    removeConnection: async (connectionId: string) => {
        const { data } = await API.delete(`/${connectionId}`);
        return data;
    },

    /**
     * Get list of accepted connections
     */
    getConnections: async () => {
        console.log(API.defaults.baseURL);

        const { data } = await API.get('/');
        return data.data; // Assuming response structure { success: true, data: [...] }
    },

    getConnectionRequests: async () => {
        const { data } = await API.get('/requests');
        return data.data;
    },

    /**
     * Get list of sent connection requests (pending)
     */
    getSentConnectionRequests: async () => {
        const { data } = await API.get('/requests/sent');
        return data.data;
    },

    /**
     * Withdraw a pending request the current user sent.
     * Use this instead of delete() for pending requests — server records withdrawnAt
     * to enforce 14-day cooldown before re-sending.
     */
    withdrawConnectionRequest: async (connectionId: string) => {
        const { data } = await API.patch(`/${connectionId}/withdraw`);
        return data;
    },

    /**
     * Block a user directly (works even if no connection exists).
     */
    blockUserDirect: async (userId: string, reason?: string, note?: string) => {
        const { data } = await API.post(`/block/${userId}`, { reason, note });
        return data;
    },

    /**
     * Remove a standalone block.
     */
    unblockUser: async (userId: string) => {
        const { data } = await API.delete(`/block/${userId}`);
        return data;
    },

    /**
     * Mutual connections between current user and target.
     * Returns { count, users[] } (users populated with displayName, role, profileImageUrl, artistType).
     */
    getMutualConnections: async (userId: string, limit = 10) => {
        const { data } = await API.get(`/mutual/${userId}`, { params: { limit } });
        return data.data as {
            count: number;
            users: Array<{ _id: string; displayName: string; profileImageUrl?: string; role?: string; artistType?: string | string[] }>;
        };
    },

    /**
     * Connection degree between current user and target.
     * Returns { degree: 1 | 2 | 3 | null } — null means 4+ or disconnected.
     * Server caches 1h in Redis.
     */
    getConnectionDegree: async (userId: string) => {
        const { data } = await API.get(`/degree/${userId}`);
        return data.data as { degree: 1 | 2 | 3 | null };
    },

    /**
     * People You May Know — scored friend-of-friend suggestions.
     * Server caches 1h on-demand, 24h when warmed by the daily cron.
     * Pass refresh=true to force a recompute (skips cache).
     */
    getPYMK: async (limit = 10, refresh = false) => {
        const { data } = await API.get('/pymk', { params: { limit, refresh: refresh ? 'true' : undefined } });
        return data.data as {
            suggestions: Array<{
                userId: string;
                displayName: string;
                profileImageUrl?: string;
                role?: string;
                artistType?: string | string[];
                primaryCity?: string | null;
                mutualCount: number;
                score: number;
                reason: string;
            }>;
            cached?: boolean;
        };
    },

    // ─── Follow system (PRD §8.9.5) ─────────────────────────────────

    /** Start following another user (one-way, no approval needed). */
    followUser: async (userId: string) => {
        const { data } = await API.post(`/follow/${userId}`);
        return data;
    },

    /** Stop following a user. Silent — no notification to them per PRD. */
    unfollowUser: async (userId: string) => {
        const { data } = await API.delete(`/follow/${userId}`);
        return data.data as { removed: boolean };
    },

    /** Am I following them? Are they following me back? */
    getFollowStatus: async (userId: string) => {
        const { data } = await API.get(`/follow-status/${userId}`);
        return data.data as { iFollow: boolean; followsMe: boolean };
    },

    /** Follower + following counts for a given user (any user, public data). */
    getFollowCounts: async (userId: string) => {
        const { data } = await API.get(`/follow-counts/${userId}`);
        return data.data as { followers: number; following: number };
    },

    /** Users the current user is following (paginated, most recent first). */
    getFollowing: async (limit = 50, skip = 0) => {
        const { data } = await API.get('/following', { params: { limit, skip } });
        return data.data as Array<FollowListUser>;
    },

    /** Users following the current user (paginated, most recent first). */
    getFollowers: async (limit = 50, skip = 0) => {
        const { data } = await API.get('/followers', { params: { limit, skip } });
        return data.data as Array<FollowListUser>;
    },
};

export type FollowListUser = {
    _id: string;
    displayName: string;
    profileImageUrl?: string;
    role?: string;
    artistType?: string | string[];
    followedAt: string;
};

export default connectionService;