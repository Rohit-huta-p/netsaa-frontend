// src/hooks/useSecurity.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import securityService, { type Device } from '../services/securityService';

/* ── Query keys ── */
export const securityKeys = {
    all: ['security'] as const,
    sessions: () => [...securityKeys.all, 'sessions'] as const,
};

/**
 * Fetch active devices / sessions.
 */
export const useActiveSessions = () => {
    return useQuery({
        queryKey: securityKeys.sessions(),
        queryFn: securityService.getActiveSessions,
    });
};

/**
 * Change password mutation.
 * Re-auth is enforced server-side via currentPassword.
 */
export const useChangePassword = () => {
    return useMutation({
        mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
            securityService.changePassword(currentPassword, newPassword),

        onSuccess: () => {
            Alert.alert('Success', 'Your password has been changed.');
        },

        onError: (err: any) => {
            const message = err?.response?.data?.message || 'Could not change password. Please try again.';
            Alert.alert('Error', message);
        },
    });
};

/**
 * Logout a specific device.
 * Optimistically removes the device from the list.
 */
export const useLogoutDevice = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (deviceId: string) => securityService.logoutDevice(deviceId),

        onMutate: async (deviceId) => {
            await queryClient.cancelQueries({ queryKey: securityKeys.sessions() });
            const previous = queryClient.getQueryData<Device[]>(securityKeys.sessions());

            if (previous) {
                queryClient.setQueryData(
                    securityKeys.sessions(),
                    previous.filter((d) => d._id !== deviceId),
                );
            }
            return { previous };
        },

        onSuccess: (updatedDevices) => {
            queryClient.setQueryData(securityKeys.sessions(), updatedDevices);
        },

        onError: (_err, _deviceId, context) => {
            if (context?.previous) {
                queryClient.setQueryData(securityKeys.sessions(), context.previous);
            }
            Alert.alert('Error', 'Could not log out device. Please try again.');
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: securityKeys.sessions() });
        },
    });
};

/**
 * Logout all devices.
 */
export const useLogoutAllDevices = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => securityService.logoutAllDevices(),

        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: securityKeys.sessions() });
            const previous = queryClient.getQueryData<Device[]>(securityKeys.sessions());
            queryClient.setQueryData(securityKeys.sessions(), []);
            return { previous };
        },

        onSuccess: () => {
            queryClient.setQueryData(securityKeys.sessions(), []);
            Alert.alert('Success', 'All devices have been logged out.');
        },

        onError: (_err, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(securityKeys.sessions(), context.previous);
            }
            Alert.alert('Error', 'Could not log out all devices. Please try again.');
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: securityKeys.sessions() });
        },
    });
};
