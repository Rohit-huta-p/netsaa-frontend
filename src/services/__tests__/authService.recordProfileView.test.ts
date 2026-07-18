// src/services/__tests__/authService.recordProfileView.test.ts
//
// Focused regression coverage for authService.recordProfileView's session
// guard: the endpoint requires auth, so an unauthenticated call must never
// hit the network — it would only trip the response interceptor's
// clearAuth() for no benefit, since view screens are only reachable while
// logged in (see the guard's own comment in authService.ts).
//
// authService.ts builds its axios client once at module-load time via
// `axios.create(...)` and never exports it, so there's no module-internal
// instance to spy on without changing production code. Instead: mock the
// `axios` module so `axios.create()` returns an inspectable stub, and mock
// `@/stores/authStore` (mirroring the store-built-inside-the-factory pattern
// used by ProfileScreen.reels.test.tsx) so the guard's accessToken read is
// fully under this test's control.

const mockPost = jest.fn().mockResolvedValue({ data: {} });
jest.mock('axios', () => ({
    __esModule: true,
    default: {
        create: jest.fn(() => ({
            post: (...a: any[]) => mockPost(...a),
            get: jest.fn(),
            patch: jest.fn(),
            interceptors: {
                request: { use: jest.fn() },
                response: { use: jest.fn() },
            },
        })),
    },
}));

jest.mock('@/stores/authStore', () => {
    const store: { accessToken: string | null } = { accessToken: null };
    const useAuthStore: any = (selector?: (s: any) => any) => (selector ? selector(store) : store);
    useAuthStore.getState = () => store;
    return { __esModule: true, useAuthStore };
});

import authService from '../authService';
import { useAuthStore } from '@/stores/authStore';

describe('authService.recordProfileView — session guard', () => {
    beforeEach(() => {
        mockPost.mockClear();
        (useAuthStore as any).getState().accessToken = null;
    });

    it('does not issue the network POST when there is no access token', async () => {
        await authService.recordProfileView('u2');

        expect(mockPost).not.toHaveBeenCalled();
    });

    it('POSTs /users/:id/view when an access token is present', async () => {
        (useAuthStore as any).getState().accessToken = 'tok_123';

        await authService.recordProfileView('u2');

        expect(mockPost).toHaveBeenCalledWith('/users/u2/view');
    });
});
