import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert, Platform, useWindowDimensions, Settings } from 'react-native';
import {
    Calendar,
    MapPin,
    Clock,
    Heart,
    Share2,
    CheckCircle2,
    ShieldCheck,
    ArrowRight,
    Lock,
    Zap,
    Star,
    AlertCircle,
    User as UserIcon,
    DollarSign,
    Briefcase,
    Award,
    Camera,
    Film,
    Music,
    Settings2,
} from 'lucide-react-native';
import { MapLinkCard } from '@/components/location/MapLinkCard';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { GigApplyModal } from './GigApplyModal';
import useAuthStore from '@/stores/authStore';
import { GigSettingsModal } from './GigSettingsModal';
import { useGigApplications, useUpdateApplicationStatus } from '@/hooks/useGigApplications';
import { usePlatform } from '@/utils/platform';
import { useRouter } from 'expo-router';
import { FlatList } from 'react-native-gesture-handler';
import gigService from '@/services/gigService';

// Application Management Components
import { ApplicationsTab, ApplicationsBadge, ApplicationsBottomSheet } from './applications';

// Gig Highlights Components
import { GigHighlightsSection } from './GigHighlightsSection';
import { OrganizerTrustCard } from './OrganizerTrustCard';
import { OrganizerDashboardCard } from './OrganizerDashboardCard';

// Tab bar height for dynamic padding
import { useMobileTabBarHeight } from '@/components/MobileTabBar';

interface GigDetailsProps {
    gig: any;
    isOrganizer?: boolean;
}



import { AuthPromptModal } from '../common/AuthPromptModal';
import { ShareBottomSheet } from '../common/ShareBottomSheet';

