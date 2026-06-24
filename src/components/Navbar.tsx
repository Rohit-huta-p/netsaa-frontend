import * as React from 'react';
import logo from '@/assets/logo-black.jpeg';
import noAvatar from '@/assets/no-avatar.jpg';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, Dimensions, Platform,
    ScrollView, Pressable, TextInput, ActivityIndicator, Image,
    Animated, Keyboard, useWindowDimensions
} from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { useRouter } from 'expo-router';
import useAuthStore from '../stores/authStore';
import {
    Bell, User as UserIcon, ChevronDown, Settings, LogOut, HelpCircle,
    Briefcase, Calendar, Users, LayoutDashboard, Search, X, Music,
    Mail, ChevronRight, Repeat, MessageCircle
} from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useSearchPreview } from '@/hooks/useSearchQueries';
import conversationService from '@/services/conversationService';
import { inviteService } from '@/services/inviteService';
import authService from '@/services/authService';
import type { User } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

const C = {
    coral: '#E8613A',
    white: '#FFFFFF',
    textSecondary: '#9A9490',
    textPrimary: '#F5F0EB',
};

const F = {
    heading: 'Outfit-Bold',
    bodyMedium: 'SourceSans3-Medium',
    bodySemiBold: 'SourceSans3-SemiBold',
};

// ----- Types -----
interface SearchResultItem {
    id: string;
    type: 'gig' | 'event' | 'artist' | 'organizer';
    title: string;
    subtitle?: string;
    image?: string;
}

interface SearchPreviewResponse {
    gigs?: Array<{ id: string; title: string; location?: string }>;
    events?: Array<{ id: string; title: string; date?: string }>;
    people?: Array<{ id: string; title: string; role?: string, image: string }>;
}

// Width reserved for Bell + Profile avatar + gap on right side of mobile navbar
const ICONS_WIDTH = 90;

// ----- Shared result row component -----
function SearchResultRow({
    item,
    onPress,
    isLast,
}: {
    item: SearchResultItem;
    onPress: () => void;
    isLast: boolean;
}) {
    const [hover, setHover] = React.useState(false);
    const isPerson = item.type === 'artist' || item.type === 'organizer';

    const Thumb = () => {
        if (isPerson) {
            const src = item.image ? { uri: item.image } : noAvatar;
            return (
                <Image
                    source={src as any}
                    style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)' }}
                />
            );
        }
        if (item.image) {
            return (
                <Image
                    source={{ uri: item.image }}
                    style={{ width: 32, height: 32, borderRadius: 6 }}
                />
            );
        }
        const tileBg = item.type === 'gig' ? 'rgba(255, 107, 53, 0.08)' : 'rgba(212, 161, 85, 0.10)';
        const tileBorder = item.type === 'gig' ? 'rgba(255, 107, 53, 0.20)' : 'rgba(212, 161, 85, 0.25)';
        const Icon = item.type === 'gig' ? Briefcase : Calendar;
        const iconColor = item.type === 'gig' ? '#FF6B35' : '#D4A155';
        return (
            <View style={{
                width: 32, height: 32, borderRadius: 6,
                backgroundColor: tileBg,
                borderWidth: 1, borderColor: tileBorder,
                alignItems: 'center', justifyContent: 'center',
            }}>
                <Icon size={14} color={iconColor} strokeWidth={1.5} />
            </View>
        );
    };

    const webHover = Platform.OS === 'web'
        ? { onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false) }
        : {};

    return (
        <TouchableOpacity
            onPress={onPress}
            {...(webHover as any)}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderBottomWidth: isLast ? 0 : 1,
                borderBottomColor: 'rgba(212, 161, 85, 0.10)',
                backgroundColor: hover ? 'rgba(255, 200, 140, 0.03)' : 'transparent',
            }}
        >
            <View style={{ marginRight: 12 }}>
                <Thumb />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: '#F5F0EB', fontSize: 14, fontFamily: 'Outfit-SemiBold' }} numberOfLines={1}>
                    {item.title}
                </Text>
                {item.subtitle ? (
                    <Text style={{ color: '#A19BAA', fontSize: 11, marginTop: 1, letterSpacing: 0.2 }} numberOfLines={1}>
                        {item.subtitle}
                    </Text>
                ) : null}
            </View>
        </TouchableOpacity>
    );
}

