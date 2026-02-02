import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export type EntityType = 'user' | 'artist' | 'gig' | 'event' | 'contract';

export type MediaPurpose =
    | 'avatar'
    | 'portfolio'
    | 'audition'
    | 'banner'
    | 'gallery'
    | 'thumbnail'
    | 'promo'
    | 'documents';

/**
 * Presign request payload.
 * 
 * NOTE: fileName is intentionally NOT included.
 * Backend generates S3 keys using UUID + MIME extension only.
 * This is a locked architectural decision for security.
 */
export interface PresignRequest {
    entityType: EntityType;
    entityId: string;
    purpose: MediaPurpose;
    mimeType: string;        // MIME type: 'image/jpeg', 'video/mp4'
    fileSize: number;        // File size in bytes (required for backend validation)
}

export interface PresignResponse {
    success: boolean;
    data: {
        uploadUrl: string;    // PUT URL for S3
        fileUrl: string;      // URL to access file after upload (backend returns this)
        key: string;          // S3 object key
        expiresIn: number;    // seconds until URL expires
    };
    message?: string;
}

// ─────────────────────────────────────────────────────────────
// API CLIENT
// ─────────────────────────────────────────────────────────────

const getBaseUrl = () => {
    return process.env.EXPO_PUBLIC_API_MEDIA_URL || 'https://netsaa-media-service.onrender.com/v1';
};

const API = axios.create({
    baseURL: getBaseUrl(),
});

// Attach auth token (consistent with other services)
API.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    console.log('[MediaService] Token exists:', !!token, token ? `(${token.substring(0, 20)}...)` : '(none)');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response Interceptor: Handle 401 (Token Expired/Invalid)
// API.interceptors.response.use(
//     (response) => response,
//     async (error) => {
//         if (error.response?.status === 401) {
//             console.log('Media Service 401: Clearing auth');
//             const { clearAuth } = useAuthStore.getState();
//             clearAuth(); // Force logout so user can get a fresh token
//         }
//         return Promise.reject(error);
//     }
// );

// ─────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────

const mediaService = {
    /**
     * Request a presigned URL for uploading media to S3.
     * NEVER sends file bytes to backend.
     */
    requestPresignedUrl: async (request: PresignRequest): Promise<PresignResponse> => {
        const response = await API.post<PresignResponse>('/media/presign', request);
        return response.data;
    },
};

export default mediaService;
