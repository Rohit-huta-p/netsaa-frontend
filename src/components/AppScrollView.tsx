// src/components/AppScrollView.tsx
import Footer from "@/components/Footer";
import { useMobileTabBarHeight } from "@/components/MobileTabBar";
import React from "react";
import {
    ScrollView,
    ScrollViewProps,
    ViewStyle,
    StyleProp,
} from "react-native";
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
        <ScrollView

            // sensible defaults: let taps pass through to inputs/buttons
            keyboardShouldPersistTaps="handled"
            // preserve any props passed by caller
            {...props}
            // override/merge contentContainerStyle so footer sits after content
            contentContainerStyle={mergedContentContainerStyle}
        >
            {props.children}
            {/* Footer is appended inside the ScrollView so it scrolls with the page */}
            <Footer />
        </ScrollView>
    );
}

