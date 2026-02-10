// app/(app)/profile/[id].tsx
import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    useWindowDimensions,
    ActivityIndicator,
    StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Menu } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import authService from "@/services/authService";
import connectionService from "@/services/connectionService";
import { AuthPromptModal } from "@/components/common/AuthPromptModal";

import useAuthStore from "@/stores/authStore";

import {
    ProfileHeader,
    ProfileSidebar,
    FeaturedWorks,
    ProfessionalHistory,
    Testimonials,
    ProfileFooter,
    ProfileData,
    ProfileStats,
} from "@/components/profile";

import { ShareBottomSheet } from "@/components/common/ShareBottomSheet";
import { User } from "@/types/index";

// Tab bar height for dynamic padding
import { useMobileTabBarHeight } from "@/components/MobileTabBar";

// Import application context components
import { ApplicantContextCard } from "@/components/gigs/applications";
import { useApplicationContext, useUpdateApplicationStatus } from "@/hooks/useGigApplications";
import { useGig } from "@/hooks/useGigs";
import AppScrollView from "@/components/AppScrollView";

export default function UserProfile() {
    const { user } = useAuthStore();
    const { id, gigId, applicationId, fromGig } = useLocalSearchParams<{
        id: string;
        gigId?: string;
        applicationId?: string;
        fromGig?: string;
    }>();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const [profile, setProfile] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showContextCard, setShowContextCard] = useState(true);
    const [shareSheetVisible, setShareSheetVisible] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'connected' | 'following'>('none');
    const [isConnectionLoading, setIsConnectionLoading] = useState(false);
    const [authModalVisible, setAuthModalVisible] = useState(false);
    const tabBarHeight = useMobileTabBarHeight();

    // Check if viewing from a gig context
    const isFromGig = fromGig === 'true' && gigId && applicationId;

    // Fetch gig details if viewing from gig context
    const { data: gig } = useGig(isFromGig ? gigId : '');

    // Fetch application context if applicable
    const { data: applicationContext } = useApplicationContext(
        isFromGig ? gigId : '',
        isFromGig ? applicationId : ''
    );

    // Status update mutation
    const updateMutation = useUpdateApplicationStatus();

    // Check if current user is organizer of the gig
    const isOrganizer = gig && user?._id === gig.organizerId?._id;

    useEffect(() => {
        const fetchUser = async () => {
            if (!id) return;
            if (id === user?._id) {
                setProfile(user);
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const fetchedUser = await authService.getUserById(Array.isArray(id) ? id[0] : id);
                setProfile(fetchedUser);
                setError("");
            } catch (err) {
                console.error("Failed to fetch user", err);
                setError("Failed to load profile");
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [id]);

    useEffect(() => {
        const checkConnectionStatus = async () => {
            if (!user || !profile || user._id === profile._id) return;

            try {
                // Check if already connected
                const connections = await connectionService.getConnections();
                const isConnected = connections.some((c: any) =>
                    (c.requesterId?._id === profile._id || c.recipientId?._id === profile._id)
                );

                if (isConnected) {
                    setConnectionStatus('connected');
                    return;
                }

                // Check if request sent
                const sentRequests = await connectionService.getSentConnectionRequests();
                const isPending = sentRequests.some((r: any) =>
                    r.recipientId?._id === profile._id || r.recipientId === profile._id
                );

                if (isPending) {
                    setConnectionStatus('pending');
                }
            } catch (error) {
                console.error("Failed to check connection status", error);
            }
        };

        if (profile) {
            checkConnectionStatus();
        }
    }, [profile, user]);

    const handleConnect = async () => {
        if (!user) {
            setAuthModalVisible(true);
            return;
        }

        if (connectionStatus !== 'none' || isConnectionLoading) return;

        try {
            setIsConnectionLoading(true);
            // Assuming profile._id is the user ID to connect to
            await connectionService.sendConnectionRequest((profile as any)._id || (profile as any).id);
            setConnectionStatus('pending');
        } catch (error) {
            console.error("Failed to send connection request", error);
            // Ideally show a toast here
        } finally {
            setIsConnectionLoading(false);
        }
    };

    const handleUpdateStatus = (appId: string, status: string) => {
        updateMutation.mutate({ applicationId: appId, status });
    };

    // Map User to ProfileData
    const profileData: ProfileData = {
        fullName: profile?.displayName || `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || 'Artist',
        location: (profile as any)?.location || "",
        age: (profile as any)?.age || "",
        gender: (profile as any)?.gender || "",
        height: (profile as any)?.height || "",
        skinTone: (profile as any)?.skinTone || "",
        artistType: (profile as any)?.artistType || profile?.roles?.[0] || "",
        skills: (profile as any)?.skills || [],
        bio: (profile as any)?.bio || "",
        instagramHandle: (profile as any)?.instagramHandle || "",
        experience: (profile as any)?.experience || [],
        hasPhotos: (profile as any)?.hasPhotos || false,
        profileImageUrl: profile?.profileImageUrl,
        galleryUrls: (profile as any)?.galleryUrls || [],
        videoUrls: (profile as any)?.videoUrls || [],
    };

    const stats: ProfileStats = {
        connections: (profile as any)?.connections || 234,
        events: (profile as any)?.events || 47,
        rating: (profile as any)?.rating || 4.9,
    };

    if (loading) {
        return (
            <View className="flex-1 bg-black items-center justify-center">
                <ActivityIndicator size="large" color="#ea698b" />
            </View>
        );
    }

    if (error || !profile) {
        return (
            <View className="flex-1 bg-black items-center justify-center p-6">
                <Text className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-6">User Unavailable</Text>
                <TouchableOpacity onPress={() => router.back()} className="bg-white/10 px-6 py-3 border border-white/20">
                    <Text className="text-white font-bold uppercase tracking-widest text-[10px]">Return Home</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-black">
            <StatusBar barStyle="light-content" />
            <SafeAreaView className="flex-1" edges={['top']}>

                {/* Navbar */}
                <View className="flex-row items-center justify-between px-6 py-6 pt-4 bg-transparent z-50">
                    <TouchableOpacity onPress={() => {
                        if (!user) {
                            router.replace('/');
                        } else {
                            router.back();
                        }
                    }} className="flex-row items-center gap-2">
                        <ArrowLeft size={20} color="white" />
                        <Text className="text-white font-bold text-[10px] uppercase tracking-widest">Back</Text>
                    </TouchableOpacity>

                </View>

                <AppScrollView className="flex-1" contentContainerStyle={{ paddingBottom: tabBarHeight > 0 ? tabBarHeight + 60 : 120 }}>

                    {/* Application Context Card - Shown when organizer views applicant from gig */}
                    {isFromGig && isOrganizer && applicationContext && showContextCard && (
                        <ApplicantContextCard
                            gigId={gigId!}
                            gigTitle={gig?.title || 'Gig'}
                            application={applicationContext}
                            onUpdateStatus={handleUpdateStatus}
                            isUpdating={updateMutation.isPending}
                            onDismiss={() => setShowContextCard(false)}
                        />
                    )}
                    <View style={{ width: '80%', marginLeft: '10%', marginRight: '10%' }}>
                        {/* Header Section */}
                        <ProfileHeader
                            fullName={profileData.fullName}
                            artistType={profileData.artistType}
                            location={profileData.location}
                            profileImageUrl={profileData.profileImageUrl}
                            stats={stats}
                            isDesktop={isDesktop}
                            isEditable={false}
                            onSharePress={() => setShareSheetVisible(true)}
                            connectionStatus={connectionStatus}
                            isConnectionLoading={isConnectionLoading}
                            onConnectPress={handleConnect}
                        />

                        {/* Main Layout Grid */}
                        <View className="px-6 py-16">
                            <View className={`flex-col ${isDesktop ? 'md:flex-row' : ''} gap-16`}>

                                {/* SIDEBAR */}
                                <ProfileSidebar
                                    profileData={profileData}
                                    isDesktop={isDesktop}
                                    isEditable={false}
                                />

                                {/* MAIN CONTENT */}
                                <View className="flex-1 space-y-20">
                                    {/* Featured Works */}
                                    <FeaturedWorks
                                        galleryUrls={profileData.galleryUrls || []}
                                        videoUrls={profileData.videoUrls || []}
                                        hasPhotos={profileData.hasPhotos}
                                        isDesktop={isDesktop}
                                        isEditable={false}
                                    />

                                    {/* Professional History */}
                                    <ProfessionalHistory
                                        experience={profileData.experience}
                                        isEditable={false}
                                    />

                                    {/* Testimonials */}
                                    <Testimonials />
                                </View>
                            </View>
                        </View>
                    </View>

                </AppScrollView>

                {/* Footer */}
                {/* <ProfileFooter /> */}

                {/* Share Bottom Sheet */}
                <ShareBottomSheet
                    visible={shareSheetVisible}
                    onClose={() => setShareSheetVisible(false)}
                    type="profile"
                    data={profile}
                />

                <AuthPromptModal
                    visible={authModalVisible}
                    onClose={() => setAuthModalVisible(false)}
                />
            </SafeAreaView>
        </View>
    );
}
