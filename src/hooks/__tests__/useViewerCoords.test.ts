// src/hooks/__tests__/useViewerCoords.test.ts
//
// Plan 5 — viewer GPS coords hook for gig detail distance line.
// Mocks expo-location to drive each permission state. Cache TTL is
// reset between tests so one test's coords don't leak into the next.

import { renderHook, act, waitFor } from '@testing-library/react-native';
import {
    useViewerCoords,
    __resetViewerCoordsCacheForTests,
} from '../useViewerCoords';

jest.mock('expo-location', () => ({
    Accuracy: { Balanced: 3, High: 4, Low: 1 },
    getForegroundPermissionsAsync: jest.fn(),
    requestForegroundPermissionsAsync: jest.fn(),
    getCurrentPositionAsync: jest.fn(),
}));

// Pull the mocked module so we can configure each fn per-test.
const Location = require('expo-location');
const mockGetForegroundPermissionsAsync = Location.getForegroundPermissionsAsync;
const mockRequestForegroundPermissionsAsync = Location.requestForegroundPermissionsAsync;
const mockGetCurrentPositionAsync = Location.getCurrentPositionAsync;

const PUNE_FIX = {
    coords: { latitude: 18.5204, longitude: 73.8567 },
};

beforeEach(() => {
    __resetViewerCoordsCacheForTests();
    mockGetForegroundPermissionsAsync.mockReset();
    mockRequestForegroundPermissionsAsync.mockReset();
    mockGetCurrentPositionAsync.mockReset();
});

describe('useViewerCoords — silent mount path', () => {
    it('returns coords when permission already granted', async () => {
        mockGetForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
        mockGetCurrentPositionAsync.mockResolvedValue(PUNE_FIX);

        const { result } = renderHook(() => useViewerCoords());

        await waitFor(() =>
            expect(result.current.status).toBe('granted')
        );
        expect(result.current.coords).toEqual({ lat: 18.5204, lng: 73.8567 });
        expect(mockRequestForegroundPermissionsAsync).not.toHaveBeenCalled();
    });

    it('does NOT auto-prompt when permission is undetermined (default)', async () => {
        mockGetForegroundPermissionsAsync.mockResolvedValue({
            status: 'undetermined',
        });

        const { result } = renderHook(() => useViewerCoords());

        await waitFor(() =>
            expect(result.current.status).toBe('undetermined')
        );
        expect(result.current.coords).toBeNull();
        expect(mockRequestForegroundPermissionsAsync).not.toHaveBeenCalled();
        expect(mockGetCurrentPositionAsync).not.toHaveBeenCalled();
    });

    it('publishes denied status when permission was previously denied', async () => {
        mockGetForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });

        const { result } = renderHook(() => useViewerCoords());

        await waitFor(() => expect(result.current.status).toBe('denied'));
        expect(result.current.coords).toBeNull();
        expect(mockGetCurrentPositionAsync).not.toHaveBeenCalled();
    });

    it('AUTO-prompts when undetermined + autoRequest=true', async () => {
        mockGetForegroundPermissionsAsync.mockResolvedValue({
            status: 'undetermined',
        });
        mockRequestForegroundPermissionsAsync.mockResolvedValue({
            status: 'granted',
        });
        mockGetCurrentPositionAsync.mockResolvedValue(PUNE_FIX);

        const { result } = renderHook(() =>
            useViewerCoords({ autoRequest: true })
        );

        await waitFor(() => expect(result.current.status).toBe('granted'));
        expect(result.current.coords).toEqual({ lat: 18.5204, lng: 73.8567 });
        expect(mockRequestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
    });

    it('falls back to error status when GPS lookup throws', async () => {
        mockGetForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
        mockGetCurrentPositionAsync.mockRejectedValue(
            new Error('Location services disabled')
        );

        const { result } = renderHook(() => useViewerCoords());

        await waitFor(() =>
            expect(result.current.status).toBe('unavailable')
        );
        expect(result.current.coords).toBeNull();
    });
});

describe('useViewerCoords — explicit request()', () => {
    it('asks for permission and resolves coords on grant', async () => {
        mockGetForegroundPermissionsAsync
            .mockResolvedValueOnce({ status: 'undetermined' }) // mount probe
            .mockResolvedValueOnce({ status: 'undetermined' }); // request() probe
        mockRequestForegroundPermissionsAsync.mockResolvedValue({
            status: 'granted',
        });
        mockGetCurrentPositionAsync.mockResolvedValue(PUNE_FIX);

        const { result } = renderHook(() => useViewerCoords());

        await waitFor(() =>
            expect(result.current.status).toBe('undetermined')
        );

        let returned = undefined;
        await act(async () => {
            returned = await result.current.request();
        });

        expect(returned).toEqual({ lat: 18.5204, lng: 73.8567 });
        expect(result.current.status).toBe('granted');
        expect(mockRequestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
    });

    it('returns null when user denies the prompt', async () => {
        mockGetForegroundPermissionsAsync
            .mockResolvedValueOnce({ status: 'undetermined' })
            .mockResolvedValueOnce({ status: 'undetermined' });
        mockRequestForegroundPermissionsAsync.mockResolvedValue({
            status: 'denied',
        });

        const { result } = renderHook(() => useViewerCoords());
        await waitFor(() =>
            expect(result.current.status).toBe('undetermined')
        );

        let returned = 'not-yet';
        await act(async () => {
            returned = await result.current.request();
        });

        expect(returned).toBeNull();
        expect(result.current.status).toBe('denied');
        expect(mockGetCurrentPositionAsync).not.toHaveBeenCalled();
    });
});

describe('useViewerCoords — module cache (5-minute TTL)', () => {
    it('reuses cached coords across renders without re-hitting GPS', async () => {
        mockGetForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
        mockGetCurrentPositionAsync.mockResolvedValue(PUNE_FIX);

        // 1st mount populates cache
        const first = renderHook(() => useViewerCoords());
        await waitFor(() => expect(first.result.current.status).toBe('granted'));
        expect(mockGetCurrentPositionAsync).toHaveBeenCalledTimes(1);

        // 2nd mount should serve from cache — no extra GPS call
        const second = renderHook(() => useViewerCoords());
        await waitFor(() =>
            expect(second.result.current.coords).toEqual({
                lat: 18.5204,
                lng: 73.8567,
            })
        );
        expect(mockGetCurrentPositionAsync).toHaveBeenCalledTimes(1);
    });
});
