/**
 * Distance utilities for the gig detail page (Plan 5 — gig redesign).
 *
 * The backend now stores gig.location.geo = { lat, lng } on every gig
 * (geocoded server-side). The artist's coordinates may or may not be
 * known at render time — we try the precise haversine first and fall
 * back to a city-string match as a soft signal ("in your city").
 *
 * No external geo libraries — haversine is ~10 lines and good enough
 * within India's bounding box (>99.9% accuracy at <10,000 km).
 */

export type Coords = { lat: number; lng: number };

/**
 * Great-circle distance in kilometres between two points.
 * Uses the haversine formula with Earth's mean radius (6371 km).
 */
export function haversineKm(a: Coords, b: Coords): number {
    const R = 6371;
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);

    const sinDlat = Math.sin(dLat / 2);
    const sinDlng = Math.sin(dLng / 2);

    const h =
        sinDlat * sinDlat +
        Math.cos(lat1) * Math.cos(lat2) * sinDlng * sinDlng;
    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    return R * c;
}

/**
 * Format a km distance for the gig card UI.
 *  - < 1 km   → "850 m"
 *  - < 10 km  → "1.4 km"   (1 decimal)
 *  - >= 10 km → "12 km"    (rounded)
 *  - > 5000 km (likely a bad geocode) → null
 */
export function formatDistanceKm(km: number): string | null {
    if (!isFinite(km) || km < 0) return null;
    if (km > 5000) return null; // outlier — probably a bad geocode

    if (km < 1) return `${Math.round(km * 1000)} m`;
    if (km < 10) return `${km.toFixed(1)} km`;
    return `${Math.round(km)} km`;
}

/**
 * Soft city-string fallback. Used when we don't have artist coords but
 * we DO know which city they're in (from User.location).
 *
 * Returns "in your city" when the strings match (case-insensitive,
 * trim-tolerant). Returns null otherwise — caller decides whether to
 * render a placeholder or hide the cell.
 */
export function citySoftMatch(
    artistCity: string | undefined | null,
    gigCity: string | undefined | null
): string | null {
    if (!artistCity || !gigCity) return null;
    const a = artistCity.trim().toLowerCase();
    const g = gigCity.trim().toLowerCase();
    if (!a || !g) return null;
    return a === g ? 'in your city' : null;
}

/**
 * High-level helper used by the gig detail page renderer.
 *
 * Inputs:
 *  - gig location (always present on a published gig)
 *  - artist coords (optional — may come from device GPS or user profile)
 *  - artist city string (always present on a registered user with a profile)
 *
 * Output: a short string suitable for display, or null when neither
 * signal is available.
 *
 * Precedence: real distance > city soft-match > null.
 */
export function describeDistance(
    gigLocation: { geo?: Coords; city?: string } | undefined,
    artistCoords: Coords | undefined | null,
    artistCity: string | undefined | null
): string | null {
    if (!gigLocation) return null;

    if (gigLocation.geo && artistCoords) {
        const km = haversineKm(artistCoords, gigLocation.geo);
        return formatDistanceKm(km);
    }

    return citySoftMatch(artistCity, gigLocation.city);
}
