// src/services/notificationService.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { deepLinkService } from './deepLinkService';

/**
 * Notification Service
 * Manages push notification setup, permissions, and handling.
 * Integrates with deepLinkService for navigation from notifications.
 */
class NotificationService {
    private isInitialized = false;
    private notificationListener: Notifications.Subscription | null = null;
    private responseListener: Notifications.Subscription | null = null;

    /**
     * Initialize notification service
     * Sets up notification handlers and requests permissions
     */
    async initialize() {
        if (this.isInitialized) {
            console.log('[NotificationService] Already initialized');
            return;
        }

        console.log('[NotificationService] Initializing...');

        // Configure how notifications are displayed when app is in foreground
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
                shouldShowBanner: true,
                shouldShowList: true,
            }),
        });

        // Set up notification channels for Android
        if (Platform.OS === 'android') {
            await this.setupAndroidChannels();
        }

        // Request permissions
        await this.requestPermissions();

        // Set up listeners
        this.setupListeners();

        // Check for notification that launched the app (cold start)
        await this.checkInitialNotification();

        this.isInitialized = true;
        console.log('[NotificationService] Initialized successfully');
    }

    /**
     * Set up Android notification channels
     */
    private async setupAndroidChannels() {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#A855F7', // Purple
        });

        await Notifications.setNotificationChannelAsync('messages', {
            name: 'Messages',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#A855F7',
        });

        await Notifications.setNotificationChannelAsync('events', {
            name: 'Events',
            importance: Notifications.AndroidImportance.DEFAULT,
            vibrationPattern: [0, 250],
            lightColor: '#A855F7',
        });

        console.log('[NotificationService] Android channels configured');
    }

    /**
     * Request notification permissions
     */
    private async requestPermissions() {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.warn('[NotificationService] Notification permissions not granted');
            return;
        }

        console.log('[NotificationService] Notification permissions granted');

        // Get push token for sending to backend
        const token = await this.getPushToken();
        if (token) {
            console.log('[NotificationService] Push token:', token);
            // TODO: Send token to backend
            // await api.updatePushToken(token);
        }
    }

    /**
     * Get Expo push token
     */
    private async getPushToken(): Promise<string | null> {
        try {
            const token = (await Notifications.getExpoPushTokenAsync()).data;
            return token;
        } catch (error) {
            console.error('[NotificationService] Failed to get push token:', error);
            return null;
        }
    }

    /**
     * Set up notification listeners
     */
    private setupListeners() {
        // Listener for notifications received while app is in foreground
        this.notificationListener = Notifications.addNotificationReceivedListener(
            (notification: Notifications.Notification) => {
                console.log('[NotificationService] Notification received (foreground):', notification);
                this.handleNotificationReceived(notification);
            }
        );

        // Listener for when user taps on a notification
        this.responseListener = Notifications.addNotificationResponseReceivedListener(
            (response: Notifications.NotificationResponse) => {
                console.log('[NotificationService] Notification tapped:', response);
                this.handleNotificationResponse(response);
            }
        );

        console.log('[NotificationService] Listeners set up');
    }

    /**
     * Check if app was launched by tapping a notification (cold start)
     * Note: Not supported on web platform
     */
    private async checkInitialNotification() {
        // getLastNotificationResponse is not available on web
        if (Platform.OS === 'web') {
            console.log('[NotificationService] Skipping initial notification check on web');
            return;
        }

        const response = await Notifications.getLastNotificationResponse();

        if (response) {
            console.log('[NotificationService] App launched from notification:', response);
            this.handleNotificationResponse(response);
        }
    }

    /**
     * Handle notification received while app is in foreground
     */
    private handleNotificationReceived(notification: Notifications.Notification) {
        // You can show an in-app notification or update UI here
        const { title, body, data } = notification.request.content;

        console.log('[NotificationService] Foreground notification:', {
            title,
            body,
            data,
        });

        // TODO: Show in-app notification banner or update badge
    }

    /**
     * Handle notification tap (user interaction)
     */
    private handleNotificationResponse(response: Notifications.NotificationResponse) {
        const { data } = response.notification.request.content;

        console.log('[NotificationService] Notification data:', data);

        // Extract route from notification data
        const route = data?.route as string | undefined;

        if (route) {
            console.log('[NotificationService] Navigating to route:', route);
            deepLinkService.navigateToRoute(route);
        } else {
            console.log('[NotificationService] No route in notification data, navigating to notifications screen');
            deepLinkService.navigateToRoute('/notifications');
        }
    }

    /**
     * Clean up listeners
     */
    cleanup() {
        if (this.notificationListener) {
            this.notificationListener.remove();
            this.notificationListener = null;
        }

        if (this.responseListener) {
            this.responseListener.remove();
            this.responseListener = null;
        }

        this.isInitialized = false;
        console.log('[NotificationService] Cleaned up');
    }

    /**
     * Send a local notification (for testing)
     */
    async sendLocalNotification(title: string, body: string, data?: any) {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
                sound: true,
            },
            trigger: null, // Send immediately
        });
    }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
