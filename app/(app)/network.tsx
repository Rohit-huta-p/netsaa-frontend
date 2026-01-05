import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppScrollView from '@/components/AppScrollView';

export default function NetworkPage() {
    return (
        <View className="flex-1 bg-black">
            <SafeAreaView className="flex-1" edges={['top']}>
                <AppScrollView>
                    <View className="px-6 py-8">
                        <Text className="text-3xl font-bold text-white mb-4">Network</Text>
                        <Text className="text-gray-400 text-lg">
                            Connect with other artists and organizers in the Netsa community.
                        </Text>
                        {/* Placeholder content */}
                        <View className="mt-8 bg-white/5 rounded-xl p-8 items-center border border-white/10">
                            <Text className="text-gray-500">Community features coming soon!</Text>
                        </View>
                    </View>
                </AppScrollView>
            </SafeAreaView>
        </View>
    );
}
