import axios from 'axios';
import { Platform } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { Message } from '../types/chat';

const getBaseUrl = () => {
    if (process.env.EXPO_PUBLIC_API_URL) return `${process.env.EXPO_PUBLIC_API_URL}/messages`;
    // if (Platform.OS === 'web') return 'http://localhost:5001/api/messages';
    return 'https://netsaa-backend.onrender.com/api/messages';
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

const messageService = {
    /**
     * Get messages for a conversation
     */
    getMessages: async (conversationId: string): Promise<Message[]> => {
        const { data } = await API.get(`/${conversationId}`);
        return data.data;
    },

    /**
     * Send a message
     */
    sendMessage: async (conversationId: string, text: string, clientMessageId: string): Promise<Message> => {
        const { data } = await API.post(`/${conversationId}`, { text, clientMessageId });
        return data.data;
    },

    /**
     * Mark messages in conversation as seen
     */
    markAsSeen: async (conversationId: string): Promise<void> => {
        await API.patch(`/${conversationId}/seen`);
    }
};

export default messageService;
