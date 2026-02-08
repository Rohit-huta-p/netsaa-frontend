import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Users } from 'lucide-react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
} from 'react-native-reanimated';

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
    }));

    const dotAnimatedStyle = useAnimatedStyle(() => ({
        opacity: withRepeat(
            withSequence(
                withTiming(0.3, { duration: 600 }),
                withTiming(1, { duration: 600 })
            ),
            -1,
            false
        ),
    }));

    const hasPending = pendingCount > 0;

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <Animated.View
                style={animatedStyle}
                className={`relative flex-row items-center gap-2 px-4 py-2 rounded-2xl border ${hasPending
                    ? 'bg-blue-500/10 border-blue-500/20'
                    : 'bg-zinc-800/50 border-white/10'
                    }`}
            >
                <Users size={18} color={hasPending ? '#3B82F6' : '#A1A1AA'} />
                <Text className={`font-black text-sm ${hasPending ? 'text-blue-400' : 'text-zinc-400'}`}>
                    {count}
                </Text>

                {/* Pending indicator badge */}
                {hasPending && (
                    <Animated.View
                        style={dotAnimatedStyle}
                        className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-amber-500 rounded-full border-2 border-black items-center justify-center"
                    >
                        <Text className="text-black text-[10px] font-black">{pendingCount}</Text>
                    </Animated.View>
                )}
            </Animated.View>
        </TouchableOpacity>
    );
};