// ----- Section label inside dropdown -----
function DropdownSectionLabel({ label, count }: { label: string; count: number }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 }}>
            <Text style={{ color: '#D4A155', fontSize: 9, fontFamily: 'SpaceMono', letterSpacing: 2.5 }}>
                {label.toUpperCase()}
            </Text>
            <Text style={{ color: '#4A4656', fontSize: 9, fontFamily: 'SpaceMono', letterSpacing: 1.5, marginLeft: 8 }}>
                {String(count).padStart(2, '0')}
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(212, 161, 85, 0.15)', marginLeft: 10 }} />
        </View>
    );
}

// ----- Top-nav profile avatar (real user pic, with fallback) -----
function NavAvatar({ user, size = 32 }: { user: User | null; size?: number }) {
    const uri = user?.profileImageUrl;
    return (
        <Image
            source={uri ? { uri } : noAvatar}
            style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#1a1a24' }}
        />
    );
}

// ----- Profile Dropdown Menu -----
function ProfileMenu({
    user,
    onClose,
    onLogout,
    router,
    isMobileView
}: {
    user: User | null;
    onClose: () => void;
    onLogout: () => void;
    router: any;
    isMobileView?: boolean;
}) {
    // Reflect the real 3-role model (client / creative_lead / artist), not the
    // legacy 2-mode (artist/hirer) toggle. Switching is done the canonical way
    // via the role screen (authService.switchRole).
    const currentRole = useAuthStore((s) => s.role);
    const ROLE_META: Record<string, { label: string; color: string }> = {
        client: { label: 'Client', color: '#FF6B35' },
        creative_lead: { label: 'Creative', color: '#FBBF24' },
        artist: { label: 'Artist', color: '#8B5CF6' },
    };
    const roleMeta = ROLE_META[currentRole] ?? ROLE_META.artist;
    const modeColor = roleMeta.color;
    const modeLabel = roleMeta.label;
    const isClientRole = currentRole === 'client';

    // For clients, surface the business type (organizerTypeCategory) beside the
    // mode pill. Server-authoritative — lives on the Organizer doc, so we fetch
    // it (cached) only when the viewer is actually a client.
    const { data: organizer } = useQuery({
        queryKey: ['organizer', 'me'],
        queryFn: () => authService.getOrganizer(),
        enabled: isClientRole,
        staleTime: 60_000,
        retry: false,
    });
    const BIZ_LABEL: Record<string, string> = {
        individual: 'Personal',
        corporate: 'Company',
        agency: 'Agency',
        institution: 'Venue',
    };
    const bizLabel = isClientRole ? BIZ_LABEL[organizer?.organizerTypeCategory ?? ''] : undefined;

    const displayName = user?.displayName || (user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'No Name');
    const email = user?.email || '';

    const MenuSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
        <View style={{ marginTop: 10 }}>
            <Text style={{
                color: '#4B5563',
                fontSize: 9,
                fontFamily: F.bodySemiBold,
                textTransform: 'uppercase',
                letterSpacing: 1,
                paddingHorizontal: 12,
                marginBottom: 4
            }}>{title}</Text>
            {children}
        </View>
    );

    const MenuItem = ({ icon: Icon, label, color, onPress, badge }: { icon: any, label: string, color: string, onPress: () => void, badge?: string }) => (
        <TouchableOpacity
            onPress={onPress}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 8,
                paddingHorizontal: 12,
                gap: 10,
            }}
        >
            <View style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                backgroundColor: `${color}15`,
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Icon size={16} color={color} />
            </View>
            <Text style={{
                color: '#F5F0EB',
                fontFamily: F.bodyMedium,
                fontSize: 13,
                flex: 1
            }}>{label}</Text>
            {badge && (
                <View style={{ backgroundColor: '#EC4899', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 8 }}>
                    <Text style={{ color: 'white', fontSize: 9, fontFamily: F.bodySemiBold }}>{badge}</Text>
                </View>
            )}
            <ChevronRight size={12} color="#4B5563" />
        </TouchableOpacity>
    );

    return (
        <View style={{
            minWidth: 240,
            backgroundColor: '#111118',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.4,
            shadowRadius: 15,
            elevation: 15,
        }}>
            {/* Header / Profile Card */}
            <TouchableOpacity
                onPress={() => { onClose(); router.push(isClientRole ? '/(app)/client-profile' : '/(app)/profile'); }}
                style={{
                    padding: 12,
                    backgroundColor: 'rgba(147, 51, 234, 0.05)',
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(255,255,255,0.05)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10
                }}
            >
                <View style={{ position: 'relative' }}>
                    <Image
                        source={user?.profileImageUrl ? { uri: user.profileImageUrl } : noAvatar}
                        style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#1a1a24' }}
                    />
                    <View style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: '#10B981',
                        borderWidth: 2,
                        borderColor: '#111118'
                    }} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ color: 'white', fontFamily: F.heading, fontSize: 13 }} numberOfLines={1}>{displayName}</Text>
                    <Text style={{ color: '#9CA3AF', fontFamily: F.bodyMedium, fontSize: 11 }} numberOfLines={1}>{email}</Text>
                    <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {/* Mode pill */}
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            backgroundColor: `${modeColor}1F`,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: `${modeColor}55`,
                        }}>
                            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: modeColor }} />
                            <Text style={{ color: modeColor, fontSize: 9, fontFamily: F.bodySemiBold, letterSpacing: 0.5 }}>
                                {modeLabel.toUpperCase()} MODE
                            </Text>
                        </View>

                        {/* Business-type pill — clients only */}
                        {bizLabel && (
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                                backgroundColor: 'rgba(212,161,85,0.12)',
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                borderRadius: 999,
                                borderWidth: 1,
                                borderColor: 'rgba(212,161,85,0.45)',
                            }}>
                                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#D4A155' }} />
                                <Text style={{ color: '#D4A155', fontSize: 9, fontFamily: F.bodySemiBold, letterSpacing: 0.5 }}>
                                    {bizLabel.toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>

            <ScrollView bounces={false} style={{ maxHeight: isMobileView ? 350 : 450 }}>
                <MenuSection title="Role">
                    <MenuItem
                        icon={Repeat}
                        label="Switch role"
                        color={modeColor}
                        onPress={() => {
                            onClose();
                            router.push('/(app)/settings/role');
                        }}
                    />
                </MenuSection>
                <MenuSection title="Workspace">
                    <MenuItem
                        icon={LayoutDashboard}
                        label="Dashboard"
                        color="#F97316"
                        onPress={() => { onClose(); router.push('/(app)/dashboard' as any); }}
                    />
                </MenuSection>
                <MenuSection title="Network">
                    <MenuItem
                        icon={Users}
                        label="Your Network"
                        color="#EC4899"
                        onPress={() => { onClose(); router.push('/(app)/network' as any); }}
                    />
                    <MenuItem
                        icon={Bell}
                        label="Notifications"
                        color="#F97316"
                        onPress={() => { onClose(); router.push('/(app)/notifications'); }}
                    />
                </MenuSection>
                <MenuSection title="Account">
                    <MenuItem
                        icon={Settings}
                        label="Settings"
                        color="#3B82F6"
                        onPress={() => { onClose(); router.push('/(app)/settings'); }}
                    />
                    <MenuItem
                        icon={HelpCircle}
                        label="Help & Support"
                        color="#9CA3AF"
                        onPress={() => { onClose(); router.push('/(app)/help'); }}
                    />
                </MenuSection>
            </ScrollView>
        </View>
    );
}

