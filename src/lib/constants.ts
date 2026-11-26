import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ── Backend host resolution ──────────────────────────────────────────────────
// Dev talks to the local backend on the dev machine. The machine's IP is
// discovered automatically from Metro (expo-constants `hostUri`), so local dev —
// web AND native (incl. `expo start --lan` on a device) — just works on any
// network, with no IP to maintain. Production builds (and the
// EXPO_PUBLIC_USE_PROD_API escape hatch) use the deployed URLs.

/** The dev machine's host/IP (discovered from Metro), or null if unknown. */
function devHost(): string | null {
    // Explicit override wins — e.g. the backend runs on a different machine
    // than Metro. Normally leave this unset and let auto-detect do its job.
    if (process.env.EXPO_PUBLIC_DEV_IP) return process.env.EXPO_PUBLIC_DEV_IP;

    // Web: the browser already loaded from the right host.
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
        return window.location.hostname || null;
    }

    // Native: Metro serves the bundle from the dev machine, so its IP is the
    // manifest host (e.g. "172.20.10.11:8081"). This follows your IP automatically
    // because Metro re-advertises it every time the app connects — change Wi-Fi or
    // hotspot and a reload is all it takes.
    const expo: any = Constants;
    const hostUri =
        expo.expoConfig?.hostUri ??
        expo.expoGoConfig?.debuggerHost ??
        expo.manifest?.debuggerHost ??
        null;
    if (!hostUri) return null;
    // Strip any scheme / path / port → bare host or IP.
    const host = String(hostUri).replace(/^[a-z]+:\/\//i, '').split('/')[0].split(':')[0].trim();
    return host || null;
}

// Set EXPO_PUBLIC_USE_PROD_API=1 to hit the deployed (prod) APIs even in a dev build.
const USE_PROD_API =
    process.env.EXPO_PUBLIC_USE_PROD_API === '1' ||
    process.env.EXPO_PUBLIC_USE_PROD_API === 'true';

function url(prod: string, localPath: string): string {
    if (__DEV__ && !USE_PROD_API) {
        const host = devHost();
        if (host) return `http://${host}${localPath}`;
    }
    return prod;
}

// Includes /api suffix — use for axios baseURL on users-service routes
export const API_URL = url('https://netsaa-backend.onrender.com/api', ':5001/api');

// No /api suffix — use for socket.io connection
export const SOCKET_URL = url('https://netsaa-backend.onrender.com', ':5001');

export const API_GIGS_URL = url('https://netsaa-gigs-service.onrender.com/v1', ':5002/v1');
export const API_EVENTS_URL = url('https://netsaa-events-service.onrender.com', ':5010');
export const API_SEARCH_URL = url('https://netsaa-search-service.onrender.com', ':5003');
// NOTE: media-service's Render public URL is netsaa-backend-yvy9, NOT netsaa-media-service
// (that host has no service behind it). Don't "correct" this back without checking Render.
export const API_MEDIA_URL = url('https://netsaa-backend-yvy9.onrender.com/v1', ':5004/v1');

/**
 * Master kill-switch for the event-waitlist concept (MVP: OFF), mirroring the INVITES_ENABLED
 * park pattern. When false, no surface offers a waitlist: the register "Event is full" CTA
 * reads "Sold out" (no join), the host hub + See-all drop the Waitlist tab/group/Promote, and
 * the home "Seat open · confirm" pill never appears. The code is kept, not deleted — flip this
 * to true (and set EVENTS_WAITLIST_ENABLED=1 on events-service) to bring the feature back.
 */
export const EVENT_WAITLIST_ENABLED = false;
