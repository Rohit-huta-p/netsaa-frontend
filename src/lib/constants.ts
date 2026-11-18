import { Platform } from 'react-native';

// Local dev IP — only used on web. Change here or override with EXPO_PUBLIC_DEV_IP in .env.
const DEV_IP = process.env.EXPO_PUBLIC_DEV_IP || '172.20.10.11';

function url(prod: string, localPath: string): string {
    if (Platform.OS === 'web') return `http://${DEV_IP}${localPath}`;
    return prod;
}

// Includes /api suffix — use for axios baseURL on users-service routes
export const API_URL = url('https://netsaa-backend.onrender.com/api', ':5001/api');

// No /api suffix — use for socket.io connection
export const SOCKET_URL = url('https://netsaa-backend.onrender.com', ':5001');

export const API_GIGS_URL = url('https://netsaa-gigs-service.onrender.com/v1', ':5002/v1');
export const API_EVENTS_URL = url('https://netsaa-events-service.onrender.com', ':5010');
export const API_SEARCH_URL = url('https://netsaa-search-service.onrender.com', ':5003');
export const API_MEDIA_URL = url('https://netsaa-media-service.onrender.com/v1', ':5004/v1');
