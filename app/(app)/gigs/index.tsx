import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, useWindowDimensions, Platform, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Footer from '@/components/Footer';
import { GigCard } from '../../../src/components/gigs/GigCard';
import { GigDetails } from '../../../src/components/gigs/GigDetails';
import useAuthStore from '@/stores/authStore';
import AppScrollView from '@/components/AppScrollView';
import { useGigs, useGig } from '@/hooks/useGigs';
import { useUiStore } from '@/stores/uiStore';

// Mock Data


export default function GigsPage() {
    const { user } = useAuthStore();
    console.log("USER: ", user);
    const { width } = useWindowDimensions();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    // Global Client State
    const { selectedGigId, setSelectedGigId } = useUiStore();

    // Determine layout mode
    // MD breakpoint usually ~768px.
    const isDesktop = width >= 768;

    // Server State - List
    const { data: gigs, isLoading: isLoadingList, error: listError } = useGigs();

    // Server State - Details (Only fetch if ID is present)
    const { data: activeGig, isLoading: isLoadingDetails } = useGig(selectedGigId || '');

    const filteredGigs = gigs?.filter((gig: any) =>
        gig.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    useEffect(() => {
        // Auto-select first item on desktop if nothing selected
        if (isDesktop && !selectedGigId && gigs && gigs.length > 0) {
            setSelectedGigId(gigs[0]._id);
        }
    }, [isDesktop, gigs, selectedGigId]);

    const handleCardPress = (gigId: string) => {
        if (isDesktop) {
            setSelectedGigId(gigId);
        } else {
            router.push(`/gigs/${gigId}`);
        }
    };

    // Derived state for UI view - activeGig is now from useGig query, not derived from list


    return (
        <View className="flex-1 bg-black">
            <SafeAreaView className="flex-1" edges={['top']}>
                <AppScrollView >
                    {/* Row 1: Header / Search - Fixed at top */}
                    <View className="px-6 pb-4 bg-black z-10 border-b border-white/10 p-8">
                        <Text className="text-3xl font-bold text-white mb-6 text-center">Find Your Next Gig</Text>

                        <View className="flex-row items-center w-[90%] mx-auto space-x-3 mb-4">
                            <View className="flex-1 flex-row items-center bg-white/10 rounded-xl px-4 py-3 border border-white/5">
                                <Search size={20} color="#9CA3AF" />
                                <TextInput
                                    placeholder="Search gigs, roles, locations..."
                                    placeholderTextColor="#6B7280"
                                    className="flex-1 ml-3 text-white text-base"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                            </View>
                            <View className="bg-white/10 p-3 rounded-xl border border-white/5">
                                <Filter size={20} color="#A855F7" />
                            </View>
                        </View>
                    </View>

                    {/* Row 2: Content (List + Details) */}
                    <View className="flex-1 flex-row md:max-h-[100vh]">
                        {/* Left Column (Gig List) - Scrollable FlatList */}
                        <View className={`flex-1 bg-black p-4 ${isDesktop ? 'max-w-sm  border-r border-white/10' : ''}`}>
                            {isLoadingList ? (
                                <ActivityIndicator size="large" color="#A855F7" />
                            ) : listError ? (
                                <Text className="text-red-500 p-4">Failed to load gigs.</Text>
                            ) : (
                                <FlatList
                                    data={filteredGigs}
                                    keyExtractor={(item: any) => item._id}
                                    renderItem={({ item }) => (
                                        <GigCard
                                            gig={item}
                                            onPress={() => handleCardPress(item._id)}
                                            isSelected={selectedGigId === item._id}
                                        />
                                    )}
                                    contentContainerStyle={{ flexGrow: 1 }}
                                    ListHeaderComponent={
                                        <Text className="text-gray-400 font-medium mb-4 px-6 pt-4">
                                            {filteredGigs.length} Gigs Available
                                        </Text>
                                    }
                                />
                            )}
                        </View>

                        {/* Right Column (Details) - Only visible on Desktop */}
                        {isDesktop && (
                            <ScrollView className="flex-[1.5] bg-[#1A1A1A]">
                                <View className="flex-[1.5] bg-[#1A1A1A]">
                                    {isLoadingDetails ? (
                                        <View className="p-8 items-center">
                                            <ActivityIndicator color="#A855F7" />
                                        </View>
                                    ) : (
                                        <GigDetails gig={activeGig} />
                                    )}
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </AppScrollView>
            </SafeAreaView>
        </View>
    );
}
