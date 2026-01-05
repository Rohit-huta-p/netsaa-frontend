import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CheckCircle } from 'lucide-react-native';

interface SuccessStepProps {
    onClose: () => void;
}

export const SuccessStep: React.FC<SuccessStepProps> = ({ onClose }) => {
    return (
        <View className="flex-1 justify-center items-center py-10">
            <View className="mb-6">
                <CheckCircle size={80} color="#4ade80" />
            </View>
            <Text className="text-white text-2xl font-bold mb-2 text-center">You're going!</Text>
            <Text className="text-zinc-400 text-center mb-8 px-4">
                Registration successful. Your tickets have been sent to your email and are available in "My Events".
            </Text>

            <TouchableOpacity
                onPress={onClose}
                className="w-full py-4 rounded-xl items-center justify-center bg-zinc-800 border border-zinc-700"
            >
                <Text className="text-white font-bold text-lg">View Ticket</Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={onClose}
                className="mt-4"
            >
                <Text className="text-zinc-500">Close</Text>
            </TouchableOpacity>
        </View>
    );
};
