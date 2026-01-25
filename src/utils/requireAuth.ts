// src/utils/requireAuth.ts
import { useAuthStore } from '@/stores/authStore';
import { usePendingAuthActionStore } from '@/stores/pendingAuthActionStore';
import { router } from 'expo-router';

export type AuthActionReason =
    | 'apply_gig'
    | 'register_event'
    | 'connect'
    | 'save'
    | 'message'
    | 'follow'
    | 'create';

export interface RequireAuthOptions {
    action: () => Promise<void> | void;
    reason?: AuthActionReason;
}

/**
 * Guard function that checks authentication before executing an action.
 * If not authenticated, stores the action and redirects to login.
 * After successful login, the action will be executed automatically.
 * 
 * @example
 * requireAuth({
 *   action: () => applyToGig(gigId),
 *   reason: 'apply_gig'
 * });
 */
export function requireAuth(options: RequireAuthOptions): void {
    const isAuthenticated = !!useAuthStore.getState().accessToken;

    if (isAuthenticated) {
        // User is authenticated, execute action immediately
        console.log('[RequireAuth] User authenticated, executing action');
        options.action();
    } else {
        // User not authenticated, store action and redirect to login
        console.log('[RequireAuth] User not authenticated, storing action:', options.reason);
        usePendingAuthActionStore.getState().setPendingAction(
            options.action,
            options.reason
        );
        router.push('/(auth)/login');
    }
}

/**
 * Hook version for components that need to check auth state reactively
 */
export function useRequireAuth() {
    const accessToken = useAuthStore((state) => state.accessToken);
    const isAuthenticated = !!accessToken;

    return {
        isAuthenticated,
        requireAuth: (options: RequireAuthOptions) => requireAuth(options),
    };
}

export default requireAuth;
