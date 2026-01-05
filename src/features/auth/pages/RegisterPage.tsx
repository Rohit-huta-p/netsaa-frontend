import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { Palette, Users } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const RegisterPage = () => {
    return (
        <SafeAreaView className="flex-1 bg-red-200">
            {/* note: removed alignItems: 'center' so flex row can work on wider screens */}
            <ScrollView
                contentContainerStyle={{
                    padding: 16,
                    justifyContent: 'center',
                    minHeight: '100%',
                }}
            >
                {/* Header */}
                <View className="items-center mb-12">
                    <View className="w-16 h-16 mb-6 rounded-full bg-purple-600 items-center justify-center shadow-lg">
                        <Text className="text-white text-2xl font-bold">N</Text>
                    </View>
                    <Text className="text-4xl font-bold mb-3 text-center text-purple-600">
                        Welcome to Netsa
                    </Text>
                    <Text className="text-gray-500 text-lg text-center">
                        Choose how you'd like to join our community
                    </Text>
                </View>

                {/* Cards Container: column on small, row on md+ */}
                <View className="w-full flex flex-col md:flex-row md:flex-wrap items-center md:items-start justify-center gap-8">
                    {/* Artist Card */}
                    <View className="w-full md:w-1/2 lg:w-1/3 max-w-md bg-white rounded-3xl p-6 shadow-sm border border-gray-100 items-center">
                        <View className="w-20 h-20 rounded-full bg-[#F3E8FF] items-center justify-center mb-4">
                            <Palette size={40} color="#9333EA" />
                        </View>

                        <Text className="text-2xl font-bold text-[#9333EA] mb-2">Artist</Text>

                        <Text className="text-gray-500 mb-6 text-center leading-6">
                            Join as a performer, dancer, musician, or any creative professional looking for opportunities to showcase your talent.
                        </Text>

                        <View className="w-full mb-6">
                            {[
                                'Browse and apply to gigs',
                                'Showcase your portfolio',
                                'Connect with recruiters',
                                'Join workshops and events'
                            ].map((item, index) => (
                                <View key={index} className="flex-row items-center mb-2">
                                    <View className="w-2 h-2 rounded-full bg-[#9333EA] mr-3" />
                                    <Text className="text-gray-600">{item}</Text>
                                </View>
                            ))}
                        </View>

                        <Link href="/register/artist" asChild>
                            <TouchableOpacity className="w-full bg-purple-600 py-3 rounded-xl items-center shadow-md active:opacity-90">
                                <Text className="text-white font-bold text-lg">Register as Artist</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>

                    {/* Recruiter/Client Card */}
                    <View className="w-full md:w-1/2 lg:w-1/3 max-w-md bg-white rounded-3xl p-6 shadow-sm border border-gray-100 items-center">
                        <View className="w-20 h-20 rounded-full bg-[#FFEDD5] items-center justify-center mb-4">
                            <Users size={40} color="#E11D48" />
                        </View>

                        <Text className="text-2xl font-bold text-[#E11D48] mb-2">Recruiter/ Client</Text>

                        <Text className="text-gray-500 mb-6 text-center leading-6">
                            Join as a talent scout, event organizer, casting director, or agency looking to discover and hire creative talent.
                        </Text>

                        <View className="w-full mb-6">
                            {[
                                'Post job opportunities',
                                'Browse artist profiles',
                                'Host events and workshops',
                                'Build your talent network'
                            ].map((item, index) => (
                                <View key={index} className="flex-row items-center mb-2">
                                    <View className="w-2 h-2 rounded-full bg-[#E11D48] mr-3" />
                                    <Text className="text-gray-600">{item}</Text>
                                </View>
                            ))}
                        </View>

                        <Link href="/register/organizer" asChild>
                            <TouchableOpacity className="w-full bg-rose-600 py-3 rounded-xl items-center shadow-md active:opacity-90">
                                <Text className="text-white font-bold text-lg">Register as Recruiter</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>

                {/* Footer */}
                <View className="mt-12 flex-row justify-center">
                    <Text className="text-gray-500">Already have an account? </Text>
                    <Link href="/login" asChild>
                        <TouchableOpacity>
                            <Text className="text-[#9333EA] font-semibold">Sign in here</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};