// ----- Messages / inbox button (badge = unread messages + pending sent invites) -----
function InboxButton({ count, onPress }: { count: number; onPress: () => void }) {
    return (
        <TouchableOpacity style={{ position: 'relative' }} onPress={onPress} accessibilityRole="button" accessibilityLabel="Messages">
            <MessageCircle size={22} color="white" />
            {count > 0 && (
                <View style={{
                    position: 'absolute', top: -5, right: -5, minWidth: 15, height: 15, borderRadius: 7.5,
                    backgroundColor: '#FF6B35', alignItems: 'center', justifyContent: 'center',
                    paddingHorizontal: 3, borderWidth: 1.5, borderColor: '#09090b',
                }}>
                    <Text style={{ color: '#fff', fontSize: 8.5, fontFamily: 'Outfit-SemiBold' }}>
                        {count > 9 ? '9+' : String(count)}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

// ----- Main Navbar -----
export default function Navbar() {
    const { isMobile } = useResponsive();
    const { width } = useWindowDimensions();
    const router = useRouter();
    const { accessToken, user } = useAuthStore();
    const role = useAuthStore((s) => s.role);
    const isAuthenticated = !!accessToken;

    // Inbox badge (unread messages + pending sent invites). Lives here so the
    // affordance is consistent on every screen. Invites are client-only, so that
    // query is gated by role; messages unread applies to everyone.
    const { data: unreadCount = 0 } = useQuery({
        queryKey: ['conversations', 'unread'],
        queryFn: async () => {
            const convos = await conversationService.getConversations();
            return convos.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
        },
        enabled: isAuthenticated,
        staleTime: 60_000,
        retry: false,
    });
    const { data: sentInvites = [] } = useQuery({
        queryKey: ['invites', 'sent'],
        queryFn: () => inviteService.sent(),
        enabled: isAuthenticated && role === 'client',
        staleTime: 60_000,
        retry: false,
    });
    const inboxCount =
        unreadCount + (sentInvites as any[]).filter((i) => i.status === 'sent' || i.status === 'viewed').length;

    // Profile dropdown
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

    // Search
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const searchInputRef = useRef<TextInput>(null);

    // Mobile search animation (for md+ screens)
    const [isMobileSearchExpanded, setIsMobileSearchExpanded] = useState(false);
    const mobileSearchAnim = useRef(new Animated.Value(0)).current;
    const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Full-screen overlay search (for small mobile screens)
    const [isFullSearchOpen, setIsFullSearchOpen] = useState(false);
    const fullSearchRef = useRef<TextInput>(null);

    const debouncedQuery = useDebouncedValue(searchQuery.trim(), 300);
    const { data: searchResults, isLoading: isSearching } = useSearchPreview(debouncedQuery);

    const normalizeResults = (data: SearchPreviewResponse | undefined): SearchResultItem[] => {
        console.log("search result in normalize: ", data)
        if (!data) return [];
        const out: SearchResultItem[] = [];
        data.gigs?.slice(0, 3).forEach(g => out.push({ id: g.id, type: 'gig', title: g.title, subtitle: g.location }));
        data.events?.slice(0, 3).forEach(e => out.push({ id: e.id, type: 'event', title: e.title, subtitle: e.date }));
        data.people?.slice(0, 3).forEach(p => out.push({ id: p.id, type: p.role === 'organizer' ? 'organizer' : 'artist', title: p.title, subtitle: p.role, image: p.image }));
        return out;
    };

    const results = normalizeResults(searchResults);
    const showDropdown = debouncedQuery.length >= 2 && (isSearchFocused || isMobileSearchExpanded || isFullSearchOpen);

    const clearSearch = () => {
        setSearchQuery('');
        setIsSearchFocused(false);
        Keyboard.dismiss();
    };

    const closeFullSearch = () => {
        setIsFullSearchOpen(false);
        setSearchQuery('');
        setIsSearchFocused(false);
        Keyboard.dismiss();
    };

    const openFullSearch = () => {
        setIsFullSearchOpen(true);
        // slight delay so the overlay is mounted before focus
        setTimeout(() => fullSearchRef.current?.focus(), 80);
    };

    const handleResultClick = (type: string, id: string) => {
        clearSearch();
        if (type === 'gig') router.push(`/(app)/gigs/${id}` as any);
        else if (type === 'event') router.push(`/(app)/events/${id}` as any);
        else router.push(`/(app)/profile/${id}` as any);
    };

    const handleViewAll = () => {
        if (debouncedQuery.length >= 2) {
            clearSearch();
            router.push(`/(app)/search?q=${encodeURIComponent(debouncedQuery)}` as any);
        }
    };

    // --- Mobile search animation helpers ---
    const resetCollapseTimer = useCallback(() => {
        if (collapseTimer.current) clearTimeout(collapseTimer.current);
        collapseTimer.current = setTimeout(() => {
            if (searchQuery.length === 0) collapseMobileSearch();
        }, 4000);
    }, [searchQuery]);

    const runAnim = (toValue: number, cb?: () => void) => {
        Animated.spring(mobileSearchAnim, { toValue, useNativeDriver: false, speed: 22, bounciness: 0 }).start(cb);
    };

    const expandMobileSearch = () => {
        setIsMobileSearchExpanded(true);
        runAnim(1, () => searchInputRef.current?.focus());
        resetCollapseTimer();
    };

    const collapseMobileSearch = () => {
        Keyboard.dismiss();
        setSearchQuery('');
        setIsSearchFocused(false);
        runAnim(0, () => setIsMobileSearchExpanded(false));
        if (collapseTimer.current) clearTimeout(collapseTimer.current);
    };

    useEffect(() => () => { if (collapseTimer.current) clearTimeout(collapseTimer.current); }, []);

    const mobileSearchWidth = mobileSearchAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [40, width - ICONS_WIDTH - 250],
    });

    // --- Shared dropdown content ---
    const renderDropdown = () => {
        // No loading state — keepPreviousData keeps prior results visible while refetching.
        if (results.length === 0) return (
            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <Text style={{ color: '#4A4656', fontFamily: 'DMSerifDisplay_400Regular', fontSize: 22, marginBottom: 6 }}>⋄</Text>
                <Text style={{ color: '#A19BAA', fontSize: 12 }}>
                    Nothing for{' '}
                    <Text style={{ color: '#D4D0CB', fontFamily: 'DMSerifDisplay_400Regular', ...(isWeb ? { fontStyle: 'italic' as any } : {}) }}>
                        "{debouncedQuery}"
                    </Text>
                </Text>
            </View>
        );

        // Group results by type for sectioned rendering
        const people = results.filter(r => r.type === 'artist' || r.type === 'organizer');
        const gigs   = results.filter(r => r.type === 'gig');
        const events = results.filter(r => r.type === 'event');

        const renderGroup = (label: string, items: SearchResultItem[]) => (
            items.length === 0 ? null : (
                <View key={label}>
                    <DropdownSectionLabel label={label} count={items.length} />
                    {items.map((item, i) => (
                        <SearchResultRow
                            key={`${item.type}-${item.id}`}
                            item={item}
                            onPress={() => handleResultClick(item.type, item.id)}
                            isLast={i === items.length - 1}
                        />
                    ))}
                </View>
            )
        );

        return (
            <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 380 }}>
                {renderGroup('People', people)}
                {renderGroup('Gigs', gigs)}
                {renderGroup('Events', events)}
                <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(212, 161, 85, 0.12)', marginTop: 4 }}>
                    <TouchableOpacity
                        onPress={handleViewAll}
                        style={{ paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                        <Text style={{ color: '#D4A155', fontSize: 12, fontFamily: 'Outfit-SemiBold' }}>View all results</Text>
                        <Text style={{ color: '#4A4656', fontSize: 9, fontFamily: 'SpaceMono', letterSpacing: 2 }}>{isWeb ? '↵ ENTER' : 'TAP'}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    };



    const handleLogout = () => {
        useAuthStore.getState().clearAuth();
        setIsProfileDropdownOpen(false);
        router.push('/');
    };

    return (
        <View style={{
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            paddingHorizontal: isWeb && !isMobile ? 48 : 12, paddingTop: isWeb ? 20 : 12, paddingBottom: 12,
            zIndex: 10,
        }}>
            {/* Logo */}
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} onPress={() => router.push('/')}>
                <Image source={logo} style={{ width: 44, height: 44, borderRadius: 4, backgroundColor: C.coral, alignItems: 'center', justifyContent: 'center' }} />
                <Text style={{ color: C.white, fontFamily: F.heading, fontSize: 16, letterSpacing: 1 }}>NETSA</Text>
            </TouchableOpacity>

            {/* Desktop nav links */}
            {!(isWeb && isMobile) && (
                <View style={{ flexDirection: 'row', gap: 0, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden' }}>
                    <TouchableOpacity style={{ paddingHorizontal: 16, paddingVertical: 8 }} onPress={() => router.push('/(app)/gigs')}>
                        <Text style={{ color: C.textSecondary, fontFamily: F.bodyMedium, fontSize: 13 }}>Opportunities</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ paddingHorizontal: 16, paddingVertical: 8 }} onPress={() => router.push('/(app)/events')}>
                        <Text style={{ color: C.textSecondary, fontFamily: F.bodyMedium, fontSize: 13 }}>Events</Text>
                    </TouchableOpacity>
                    {isAuthenticated && (
                        <TouchableOpacity style={{ paddingHorizontal: 16, paddingVertical: 8 }} onPress={() => router.push('/(app)/network' as any)}>
                            <Text style={{ color: C.textSecondary, fontFamily: F.bodyMedium, fontSize: 13 }}>Network</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* ===== DESKTOP (web, wide screen) ===== */}
            {isWeb && SCREEN_WIDTH > 768 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>

                    {/* Desktop Search Bar */}
                    {isAuthenticated && (
                        <View style={{ position: 'relative', zIndex: 50 }}>
                            <View style={{
                                flexDirection: 'row', alignItems: 'center',
                                backgroundColor: '#1a1a24', borderRadius: 20,
                                paddingHorizontal: 14, paddingVertical: 8,
                                borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
                                width: 260,
                            }}>
                                <Search size={16} color="#888" />
                                <TextInput
                                    ref={searchInputRef}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    onFocus={() => setIsSearchFocused(true)}
                                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                    placeholder="Search..."
                                    placeholderTextColor="#555"
                                    style={{ flex: 1, color: '#fff', marginLeft: 8, fontSize: 13, fontFamily: F.bodyMedium, outlineStyle: 'none' } as any}
                                    returnKeyType="search"
                                    onSubmitEditing={handleViewAll}
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity onPress={clearSearch}>
                                        <X size={16} color="#888" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Desktop results dropdown */}
                            {showDropdown && (
                                <View style={{
                                    position: 'absolute', top: 56, left: 0, right: 10,
                                    backgroundColor: '#13110f', borderRadius: 14,
                                    borderWidth: 1, borderColor: 'rgba(212, 161, 85, 0.20)',
                                    overflow: 'hidden', zIndex: 999,
                                    shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 24,
                                    elevation: 10,
                                }}>
                                    {renderDropdown()}
                                </View>
                            )}
                        </View>
                    )}

                    {/* Auth actions */}
                    {isAuthenticated ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                            {/* Messages / inbox */}
                            <InboxButton count={inboxCount} onPress={() => router.push('/(app)/inbox' as any)} />

                            {/* Notifications */}
                            <TouchableOpacity style={{ position: 'relative' }} onPress={() => router.push('/(app)/notifications')}>
                                <Bell size={22} color="white" />
                                <View style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, backgroundColor: '#EC4899', borderRadius: 4 }} />
                            </TouchableOpacity>

                            {/* Profile dropdown */}
                            <View style={{ position: 'relative', zIndex: 60 }}>
                                <TouchableOpacity onPress={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <NavAvatar user={user} size={32} />
                                    <ChevronDown size={16} color="white" style={{ transform: [{ rotate: isProfileDropdownOpen ? '180deg' : '0deg' }], marginLeft: 4 }} />
                                </TouchableOpacity>

                                {isProfileDropdownOpen && (
                                    <>
                                        <Pressable
                                            onPress={() => setIsProfileDropdownOpen(false)}
                                            style={{
                                                position: isWeb ? 'fixed' : 'absolute',
                                                top: isWeb ? 0 : -100,
                                                left: isWeb ? 0 : -SCREEN_WIDTH,
                                                width: Dimensions.get('window').width * 2,
                                                height: Dimensions.get('window').height * 2,
                                            } as any}
                                        />
                                        <View style={{
                                            position: 'absolute', right: 0, top: 48, zIndex: 70,
                                        }}>
                                            <ProfileMenu
                                                user={user}
                                                onClose={() => setIsProfileDropdownOpen(false)}
                                                onLogout={handleLogout}
                                                router={router}
                                            />
                                        </View>
                                    </>
                                )}
                            </View>
                        </View>
                    ) : (
                        <>
                            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                                <Text style={{ color: C.textPrimary, fontFamily: F.bodyMedium, fontSize: 13 }}>Login</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{ backgroundColor: C.coral, borderRadius: 6, paddingHorizontal: 16, paddingVertical: 8 }} onPress={() => router.push('/(auth)/welcome')}>
                                <Text style={{ color: C.white, fontFamily: F.bodySemiBold, fontSize: 13 }}>Sign up</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            ) : (
                /* ===== MOBILE ===== */
                <View style={{ flexDirection: 'row', alignItems: 'center', position: 'relative', height: 40, gap: 8 }}>
                    {isAuthenticated ? (
                        <>
                            {/* ---- SMALL MOBILE: full-screen search overlay ---- */}
                            {isMobile ? (
                                <>
                                    <TouchableOpacity
                                        onPress={openFullSearch}
                                        style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#1a1a24', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                                    >
                                        <Search size={17} color="#A855F7" />
                                    </TouchableOpacity>

                                    {isFullSearchOpen && (
                                        <View style={{
                                            position: 'fixed' as any,
                                            top: 0, left: 0, right: 0, bottom: 0,
                                            backgroundColor: '#0c0c14',
                                            zIndex: 99999,
                                            paddingTop: 0,
                                        }}>
                                            {/* Header row */}
                                            <View style={{
                                                flexDirection: 'row', alignItems: 'center',
                                                paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12,
                                                borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
                                                gap: 10,
                                            }}>
                                                <View style={{
                                                    flex: 1, flexDirection: 'row', alignItems: 'center',
                                                    backgroundColor: '#1a1a24', borderRadius: 12,
                                                    paddingHorizontal: 12, paddingVertical: 10,
                                                    borderWidth: 1, borderColor: 'rgba(168,85,247,0.4)',
                                                }}>
                                                    <Search size={16} color="#A855F7" />
                                                    <TextInput
                                                        ref={fullSearchRef}
                                                        value={searchQuery}
                                                        onChangeText={(t) => { setSearchQuery(t); setIsSearchFocused(true); }}
                                                        placeholder="Search gigs, events, people..."
                                                        placeholderTextColor="#555"
                                                        style={{ flex: 1, color: '#fff', marginLeft: 8, fontSize: 14, fontFamily: F.bodyMedium, outlineStyle: 'none' } as any}
                                                        returnKeyType="search"
                                                        onSubmitEditing={handleViewAll}
                                                        autoFocus
                                                    />
                                                    {searchQuery.length > 0 && (
                                                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                                                            <X size={16} color="#888" />
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                                <TouchableOpacity onPress={closeFullSearch}>
                                                    <Text style={{ color: '#A855F7', fontFamily: F.bodySemiBold, fontSize: 14 }}>Cancel</Text>
                                                </TouchableOpacity>
                                            </View>

                                            {/* Results */}
                                            <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }}>
                                                {debouncedQuery.length < 2 ? (
                                                    <View style={{ paddingVertical: 64, alignItems: 'center' }}>
                                                        <Text style={{ color: '#4A4656', fontFamily: 'DMSerifDisplay_400Regular', fontSize: 32, marginBottom: 8 }}>⋄</Text>
                                                        <Text style={{ color: '#A19BAA', fontSize: 13 }}>Start typing to search</Text>
                                                        <Text style={{ color: '#4A4656', fontSize: 9, fontFamily: 'SpaceMono', letterSpacing: 2.5, marginTop: 6 }}>
                                                            PEOPLE · GIGS · EVENTS
                                                        </Text>
                                                    </View>
                                                ) : results.length === 0 ? (
                                                    <View style={{ paddingVertical: 48, alignItems: 'center' }}>
                                                        <Text style={{ color: '#4A4656', fontFamily: 'DMSerifDisplay_400Regular', fontSize: 26, marginBottom: 6 }}>⋄</Text>
                                                        <Text style={{ color: '#A19BAA', fontSize: 13 }}>
                                                            Nothing for{' '}
                                                            <Text style={{ color: '#D4D0CB', fontFamily: 'DMSerifDisplay_400Regular', ...(isWeb ? { fontStyle: 'italic' as any } : {}) }}>
                                                                "{debouncedQuery}"
                                                            </Text>
                                                        </Text>
                                                    </View>
                                                ) : (
                                                    <>
                                                        {(() => {
                                                            const people = results.filter(r => r.type === 'artist' || r.type === 'organizer');
                                                            const gigs   = results.filter(r => r.type === 'gig');
                                                            const events = results.filter(r => r.type === 'event');
                                                            const renderGroup = (label: string, items: SearchResultItem[]) => (
                                                                items.length === 0 ? null : (
                                                                    <View key={label}>
                                                                        <DropdownSectionLabel label={label} count={items.length} />
                                                                        {items.map((item, i) => (
                                                                            <SearchResultRow
                                                                                key={`${item.type}-${item.id}`}
                                                                                item={item}
                                                                                onPress={() => { closeFullSearch(); handleResultClick(item.type, item.id); }}
                                                                                isLast={i === items.length - 1}
                                                                            />
                                                                        ))}
                                                                    </View>
                                                                )
                                                            );
                                                            return (
                                                                <>
                                                                    {renderGroup('People', people)}
                                                                    {renderGroup('Gigs', gigs)}
                                                                    {renderGroup('Events', events)}
                                                                </>
                                                            );
                                                        })()}
                                                        <TouchableOpacity
                                                            onPress={() => { closeFullSearch(); handleViewAll(); }}
                                                            style={{ paddingVertical: 16, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(212, 161, 85, 0.12)', marginTop: 8 }}
                                                        >
                                                            <Text style={{ color: '#D4A155', fontSize: 13, fontFamily: 'Outfit-SemiBold' }}>View all results</Text>
                                                            <Text style={{ color: '#4A4656', fontSize: 9, fontFamily: 'SpaceMono', letterSpacing: 2 }}>TAP</Text>
                                                        </TouchableOpacity>
                                                    </>
                                                )}
                                            </ScrollView>
                                        </View>
                                    )}
                                </>
                            ) : (
                                /* ---- TABLET / WIDER MOBILE: animated expand bar ---- */
                                <>
                                    {!isMobileSearchExpanded ? (
                                        <TouchableOpacity
                                            onPress={expandMobileSearch}
                                            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#1a1a24', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                                        >
                                            <Search size={17} color="#A855F7" />
                                        </TouchableOpacity>
                                    ) : (
                                        <Animated.View style={{
                                            position: 'absolute',
                                            right: ICONS_WIDTH,
                                            height: 36,
                                            width: mobileSearchWidth,
                                            backgroundColor: '#1a1a24',
                                            borderRadius: 13,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            borderWidth: 1,
                                            borderColor: 'rgba(168,85,247,0.45)',
                                            overflow: 'hidden',
                                            paddingLeft: 12,
                                        }}>
                                            <TextInput
                                                ref={searchInputRef}
                                                value={searchQuery}
                                                onChangeText={(t) => { setSearchQuery(t); resetCollapseTimer(); }}
                                                placeholder="Search..."
                                                placeholderTextColor="#555"
                                                style={{ flex: 1, color: '#fff', fontSize: 13, fontFamily: F.bodyMedium, outlineStyle: 'none' } as any}
                                                autoFocus
                                                returnKeyType="search"
                                                onFocus={() => { setIsSearchFocused(true); resetCollapseTimer(); }}
                                                onBlur={() => setTimeout(() => setIsSearchFocused(false), 300)}
                                                onSubmitEditing={handleViewAll}
                                            />
                                            <TouchableOpacity onPress={collapseMobileSearch} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
                                                <X size={16} color="#A855F7" />
                                            </TouchableOpacity>
                                        </Animated.View>
                                    )}

                                    {isMobileSearchExpanded && showDropdown && (
                                        <View style={{
                                            position: 'absolute',
                                            top: 44,
                                            right: ICONS_WIDTH,
                                            width: width - ICONS_WIDTH - 24,
                                            backgroundColor: '#13110f',
                                            borderRadius: 14,
                                            borderWidth: 1,
                                            borderColor: 'rgba(212, 161, 85, 0.22)',
                                            overflow: 'hidden',
                                            zIndex: 9999,
                                            elevation: 30,
                                            shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 24,
                                        }}>
                                            {renderDropdown()}
                                        </View>
                                    )}
                                </>
                            )}

                            {/* Messages / inbox */}
                            <InboxButton count={inboxCount} onPress={() => router.push('/(app)/inbox' as any)} />

                            {/* Bell */}
                            <TouchableOpacity style={{ position: 'relative' }} onPress={() => router.push('/(app)/notifications')}>
                                <Bell size={22} color="white" />
                                <View style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, backgroundColor: '#EC4899', borderRadius: 4 }} />
                            </TouchableOpacity>

                            {/* Profile avatar + dropdown */}
                            <View style={{ position: 'relative', zIndex: 60 }}>
                                <TouchableOpacity onPress={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}>
                                    <NavAvatar user={user} size={32} />
                                </TouchableOpacity>

                                {isProfileDropdownOpen && (
                                    <>
                                        <Pressable
                                            onPress={() => setIsProfileDropdownOpen(false)}
                                            style={{
                                                position: isWeb ? 'fixed' : 'absolute',
                                                top: isWeb ? 0 : -100,
                                                left: isWeb ? 0 : -SCREEN_WIDTH,
                                                width: Dimensions.get('window').width * 2,
                                                height: Dimensions.get('window').height * 2,
                                                zIndex: 50,
                                            } as any}
                                        />
                                        <View style={{
                                            position: 'absolute', right: 0, top: 48, zIndex: 70,
                                        }}>
                                            <ProfileMenu
                                                user={user}
                                                onClose={() => setIsProfileDropdownOpen(false)}
                                                onLogout={handleLogout}
                                                router={router}
                                                isMobileView={true}
                                            />
                                        </View>
                                    </>
                                )}
                            </View>
                        </>
                    ) : (
                        <>
                            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                                <Text style={{ color: C.textPrimary, fontFamily: F.bodyMedium, fontSize: 13 }}>Login</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{ backgroundColor: C.coral, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 7 }} onPress={() => router.push('/(auth)/welcome')}>
                                <Text style={{ color: C.white, fontFamily: F.bodySemiBold, fontSize: 12 }}>Sign up</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            )}
        </View>
    );
}