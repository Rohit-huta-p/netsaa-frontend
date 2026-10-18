// src/components/AppScrollView.tsx
import Footer from "@/components/Footer";
import { useMobileTabBarHeight } from "@/components/MobileTabBar";
import { useBottomNavScroll, NAV_SCROLL_EVENT_THROTTLE } from "@/components/nav/navVisibility";
import React from "react";
import {
    ScrollViewProps,
    ViewStyle,
    StyleProp,
} from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";


/**
 * AppScrollView
 * - Wraps a ScrollView and auto-appends Footer at the end of the scroll content
 * - Automatically adds bottom padding for the mobile tab bar overlay
 * - Respects safe area bottom inset for desktop/web
 *
 * Usage:
 *  import AppScrollView from "@/components/AppScrollView";
 *  ...
 *  <AppScrollView>
 *    ...page content...
 *  </AppScrollView>
 */
export default function AppScrollView(props: ScrollViewProps) {
    const insets = useSafeAreaInsets();
    const tabBarHeight = useMobileTabBarHeight();
    // Drives the global BottomNav auto-hide. Every AppScrollView is a vertical
    // page scroller, so it always reports direction.
    const onNavScroll = useBottomNavScroll();

    // On mobile: use tab bar height (which includes safe area)
    // On desktop: use safe area insets only
    const bottomPadding = tabBarHeight > 0 ? tabBarHeight : insets.bottom + 8;

    // merge caller contentContainerStyle with our defaults
    const userCCS = props.contentContainerStyle as StyleProp<ViewStyle> | undefined;
    const mergedContentContainerStyle: StyleProp<ViewStyle> = [
        { flexGrow: 1, paddingBottom: bottomPadding },
        userCCS,
    ];

    return (
        <Animated.ScrollView
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={NAV_SCROLL_EVENT_THROTTLE}
            {...props}
            // Our handler is authoritative for nav auto-hide. No current caller
            // passes onScroll; a future one that needs its own should use
            // useBottomNavScroll() alongside it on a raw Animated list instead.
            onScroll={onNavScroll}
            style={[{ flex: 1 }, props.style]}
            contentContainerStyle={mergedContentContainerStyle}
        >
            {props.children}
            {/* Footer is appended inside the ScrollView so it scrolls with the page */}
            <Footer />
        </Animated.ScrollView>
    );
}

