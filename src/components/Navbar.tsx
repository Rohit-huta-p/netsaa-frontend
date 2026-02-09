import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Pressable, ScrollView, Keyboard, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Search, Bell, User, X, MapPin, Calendar, Users, Briefcase, Music, ChevronDown, Settings, LogOut, HelpCircle, Heart, UserCircle, LayoutDashboard } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useAuthStore from '@/stores/authStore';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useSearchPreview } from '@/hooks/useSearchQueries';

const isWeb = Platform.OS === 'web';

// Type for search result items
interface SearchResultItem {
    id: string;
    type: 'gig' | 'event' | 'artist' | 'organizer';
    title: string;
    displayName?: string;
    subtitle?: string;
}

// Type for search preview response
interface SearchPreviewResponse {
    gigs?: Array<{ id: string; title: string; location?: string }>;
    events?: Array<{ id: string; title: string; date?: string }>;
    people?: Array<{ id: string; name: string; role?: string }>;
}

export default function Navbar() {
    const router = useRouter();
    const { accessToken, isHydrated, user } = useAuthStore();


    const isAuthenticated = !!accessToken;
    const insets = useSafeAreaInsets();

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const searchInputRef = useRef<TextInput>(null);

    // Profile dropdown state
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

    // Debounce search query (300ms delay)
    const debouncedQuery = useDebouncedValue(searchQuery.trim(), 300);

    // Fetch preview results when debounced query changes
    const { data: searchResults, isLoading: isSearching, isError } = useSearchPreview(debouncedQuery);

    // Handle navigation for protected routes
    const handleProtectedNavigation = (route: string) => {
        if (isAuthenticated) {
            router.push(route as any);
        } else {
            // Redirect to login if not authenticated
            router.push('/(auth)/login');
        }
    };

    // Handle logo press - go to landing if not authenticated, or dashboard if authenticated
    const handleLogoPress = () => {
        if (isAuthenticated) {
            router.push('/(app)/gigs');
        } else {
            router.push('/');
        }
    };

    // Clear search and close dropdown
    const clearSearch = () => {
        setSearchQuery('');
        setIsSearchFocused(false);
        Keyboard.dismiss();
    };

    // Handle logout
    const handleLogout = () => {
        useAuthStore.getState().clearAuth();
        setIsProfileDropdownOpen(false);
        router.push('/');
    };

    // Handle result click - navigate to appropriate detail page
    const handleResultClick = (type: string, id: string) => {
        clearSearch();
        switch (type) {
            case 'gig':
                router.push(`/(app)/gigs/${id}` as any);
                break;
            case 'event':
                router.push(`/(app)/events/${id}` as any);
                break;
            case 'artist':
            case 'organizer':
                router.push(`/(app)/profile/${id}` as any);
                break;
            default:
                break;
        }
    };

    // Handle "View All" click - navigate to full search results page
    const handleViewAllResults = () => {
        if (debouncedQuery.length >= 2) {
            clearSearch();
            router.push(`/(app)/search?q=${encodeURIComponent(debouncedQuery)}` as any);
        }
    };

    // Normalize search results into a flat list
    const normalizeResults = (data: SearchPreviewResponse | undefined): SearchResultItem[] => {
        if (!data) return [];
        const results: SearchResultItem[] = [];

        // Add gigs
        if (data.gigs) {
            data.gigs.slice(0, 3).forEach((gig) => {
                results.push({
                    id: gig.id,
                    type: 'gig',
                    title: gig.title,
                    subtitle: gig.location,
                });
            });
        }

        // Add events
        if (data.events) {
            data.events.slice(0, 3).forEach((event) => {
                results.push({
                    id: event.id,
                    type: 'event',
                    title: event.title,
                    subtitle: event.date,
                });
            });
        }

        // Add people
        if (data.people) {
            data.people.slice(0, 3).forEach((person) => {
                results.push({
                    id: person.id,
                    type: person.role === 'organizer' ? 'organizer' : 'artist',
                    title: person.name,
                    subtitle: person.role,
                });
            });
        }

        return results;
    };

    const results = normalizeResults(searchResults);
    const showDropdown = isSearchFocused && debouncedQuery.length >= 2;

    // Get icon for result type
    const getResultIcon = (type: string) => {
        switch (type) {
            case 'gig':
                return <Briefcase size={16} color="#ff006e" />;
            case 'event':
                return <Calendar size={16} color="#8338ec" />;
            case 'artist':
                return <Music size={16} color="#3b82f6" />;
            case 'organizer':
                return <Users size={16} color="#10b981" />;
            default:
                return <Search size={16} color="#888" />;
        }
    };

    return (
        <View
            className="bg-[#0a0a0f] border-b border-white/10 px-6 py-4"
            style={{ paddingTop: insets.top + 16, zIndex: 100 }}
        >
            <View className="flex-row items-center justify-between">
                {/* Logo */}
                <TouchableOpacity onPress={handleLogoPress} className="flex-row items-center">
                    <View className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full items-center justify-center mr-3">
                        <Text className="text-white text-xl font-outfit-black">N</Text>
                    </View>
                    <Text className="text-white text-2xl font-outfit-black">Netsa</Text>
                </TouchableOpacity>

                {/* Navigation Links - Gigs & Events for everyone, Connections & Saved require auth */}
                <View className="hidden md:flex flex-row items-center gap-8">
                    {
                        user?.role === 'organizer' && (
                            <TouchableOpacity onPress={() => router.push('/(app)/dashboard')}>
                                <Text className="text-gray-400 hover:text-white font-outfit-medium">Dashboard</Text>
                            </TouchableOpacity>
                        )
                    }
                    <TouchableOpacity onPress={() => router.push('/(app)/gigs')}>
                        <Text className="text-gray-400 hover:text-white font-outfit-medium">Gigs</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push('/(app)/events')}>
                        <Text className="text-gray-400 hover:text-white font-outfit-medium">Events</Text>
                    </TouchableOpacity>
                    {isAuthenticated && (
                        <>
                            <TouchableOpacity onPress={() => router.push('/(app)/saved')}>
                                <Text className="text-gray-400 hover:text-white font-outfit-medium">Saved</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* Search Bar - Only show when authenticated */}
                {isAuthenticated && (
                    <View className="flex-1 max-w-md mx-8 hidden md:block" style={{ position: 'relative', zIndex: 50 }}>
                        <View className="bg-[#1a1a24] rounded-full px-5 py-3 flex-row items-center border border-white/10">
                            {isSearching ? (
                                <ActivityIndicator size="small" color="#ff006e" />
                            ) : (
                                <Search size={18} color="#888" />
                            )}
                            <TextInput
                                ref={searchInputRef}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => {
                                    // Delay closing dropdown to allow click events
                                    setTimeout(() => setIsSearchFocused(false), 200);
                                }}
                                placeholder="Search gigs, events, artists..."
                                placeholderTextColor="#666"
                                className="flex-1 text-white ml-3 font-outfit"
                                returnKeyType="search"
                                onSubmitEditing={handleViewAllResults}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                    <X size={18} color="#888" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Search Results Dropdown */}
                        {showDropdown && (
                            <View
                                className="absolute left-0 right-0 bg-[#1a1a24] rounded-2xl border border-white/10 overflow-hidden"
                                style={{
                                    top: 56,
                                    maxHeight: 400,
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 8 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 16,
                                    elevation: 10,
                                }}
                            >
                                {isSearching ? (
                                    <View className="p-6 items-center">
                                        <ActivityIndicator size="small" color="#ff006e" />
                                        <Text className="text-gray-400 text-sm mt-2 font-outfit">Searching...</Text>
                                    </View>
                                ) : isError ? (
                                    <View className="p-6 items-center">
                                        <Text className="text-red-400 text-sm font-outfit">Error loading results</Text>
                                    </View>
                                ) : results.length === 0 ? (
                                    <View className="p-6 items-center">
                                        <Text className="text-gray-400 text-sm font-outfit">No results found for "{debouncedQuery}"</Text>
                                    </View>
                                ) : (
                                    <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
                                        {results.map((item, index) => {
                                            console.log(item);
                                            return (
                                                <TouchableOpacity
                                                    key={`${item.type}-${item.id}`}
                                                    onPress={() => handleResultClick(item.type, item.id)}
                                                    className="flex-row items-center px-4 py-3 border-b border-white/5"
                                                    style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                                                >
                                                    <View className="w-8 h-8 rounded-full bg-white/5 items-center justify-center mr-3">
                                                        {getResultIcon(item.type)}
                                                    </View>
                                                    <View className="flex-1">
                                                        <Text className="text-white text-sm font-outfit-medium" numberOfLines={1}>
                                                            {item.title || item.displayName}
                                                        </Text>
                                                        {item.subtitle && (
                                                            <Text className="text-gray-500 text-xs font-outfit" numberOfLines={1}>
                                                                {item.subtitle}sss
                                                            </Text>
                                                        )}
                                                    </View>
                                                    <View className="px-2 py-1 rounded-full bg-white/5">
                                                        <Text className="text-gray-400 text-xs capitalize font-outfit">{item.type}</Text>
                                                    </View>
                                                </TouchableOpacity>
                                            )
                                        })}

                                        {/* View All Results */}
                                        <TouchableOpacity
                                            onPress={handleViewAllResults}
                                            className="px-4 py-4 items-center border-t border-white/10"
                                            style={{ backgroundColor: 'rgba(255,0,110,0.05)' }}
                                        >
                                            <Text className="text-[#ff006e] text-sm font-outfit-semibold">
                                                View all results for "{debouncedQuery}" →
                                            </Text>
                                        </TouchableOpacity>
                                    </ScrollView>
                                )}
                            </View>
                        )}
                    </View>
                )}

                {/* Right Actions - Different based on auth state */}
                <View className="flex-row items-center gap-4">
                    {isAuthenticated ? (
                        <>
                            {/* Notifications */}
                            <TouchableOpacity
                                className="relative"
                                onPress={() => router.push('/(app)/notifications')}
                            >
                                <Bell size={22} color="white" />
                                <View className="absolute -top-1 -right-1 w-2 h-2 bg-pink-500 rounded-full" />
                            </TouchableOpacity>

                            {/* Profile Dropdown */}
                            <View style={{ position: 'relative', zIndex: 60 }}>
                                <TouchableOpacity
                                    onPress={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                    className="flex-row items-center gap-2"
                                >
                                    <View className="w-8 h-8 bg-purple-600 rounded-full items-center justify-center">
                                        <User size={18} color="white" />
                                    </View>
                                    <ChevronDown
                                        size={16}
                                        color="white"
                                        style={{
                                            transform: [{ rotate: isProfileDropdownOpen ? '180deg' : '0deg' }]
                                        }}
                                    />
                                </TouchableOpacity>

                                {/* Dropdown Menu */}
                                {isProfileDropdownOpen && (
                                    <>
                                        {/* Backdrop to close dropdown */}
                                        <Pressable
                                            onPress={() => setIsProfileDropdownOpen(false)}
                                            style={{
                                                position: 'static',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                zIndex: 50,
                                            }}
                                        />

                                        {/* Dropdown Content */}
                                        <View
                                            className="absolute right-0 bg-[#1a1a24] rounded-2xl border border-white/10 overflow-hidden min-w-[240px]"
                                            style={{
                                                top: 48,
                                                zIndex: 70,
                                                shadowColor: '#000',
                                                shadowOffset: { width: 0, height: 8 },
                                                shadowOpacity: 0.3,
                                                shadowRadius: 16,
                                                elevation: 10,
                                            }}
                                        >
                                            {/* Profile Header */}
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setIsProfileDropdownOpen(false);
                                                    router.push('/(app)/profile');
                                                }}
                                                className="px-4 py-4 border-b border-white/10"
                                                style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
                                            >
                                                <View className="flex-row items-center gap-3">
                                                    <View className="w-10 h-10 bg-purple-600 rounded-full items-center justify-center">
                                                        <User size={20} color="white" />
                                                    </View>
                                                    <View className="flex-1">
                                                        <Text className="text-white font-outfit-semibold text-sm">
                                                            {useAuthStore.getState().user?.firstName || 'My Profile'}
                                                        </Text>
                                                        <Text className="text-gray-400 font-outfit text-xs">
                                                            View Profile
                                                        </Text>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>

                                            {/* Menu Items */}
                                            <ScrollView style={{ maxHeight: 400 }}>
                                                {/* Dashboard (Organizer Only) */}
                                                {(user?.role === 'organizer' || user?.roles?.includes('organizer')) && (
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            setIsProfileDropdownOpen(false);
                                                            router.push('/(app)/dashboard');
                                                        }}
                                                        className="px-4 py-3 border-b border-white/5 flex-row items-center gap-3"
                                                        style={{ backgroundColor: 'rgba(255, 107, 53, 0.08)' }}
                                                    >
                                                        <LayoutDashboard size={18} color="#FF6B35" />
                                                        <Text className="text-white font-outfit-medium text-sm flex-1">
                                                            Dashboard
                                                        </Text>
                                                    </TouchableOpacity>
                                                )}

                                                {/* My Gigs */}
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        setIsProfileDropdownOpen(false);
                                                        router.push('/(app)/gigs');
                                                    }}
                                                    className="px-4 py-3 border-b border-white/5 flex-row items-center gap-3"
                                                    style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                                                >
                                                    <Briefcase size={18} color="#ff006e" />
                                                    <Text className="text-white font-outfit-medium text-sm flex-1">
                                                        My Gigs
                                                    </Text>
                                                </TouchableOpacity>

                                                {/* My Applications */}
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        setIsProfileDropdownOpen(false);
                                                        router.push('/(app)/saved');
                                                    }}
                                                    className="px-4 py-3 border-b border-white/5 flex-row items-center gap-3"
                                                    style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                                                >
                                                    <Calendar size={18} color="#8338ec" />
                                                    <Text className="text-white font-outfit-medium text-sm flex-1">
                                                        My Applications
                                                    </Text>
                                                </TouchableOpacity>

                                                {/* Connections */}
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        setIsProfileDropdownOpen(false);
                                                        router.push('/(app)/connections');
                                                    }}
                                                    className="px-4 py-3 border-b border-white/5 flex-row items-center gap-3"
                                                    style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                                                >
                                                    <Users size={18} color="#10b981" />
                                                    <Text className="text-white font-outfit-medium text-sm flex-1">
                                                        Connections
                                                    </Text>
                                                </TouchableOpacity>

                                                {/* Saved */}
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        setIsProfileDropdownOpen(false);
                                                        router.push('/(app)/saved');
                                                    }}
                                                    className="px-4 py-3 border-b border-white/5 flex-row items-center gap-3"
                                                    style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                                                >
                                                    <Heart size={18} color="#f472b6" />
                                                    <Text className="text-white font-outfit-medium text-sm flex-1">
                                                        Saved
                                                    </Text>
                                                </TouchableOpacity>

                                                {/* Settings */}
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        setIsProfileDropdownOpen(false);
                                                        // You can add a settings route later
                                                        router.push('/(app)/profile');
                                                    }}
                                                    className="px-4 py-3 border-b border-white/5 flex-row items-center gap-3"
                                                    style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                                                >
                                                    <Settings size={18} color="#6b7280" />
                                                    <Text className="text-white font-outfit-medium text-sm flex-1">
                                                        Settings
                                                    </Text>
                                                </TouchableOpacity>

                                                {/* Help & Support */}
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        setIsProfileDropdownOpen(false);
                                                        // You can add a help route later
                                                        router.push('/(app)/profile');
                                                    }}
                                                    className="px-4 py-3 border-b border-white/5 flex-row items-center gap-3"
                                                    style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                                                >
                                                    <HelpCircle size={18} color="#3b82f6" />
                                                    <Text className="text-white font-outfit-medium text-sm flex-1">
                                                        Help & Support
                                                    </Text>
                                                </TouchableOpacity>

                                                {/* Logout */}
                                                <TouchableOpacity
                                                    onPress={handleLogout}
                                                    className="px-4 py-4 flex-row items-center gap-3"
                                                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                                                >
                                                    <LogOut size={18} color="#ef4444" />
                                                    <Text className="text-red-400 font-outfit-semibold text-sm flex-1">
                                                        Logout
                                                    </Text>
                                                </TouchableOpacity>
                                            </ScrollView>
                                        </View>
                                    </>
                                )}
                            </View>
                        </>
                    ) : (
                        <>
                            {/* Login/Signup for unauthenticated users */}
                            <Link href="/(auth)/login">
                                <Text className="text-white font-outfit-semibold">Log In</Text>
                            </Link>

                            <Link href="/(auth)/register">
                                <View className="bg-purple-600 px-4 py-2 rounded-full">
                                    <Text className="text-white font-outfit-semibold">Sign Up</Text>
                                </View>
                            </Link>
                        </>
                    )}
                </View>
            </View>
        </View>
    );
}