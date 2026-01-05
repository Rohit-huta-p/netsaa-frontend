import axios from 'axios';
import { Platform } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { Conversation } from '../types/chat';

// Extended type for UI
export interface PopulatedConversation extends Omit<Conversation, 'participants'> {
    participants: {
        _id: string;
        displayName: string;
        profilePicture?: string;
    }[];
    lastMessage?: string;
}

const getBaseUrl = () => {
    if (Platform.OS === 'web') return 'http://localhost:5001/api/conversations';
    return 'http://10.197.171.107:5001/api/conversations';
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

const conversationService = {
    /**
     * Get all conversations for the current user
     */
    getConversations: async (): Promise<PopulatedConversation[]> => {
        const { data } = await API.get('/');
        return data.data;
    },

    getConversationById: async (id: string): Promise<PopulatedConversation> => {
        const { data } = await API.get(`/${id}`);
        return data.data;
    },

    createConversation: async (recipientId: string): Promise<PopulatedConversation> => {
        const { data } = await API.post('/', { recipientId });
        return data.data;
    }
};

export default conversationService;
