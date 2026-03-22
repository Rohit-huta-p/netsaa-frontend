import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface SuccessStepProps {
    onClose: () => void;
    eventTitle?: string;
    eventDate?: string;
}

export const SuccessStep: React.FC<SuccessStepProps> = ({
    onClose,
    eventTitle,
    eventDate
}) => {
    const router = useRouter();
    const scaleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            damping: 12,
            stiffness: 150,
            useNativeDriver: true,
        }).start();
    }, []);

    const handleViewTicket = () => {
        onClose();
        router.push('/(app)/saved');
    };

    return (
        <View className="flex-1 justify-center items-center py-10">
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }} className="mb-6">
                <CheckCircle size={80} color="#4ade80" />
            </Animated.View>

            <Text className="text-white text-2xl font-bold mb-2 text-center">You're going!</Text>

            {eventTitle && (
                <Text className="text-zinc-300 text-base text-center font-semibold mb-1" numberOfLines={2}>
                    {eventTitle}
                </Text>
            )}

            {eventDate && (
                <Text className="text-zinc-500 text-sm text-center mb-2">
                    {new Date(eventDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
            )}

            <Text className="text-zinc-400 text-center mb-8 px-4">
                Tickets sent to your email and are available in "My Events".
            </Text>

            <View className="w-full gap-3">
                <TouchableOpacity
                    onPress={handleViewTicket}
                    className="w-full py-4 rounded-xl items-center justify-center bg-zinc-800 border border-zinc-700"
                >
                    <Text className="text-white font-bold text-lg">View Ticket</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={onClose}
                    className="w-full py-3 items-center justify-center"
                >
                    <Text className="text-zinc-500 font-medium">Close</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};
