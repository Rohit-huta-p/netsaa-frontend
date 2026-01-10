// src/services/deepLinkService.ts
import { router } from 'expo-router';
import useAuthStore from '@/stores/authStore';

type Route = string;

/**
 * Deep Link Service
 * Manages navigation from push notifications and deep links.
 * Handles pending navigation during auth hydration.
 */
class DeepLinkService {
    private pendingRoute: Route | null = null;
    private isInitialized = false;

    /**
     * Supported route patterns for validation
     * Supports both plain routes (/events/123) and Expo Router app routes (/(app)/events/123)
     */
    private readonly SUPPORTED_ROUTES = [
        /^\/conversations\/[a-zA-Z0-9_-]+$/,           // /conversations/:id
        /^\/(app)\/conversations\/[a-zA-Z0-9_-]+$/,   // /(app)/conversations/:id
        /^\/gigs\/[a-zA-Z0-9_-]+$/,                    // /gigs/:id
        /^\/(app)\/gigs\/[a-zA-Z0-9_-]+$/,            // /(app)/gigs/:id
        /^\/events\/[a-zA-Z0-9_-]+$/,                  // /events/:id
        /^\/(app)\/events\/[a-zA-Z0-9_-]+$/,          // /(app)/events/:id
        /^\/contracts\/[a-zA-Z0-9_-]+$/,               // /contracts/:id
        /^\/(app)\/contracts\/[a-zA-Z0-9_-]+$/,       // /(app)/contracts/:id
        /^\/connections$/,                              // /connections
        /^\/(app)\/connections$/,                       // /(app)/connections
        /^\/messages$/,                                 // /messages
        /^\/(app)\/messages$/,                          // /(app)/messages
        /^\/notifications$/,                            // /notifications
        /^\/(app)\/notifications$/,                     // /(app)/notifications
        /^\/profile\/[a-zA-Z0-9_-]+$/,                 // /profile/:userId
        /^\/(app)\/profile\/[a-zA-Z0-9_-]+$/,         // /(app)/profile/:userId
        /^\/network$/,                                  // /network
        /^\/(app)\/network$/,                           // /(app)/network
    ];

    /**
     * Map route names from backend to actual app routes
     * Backend sends route names like 'connections', 'chat', etc.
     * We need to map them to actual app routes like '/(app)/connections'
     */
    private readonly ROUTE_MAP: Record<string, string> = {
        'connections': '/(app)/network',
        'chat': '/(app)/messages',
        'gig-applications': '/(app)/gigs',
        'gig-details': '/(app)/gigs',
        'event-details': '/(app)/events',
        'event-checkout': '/(app)/events',
        'payment-receipt': '/(app)/profile',
        'payment-retry': '/(app)/profile',
        'contract-details': '/(app)/profile',
    };

    /**
     * Initialize the deep link service
     * Should be called once on app startup
     */
    initialize() {
        if (this.isInitialized) {
            console.log('[DeepLinkService] Already initialized');
            return;
        }

        this.isInitialized = true;
        console.log('[DeepLinkService] Initialized');
    }

    /**
     * Resolve a route name or path to a full app route
     * Handles both route names ('connections') and full paths ('/(app)/connections')
     */
    private resolveRoute(route: string): string {
        // If it's already a full path (starts with /), return as-is
        if (route.startsWith('/')) {
            return route;
        }

        // Otherwise, map the route name to an app route
        const mappedRoute = this.ROUTE_MAP[route];
        if (mappedRoute) {
            console.log(`[DeepLinkService] Mapped route '${route}' to '${mappedRoute}'`);
            return mappedRoute;
        }

        // If no mapping found, try to construct a default route
        console.warn(`[DeepLinkService] No mapping found for route '${route}', using default`);
        return `/(app)/${route}`;
    }

    /**
     * Validate if a route is supported
     */
    private isValidRoute(route: string): boolean {
        return this.SUPPORTED_ROUTES.some(pattern => pattern.test(route));
    }

    /**
     * Navigate to a route from a notification
     * If auth is not hydrated, queue the navigation
     */
    navigateToRoute(route: string) {
        console.log('[DeepLinkService] Navigate to route requested:', route);

        // Resolve route name to full path
        const resolvedRoute = this.resolveRoute(route);
        console.log('[DeepLinkService] Resolved route:', resolvedRoute);

        // Validate route (but don't block navigation)
        const isValid = this.isValidRoute(resolvedRoute);
        if (!isValid) {
            console.warn('[DeepLinkService] Route pattern not recognized, but attempting navigation anyway');
        }

        const { isHydrated, accessToken } = useAuthStore.getState();

        // Check if auth is ready
        if (!isHydrated) {
            console.log('[DeepLinkService] Auth not hydrated, queueing navigation');
            this.pendingRoute = resolvedRoute;
            return;
        }

        // Check if user is authenticated (for protected routes)
        if (!accessToken) {
            console.log('[DeepLinkService] User not authenticated, cannot navigate to protected route');
            this.pendingRoute = null;
            return;
        }

        // Navigate immediately
        this.performNavigation(resolvedRoute);
    }

    /**
     * Process pending navigation after auth hydration
     * Should be called when auth hydration completes
     */
    processPendingNavigation() {
        if (!this.pendingRoute) {
            return;
        }

        const { isHydrated, accessToken } = useAuthStore.getState();

        if (!isHydrated) {
            console.log('[DeepLinkService] Auth still not hydrated, keeping route in queue');
            return;
        }

        if (!accessToken) {
            console.log('[DeepLinkService] User not authenticated, clearing pending route');
            this.pendingRoute = null;
            return;
        }

        console.log('[DeepLinkService] Processing pending navigation:', this.pendingRoute);
        const route = this.pendingRoute;
        this.pendingRoute = null;
        this.performNavigation(route);
    }

    /**
     * Perform the actual navigation
     */
    private performNavigation(route: string) {
        try {
            console.log('[DeepLinkService] Navigating to:', route);
            router.push(route as any);
        } catch (error) {
            console.error('[DeepLinkService] Navigation failed:', error);
        }
    }

    /**
     * Clear any pending navigation
     */
    clearPendingNavigation() {
        console.log('[DeepLinkService] Clearing pending navigation');
        this.pendingRoute = null;
    }

    /**
     * Get the current pending route (for debugging)
     */
    getPendingRoute(): Route | null {
        return this.pendingRoute;
    }
}

// Export singleton instance
export const deepLinkService = new DeepLinkService();
export default deepLinkService;
