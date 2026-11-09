import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

// Follow endpoints live in users-service (same host as connections).
const getBaseUrl = () => {
    if (process.env.EXPO_PUBLIC_API_URL) return `${process.env.EXPO_PUBLIC_API_URL}/follows`;
    return 'http://10.197.171.107:5001/api/follows';
};

const API = axios.create({ baseURL: getBaseUrl() });

API.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export interface FollowState {
    isFollowing: boolean;
    followerCount: number;
}

const followService = {
    /** Current viewer's follow state for `userId` + that user's follower count. */
    getStatus: async (userId: string): Promise<FollowState> => {
        const { data } = await API.get(`/${userId}/status`);
        return data.data;
    },
    /** Follow `userId` (idempotent). Returns the new state. */
    follow: async (userId: string): Promise<FollowState> => {
        const { data } = await API.post(`/${userId}`);
        return data.data;
    },
    /** Unfollow `userId` (idempotent). Returns the new state. */
    unfollow: async (userId: string): Promise<FollowState> => {
        const { data } = await API.delete(`/${userId}`);
        return data.data;
    },
};

export default followService;
