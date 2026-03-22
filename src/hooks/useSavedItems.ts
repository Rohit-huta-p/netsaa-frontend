import { useQuery } from '@tanstack/react-query';
import eventService from '../services/eventService';
import gigService from '../services/gigService';
import { SavedItem, SavedItemType } from '../types/saved.type';

export type { SavedItem, SavedItemType };

/* ─────────────── Gradient & icon maps ─────────────── */

const EVENT_GRADIENTS: Record<string, [string, string]> = {
    dance: ['#ec4899', '#be185d'],
    music: ['#8b5cf6', '#6d28d9'],
    acting: ['#f59e0b', '#d97706'],
    workshop: ['#10b981', '#059669'],
    competition: ['#3b82f6', '#2563eb'],
    showcase: ['#f43f5e', '#e11d48'],
    meetup: ['#14b8a6', '#0d9488'],
    default: ['#6366f1', '#4f46e5'],
};

const EVENT_ICONS: Record<string, string> = {
    dance: '💃',
    music: '🎵',
    acting: '🎬',
    workshop: '🎭',
    competition: '🏆',
    showcase: '🎤',
    meetup: '🤝',
    default: '📅',
};

const GIG_GRADIENTS: Record<string, [string, string]> = {
    dance: ['#ec4899', '#be185d'],
    music: ['#8b5cf6', '#6d28d9'],
    acting: ['#f59e0b', '#d97706'],
    modeling: ['#10b981', '#059669'],
    default: ['#6366f1', '#4f46e5'],
};

const GIG_ICONS: Record<string, string> = {
    dance: '💃',
    music: '🎸',
    acting: '🎬',
    modeling: '📸',
    default: '💼',
};

/* ─────────────── Helpers ─────────────── */

const getCategoryKey = (cat?: string) => (cat || 'default').toLowerCase();

const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Date TBD';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Date TBD';
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const day = d.getDate();
    const year = d.getFullYear();
    return `${month} ${day}, ${year}`;
};

const formatLocation = (loc: any): string => {
    if (!loc) return 'Location TBD';
    if (typeof loc === 'string') return loc;
    if (loc.venueName && loc.city) return `${loc.venueName}, ${loc.city}`;
    if (loc.city) return loc.city;
    if (loc.venueName) return loc.venueName;
    return 'Location TBD';
};

const calculateExpiry = (dateString?: string): string => {
    if (!dateString) return 'No deadline';
    const deadline = new Date(dateString);
    if (isNaN(deadline.getTime())) return 'No deadline';
    const now = new Date();
    const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `${diffDays} days`;
    return `${Math.ceil(diffDays / 7)} weeks`;
};

const getStartDate = (item: any): string | undefined => {
    // event shape: { schedule: { startDate } }
    return item?.schedule?.startDate || item?.startDate;
};

/* ─────────────── Transformers ─────────────── */

const transformSavedEvent = (savedEvent: any): SavedItem => {
    const event = savedEvent.eventDetails || (typeof savedEvent.eventId === 'object' ? savedEvent.eventId : null) || savedEvent;
    const key = getCategoryKey(event.category);
    return {
        id: event._id || event.id,
        type: 'EVENT',
        title: event.title || 'Untitled Event',
        date: formatDate(getStartDate(event)),
        location: formatLocation(event.location),
        attending: event.attendeesCount || event.registrationsCount || 0,
        expiresOn: calculateExpiry(event.registrationDeadline || getStartDate(event)),
        imageGradient: EVENT_GRADIENTS[key] || EVENT_GRADIENTS.default,
        icon: EVENT_ICONS[key] || EVENT_ICONS.default,
        status: savedEvent.status,
    };
};

const transformSavedGig = (savedGig: any): SavedItem => {
    const gig = savedGig.gigDetails || (typeof savedGig.gigId === 'object' ? savedGig.gigId : null) || savedGig;
    const key = getCategoryKey(gig.category);
    return {
        id: gig._id || gig.id,
        type: 'GIG',
        title: gig.title || 'Untitled Gig',
        date: formatDate(gig.deadline || gig.applicationDeadline),
        location: formatLocation(gig.location),
        attending: gig.applicantsCount || gig.applicationCount || 0,
        expiresOn: calculateExpiry(gig.deadline || gig.applicationDeadline),
        imageGradient: GIG_GRADIENTS[key] || GIG_GRADIENTS.default,
        icon: GIG_ICONS[key] || GIG_ICONS.default,
        status: savedGig.status,
    };
};

