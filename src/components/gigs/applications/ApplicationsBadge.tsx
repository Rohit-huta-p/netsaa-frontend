import React, { useEffect } from 'react';
import { Text, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { Users } from 'lucide-react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
} from 'react-native-reanimated';
import { usePlatform } from '@/utils/platform';

interface ApplicationsBadgeProps {
    count: number;           // Total applications count
    pendingCount?: number;   // Pending applications count
    onPress: () => void;
    hasNew?: boolean;
}

export const ApplicationsBadge: React.FC<ApplicationsBadgeProps> = ({
    count,
    pendingCount = 0,
    onPress,
    hasNew = false,
}) => {
    const scale = useSharedValue(1);
    const { isWeb } = usePlatform();
    const { width } = useWindowDimensions();
    const isMobileWidth = width < 768;
    useEffect(() => {
        if (pendingCount > 0) {
            // Pulse animation when there are pending applications
            scale.value = withRepeat(
                withSequence(
                    withTiming(1.05, { duration: 600, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
                ),
                -1, // infinite
                false
            );
        } else {
            scale.value = 1;
        }
    }, [pendingCount]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,

    }));

    const hasPending = pendingCount > 0;

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <Animated.View
                style={animatedStyle}
            >
                <Users size={isMobileWidth ? 16 : 22} color={hasPending ? '#3B82F6' : '#e0e0e0ff'} />
                <Text className={`font-black ${isMobileWidth ? 'text-sm' : 'text-lg'} ${hasPending ? 'text-blue-400' : 'text-white/70'}`}>
                    ({count})
                </Text>
            </Animated.View>
        </TouchableOpacity>
    );
};