export const GigDetails: React.FC<GigDetailsProps> = ({
    gig,
}) => {
    console.log("[GIG DETAILS: ]: ", gig);
    const { width } = useWindowDimensions();
    const tabBarHeight = useMobileTabBarHeight();
    const isMobileWidth = width < 768;

    const router = useRouter();
    // const { isWeb } = usePlatform();
    const user = useAuthStore((state) => state.user);
    console.log("gig:", gig);
    const isOrganizer = user?._id === gig.organizerId._id;
    const hasApplied = gig.viewerContext?.hasApplied;

    const [settingsModalVisible, setSettingsModalVisible] = useState(false);
    const [applyModalVisible, setApplyModalVisible] = useState(false);
    const [authPromptVisible, setAuthPromptVisible] = useState(false); // New state for custom auth modal
    const [isSaved, setIsSaved] = useState(false);
    const [activeTab, setActiveTab] = useState<'about' | 'talent' | 'schedule' | 'apply' | 'applications' | 'terms'>('about');
    const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
    const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
    const [shareSheetVisible, setShareSheetVisible] = useState(false);

    // Fetch applications if organizer
    const { data: applications, isLoading: loadingApplications } = useGigApplications(
        isOrganizer ? gig._id : ''
    );
    const updateMutation = useUpdateApplicationStatus();

    // Calculate pending applications count for badge
    const pendingCount = useMemo(() => {
        if (!applications) return 0;
        return applications.filter((app: any) => app.status === 'pending').length;
    }, [applications]);

    // Total applications count
    const totalCount = applications?.length || 0;

    const handleApply = () => {
        if (!user) {
            setAuthPromptVisible(true);
            return;
        }
        setApplyModalVisible(true);
    };

    const handleShare = () => {
        setShareSheetVisible(true);
    };

    const handleViewTerms = () => {
        setApplyModalVisible(false);
        setActiveTab('terms');
    };

    const handleSave = async () => {
        if (!user) {
            setAuthPromptVisible(true);
            return;
        }

        try {
            setIsSaved(!isSaved); // Optimistic update
            const response = await gigService.saveGig(gig._id);
            // The API returns { saved: true/false } to indicate current state
            if (response.data?.saved !== undefined) {
                setIsSaved(response.data.saved);
            }
        } catch (error) {
            console.error('Failed to save gig:', error);
            setIsSaved(isSaved); // Revert on error
            Alert.alert('Error', 'Failed to save gig. Please try again.');
        }
    };

    const handleUpdateStatus = (appId: string, status: string) => {
        updateMutation.mutate({ applicationId: appId, status });
    };

    const toggleExpand = (appId: string) => {
        setExpandedAppId((prev) => (prev === appId ? null : appId));
    };

    // Calculate application progress
    const capacity = parseInt(gig.maxApplications || gig.capacity || '1');
    const registered = gig.stats?.applications || 0;
    const spotsLeft = capacity - registered;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'hired':
                return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' };
            case 'shortlisted':
                return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' };
            case 'rejected':
                return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' };
            default:
                return { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/20' };
        }
    };

    // Helper to format media requirements
    const getMediaRequirements = () => {
        const reqs = [];
        if (gig.mediaRequirements?.headshots) reqs.push({ icon: Camera, label: 'Headshots' });
        if (gig.mediaRequirements?.fullBody) reqs.push({ icon: Camera, label: 'Full Body Shots' });
        if (gig.mediaRequirements?.videoReel) reqs.push({ icon: Film, label: 'Video Reel' });
        if (gig.mediaRequirements?.audioSample) reqs.push({ icon: Music, label: 'Audio Sample' });
        return reqs;
    };

    return (
        <View className="flex-1 w-[90%] mx-auto">
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: tabBarHeight > 0 ? tabBarHeight + ((isMobileWidth && !isOrganizer) ? 150 : 100) : 140, marginTop: 20 }}>
                {/* HERO IMAGE */}
                <View className="relative w-full overflow-hidden rounded-2xl">
                    {/* <Image
                        source={{
                            uri: gig.organizerSnapshot?.profileImageUrl || 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?q=80&w=2000',
                        }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                    /> */}
                    {/* <LinearGradient
                        colors={isOrganizer ? ['rgba(255, 107, 53, 0.15)', 'rgba(0,0,0,0.8)', '#000000'] : ['transparent', 'rgba(0,0,0,0.3)', '#000000']}
                        locations={[0, 0.6, 1]}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                        }}
                    /> */}

                    {/* Hero Content */}
                    <View className="flex-row w-full justify-between mb-4">
                        {/* tags */}
                        <View className="flex-1 justify-end">
                            <View className="flex-row gap-2">
                                {gig.isUrgent && (
                                    <View className="bg-orange-600 rounded-full px-3 py-1">
                                        <Text className="text-white font-black text-[10px] uppercase tracking-[0.2em]">
                                            URGENT
                                        </Text>
                                    </View>
                                )}
                                <View className="bg-blue-600 rounded-full px-4 py-1">
                                    <Text className="text-white font-black text-[10px] uppercase tracking-[0.2em]">
                                        {gig.artistTypes?.[0] || 'MUSIC'} • {gig.category?.replace('_', ' ').toUpperCase()}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        {/* Action Buttons */}
                        <View className="flex-row items-center gap-3 z-30">
                            {
                                !isOrganizer && (
                                    <TouchableOpacity
                                        onPress={handleSave}
                                        className={`${isMobileWidth ? 'w-8 h-8' : 'w-10 h-10'} rounded-2xl bg-black/50 border border-white/10 items-center justify-center`}
                                    >
                                        <Heart size={isMobileWidth ? 16 : 20} color={isSaved ? '#EF4444' : '#FFFFFF'} fill={isSaved ? '#EF4444' : 'none'} />
                                    </TouchableOpacity>
                                )
                            }

                            {isOrganizer && (
                                <>
                                    <ApplicationsBadge
                                        count={totalCount}
                                        pendingCount={pendingCount}
                                        onPress={() => setBottomSheetVisible(true)}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setSettingsModalVisible(true)}
                                        className={`${isMobileWidth ? 'w-8 h-8' : 'w-10 h-10'} rounded-2xl bg-black/50 border border-white/10 items-center justify-center`}
                                    >
                                        <Settings2 size={isMobileWidth ? 16 : 20} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </>
                            )}

                            <TouchableOpacity
                                onPress={handleShare}
                                className={`${isMobileWidth ? 'w-8 h-8' : 'w-10 h-10'} rounded-2xl bg-black/50 border border-white/10 items-center justify-center`}
                            >
                                <Share2 size={isMobileWidth ? 16 : 20} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View className="">
                    {/* MAIN CONTENT - TWO COLUMN LAYOUT */}
                    <View className="items-start md:flex-row md:justify-between gap-5">
                        {/* Organizer details */}
                        <View className={`pt-1  ${isMobileWidth ? 'w-full' : 'w-1/2'}`}>

                            <View>
                                <Text className="text-4xl font-black text-white leading-tight mb-4 mt-3 mb-5">
                                    {gig.title}
                                </Text>
                                <hr className="w-full border-white/10 mb-5" />

                                {/* ORGANIZER DETAILS */}
                                {
                                    !isOrganizer && (
                                        <TouchableOpacity
                                            activeOpacity={0.7}
                                            onPress={() => router.push(`/profile/${gig.organizerId._id}`)}
                                            className={`flex-row items-center gap-4 mb-5 bg-white/10 py-5 px-1 rounded-2xl`}
                                        >
                                            <View className="relative">
                                                <View className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-white/10">
                                                    {gig.organizerSnapshot?.profileImageUrl ? (
                                                        <Image
                                                            source={{ uri: gig.organizerSnapshot.profileImageUrl }}
                                                            style={{ width: '100%', height: '100%' }}
                                                            resizeMode="cover"
                                                        />
                                                    ) : (
                                                        <View className="w-full h-full items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
                                                            <Text className="text-white font-black text-xl">
                                                                {gig.organizerSnapshot?.displayName?.charAt(0) || 'O'}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <View className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-600 rounded-full items-center justify-center border-2 border-black">
                                                    <CheckCircle2 size={12} color="white" />
                                                </View>
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-md font-black text-white mb-1">
                                                    {gig.organizerSnapshot?.displayName || 'Organizer'}
                                                </Text>
                                                <View className="flex-row items-center gap-3">
                                                    <View className="flex-row items-center gap-1">
                                                        {[1, 2, 3, 4].map((i) => (
                                                            <Star key={i} size={10} color="#EAB308" fill="#EAB308" />
                                                        ))}
                                                        <Star size={8} color="#3F3F46" fill="#3F3F46" />
                                                        <Text className="text-[10px] font-bold text-zinc-400 ml-1">
                                                            {gig.organizerSnapshot?.rating || '4.9'}
                                                        </Text>
                                                    </View>
                                                    <View className="bg-emerald-500/10 px-2 py-1 rounded">
                                                        <Text className="text-emerald-500 text-[6px] font-black uppercase tracking-widest">
                                                            VERIFIED
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    )
                                }
                                <hr className="w-full border-white/10 mb-5" />
                            </View>

                            {/* Quick Meta */}
                            <View className="flex-row justify-start gap-6 mb-10">
                                <View className="flex-row items-center gap-1">
                                    <View className="w-8 h-8 items-center justify-center">
                                        <MapPin size={24} color="#3B82F6" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-[12px] font-bold text-white mb-1">
                                            {gig.location?.venueName || gig.location?.city || 'Location TBD'}
                                        </Text>
                                        <Text className="text-[10px] text-zinc-400">
                                            {gig.location?.city || ''}{gig.location?.state ? `, ${gig.location.state}` : ''}
                                        </Text>
                                    </View>
                                </View>

                                <View className="flex-row items-center gap-1">
                                    <View className="w-8 h-8 items-center justify-center">
                                        <Calendar size={24} color="#8B5CF6" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-[12px] font-bold text-white mb-1">
                                            {gig.schedule?.startDate
                                                ? new Date(gig.schedule.startDate).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })
                                                : "Date TBD"}
                                        </Text>
                                        <Text className="text-[10px] text-zinc-400">
                                            {gig.type === 'one-time' ? 'One-time gig' : gig.type === 'recurring' ? 'Recurring' : 'Contract'}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* NEW: Gig Highlights Section - For Artists */}
                            {!isOrganizer && (
                                <>
                                    <GigHighlightsSection gig={gig} isOrganizer={isOrganizer} />
                                    <OrganizerTrustCard
                                        organizer={{
                                            _id: gig.organizerId._id || gig.organizerId,
                                            displayName: gig.organizerSnapshot?.displayName,
                                            profileImageUrl: gig.organizerSnapshot?.profileImageUrl,
                                            rating: gig.organizerSnapshot?.rating,
                                            gigsHosted: gig.organizerSnapshot?.gigsHosted,
                                        }}
                                        isOrganizer={isOrganizer}
                                    />
                                </>
                            )}

                            {/* NEW: Organizer Dashboard - For Organizers */}
                            {isOrganizer && (
                                <OrganizerDashboardCard
                                    gig={gig}
                                    applicationsCount={totalCount}
                                    onBoostPress={() => Alert.alert('Boost', 'Boost feature coming soon!')}
                                    onSharePress={handleShare}
                                    onDuplicatePress={() => Alert.alert('Duplicate', 'Duplicate feature coming soon!')}
                                />
                            )}

                        </View>

                        {/* Compensation Details */}
                        {
                            !isOrganizer && (
                                <View className="hidden bg-zinc-800/10 md:flex w-full md:w-80 lg:w-96 mx-auto lg:mx-0 pt-5">
                                    <BlurView intensity={20} tint="dark" className="rounded-[2.5rem] overflow-hidden mb-6 border border-white/10">
                                        <View className="p-8 bg-zinc-800/10">
                                            <View className="items-center mb-4">
                                                <View className="flex-row items-center gap-2 mb-2">
                                                    <Zap size={14} color="#3B82F6" />
                                                    <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
                                                        TOTAL COMPENSATION
                                                    </Text>
                                                </View>
                                                <View className="items-center">
                                                    <View className="flex-row items-baseline">
                                                        {gig.compensation?.amount ? (
                                                            <>
                                                                <Text className="text-2xl font-black text-zinc-400 mr-1">₹</Text>
                                                                <Text className="text-3xl font-black text-white bg-transparent px-2 py-1">
                                                                    {gig.compensation.amount.toLocaleString()}
                                                                </Text>
                                                            </>
                                                        ) : gig.compensation?.minAmount ? (
                                                            <>
                                                                <Text className="text-xl font-black text-zinc-400 mr-1">
                                                                    {gig.compensation.maxAmount ? '₹' : 'Starts at ₹'}
                                                                </Text>
                                                                <Text className="text-2xl font-black text-white bg-transparent px-2 py-1">
                                                                    {gig.compensation.minAmount.toLocaleString()}
                                                                    {gig.compensation.maxAmount && ` - ${gig.compensation.maxAmount.toLocaleString()}`}
                                                                </Text>
                                                            </>
                                                        ) : (
                                                            <Text className="text-2xl font-black text-white bg-transparent px-2 py-1">
                                                                To Be Discussed
                                                            </Text>
                                                        )}
                                                    </View>
                                                    {gig.compensation?.perks && (
                                                        <Text className="text-zinc-400 text-xs mt-2 font-medium">
                                                            {gig.compensation.perks.length === 0 ? '' : `+ ${gig.compensation.perks.length} benefits`}
                                                        </Text>
                                                    )}
                                                </View>
                                            </View>

                                            {/* Progress */}
                                            <View className="mb-8">
                                                <View className="flex-row justify-between items-center mb-3">
                                                    <Text className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500">
                                                        APPLICATIONS / SPOTS
                                                    </Text>
                                                    <Text className="text-[8px] font-black text-white">
                                                        {registered} / {capacity}
                                                    </Text>
                                                </View>
                                                <View className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                                    <View
                                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                                        style={{ width: `${(registered / capacity) * 100}%` }}
                                                    />
                                                </View>
                                            </View>
                                            {!isMobileWidth && <TouchableOpacity
                                                onPress={() => !hasApplied && handleApply()}
                                                disabled={hasApplied}
                                                className={`w-full py-3 rounded-2xl items-center justify-center flex-row mb-6 ${hasApplied ? 'bg-zinc-800 border border-white/10' : 'bg-white active:scale-95'
                                                    }`}
                                            >
                                                {hasApplied ? (
                                                    <>
                                                        <CheckCircle2 size={20} color="#10B981" style={{ marginRight: 8 }} />
                                                        <Text className="text-zinc-400 text-lg font-black">Applied</Text>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Text className="text-black text-lg font-black">Apply Now</Text>
                                                        <ArrowRight size={20} color="#000000" style={{ marginLeft: 8 }} />
                                                    </>
                                                )}
                                            </TouchableOpacity>}

                                            {/* Closing Alert */}
                                            {gig.applicationDeadline && !isMobileWidth && !isOrganizer && (
                                                <View className="w-fit self-center gap-3 px-3 py-1 bg-rose-500/10 rounded-2xl border border-rose-500/20 mb-4">
                                                    <View className="flex-row justify-center items-center gap-2">
                                                        <AlertCircle size={10} color="#EF4444" />
                                                        <Text className="text-[7px] font-bold uppercase tracking-widest text-zinc-400">
                                                            DEADLINE:{' '}
                                                            <Text className="text-white">
                                                                {new Date(gig.applicationDeadline).toLocaleDateString('en-IN', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                })}
                                                            </Text>
                                                        </Text>
                                                    </View>
                                                </View>
                                            )}

                                            {/* Apply Button */}
                                            {/* {
                                                !showActionFooter && !isOrganizer && (
                                                    <TouchableOpacity
                                                        onPress={handleApply}
                                                        className="w-full py-3 rounded-2xl bg-white items-center justify-center flex-row mb-6 mt active:scale-95"
                                                    >
                                                        <Text className="text-black text-lg font-black">Apply Now</Text>
                                                        <ArrowRight size={20} color="#000000" style={{ marginLeft: 8 }} />
                                                    </TouchableOpacity>
                                                )
                                            } */}

                                            {/* Trust Footer */}
                                            <View className="space-y-3">
                                                <View className="flex-row items-center gap-2 justify-center">
                                                    <Lock size={12} color="#71717A" />
                                                    <Text className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                                                        ENCRYPTED APPLICATION FLOW
                                                    </Text>
                                                </View>
                                                <Text className="text-center text-[9px] text-zinc-600 leading-relaxed">
                                                    BY APPLYING, YOU AGREE TO THE{'\n'}
                                                    <Text className="text-blue-400 underline">NETSA PERFORMANCE CHARTER</Text>
                                                </Text>
                                            </View>
                                        </View>
                                    </BlurView>

                                    {/* Trust Badges */}
                                    {/* <View className="space-y-4">
                                    <View className="p-5 rounded-2xl bg-zinc-900/30 border border-white/5 flex-row items-center gap-4">
                                        <View className="w-10 h-10 rounded-xl bg-emerald-500/10 items-center justify-center">
                                            <ShieldCheck size={20} color="#10B981" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-1">
                                                ESCROW PROTECTED
                                            </Text>
                                            <Text className="text-[11px] text-zinc-500">
                                                Funds held by NETSA until performance completion.
                                            </Text>
                                        </View>
                                    </View>
                                    <View className="p-5 rounded-2xl bg-zinc-900/30 border border-white/5 flex-row items-center gap-4">
                                        <View className="w-10 h-10 rounded-xl bg-blue-500/10 items-center justify-center">
                                            <CheckCircle2 size={20} color="#3B82F6" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500 mb-1">
                                                IDENTITY VERIFIED
                                            </Text>
                                            <Text className="text-[11px] text-zinc-500">
                                                Both organizer and artist identities verified.
                                            </Text>
                                        </View>
                                    </View>
                                </View> */}
                                </View>
                            )
                        }

                    </View>


                    {/* TABS */}
                    <View className="w-full bg-surface ">
                        {/* Tab Headers */}
                        <FlatList
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{
                                // backgroundColor: '#171730ff',
                                paddingVertical: 10,
                                paddingHorizontal: 20,
                                width: width >= 1024 ? '100%' : 'auto',
                                justifyContent: width >= 1024 ? 'space-around' : 'flex-start'
                            }}
                            data={[
                                { key: 'about', label: 'About' },
                                { key: 'talent', label: 'Talent Criteria' },
                                { key: 'schedule', label: 'Schedule & Pay' },
                                { key: 'apply', label: 'How to Apply' },
                                ...(gig.termsAndConditions ? [{ key: 'terms', label: 'Terms' }] : []),
                                ...(isOrganizer ? [{ key: 'applications', label: 'Applications' }] : []),
                            ]}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    key={item.key}
                                    onPress={() => setActiveTab(item.key as any)}
                                    className={`px-4 py-4 mb-5  ${activeTab === item.key ? 'border-b-2 border-blue-500 bg-[#171730ff]' : ''}`}
                                >
                                    <Text
                                        className={`text-[11px] font-black uppercase tracking-[0.15em] ${activeTab === item.key ? 'text-white' : 'text-zinc-500'}`}
                                    >
                                        {item.label}
                                        {item.key === 'applications' && applications && (
                                            <Text className="text-blue-400"> ({applications.length})</Text>
                                        )}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />

                        {/* Tab Content */}
                        {activeTab === 'about' && (
                            <View className="space-y-6">
                                {/* Description */}
                                <View>
                                    <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4">
                                        GIG OVERVIEW
                                    </Text>
                                    <View className="border-l-4 border-blue-500/30 pl-6">
                                        <Text className="text-xl text-zinc-300 leading-relaxed font-light">
                                            {gig.description || 'No description provided.'}
                                        </Text>
                                    </View>
                                </View>

                                {/* Tags */}
                                {gig.tags && gig.tags.length > 0 && (
                                    <View>
                                        <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3">
                                            TAGS
                                        </Text>
                                        <View className="flex-row flex-wrap gap-2">
                                            {gig.tags.map((tag: string, idx: number) => (
                                                <View
                                                    key={idx}
                                                    className="px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg"
                                                >
                                                    <Text className="text-zinc-400 text-xs">#{tag}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                {/* Additional Benefits */}
                                {gig.compensation?.perks && gig.compensation.perks.length > 0 && (
                                    <View>
                                        <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4">
                                            ADDITIONAL BENEFITS
                                        </Text>
                                        <View className="space-y-3">
                                            {gig.compensation.perks.map((perk: string, idx: number) => (
                                                <View
                                                    key={idx}
                                                    className="flex-row items-center gap-4 p-4 rounded-2xl bg-zinc-900/30 border border-white/5"
                                                >
                                                    <View className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 items-center justify-center">
                                                        <Zap size={18} color="#A855F7" />
                                                    </View>
                                                    <Text className="flex-1 text-base text-zinc-300">{perk}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}

                        {activeTab === 'talent' && (
                            <View className="space-y-6">
                                {/* Artist Type & Experience */}
                                <View className="p-6 rounded-2xl bg-zinc-900/30 border border-white/5">
                                    <View className="flex-row items-center gap-2 mb-6">
                                        <Award size={16} color="#3B82F6" />
                                        <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">
                                            ROLE REQUIREMENTS
                                        </Text>
                                    </View>
                                    <View className="space-y-4">
                                        <View className="flex-row justify-between items-center py-3 border-b border-white/5">
                                            <Text className="text-sm text-zinc-400">Artist Type</Text>
                                            <Text className="text-base font-black text-white capitalize">
                                                {gig.artistTypes?.join(', ') || 'Not specified'}
                                            </Text>
                                        </View>
                                        <View className="flex-row justify-between items-center py-3 border-b border-white/5">
                                            <Text className="text-sm text-zinc-400">Experience Level</Text>
                                            <Text className="text-base font-black text-white capitalize">
                                                {gig.experienceLevel || 'Any'}
                                            </Text>
                                        </View>
                                        {gig.requiredSkills && gig.requiredSkills.length > 0 && (
                                            <View className="py-3">
                                                <Text className="text-sm text-zinc-400 mb-2">Required Skills</Text>
                                                <View className="flex-row flex-wrap gap-2">
                                                    {gig.requiredSkills.map((skill: string, idx: number) => (
                                                        <View
                                                            key={idx}
                                                            className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg"
                                                        >
                                                            <Text className="text-blue-400 text-xs font-medium">{skill}</Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                {/* Physical Requirements */}
                                <View className="p-6 rounded-2xl bg-zinc-900/30 border border-white/5">
                                    <View className="flex-row items-center gap-2 mb-6">
                                        <UserIcon size={16} color="#8B5CF6" />
                                        <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-500">
                                            PHYSICAL CRITERIA
                                        </Text>
                                    </View>
                                    <View className="space-y-4">
                                        {gig.genderPreference && gig.genderPreference !== 'any' && (
                                            <View className="flex-row justify-between items-center py-3 border-b border-white/5">
                                                <Text className="text-sm text-zinc-400">Gender</Text>
                                                <Text className="text-base font-black text-white capitalize">
                                                    {gig.genderPreference}
                                                </Text>
                                            </View>
                                        )}
                                        {(gig.ageRange?.min || gig.ageRange?.max) && (
                                            <View className="flex-row justify-between items-center py-3 border-b border-white/5">
                                                <Text className="text-sm text-zinc-400">Age Range</Text>
                                                <Text className="text-base font-black text-white">
                                                    {gig.ageRange?.min || '?'} - {gig.ageRange?.max || '?'} years
                                                </Text>
                                            </View>
                                        )}
                                        {/* Height Requirements */}
                                        {(gig.heightRequirements?.male || gig.heightRequirements?.female) && (
                                            <View className="flex-row justify-between items-start py-3 border-b border-white/5">
                                                <Text className="text-sm text-zinc-400 mt-1">Height</Text>
                                                <View className="items-end">
                                                    {/* Check if split or same */}
                                                    {(gig.heightRequirements.male?.min === gig.heightRequirements.female?.min &&
                                                        gig.heightRequirements.male?.max === gig.heightRequirements.female?.max) ? (
                                                        <Text className="text-base font-black text-white">
                                                            {gig.heightRequirements.male?.min || '?'} - {gig.heightRequirements.male?.max || '?'} ft
                                                        </Text>
                                                    ) : (
                                                        <>
                                                            {gig.heightRequirements.male && (
                                                                <Text className="text-base font-black text-white">
                                                                    Male: {gig.heightRequirements.male.min} - {gig.heightRequirements.male.max} ft
                                                                </Text>
                                                            )}
                                                            {gig.heightRequirements.female && (
                                                                <Text className="text-base font-black text-white">
                                                                    Female: {gig.heightRequirements.female.min} - {gig.heightRequirements.female.max} ft
                                                                </Text>
                                                            )}
                                                        </>
                                                    )}
                                                </View>
                                            </View>
                                        )}

                                        {gig.physicalRequirements && (
                                            <View className="py-3">
                                                <Text className="text-sm text-zinc-400 mb-2">Other Requirements</Text>
                                                <Text className="text-zinc-300 text-sm">{gig.physicalRequirements}</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>
                        )}

                        {activeTab === 'schedule' && (
                            <View className="space-y-6">
                                {/* Compensation */}
                                <View className="p-6 rounded-2xl bg-zinc-900/30 border border-white/5">
                                    <View className="flex-row items-center gap-2 mb-6">
                                        <DollarSign size={16} color="#10B981" />
                                        <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">
                                            COMPENSATION
                                        </Text>
                                    </View>
                                    <View className="space-y-4">
                                        <View className="flex-row justify-between items-center py-3 border-b border-white/5">
                                            <Text className="text-sm text-zinc-400">Payment Model</Text>
                                            <Text className="text-base font-black text-white capitalize">
                                                {gig.compensation?.model || 'Fixed'}
                                            </Text>
                                        </View>
                                        <View className="flex-row justify-between items-center py-3 border-b border-white/5">
                                            <Text className="text-sm text-zinc-400">Amount</Text>
                                            <Text className="text-2xl font-black text-white">
                                                {gig.compensation?.amount
                                                    ? `₹${gig.compensation.amount.toLocaleString()}`
                                                    : gig.compensation?.minAmount
                                                        ? `₹${gig.compensation.minAmount.toLocaleString()}${gig.compensation.maxAmount ? ` - ₹${gig.compensation.maxAmount.toLocaleString()}` : '+'}`
                                                        : 'To Be Discussed'}
                                            </Text>
                                        </View>
                                        {gig.compensation?.negotiable && (
                                            <View className="bg-blue-500/10 px-4 py-3 rounded-xl border border-blue-500/20">
                                                <Text className="text-blue-400 text-sm font-medium">
                                                    💬 Open to negotiation
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                {/* Schedule */}
                                <View className="p-6 rounded-2xl bg-zinc-900/30 border border-white/5">
                                    <View className="flex-row items-center gap-2 mb-6">
                                        <Clock size={16} color="#F59E0B" />
                                        <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">
                                            SCHEDULE & TIMING
                                        </Text>
                                    </View>
                                    <View className="space-y-4">
                                        <View className="flex-row justify-between items-center py-3 border-b border-white/5">
                                            <Text className="text-sm text-zinc-400">Start Date</Text>
                                            <Text className="text-base font-black text-white">
                                                {gig.schedule?.startDate
                                                    ? new Date(gig.schedule.startDate).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric',
                                                    })
                                                    : 'TBD'}
                                            </Text>
                                        </View>
                                        {gig.schedule?.endDate && gig.schedule.endDate !== gig.schedule.startDate && (
                                            <View className="flex-row justify-between items-center py-3 border-b border-white/5">
                                                <Text className="text-sm text-zinc-400">End Date</Text>
                                                <Text className="text-base font-black text-white">
                                                    {new Date(gig.schedule.endDate).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric',
                                                    })}
                                                </Text>
                                            </View>
                                        )}
                                        {gig.schedule?.timeCommitment && (
                                            <View className="py-3">
                                                <Text className="text-sm text-zinc-400 mb-2">Time Commitment</Text>
                                                <Text className="text-zinc-300 text-sm">{gig.schedule.timeCommitment}</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                                {/* Location */}
                                <View className="p-6 rounded-2xl bg-zinc-900/30 border border-white/5">
                                    <View className="flex-row items-center gap-2 mb-6">
                                        <Clock size={16} color="#F59E0B" />
                                        <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">
                                            Location
                                        </Text>
                                    </View>
                                    <View className="space-y-4">
                                        <View className="flex-row justify-between items-center py-3 border-b border-white/5">
                                            <Text className="text-sm text-zinc-400">City</Text>
                                            <Text className="text-base font-black text-white">
                                                {gig.location?.city
                                                    ? gig.location.city
                                                    : 'TBD'}
                                            </Text>
                                        </View>
                                        <View className="flex-row justify-between items-center py-3 border-b border-white/5">
                                            <Text className="text-sm text-zinc-400">Venue Name</Text>
                                            <Text className="text-base font-black text-white">
                                                {gig.location?.venueName
                                                    ? gig.location.venueName
                                                    : 'TBD'}
                                            </Text>
                                        </View>

                                        <View className="mb-10 w-full">
                                            <MapLinkCard
                                                venueName={gig.location?.venueName}
                                                address={gig.location?.address || ''}
                                                city={gig.location?.city || ''}
                                                state={gig.location?.state || ''}
                                                country={gig.location?.country || ''}
                                            />
                                        </View>
                                    </View>
                                </View>

                                {/* Practice/Rehearsal Days */}
                                {gig.schedule?.practiceDays && gig.schedule.practiceDays.count > 0 && (
                                    <View className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                                        <View className="flex-row items-center gap-2 mb-4">
                                            <Briefcase size={16} color="#F59E0B" />
                                            <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">
                                                REHEARSALS / PRACTICE DAYS
                                            </Text>
                                        </View>
                                        <View className="space-y-3">
                                            <View className="flex-row justify-between items-center">
                                                <Text className="text-sm text-zinc-400">Number of Days</Text>
                                                <Text className="text-base font-black text-white">
                                                    {gig.schedule.practiceDays.count} days
                                                </Text>
                                            </View>
                                            {gig.schedule.practiceDays.isPaid && (
                                                <View className="bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20">
                                                    <Text className="text-emerald-400 text-sm font-medium">
                                                        ✓ Paid rehearsals
                                                    </Text>
                                                </View>
                                            )}
                                            {gig.schedule.practiceDays.notes && (
                                                <View className="pt-2">
                                                    <Text className="text-zinc-300 text-sm italic">
                                                        "{gig.schedule.practiceDays.notes}"
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}

                        {activeTab === 'apply' && (
                            <View className="space-y-6">
                                {/* Application Deadline */}
                                <View className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                                    <View className="flex-row items-center gap-3">
                                        <AlertCircle size={20} color="#EF4444" />
                                        <View className="flex-1">
                                            <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 mb-1">
                                                APPLICATION DEADLINE
                                            </Text>
                                            <Text className="text-white text-lg font-black">
                                                {gig.applicationDeadline
                                                    ? new Date(gig.applicationDeadline).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric',
                                                    })
                                                    : 'Until filled'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Media Requirements */}
                                {getMediaRequirements().length > 0 && (
                                    <View className="p-6 rounded-2xl bg-zinc-900/30 border border-white/5">
                                        <View className="flex-row items-center gap-2 mb-6">
                                            <Camera size={16} color="#F472B6" />
                                            <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-500">
                                                REQUIRED MATERIALS
                                            </Text>
                                        </View>
                                        <Text className="text-zinc-400 text-sm mb-4">
                                            Please submit the following with your application:
                                        </Text>
                                        <View className="space-y-3">
                                            {getMediaRequirements().map((req, idx) => (
                                                <View
                                                    key={idx}
                                                    className="flex-row items-center gap-3 p-4 rounded-xl bg-zinc-800/30 border border-white/5"
                                                >
                                                    <View className="w-10 h-10 rounded-xl bg-pink-500/10 items-center justify-center">
                                                        <req.icon size={18} color="#F472B6" />
                                                    </View>
                                                    <Text className="text-zinc-200 font-medium">{req.label}</Text>
                                                </View>
                                            ))}
                                        </View>
                                        {gig.mediaRequirements?.notes && (
                                            <View className="mt-4 p-4 bg-zinc-800/50 rounded-xl">
                                                <Text className="text-zinc-400 text-sm italic">
                                                    Note: {gig.mediaRequirements.notes}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                )}

                                {/* Application Limit */}
                                {gig.maxApplications && (
                                    <View className="p-6 rounded-2xl bg-zinc-900/30 border border-white/5">
                                        <View className="flex-row justify-between items-center">
                                            <Text className="text-sm text-zinc-400">Applications Accepted</Text>
                                            <Text className="text-base font-black text-white">
                                                {registered} / {capacity}
                                            </Text>
                                        </View>
                                        <View className="h-2 bg-zinc-800 rounded-full overflow-hidden mt-4">
                                            <View
                                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                                style={{ width: `${(registered / capacity) * 100}%` }}
                                            />
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}

                        {activeTab === 'terms' && gig.termsAndConditions && (
                            <View className="space-y-6">
                                <View className="p-6 rounded-2xl bg-zinc-900/30 border border-white/5">
                                    <View className="flex-row items-center gap-2 mb-6">
                                        <ShieldCheck size={16} color="#A1A1AA" />
                                        <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                            TERMS & CONDITIONS
                                        </Text>
                                    </View>
                                    <Text className="text-zinc-300 text-sm leading-relaxed">
                                        {gig.termsAndConditions}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {activeTab === 'applications' && isOrganizer && (
                            <ApplicationsTab gigId={gig._id} />
                        )}

                    </View>
                </View>
            </ScrollView >

            {/* MOBILE ACTION FOOTER */}
            {
                isMobileWidth && !isOrganizer && gig.applicationDeadline ? (
                    <View className='absolute bottom-12 left-0 right-0 p-6 bg-black/95 backdrop-blur-xl border-t border-white/10 md:hidden'>
                        <View className="w-fit self-center gap-3 px-3 py-1 bg-rose-500/10 rounded-2xl border border-rose-500/20 mb-4">
                            <View className="flex-row justify-center items-center gap-2">
                                <AlertCircle size={10} color="#EF4444" />
                                <Text className="text-[7px] font-bold uppercase tracking-widest text-zinc-400">
                                    DEADLINE:{' '}
                                    <Text className="text-white">
                                        {new Date(gig.applicationDeadline).toLocaleDateString('en-IN', {
                                            day: 'numeric',
                                            month: 'short',
                                        })}
                                    </Text>
                                </Text>
                            </View>
                        </View>
                        <View className="">
                            <TouchableOpacity
                                onPress={() => !hasApplied && handleApply()}
                                disabled={hasApplied}
                                className={`w-[80%] self-center py-4 rounded-2xl items-center justify-center flex-row ${hasApplied ? 'bg-zinc-800 border border-white/10' : 'bg-white active:scale-95'
                                    }`}
                            >
                                {hasApplied ? (
                                    <>
                                        <CheckCircle2 size={20} color="#10B981" style={{ marginRight: 8 }} />
                                        <Text className="text-zinc-400 text-md font-black uppercase tracking-widest">Applied</Text>
                                    </>
                                ) : (
                                    <Text className="text-black text-md font-black uppercase tracking-widest">Apply Now</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View></View>
                )
            }

            <GigApplyModal
                visible={applyModalVisible}
                onClose={() => setApplyModalVisible(false)}
                gigId={gig._id}
                gigTitle={gig.title}
                onViewTerms={handleViewTerms}
                hasTerms={!!gig.termsAndConditions}
            />

            {
                settingsModalVisible && (
                    <GigSettingsModal
                        visible={settingsModalVisible}
                        onClose={() => setSettingsModalVisible(false)}
                        gig={gig}
                    />
                )
            }
            {
                authPromptVisible && (
                    <AuthPromptModal
                        visible={authPromptVisible}
                        onClose={() => setAuthPromptVisible(false)}
                    />
                )
            }

            {/* Applications Bottom Sheet for Organizer */}
            {isOrganizer && (
                <ApplicationsBottomSheet
                    visible={bottomSheetVisible}
                    onClose={() => setBottomSheetVisible(false)}
                    applications={applications || []}
                    onViewAll={() => {
                        setBottomSheetVisible(false);
                        setActiveTab('applications');
                    }}
                    onUpdateStatus={handleUpdateStatus}
                    gigId={gig._id}
                    isLoading={loadingApplications}
                />
            )}

            {/* Share Bottom Sheet */}
            <ShareBottomSheet
                visible={shareSheetVisible}
                onClose={() => setShareSheetVisible(false)}
                type="gig"
                data={gig}
            />
        </View >
    );
};