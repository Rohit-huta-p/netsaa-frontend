// src/services/__tests__/authService.email.test.ts
//
// Coverage for authService.sendEmailCode / verifyEmailCode (email
// verification, see DOCS/08-planning/specs/2026-07-21-email-verification-design.md).
//
// authService.ts builds its axios client once at module-load time via
// `axios.create(...)` and never exports it, so there's no module-internal
// instance to spy on without changing production code. Instead: mock the
// `axios` module so `axios.create()` returns an inspectable stub, and mock
// `@/stores/authStore` (mirroring authService.recordProfileView.test.ts,
// which mirrors the store-built-inside-the-factory pattern used by
// ProfileScreen.reels.test.tsx) so authService's circular import back to
// the real authStore module never has to load.

const mockPost = jest.fn();
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

describe('authService — email verification', () => {
    beforeEach(() => {
        mockPost.mockReset();
    });

    describe('sendEmailCode', () => {
        it('POSTs /auth/send-email-code with the email and returns the response body', async () => {
            const body = { meta: { status: 200, message: 'Code sent' }, data: {}, errors: [] };
            mockPost.mockResolvedValueOnce({ data: body });

            const result = await authService.sendEmailCode('priya.iyer@gmail.com');

            expect(mockPost).toHaveBeenCalledWith('/auth/send-email-code', { email: 'priya.iyer@gmail.com' });
            expect(result).toEqual(body);
        });
    });

    describe('verifyEmailCode', () => {
        it('returns the updated user from data', async () => {
            mockPost.mockResolvedValueOnce({
                data: {
                    meta: { status: 200, message: 'Verified' },
                    data: { _id: '1', emailVerifiedAt: 'now' },
                    errors: [],
                },
            });

            const user = await authService.verifyEmailCode('priya.iyer@gmail.com', '482917');

            expect(mockPost).toHaveBeenCalledWith('/auth/verify-email-code', {
                email: 'priya.iyer@gmail.com',
                code: '482917',
            });
            expect((user as any).emailVerifiedAt).toBeTruthy();
            expect((user as any)._id).toBe('1');
        });
    });
});
