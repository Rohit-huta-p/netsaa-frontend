// src/components/AppFlatList.tsx
import { useMobileTabBarHeight } from "@/components/MobileTabBar";
import React from "react";
import {
    FlatList,
    FlatListProps,
    ViewStyle,
    StyleProp,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
        <FlatList
            // preserve any props passed by caller
            {...props}
            // override/merge contentContainerStyle
            contentContainerStyle={mergedContentContainerStyle}
        />
    );
}
