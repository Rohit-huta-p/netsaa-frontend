// src/hooks/useViewerCoords.ts
//
// Plan 5 — viewer's device coordinates for the gig detail page distance
// signal. Resolves to { lat, lng } when permission is already granted,
// returns null otherwise. Will NOT auto-prompt the user for permission
// unless the caller explicitly opts in via `autoRequest: true` — gig
// detail page opens shouldn't trigger a system permission dialog out of
// nowhere; the city soft-match fallback handles the unauthorized case
// just fine.
//
// Caching: a module-level snapshot with a 5-minute TTL so we don't hit
// the OS GPS subsystem on every gig open. Phones don't move 1.4 km in
// 30 seconds, and rendering a slightly-stale distance is fine.

import { useEffect, useState, useCallback } from 'react';
import * as Location from 'expo-location';

export type Coords = { lat: number; lng: number };

export type ViewerCoordsStatus =
    | 'idle'        // hook just mounted, no decision yet
    | 'requesting'  // OS prompt is open
    | 'granted'     // we have coords (or are about to)
    | 'denied'      // user explicitly denied
    | 'undetermined' // permission never asked
    | 'unavailable' // device GPS not available / disabled
    | 'error';      // exception while fetching

interface UseViewerCoordsResult {
    coords: Coords | null;
    status: ViewerCoordsStatus;
    /**
     * Trigger the OS permission prompt (if undetermined) and fetch coords.
     * Wire this to a "Show distance" / "Use my location" tap so the user
     * is in control. Returns the fresh coords (or null) for inline use.
     */
    request: () => Promise<Coords | null>;
}

interface UseViewerCoordsOptions {
    /**
     * If true, the hook auto-requests permission on mount when the current
     * status is `undetermined`. Default false — never auto-prompt unless
     * the calling screen has decided that's appropriate UX.
     */
    autoRequest?: boolean;
}

// ── Module-level cache (per-app-session) ─────────────────────────────
let cachedCoords: Coords | null = null;
let cachedAt = 0;
const TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Test-only escape hatch — clears the in-memory cache between tests so
 * one test's coords don't leak into the next.
 */
export function __resetViewerCoordsCacheForTests() {
    cachedCoords = null;
    cachedAt = 0;
}

function isCacheFresh(): boolean {
    return cachedCoords !== null && Date.now() - cachedAt < TTL_MS;
}

/**
 * Internal: fetch a fresh fix from the OS and update the cache.
 * Resolves to coords on success or null on any failure.
 */
async function fetchAndCache(): Promise<Coords | null> {
    try {
        const pos = await Location.getCurrentPositionAsync({
            // Balanced accuracy is fine for a "X km away" badge — high
            // accuracy spins up GPS hardware and burns battery for a
            // gain we never display.
            accuracy: Location.Accuracy.Balanced,
        });
        const coords: Coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
        };
        cachedCoords = coords;
        cachedAt = Date.now();
        return coords;
    } catch (err) {
        // GPS off, simulator without location set, etc. Swallow and
        // return null — distance line just won't render.
        console.warn('[useViewerCoords] getCurrentPositionAsync failed:', err);
        return null;
    }
}

export function useViewerCoords(
    opts: UseViewerCoordsOptions = {}
): UseViewerCoordsResult {
    const { autoRequest = false } = opts;

    const [coords, setCoords] = useState<Coords | null>(
        isCacheFresh() ? cachedCoords : null
    );
    const [status, setStatus] = useState<ViewerCoordsStatus>(
        isCacheFresh() ? 'granted' : 'idle'
    );

    /**
     * Public action. Asks for permission if undetermined, else uses the
     * existing grant, else returns null (denied / unavailable).
     */
    const request = useCallback(async (): Promise<Coords | null> => {
        try {
            // Cache-first — caller might be tap-spamming.
            if (isCacheFresh()) {
                setCoords(cachedCoords);
                setStatus('granted');
                return cachedCoords;
            }

            const existing = await Location.getForegroundPermissionsAsync();

            if (existing.status === 'granted') {
                const fresh = await fetchAndCache();
                setCoords(fresh);
                setStatus(fresh ? 'granted' : 'unavailable');
                return fresh;
            }

            if (existing.status === 'denied') {
                setStatus('denied');
                return null;
            }

            // Undetermined → prompt
            setStatus('requesting');
            const ask = await Location.requestForegroundPermissionsAsync();
            if (ask.status !== 'granted') {
                setStatus(ask.status === 'denied' ? 'denied' : 'undetermined');
                return null;
            }

            const fresh = await fetchAndCache();
            setCoords(fresh);
            setStatus(fresh ? 'granted' : 'unavailable');
            return fresh;
        } catch (err) {
            console.warn('[useViewerCoords] request failed:', err);
            setStatus('error');
            return null;
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            // Already cached? Nothing to do.
            if (isCacheFresh()) return;

            try {
                const perm = await Location.getForegroundPermissionsAsync();
                if (cancelled) return;

                if (perm.status === 'granted') {
                    const fresh = await fetchAndCache();
                    if (!cancelled) {
                        setCoords(fresh);
                        setStatus(fresh ? 'granted' : 'unavailable');
                    }
                    return;
                }

                if (perm.status === 'undetermined' && autoRequest) {
                    const ask = await Location.requestForegroundPermissionsAsync();
                    if (cancelled) return;
                    if (ask.status === 'granted') {
                        const fresh = await fetchAndCache();
                        if (!cancelled) {
                            setCoords(fresh);
                            setStatus(fresh ? 'granted' : 'unavailable');
                        }
                        return;
                    }
                }

                // No grant + no auto-request → publish the status so the
                // UI can decide whether to show a "Use my location" CTA.
                if (!cancelled) setStatus(perm.status as ViewerCoordsStatus);
            } catch (err) {
                if (!cancelled) {
                    console.warn('[useViewerCoords] effect failed:', err);
                    setStatus('error');
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [autoRequest]);

    return { coords, status, request };
}