/** Event registration → SavedItem for Upcoming / History */
const transformRegistration = (reg: any): SavedItem => {
    const event = reg.event || reg.eventDetails || (typeof reg.eventId === 'object' ? reg.eventId : null);
    const key = getCategoryKey(event?.category);
    const tickets = reg.tickets || [];
    return {
        id: event?._id || reg.eventId,
        type: 'EVENT',
        title: event?.title || 'Untitled Event',
        date: formatDate(getStartDate(event)),
        location: formatLocation(event?.location),
        attending: reg.quantity || 1,
        expiresOn: formatDate(getStartDate(event)),
        imageGradient: EVENT_GRADIENTS[key] || EVENT_GRADIENTS.default,
        icon: EVENT_ICONS[key] || EVENT_ICONS.default,
        status: reg.status,
        ticketCount: tickets.length,
        qrCodes: tickets.map((t: any) => t.qrCode).filter(Boolean),
        checkedIn: tickets.some((t: any) => t.status === 'checked_in'),
        attendedAt: event?.schedule?.endDate ? formatDate(event.schedule.endDate) : undefined,
    };
};

/** Gig application → SavedItem (for Applied + Upcoming hired) */
const transformApplication = (app: any): SavedItem => {
    const gig = app.gigId && typeof app.gigId === 'object' ? app.gigId : app.gig || app;
    const key = getCategoryKey(gig.category);
    return {
        id: gig._id || gig.id || app.gigId,
        type: 'GIG',
        title: gig.title || 'Untitled Gig',
        date: formatDate(getStartDate(gig) || gig.applicationDeadline),
        location: gig.location?.isRemote ? 'Remote' : formatLocation(gig.location),
        attending: gig.applicantsCount || 0,
        expiresOn: calculateExpiry(getStartDate(gig) || gig.applicationDeadline),
        imageGradient: GIG_GRADIENTS[key] || GIG_GRADIENTS.default,
        icon: GIG_ICONS[key] || GIG_ICONS.default,
        status: app.status,
        applicationStatus: app.status,
    };
};

/* ─────────────── Hook ─────────────── */

export const useSavedItems = () => {
    const now = new Date();

    // ── Saved items ──
    const { data: savedEventsData, isLoading: l1, refetch: r1 } = useQuery({
        queryKey: ['savedEvents'],
        queryFn: () => eventService.getSavedEvents(),
    });
    const { data: savedGigsData, isLoading: l2, refetch: r2 } = useQuery({
        queryKey: ['savedGigs'],
        queryFn: () => gigService.getSavedGigs(),
    });

    // ── Event registrations (for Upcoming + History) ──
    const { data: regData, isLoading: l3, refetch: r3 } = useQuery({
        queryKey: ['upcoming-event-registrations'],
        queryFn: () => eventService.getUserRegistrations(),
    });

    // ── Gig applications (for Applied + Upcoming hired) ──
    const { data: appData, isLoading: l4, refetch: r4 } = useQuery({
        queryKey: ['my-gig-applications'],
        queryFn: () => gigService.getUserApplications(),
    });

    const isLoading = l1 || l2 || l3 || l4;

    // ── Saved tab ──
    const savedItems: SavedItem[] = [
        ...(savedEventsData?.data || []).map(transformSavedEvent),
        ...(savedGigsData?.data || []).map(transformSavedGig),
    ];

    // ── Applied tab (gig applications only) ──
    const appliedItems: SavedItem[] = (appData?.data || []).map(transformApplication);

    // ── Upcoming tab ──
    // Future event registrations
    const upcomingEvents: SavedItem[] = (regData?.data || [])
        .filter((reg: any) => {
            const event = reg.event || reg.eventDetails || (typeof reg.eventId === 'object' ? reg.eventId : null);
            const sd = getStartDate(event);
            if (!sd) return false;
            return new Date(sd) >= now && reg.status !== 'cancelled';
        })
        .map(transformRegistration);

    // Future hired gigs
    const upcomingGigs: SavedItem[] = (appData?.data || [])
        .filter((app: any) => {
            if (app.status !== 'hired') return false;
            const gig = app.gigId && typeof app.gigId === 'object' ? app.gigId : app.gig;
            const sd = getStartDate(gig);
            if (!sd) return true; // include hired gigs even without a date
            return new Date(sd) >= now;
        })
        .map(transformApplication);

    // Merge & sort by date ascending (soonest first)
    const upcomingItems: SavedItem[] = [...upcomingEvents, ...upcomingGigs].sort((a, b) => {
        const da = new Date(a.date).getTime() || Infinity;
        const db = new Date(b.date).getTime() || Infinity;
        return da - db;
    });

    // ── History tab (past event registrations) ──
    const historyItems: SavedItem[] = (regData?.data || [])
        .filter((reg: any) => {
            const event = reg.event || reg.eventDetails || (typeof reg.eventId === 'object' ? reg.eventId : null);
            const sd = getStartDate(event);
            if (!sd) return false;
            return new Date(sd) < now;
        })
        .map(transformRegistration);

    const refetchAll = () => { r1(); r2(); r3(); r4(); };

    return {
        savedItems,
        appliedItems,
        upcomingItems,
        historyItems,
        isLoading,
        refetchAll,
        counts: {
            saved: savedItems.length,
            applied: appliedItems.length,
            upcoming: upcomingItems.length,
            history: historyItems.length,
        },
    };
};
