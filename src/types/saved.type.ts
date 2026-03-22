export type SavedItemType = 'GIG' | 'EVENT';

export interface SavedItem {
    id: string;               // MongoDB _id
    type: SavedItemType;
    title: string;
    date: string;             // human-readable, e.g. "Mar 15, 2026"
    location: string;         // city or "Remote"
    attending: number;        // registrations count or applications count
    expiresOn: string;        // human-readable deadline/expiry
    icon: string;             // emoji representing category
    imageGradient: [string, string]; // LinearGradient color pair
    status?: string;          // raw status from API for conditional UI
    // Tab-specific extras:
    applicationStatus?: 'applied' | 'shortlisted' | 'rejected' | 'hired'; // Applied tab
    ticketCount?: number;     // Upcoming tab — number of issued tickets
    qrCodes?: string[];       // Upcoming tab — base64 QR data URLs
    checkedIn?: boolean;      // History tab — was ticket checked_in
    attendedAt?: string;      // History tab — event end date
}
