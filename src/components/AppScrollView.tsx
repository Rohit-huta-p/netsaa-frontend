// src/components/AppScrollView.tsx
import Footer from "@/components/Footer";
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
 * - Merges contentContainerStyle while ensuring `flexGrow: 1` so short pages still push footer to bottom
 * - Respects safe area bottom inset for spacing
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

    // merge caller contentContainerStyle with our defaults
    const userCCS = props.contentContainerStyle as StyleProp<ViewStyle> | undefined;
    const mergedContentContainerStyle: StyleProp<ViewStyle> = [
        { flexGrow: 1, paddingBottom: insets.bottom + 8 },
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
