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
    sendConnectionRequest: async (recipientId: string, message?: string) => {
        const { data } = await API.post('/request', { recipientId, message });
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
    }
};

export default connectionService;