import { useEffect, useRef } from 'react';
import { BackHandler, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

/**
 * Bulletproof back-navigation guard for multi-step wizards.
 *
 * Handles every back source on every platform:
 *   Android  → hardware back button        (BackHandler via useFocusEffect)
 *   iOS      → swipe-back / router.back()  (navigation.beforeRemove + e.preventDefault)
 *   Web      → browser back button         (popstate)
 *
 * @param onBack  Must return:
 *   true  → handled internally (go to prev step OR show leave modal). Block navigation.
 *   false → allow navigation to proceed (only set after user confirms discard).
 */
export function useStepBackGuard(onBack: () => boolean) {
    const navigation = useNavigation();

    // Ref keeps the latest callback without re-registering any listeners.
    const onBackRef = useRef(onBack);
    useEffect(() => {
        onBackRef.current = onBack;
    }); // no deps — runs after every render of the consumer component

    // ─── Android: hardware back button ───────────────────────────────────────
    // useFocusEffect ensures we only handle back when THIS screen is focused,
    // so nested navigators don't interfere.
    useFocusEffect(
        useCallback(() => {
            if (Platform.OS === 'web') return;

            const sub = BackHandler.addEventListener('hardwareBackPress', () => {
                return onBackRef.current();
            });
            return () => sub.remove();
        }, []) // stable — reads via ref
    );

    // ─── iOS: swipe-back gesture + programmatic router.back() ────────────────
    useEffect(() => {
        if (Platform.OS === 'web') return;

        const unsub = navigation.addListener('beforeRemove', (e: any) => {
            const handled = onBackRef.current();
            if (handled) {
                e.preventDefault();
            }
        });
        return unsub;
    }, [navigation]);

    // ─── Web: browser back button ─────────────────────────────────────────────
    // We push a "sentinel" history entry on mount. When the browser back button
    // is pressed, popstate fires BEFORE Expo Router processes the navigation.
    // We call our handler, and if it returns true (handled), we re-push the sentinel
    // so the next back press is also caught. If false, the Discard flow already
    // called router.replace() and the screen is exiting cleanly.
    useEffect(() => {
        if (Platform.OS !== 'web') return;

        // Delay one tick — Expo Router does its own history.pushState on mount,
        // and we need to go AFTER it so our sentinel is the topmost entry.
        const mountTimer = setTimeout(() => {
            window.history.pushState({ __wizardGuard: true }, '');
        }, 0);

        const handlePopState = () => {
            const handled = onBackRef.current();
            if (handled) {
                window.history.pushState({ __wizardGuard: true }, '');
            }
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            clearTimeout(mountTimer);
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);
}