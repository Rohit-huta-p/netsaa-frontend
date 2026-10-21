// src/components/AppFlatList.tsx
import { useMobileTabBarHeight } from "@/components/MobileTabBar";
import { useBottomNavScroll, NAV_SCROLL_EVENT_THROTTLE } from "@/components/nav/navVisibility";
import React from "react";
import {
    FlatList,
    FlatListProps,
    ViewStyle,
    StyleProp,
} from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Reanimated's Animated.FlatList carries a stricter prop type that rejects a
// spread of the full FlatListProps<T> (e.g. CellRendererComponent's null). At
// runtime this IS Animated.FlatList (the cast is type-only), so the worklet
// scroll handler still runs on the UI thread; we just type it as the plain RN
// FlatList so our generic props spread cleanly.
const AnimatedFlatList = Animated.FlatList as unknown as typeof FlatList;

/**
 * AppFlatList
 * - Wraps a FlatList with automatic bottom padding for mobile tab bar
 * - Uses useMobileTabBarHeight() for consistent spacing
 * - On mobile: adds tab bar height to paddingBottom
 * - On desktop: uses safe area insets only
 *
 * Usage:
 *  import AppFlatList from "@/components/AppFlatList";
 *  ...
 *  <AppFlatList
 *    data={items}
 *    renderItem={renderItem}
 *    keyExtractor={(item) => item.id}
 *  />
 */
export default function AppFlatList<T>(props: FlatListProps<T>) {
    const insets = useSafeAreaInsets();
    const tabBarHeight = useMobileTabBarHeight();
    const onNavScroll = useBottomNavScroll();

    // On mobile: use tab bar height (which includes safe area)
    // On desktop: use safe area insets only
    const bottomPadding = tabBarHeight > 0 ? tabBarHeight : insets.bottom + 8;

    // merge caller contentContainerStyle with our defaults
    const userCCS = props.contentContainerStyle as StyleProp<ViewStyle> | undefined;
    const mergedContentContainerStyle: StyleProp<ViewStyle> = [
        { paddingBottom: bottomPadding },
        userCCS,
    ];

    return (
        <AnimatedFlatList
            scrollEventThrottle={NAV_SCROLL_EVENT_THROTTLE}
            // preserve any props passed by caller
            {...props}
            // nav auto-hide handler is authoritative (see AppScrollView note).
            // Cast: onScroll is typed for plain FlatList here, but the runtime
            // component is Animated.FlatList which accepts the worklet handler.
            onScroll={onNavScroll as any}
            // override/merge contentContainerStyle
            contentContainerStyle={mergedContentContainerStyle}
        />
    );
}
