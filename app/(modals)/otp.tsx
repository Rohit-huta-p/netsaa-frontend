import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OTPScreen() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-white justify-center items-center p-6">
            <Text className="text-2xl font-bold mb-4">Verify OTP</Text>
            <Text className="text-gray-500 mb-8 text-center">
                Enter the code sent to your phone.
            </Text>

            <TouchableOpacity
                onPress={() => router.back()}
                className="bg-blue-600 py-3 px-8 rounded-full"
            >
                <Text className="text-white font-bold">Verify</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}
