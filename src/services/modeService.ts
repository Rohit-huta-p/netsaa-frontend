// src/services/modeService.ts
import axios, { AxiosError } from 'axios';
import { useAuthStore } from '../stores/authStore';
import type { UserMode } from '../lib/modeInference';

/**
 * Mode sync talks to the users-service. We reuse EXPO_PUBLIC_API_URL because
 * the production gateway (netsaa-backend.onrender.com) and local users-service
 * (localhost:5001/api) both route `/users/me/mode` to the same backend handler
 * mounted at `router.patch('/me/mode')` under `/api/users`.
 *
 * See spec §2.5 and §13.2: mode switch is INSTANT client-side; this sync is
 * fire-and-forget. The hook calling us must NOT await in UI-critical paths.
 */
const getBaseUrl = () => {
    return process.env.EXPO_PUBLIC_API_URL || 'https://netsaa-backend.onrender.com';
};

const API = axios.create({
    baseURL: getBaseUrl(),
});

// Attach token automatically (matches authService/settingsService pattern).
API.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 5000;

/**
 * Non-blocking server sync of the user's active mode.
 *
 * Retries up to 3 times with exponential backoff (1s, 2s, 4s) on 5xx / network
 * errors. 4xx responses are considered non-retryable and abandoned immediately.
 * Never throws — callers should treat this as fire-and-forget.
 *
 * Client UX does NOT depend on this succeeding. The authoritative mode state
 * lives in AsyncStorage + Zustand; the server copy is only used for
 * cross-device consistency and inference.
 */
export async function syncModeToServer(mode: UserMode): Promise<void> {
    const token = useAuthStore.getState().accessToken;
    if (!token) {
        // Not authenticated — silently skip. Mode will sync on next auth boot.
        return;
    }

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            await API.patch(
                '/users/me/mode',
                { mode },
                { timeout: REQUEST_TIMEOUT_MS }
            );
            return; // success
        } catch (err) {
            const ax = err as AxiosError;

            // Non-retryable: 4xx client errors (bad token, validation, etc.).
            if (ax.response && ax.response.status >= 400 && ax.response.status < 500) {
                console.warn(
                    `[syncModeToServer] non-retryable ${ax.response.status} — abandoning`,
                    ax.response.data
                );
                return;
            }

            // Retryable: 5xx, network errors, timeouts.
            if (attempt < MAX_ATTEMPTS) {
                const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
                await new Promise((resolve) => setTimeout(resolve, delay));
            } else {
                console.warn(
                    `[syncModeToServer] all ${MAX_ATTEMPTS} attempts exhausted; last error:`,
                    ax.message
                );
            }
        }
    }
}

export default { syncModeToServer };
