// Reusable Search Result Row Component
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Pressable, ScrollView, Keyboard, Platform, useWindowDimensions, Animated } from 'react-native';
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

const ICONS_WIDTH = 17; // Bell + Profile + spacing

const SearchResultRow = ({ item, onPress, isLast }: { item: SearchResultItem; onPress: () => void; isLast: boolean }) => {
    const getResultIcon = (type: string) => {
        switch (type) {
            case 'gig': return <Briefcase size={16} color="#ff006e" />;
            case 'event': return <Calendar size={16} color="#8338ec" />;
            case 'artist': return <Music size={16} color="#3b82f6" />;
            case 'organizer': return <Users size={16} color="#10b981" />;
            default: return <Search size={16} color="#888" />;
        }
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            className={`flex-row items-center p-3 ${!isLast ? 'border-b border-white/5' : ''}`}
        >
            <View className="mr-3 w-7 h-7 items-center justify-center rounded-md bg-purple-500/15">
                {getResultIcon(item.type)}
            </View>
            <View className="flex-1">
                <Text className="text-white text-[13px] font-semibold" numberOfLines={1}>
                    {item.title || item.displayName}
                </Text>
                {item.subtitle && (
                    <Text className="text-gray-500 text-xs mt-0.5" numberOfLines={1}>
                        {item.subtitle}
                    </Text>
                )}
            </View>
            <View className="bg-white/5 px-2 py-0.5 rounded text-[10px]">
                <Text className="text-gray-400 text-[10px] capitalize">{item.type}</Text>
            </View>
        </TouchableOpacity>
    );
};

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

    // Mobile search expansion state
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const [isMobileSearchExpanded, setIsMobileSearchExpanded] = useState(false);
    const mobileSearchAnimation = useRef(new Animated.Value(0)).current;
    const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
            router.push('/');
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

    // Mobile search animation functions
    const resetCollapseTimeout = useCallback(() => {
        if (collapseTimeoutRef.current) {
            clearTimeout(collapseTimeoutRef.current);
        }
        collapseTimeoutRef.current = setTimeout(() => {
            if (searchQuery.length === 0) {
                collapseMobileSearch();
            }
        }, 4000);
    }, [searchQuery]);

    const animateSearch = (toValue: number, callback?: () => void) => {
        Animated.spring(mobileSearchAnimation, {
            toValue,
            useNativeDriver: false,
            speed: 22,
            bounciness: 0,
        }).start(callback);
    };

    const expandMobileSearch = () => {
        setIsMobileSearchExpanded(true);
        animateSearch(1, () => {
            searchInputRef.current?.focus();
        });
        resetCollapseTimeout();
    };

    const collapseMobileSearch = () => {
        Keyboard.dismiss();
        setSearchQuery('');
        setIsSearchFocused(false);
        animateSearch(0, () => {
            setIsMobileSearchExpanded(false);
        });

        if (collapseTimeoutRef.current) {
            clearTimeout(collapseTimeoutRef.current);
        }
    };


    const handleMobileSearchChange = (text: string) => {
        setSearchQuery(text);
        resetCollapseTimeout();
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (collapseTimeoutRef.current) {
                clearTimeout(collapseTimeoutRef.current);
            }
        };
    }, []);

    // Interpolated animation values for mobile search
    const mobileSearchWidth = mobileSearchAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [40, width - ICONS_WIDTH - 360], // expands left
    });
    const mobileInputOpacity = mobileSearchAnimation.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0, 1],
    });

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
    const showDropdown =
        debouncedQuery.length >= 2 &&
        (isSearchFocused || isMobileSearchExpanded);

    // Shared Dropdown Content
    const renderDropdownContent = () => {
        if (isSearching) {
            return (
                <View className="p-4 items-center">
                    <ActivityIndicator size="small" color="#A855F7" />
                </View>
            );
        }
        if (results.length === 0) {
            return (
                <View className="p-4 items-center">
                    <Text className="text-gray-500 text-[13px]">No results found</Text>
                </View>
            );
        }
        return (
            <ScrollView keyboardShouldPersistTaps="handled" className="max-h-[320px]">
                {results.map((item, index) => (
                    <SearchResultRow
                        key={`${item.type}-${item.id}`}
                        item={item}
                        onPress={() => handleResultClick(item.type, item.id)}
                        isLast={index === results.length - 1}
                    />
                ))}
                <TouchableOpacity
                    onPress={handleViewAllResults}
                    className="p-3 items-center bg-purple-500/10"
                >
                    <Text className="text-purple-400 text-xs font-semibold">View all results →</Text>
                </TouchableOpacity>
            </ScrollView>
        );
    };

    return (
        <View
            className="bg-[#0a0a0f] border-b border-white/10 px-6 py-4"
            style={{ paddingTop: insets.top + 16, zIndex: 999, elevation: 20 }}
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
                                className="flex-1 text-white ml-3 font-outfit outline-none"
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
                        {showDropdown && !isMobile && (
                            <View className="absolute top-14 left-0 right-0 bg-[#1a1a24] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                                {renderDropdownContent()}
                            </View>
                        )}
                    </View>
                )}

                {/* Right Actions - Different based on auth state */}
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        position: 'relative',
                        height: 40,
                        gap: 10
                    }}
                >
                    {/* 🔍 SEARCH (absolute, grows LEFT) */}
                    {isAuthenticated && isMobile && (
                        <View className='relative'>
                            {/* Collapsed icon */}
                            {!isMobileSearchExpanded && (
                                <TouchableOpacity
                                    onPress={expandMobileSearch}
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 20,
                                        backgroundColor: '#1a1a24',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderWidth: 1,
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        marginRight: 8,
                                    }}
                                >
                                    <Search size={18} color="#A855F7" />
                                </TouchableOpacity>
                            )}

                            {/* Expanded search bar */}
                            {isMobileSearchExpanded && (
                                <Animated.View
                                    style={{
                                        // position: 'absolute',
                                        // top: '-50%',
                                        right: ICONS_WIDTH,
                                        height: 40,
                                        width: mobileSearchWidth,
                                        backgroundColor: '#1a1a24',
                                        borderRadius: 20,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        borderWidth: 1,
                                        borderColor: 'rgba(168, 85, 247, 0.4)',
                                        overflow: 'hidden',
                                        paddingLeft: 12,
                                    }}
                                >
                                    <TextInput
                                        ref={searchInputRef}
                                        value={searchQuery}
                                        onChangeText={(text) => {
                                            setSearchQuery(text);
                                            resetCollapseTimeout();
                                        }}
                                        placeholder="Search..."
                                        placeholderTextColor="#666"
                                        className='outline-none flex-1 text-white font-outfit-regular '
                                        autoFocus
                                        returnKeyType="search"
                                        onFocus={() => {
                                            setIsSearchFocused(true);
                                            resetCollapseTimeout();
                                        }}
                                        onBlur={() => {
                                            setTimeout(() => setIsSearchFocused(false), 300);
                                        }}
                                        onSubmitEditing={handleViewAllResults}
                                    />

                                    {/* Close */}
                                    <TouchableOpacity
                                        onPress={collapseMobileSearch}
                                        style={{
                                            width: 40,
                                            height: 40,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <X size={18} color="#A855F7" />
                                    </TouchableOpacity>
                                </Animated.View>
                            )}
                            {/* ✅ MOBILE SEARCH DROPDOWN */}
                            {isMobile &&
                                isMobileSearchExpanded &&
                                showDropdown && (
                                    <View
                                        style={{
                                            position: 'absolute',
                                            top: 48,
                                            right: ICONS_WIDTH,
                                            width: width - ICONS_WIDTH - 24,
                                            backgroundColor: '#1a1a24',
                                            borderRadius: 16,
                                            borderWidth: 1,
                                            borderColor: 'rgba(168,85,247,0.3)',
                                            maxHeight: 320,
                                            zIndex: 9999,
                                            elevation: 30,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {renderDropdownContent()}
                                    </View>
                                )}

                        </View>
                    )}



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
                                    className="flex-row items-center "
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
                    ) : !isMobileSearchExpanded ? (
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
                    ) : (
                        <></>
                    )}

                </View>

            </View>
        </View >
    );
}