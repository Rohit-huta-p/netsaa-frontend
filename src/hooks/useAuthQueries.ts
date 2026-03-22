import { useMutation, useQueryClient } from '@tanstack/react-query';
import authService from '../services/authService';
import { useAuthStore } from '../stores/authStore';
import { usePendingAuthActionStore } from '../stores/pendingAuthActionStore';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

export const useLogin = () => {
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAuth);

    return useMutation({
        mutationFn: authService.login,
        onSuccess: async (data) => {
            console.log("useLogin: onSuccess called", data);
            const token = data.accessToken || (data as any).token; // Handle both potential cases
            console.log("useLogin: token found:", token ? "YES" : "NO");

            if (token) {
                console.log("useLogin: Processing valid login");
                const user = data.user || await authService.getMe();
                console.log("useLogin: User loaded", user);

                setAuth({
                    user,
                    accessToken: token,
                });

                console.log("useLogin: Auth state set. Checking for pending action...");

                // Execute any pending action that triggered the login
                const { pendingAction } = usePendingAuthActionStore.getState();
                if (pendingAction) {
                    console.log("useLogin: Executing pending action");
                    await usePendingAuthActionStore.getState().executePendingAction();
                    // Don't navigate away - stay on current page after action
                    router.back();
                } else {
                    // No pending action, navigate normally
                    console.log("useLogin: No pending action, navigating...");
                    if (user?.roles?.includes('organizer')) {
                        console.log("useLogin: Redirecting to /dashboard");
                        router.replace('/(app)/dashboard');
                    } else {
                        console.log("useLogin: Redirecting to /gigs");
                        router.replace('/(app)/gigs');
                    }
                }
            } else {
                console.warn("useLogin: No accessToken or token in response");
            }
        },
        onError: (error: any) => {
            Alert.alert('Login Failed', error.response?.data?.message || 'Invalid credentials');
        },
    });
};

export const useSendOtp = () => {
    return useMutation({
        mutationFn: authService.sendOtp,
        onError: (error: any) => {
            Alert.alert('Failed to send OTP', error.response?.data?.message || 'Please check your phone number and try again.');
        },
    });
};

export const useCheckEmail = () => {
    return useMutation({
        mutationFn: authService.checkEmail,
    });
};

export const useCheckPhone = () => {
    return useMutation({
        mutationFn: authService.checkPhone,
    });
};

export const useVerifyOtp = () => {
    return useMutation({
        mutationFn: authService.verifyOtp,
        // Navigation and modal logic are handled by the component (login.tsx)
        // via inline onSuccess/onError callbacks in mutate().
    });
};

export const useRegister = () => {
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAuth);

    return useMutation({
        mutationFn: authService.register,
        onSuccess: async (data) => {
            if (data.token) {
                const user = data.user || await authService.getMe();
                setAuth({
                    user,
                    accessToken: data.token,
                });

                // Execute any pending action that triggered the registration
                const { pendingAction } = usePendingAuthActionStore.getState();
                if (pendingAction) {
                    console.log("useRegister: Executing pending action");
                    await usePendingAuthActionStore.getState().executePendingAction();
                    // Don't navigate away - stay on current page after action
                    router.back();
                } else {
                    // No pending action, navigate normally
                    if (user?.roles?.includes('organizer')) {
                        router.replace('/(app)/dashboard');
                    } else {
                        router.replace('/(app)/gigs');
                    }
                }
            } else {
                // Maybe email verification required?
                Alert.alert('Success', 'Please check your email to verify your account.');
            }
        },
        onError: (error: any) => {
            Alert.alert('Registration Failed', error.response?.data?.message || 'Something went wrong');
        },
    });
};

export const useLogout = () => {
    const router = useRouter();
    const clearAuth = useAuthStore((state) => state.clearAuth);
    const accessToken = useAuthStore((state) => state.accessToken);

    return useMutation({
        mutationFn: () => authService.logout({ token: accessToken }),
        onSettled: () => {
            clearAuth();
            router.replace('/');
        },
    });
};

export const useForgotPassword = () => {
    return useMutation({
        mutationFn: authService.forgotPassword,
    });
};

export const useResetPassword = () => {
    return useMutation({
        mutationFn: authService.resetPassword,
    });
};
