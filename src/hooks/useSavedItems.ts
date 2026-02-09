import { useQuery } from '@tanstack/react-query';
import eventService from '../services/eventService';
import gigService from '../services/gigService';

export type SavedItemType = 'event' | 'gig';

export interface SavedItem {
    id: string;
    type: string;
    title: string;
    date: string;
    location: string;
    attending: number;
    expiresOn: string;
    imageGradient: [string, string];
    icon: string;
    itemType: SavedItemType;
    status?: string;
    rawData?: any;
}

const EVENT_GRADIENTS: { [key: string]: [string, string] } = {
    workshop: ['#ec4899', '#be185d'], // Pink
    audition: ['#8b5cf6', '#6d28d9'], // Purple
    performance: ['#f59e0b', '#d97706'], // Orange
    rehearsal: ['#10b981', '#059669'], // Green
    default: ['#6366f1', '#4f46e5'], // Indigo
};

const EVENT_ICONS: { [key: string]: string } = {
    workshop: '🎭',
    audition: '👟',
    performance: '🎤',
    rehearsal: '🎵',
    default: '📅',
};

const GIG_GRADIENTS: { [key: string]: [string, string] } = {
    dance: ['#ec4899', '#be185d'], // Pink
    music: ['#8b5cf6', '#6d28d9'], // Purple
    acting: ['#f59e0b', '#d97706'], // Orange
    modeling: ['#10b981', '#059669'], // Green
    default: ['#6366f1', '#4f46e5'], // Indigo
};

const GIG_ICONS: { [key: string]: string } = {
    dance: '💃',
    music: '🎸',
    acting: '🎬',
    modeling: '📸',
    default: '💼',
};

const formatEventDate = (dateString: string): string => {
    if (!dateString) return 'Date TBD';
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${month} ${day} • ${time}`;
};

const formatLocation = (location: any): string => {
    if (!location) return 'Location TBD';
    if (typeof location === 'string') return location;
    if (location.city && location.state) return `${location.city}, ${location.state}`;
    if (location.venue) return location.venue;
    return 'Location TBD';
};

const calculateExpiry = (deadlineString: string): string => {
    if (!deadlineString) return 'No deadline';
    const deadline = new Date(deadlineString);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `${diffDays} days`;
    return `${Math.ceil(diffDays / 7)} weeks`;
};

const transformEventToItem = (savedEvent: any): SavedItem => {
    // Prioritize eventDetails (object with full data) over eventId (which may be just a string ID)
    const event = savedEvent.eventDetails || (typeof savedEvent.eventId === 'object' ? savedEvent.eventId : null) || savedEvent;
    const category = (event.category || 'default').toLowerCase();

    return {
        id: event._id || event.id,
        type: event.category || 'Event',
        title: event.title || 'Untitled Event',
        date: formatEventDate(event.startDate || event.date),
        location: formatLocation(event.location),
        attending: event.attendeesCount || event.registrationsCount || 0,
        expiresOn: calculateExpiry(event.registrationDeadline || event.startDate),
        imageGradient: EVENT_GRADIENTS[category] || EVENT_GRADIENTS.default,
        icon: EVENT_ICONS[category] || EVENT_ICONS.default,
        itemType: 'event' as SavedItemType,
        status: savedEvent.status,
        rawData: event,
    };
};

const transformGigToItem = (savedGig: any): SavedItem => {
    // Prioritize gigDetails (object with full data) over gigId (which is just a string ID)
    const gig = savedGig.gigDetails || (typeof savedGig.gigId === 'object' ? savedGig.gigId : null) || savedGig;
    const category = (gig.category || 'default').toLowerCase();

    return {
        id: gig._id || gig.id,
        type: gig.category || 'Gig',
        title: gig.title || 'Untitled Gig',
        date: formatEventDate(gig.deadline || gig.applicationDeadline),
        location: formatLocation(gig.location),
        attending: gig.applicantsCount || gig.applicationCount || 0,
        expiresOn: calculateExpiry(gig.deadline || gig.applicationDeadline),
        imageGradient: GIG_GRADIENTS[category] || GIG_GRADIENTS.default,
        icon: GIG_ICONS[category] || GIG_ICONS.default,
        itemType: 'gig' as SavedItemType,
        status: savedGig.status,
        rawData: gig,
    };
};

export const useSavedItems = () => {
    // Fetch saved events
    const { data: savedEventsData, isLoading: loadingSavedEvents, refetch: refetchSavedEvents } = useQuery({
        queryKey: ['savedEvents'],
        queryFn: () => eventService.getSavedEvents(),
    });

    // Fetch saved gigs
    const { data: savedGigsData, isLoading: loadingSavedGigs, refetch: refetchSavedGigs } = useQuery({
        queryKey: ['savedGigs'],
        queryFn: () => gigService.getSavedGigs(),
    });

    // Fetch user event registrations
    const { data: eventRegistrationsData, isLoading: loadingEventRegistrations, refetch: refetchEventRegistrations } = useQuery({
        queryKey: ['userEventRegistrations'],
        queryFn: () => eventService.getUserRegistrations(),
    });

    // Fetch user gig applications
    const { data: gigApplicationsData, isLoading: loadingGigApplications, refetch: refetchGigApplications } = useQuery({
        queryKey: ['userGigApplications'],
        queryFn: () => gigService.getUserApplications(),
    });

    const isLoading = loadingSavedEvents || loadingSavedGigs || loadingEventRegistrations || loadingGigApplications;

    // Process saved items (saved events + saved gigs)
    const savedItems: SavedItem[] = [
        ...(savedEventsData?.data || []).map(transformEventToItem),
        ...(savedGigsData?.data || []).map(transformGigToItem),
    ];

    // Process applied items (gig applications only)
    const appliedItems: SavedItem[] = (gigApplicationsData?.data || []).map(transformGigToItem);

    // Process upcoming items (future event registrations)
    const now = new Date();
    const upcomingItems: SavedItem[] = (eventRegistrationsData?.data || [])
        .filter((reg: any) => {
            const event = reg.eventId || reg.eventDetails;
            const eventDate = new Date(event?.startDate || event?.date);
            return eventDate >= now;
        })
        .map(transformEventToItem);

    // Process history items (past event registrations)
    const historyItems: SavedItem[] = (eventRegistrationsData?.data || [])
        .filter((reg: any) => {
            const event = reg.eventId || reg.eventDetails;
            const eventDate = new Date(event?.startDate || event?.date);
            return eventDate < now;
        })
        .map(transformEventToItem);

    const refetchAll = () => {
        refetchSavedEvents();
        refetchSavedGigs();
        refetchEventRegistrations();
        refetchGigApplications();
    };

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
