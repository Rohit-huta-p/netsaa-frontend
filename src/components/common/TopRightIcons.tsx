import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NetworkIcon } from '@/components/network/NetworkIcon';
import { NotificationsBell } from '@/components/notifications/NotificationsBell';

/**
 * Floating top-right icon cluster for main screens.
 *
 * Renders: [NetworkIcon (Users + pending invites)]  [NotificationsBell (Bell + unread)]
 *
 * Absolutely positioned via a pointerEvents="box-none" SafeAreaView, so it
 * overlays an existing screen layout without needing you to restructure the
 * screen's own header. Drop-in on dashboard, gigs, events, search, saved,
 * profile — any main screen that needs the global entry points.
 *
 * Do NOT render this on /network (NetworkIcon would be redundant there) or
 * /notifications (NotificationsBell would be redundant).
 *
 * Props:
 *   hideNetwork        — set true on /network
 *   hideNotifications  — set true on /notifications
 *   topOffset          — extra top padding past the safe-area (default 12)
 *   horizontalPadding  — side padding (defaults to responsive: 20/40)
 */
type Props = {
    hideNetwork?: boolean;
    hideNotifications?: boolean;
    topOffset?: number;
    horizontalPadding?: number;
};

export const TopRightIcons: React.FC<Props> = ({
    hideNetwork = false,
    hideNotifications = false,
    topOffset = 12,
    horizontalPadding,
}) => {
    const { width } = useWindowDimensions();
    const hPad = horizontalPadding ?? (width < 768 ? 20 : 40);

    if (hideNetwork && hideNotifications) return null;

    return (
        <SafeAreaView
            edges={['top']}
            pointerEvents="box-none"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 50,
            }}
        >
            <View
                pointerEvents="box-none"
                style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: hPad,
                    paddingTop: topOffset,
                }}
            >
                {!hideNetwork && <NetworkIcon />}
                {!hideNotifications && <NotificationsBell />}
            </View>
        </SafeAreaView>
    );
};

export default TopRightIcons;
