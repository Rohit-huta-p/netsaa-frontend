import React, { useState } from 'react';
import {
    View, Text, Image, ScrollView, Pressable, StyleSheet,
    ActivityIndicator, Dimensions, Modal, FlatList, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
    MapPin, Edit3, Settings, Share2, UserPlus, Check,
    Star, Briefcase, Award, ChevronRight, ChevronLeft,
    MessageCircle, Clock, Camera, ShieldCheck,
    Globe, Zap, Calendar, DollarSign, GraduationCap,
    Users, ThumbsUp, MapPinned, BadgeCheck, Handshake,
    TrendingUp, Eye, Instagram, Youtube, Play, X,
    Image as LucideImage, Trash2, Ban, Flag, UserMinus, AlertTriangle,
} from 'lucide-react-native';

import { useAuthStore } from '@/stores/authStore';
import { useUser } from '@/hooks/useUser';
import { useConnectionStatus } from '@/features/profile/hooks/useConnectionStatus';
import { useProfileUiStore } from '@/stores/profileUiStore';
import { computeOverallScore } from '@/components/profile/ProfileStrengthWidget';
import { ProfileEditModal } from '@/features/profile/components/ProfileEditModal';
import { ProfileData } from '@/components/profile/types';
import type { ConnectionContext } from '@/types/connection';
import { NotificationsBell } from '@/components/notifications/NotificationsBell';
import { useMutualConnections, useConnectionDegree } from '@/hooks/useConnectionMeta';
import { useFollowStatus, useFollowCounts, useFollowMutations } from '@/hooks/useFollow';
import { Rss, UserCheck } from 'lucide-react-native';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Bento grid math ──
const SECTION_PX = 14; // section horizontal margin
const CARD_PX = 22;    // card internal padding
const BENTO_GAP = 8;
const GRID_W = SCREEN_W - SECTION_PX * 2 - 2; // minus card border
const INNER_W = GRID_W - CARD_PX * 2;
const COL = (INNER_W - BENTO_GAP * 2) / 3;
const COL2 = COL * 2 + BENTO_GAP;

// ── Trust tier colors ──
const TRUST_COLORS: Record<string, string> = {
    new: '#6B6878', rising: '#3B82F6', trusted: '#34D399', verified: '#EAB308',
};

type Props = {
    userId: string;
    isOwner: boolean;
    gigContext?: { gigId?: string; applicationId?: string; fromGig?: string; matchScore?: number };
    highlightMissing?: boolean;
};

export const ProfileScreen: React.FC<Props> = ({ userId, isOwner, gigContext, highlightMissing = false }) => {
    const { user: authUser } = useAuthStore();
    const trustTier = useAuthStore((s) => s.trustTier);
    const trustScore = useAuthStore((s) => s.trustScore);
    const { data: fetchedUser, isLoading, error } = useUser(isOwner ? undefined : userId);
    const {
        connectionStatus, isConnectionLoading, handleConnect, sendRequest,
        removeConnection, withdrawRequest, blockUser,
        showRequestSheet, setShowRequestSheet,
        showActionMenu, setShowActionMenu,
    } = useConnectionStatus(isOwner ? undefined : userId, isOwner);
    const { openSheet } = useProfileUiStore();
    const [activeContext, setActiveContext] = useState<'artist' | 'hirer'>('artist');
    const [mediaViewerIndex, setMediaViewerIndex] = useState<number | null>(null);
    const [confirmAction, setConfirmAction] = useState<null | 'remove' | 'withdraw' | 'block' | 'block_report'>(null);

    const user = isOwner ? authUser : fetchedUser;

    // ── Loading / Error / Not found ──
    if (isLoading && !isOwner) return <View style={s.center}><ActivityIndicator size="large" color="#F97316" /></View>;
    if (error && !isOwner) return <View style={s.center}><Text style={s.errorText}>Error loading profile</Text></View>;
    if (!user) return <View style={s.center}><Text style={s.dimText}>User not found</Text></View>;

    // ══════════════════════════════════════
    //  DATA EXTRACTION (exact backend mapping)
    // ══════════════════════════════════════
    const u = user as any;
    const displayName = u.displayName || u.firstName || 'Artist';
    const artistTypes = u.artistType || u.artistTypes || [];
    const artistTypeStr = Array.isArray(artistTypes) ? artistTypes.join(' \u00b7 ') : artistTypes;
    const location = u.location || u.cached?.primaryCity || '';
    const bio = u.bio || u.headline || '';
    const skills: string[] = u.skills || [];
    const experience: any[] = u.experience || [];
    const galleryUrls: string[] = u.galleryUrls || [];
    const videoUrls: string[] = u.videoUrls || [];
    const profileImageUrl: string | undefined = u.profileImageUrl;
    const tier = (u.trustTier || trustTier || 'new') as string;
    const tierColor = TRUST_COLORS[tier] || '#6B6878';
    const score = u.trustScore || trustScore || 0;
    const rating = u.cached?.averageRating || u.rating || 0;
    const totalReviews = u.cached?.totalReviews || 0;
    const instagram = u.instagramHandle;
    const youtube = u.youtubeUrl;
    const languages: string[] = u.languages || u.artistDetails?.languages || [];
    const reviews: any[] = u.reviews || u.cached?.recentReviews || [];
    const gigsCompleted = u.stats?.gigsCompleted || u.gigsCompleted || 0;
    const eventsAttended = u.stats?.eventsAttended || u.eventsAttended || 0;
    const yearsExperience = u.yearsOfExperience || u.experience?.length || 0;
    const responseRate = u.cached?.responseRate || u.stats?.responseRate || 0;
    const phoneVerified = !!(u.phoneVerifiedAt || u.phoneVerified || u.isPhoneVerified);
    const emailVerified = !!(u.emailVerifiedAt || u.emailVerified || u.isEmailVerified);
    const kycStatus = u.kycLevel >= 2 ? 'verified' : u.kycLevel === 1 ? 'pending' : (u.kycStatus || 'none');
    // connectionDegree comes from the useConnectionDegree hook below (real data).
    const workedTogether = u.workedTogether || false;
    const endorsements: Record<string, number> = u.endorsements || {};
    const availability = u.availability || u.availabilityStatus || null;
    const travelPreference = u.travelPreference || u.travelWillingness || u.artistDetails?.travelPreferences || '';
    const baseRate = u.baseRate || u.pricing?.baseRate || 0;
    const rateUnit = u.rateUnit || u.pricing?.rateUnit || 'show';
    const isNegotiable = u.isNegotiable ?? u.pricing?.negotiable ?? true;
    const certifications: any[] = u.certifications || u.training || [];
    const gigsPosted = u.stats?.gigsPosted || u.organizerDetails?.hirerStats?.gigsPosted || 0;
    const totalHired = u.stats?.totalHired || u.organizerDetails?.hirerStats?.artistsHired || 0;
    const hirerRating = u.cached?.hirerRating || u.organizerDetails?.hirerStats?.averageRating || 0;
    const eventsHosted = u.stats?.eventsHosted || u.organizerDetails?.hirerStats?.eventsCreated || 0;
    const connections = u.stats?.connections || 0;

    // Real mutual + degree from backend (cached via TanStack Query + Redis server-side).
    // Skipped automatically when viewing own profile (hook guards on userId !== meId).
    const { data: mutualData } = useMutualConnections(isOwner ? undefined : userId);
    const { data: degreeData } = useConnectionDegree(isOwner ? undefined : userId);
    const mutualConnections = mutualData?.count ?? 0;
    const connectionDegree = degreeData?.degree ?? null;

    // Follow relationship + counts (PRD §8.9.5)
    const { data: followStatus } = useFollowStatus(isOwner ? undefined : userId);
    const { data: followCounts } = useFollowCounts(userId);
    const { follow: followMut, unfollow: unfollowMut } = useFollowMutations(isOwner ? undefined : userId);
    const iFollow = followStatus?.iFollow ?? false;
    const followsMe = followStatus?.followsMe ?? false;
    const followerCount = followCounts?.followers ?? 0;
    const followingCount = followCounts?.following ?? 0;
    const isFollowLoading = followMut.isPending || unfollowMut.isPending;
    const profileScore = isOwner ? computeOverallScore(u) : null;
    const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

    // ── Portfolio items (combined for bento) ──
    const allMedia = [
        ...galleryUrls.map((url: string) => ({ url, type: 'image' as const })),
        ...videoUrls.map((url: string) => ({ url, type: 'video' as const })),
    ];

    // ── ProfileData for edit modal ──
    const profileData: ProfileData = {
        fullName: displayName, headline: u.headline || '', location,
        age: u.age || '', gender: u.gender || '', height: u.height || '',
        skinTone: u.skinTone || '', skinToneHex: u.skinToneHex || '',
        artistType: artistTypeStr, skills, bio,
        instagramHandle: instagram || '', youtubeUrl: youtube || '',
        spotifyUrl: u.spotifyUrl || '', soundcloudUrl: u.soundcloudUrl || '',
        experience, hasPhotos: galleryUrls.length > 0 || !!profileImageUrl,
        profileImageUrl: profileImageUrl || '', galleryUrls, videoUrls,
        organizationName: u.organizationName || '', organizationWebsite: u.organizationWebsite || '',
        organizerTypeCategory: u.organizerTypeCategory || '',
        primaryContactName: u.primaryContactName || '', primaryContactPhone: u.primaryContactPhone || '',
        primaryContactEmail: u.primaryContactEmail || '',
        // @ts-ignore
        billingDetails: u.billingDetails || u.organizerDetails?.billingDetails || {},
    };

    // ══════════════════════════════════════
    //  RENDER
    // ══════════════════════════════════════
    return (
        <View style={s.container}>
            <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

                {/* ═══ 1. COVER ZONE ═══ */}
                <View style={s.cover}>
                    {profileImageUrl ? (
                        <>
                            <Image source={{ uri: profileImageUrl }} style={s.coverImg} />
                            <View style={s.coverDarken} />
                        </>
                    ) : (
                        <LinearGradient colors={['#1a0a1e', '#0f1a2e', '#1a0f15']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.coverImg} />
                    )}
                    <LinearGradient colors={['transparent', '#0A0A10']} style={s.coverFade} />

                    {/* Top bar */}
                    <SafeAreaView edges={['top']} style={s.topBar}>
                        <Pressable onPress={() => router.back()} style={s.topBtn} hitSlop={12}>
                            <ChevronLeft size={20} color="rgba(255,255,255,0.7)" />
                        </Pressable>
                        <View style={s.topActions}>
                            {/* Universal entry: NotificationsBell on every main screen (checkpoint §Phase 2 #7) */}
                            <NotificationsBell size={16} />
                            {isOwner ? (
                                <>
                                    <Pressable onPress={() => openSheet('header')} style={s.topBtn}>
                                        <Edit3 size={15} color="rgba(255,255,255,0.7)" />
                                    </Pressable>
                                    <Pressable onPress={() => router.push('/settings')} style={s.topBtn}>
                                        <Settings size={15} color="rgba(255,255,255,0.7)" />
                                    </Pressable>
                                </>
                            ) : (
                                <Pressable style={s.topBtn}>
                                    <Share2 size={15} color="rgba(255,255,255,0.7)" />
                                </Pressable>
                            )}
                        </View>
                    </SafeAreaView>
                </View>

                {/* ═══ 2. AVATAR WITH GRADIENT RING ═══ */}
                <View style={s.avatarZone}>
                    <View style={s.ringWrap}>
                        <LinearGradient colors={['#EC4899', '#F97316', '#EAB308']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={s.ring}>
                            {profileImageUrl ? (
                                <Image source={{ uri: profileImageUrl }} style={s.avatarImg} />
                            ) : (
                                <View style={s.avatarInitials}>
                                    <Text style={s.initialsText}>{initials}</Text>
                                </View>
                            )}
                        </LinearGradient>

                        {/* Trust badge */}
                        <View style={[s.trustBadge, { backgroundColor: tierColor }]}>
                            <Check size={12} color="#fff" strokeWidth={3} />
                        </View>

                        {/* Owner: camera */}
                        {isOwner && (
                            <Pressable onPress={() => openSheet('media')} style={s.cameraBadge}>
                                <Camera size={12} color="#fff" />
                            </Pressable>
                        )}
                    </View>

                    {/* Profile score */}
                    {isOwner && profileScore !== null && profileScore < 100 && (
                        <View style={s.scoreWrap}>
                            <LinearGradient colors={['#F97316', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.scorePill}>
                                <Text style={s.scoreText}>{profileScore}%</Text>
                            </LinearGradient>
                        </View>
                    )}
                </View>

                {/* ═══ 3. IDENTITY (centered) ═══ */}
                <View style={s.identity}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={s.name}>{displayName}</Text>
                        {kycStatus === 'verified' && <BadgeCheck size={20} color="#EAB308" fill="#EAB308" style={{ marginLeft: 6 }} />}
                    </View>
                    {artistTypeStr ? <Text style={s.artistType}>{artistTypeStr}</Text>
                        : isOwner ? <Pressable onPress={() => openSheet('header')}><Text style={s.placeholderTap}>Add your artist type</Text></Pressable> : null}
                    {location ? (
                        <View style={s.locRow}>
                            <MapPin size={12} color="#4A4656" />
                            <Text style={s.locText}>{location}</Text>
                        </View>
                    ) : isOwner ? (
                        <Pressable onPress={() => openSheet('header')} style={s.locRow}>
                            <MapPin size={12} color="#3A3746" />
                            <Text style={s.placeholderTap}>Add your location</Text>
                        </Pressable>
                    ) : null}

                    {/* Verification pills — always show for owner */}
                    <View style={s.verifyRow}>
                        {phoneVerified ? <View style={s.verifyPill}><Check size={9} color="#6B6878" strokeWidth={3} /><Text style={s.verifyText}>Phone</Text></View>
                            : isOwner ? <View style={s.verifyPillDim}><Check size={9} color="#3A3746" strokeWidth={3} /><Text style={s.verifyTextDim}>Phone</Text></View> : null}
                        {emailVerified ? <View style={s.verifyPill}><Check size={9} color="#6B6878" strokeWidth={3} /><Text style={s.verifyText}>Email</Text></View>
                            : isOwner ? <View style={s.verifyPillDim}><Check size={9} color="#3A3746" strokeWidth={3} /><Text style={s.verifyTextDim}>Email</Text></View> : null}
                        {kycStatus === 'verified' ? <View style={s.verifyPill}><ShieldCheck size={10} color="#6B6878" /><Text style={s.verifyText}>KYC</Text></View>
                            : kycStatus === 'pending' ? <View style={s.verifyPillDim}><ShieldCheck size={10} color="#4A4656" /><Text style={s.verifyTextDim}>KYC Pending</Text></View>
                            : isOwner ? <View style={s.verifyPillDim}><ShieldCheck size={10} color="#3A3746" /><Text style={s.verifyTextDim}>KYC</Text></View> : null}
                    </View>

                    {/* Connection degree + Worked Together */}
                    {!isOwner && (connectionDegree || workedTogether) && (
                        <View style={s.connRow}>
                            {connectionDegree && <View style={s.connPill}><Users size={10} color="#6B6878" /><Text style={s.connPillText}>{connectionDegree === 1 ? '1st' : connectionDegree === 2 ? '2nd' : '3rd+'}</Text></View>}
                            {workedTogether && <View style={s.connPill}><Handshake size={10} color="#6B6878" /><Text style={s.connPillText}>Worked Together</Text></View>}
                        </View>
                    )}
                </View>

                {/* ═══ 4. CONNECTIONS COUNT — tappable → /network (checkpoint §2D entry point #2) ═══ */}
                {(connections > 0 || isOwner) && (
                    <Pressable
                        onPress={() => router.push('/network' as any)}
                        style={({ pressed }) => [s.connectionsRow, pressed && { opacity: 0.6 }]}
                        accessibilityRole="button"
                        accessibilityLabel="Open network"
                    >
                        <Text style={s.connectionsCount}>{connections}</Text>
                        <Text style={s.connectionsLabel}>{connections === 1 ? 'connection' : 'connections'}</Text>
                        {mutualConnections > 0 && <>
                            <View style={s.dot} />
                            <Text style={s.mutualText}>{mutualConnections} mutual</Text>
                        </>}
                        {followerCount > 0 && <>
                            <View style={s.dot} />
                            <Text style={s.mutualText}>{followerCount} {followerCount === 1 ? 'follower' : 'followers'}</Text>
                        </>}
                    </Pressable>
                )}

                {/* ═══ 5. COMPACT ACTION CIRCLES ═══ */}
                <View style={s.ctaRow}>
                    {isOwner ? (
                        <>
                            <Pressable onPress={() => openSheet('header')} style={({ pressed }) => [s.ctaAction, pressed && { opacity: 0.8 }]}>
                                <LinearGradient colors={['#EC4899', '#F97316']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.ctaIconGrad}>
                                    <Edit3 size={18} color="#fff" />
                                </LinearGradient>
                                <Text style={s.ctaLabel}>Edit</Text>
                            </Pressable>
                            <Pressable onPress={() => router.push('/settings')} style={({ pressed }) => [s.ctaAction, pressed && { opacity: 0.8 }]}>
                                <View style={s.ctaIconOutline}><Settings size={18} color="#6B6878" /></View>
                                <Text style={s.ctaLabel}>Settings</Text>
                            </Pressable>
                            <Pressable style={({ pressed }) => [s.ctaAction, pressed && { opacity: 0.8 }]}>
                                <View style={s.ctaIconOutline}><Share2 size={18} color="#6B6878" /></View>
                                <Text style={s.ctaLabel}>Share</Text>
                            </Pressable>
                        </>
                    ) : (
                        <>
                            <Pressable onPress={handleConnect} disabled={isConnectionLoading} style={({ pressed }) => [s.ctaAction, pressed && { opacity: 0.8 }]}>
                                <LinearGradient
                                    colors={connectionStatus === 'connected' ? ['#34D399', '#059669'] : connectionStatus === 'pending' ? ['#6B6878', '#4A4656'] : ['#EC4899', '#F97316']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.ctaIconGrad}
                                >
                                    {isConnectionLoading ? <ActivityIndicator size="small" color="#fff" /> :
                                        connectionStatus === 'connected' ? <Check size={18} color="#fff" /> :
                                        connectionStatus === 'pending' ? <Clock size={18} color="#fff" /> :
                                        <UserPlus size={18} color="#fff" />}
                                </LinearGradient>
                                <Text style={s.ctaLabel}>{connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'pending' ? 'Pending' : 'Connect'}</Text>
                            </Pressable>
                            {/* Follow button (PRD §8.9.5) — one-way, no approval. Always available on non-owner profiles. */}
                            <Pressable
                                onPress={() => {
                                    if (isFollowLoading) return;
                                    if (iFollow) unfollowMut.mutate();
                                    else followMut.mutate();
                                }}
                                disabled={isFollowLoading}
                                style={({ pressed }) => [s.ctaAction, pressed && { opacity: 0.8 }]}
                            >
                                <View style={[s.ctaIconOutline, iFollow && { borderColor: '#EC4899', backgroundColor: 'rgba(236,72,153,0.08)' }]}>
                                    {isFollowLoading
                                        ? <ActivityIndicator size="small" color={iFollow ? '#EC4899' : '#6B6878'} />
                                        : iFollow
                                            ? <UserCheck size={18} color="#EC4899" />
                                            : <Rss size={18} color="#6B6878" />}
                                </View>
                                <Text style={[s.ctaLabel, iFollow && { color: '#EC4899' }]}>
                                    {iFollow ? 'Following' : followsMe ? 'Follow back' : 'Follow'}
                                </Text>
                            </Pressable>
                            <Pressable style={({ pressed }) => [s.ctaAction, pressed && { opacity: 0.8 }]}>
                                <View style={s.ctaIconOutline}><MessageCircle size={18} color="#6B6878" /></View>
                                <Text style={s.ctaLabel}>Message</Text>
                            </Pressable>
                            <Pressable style={({ pressed }) => [s.ctaAction, pressed && { opacity: 0.8 }]}>
                                <View style={s.ctaIconOutline}><Share2 size={18} color="#6B6878" /></View>
                                <Text style={s.ctaLabel}>Share</Text>
                            </Pressable>
                        </>
                    )}
                </View>

                {/* ═══ 6. CONTEXT TABS ═══ */}
                <View style={s.ctxTabs}>
                    <Pressable onPress={() => setActiveContext('artist')} style={[s.ctxTab, activeContext === 'artist' && s.ctxActive]}>
                        <Star size={12} color={activeContext === 'artist' ? '#F0ECE6' : '#4A4656'} />
                        <Text style={[s.ctxText, activeContext === 'artist' && s.ctxTextActive]}>Artist</Text>
                    </Pressable>
                    <Pressable onPress={() => setActiveContext('hirer')} style={[s.ctxTab, activeContext === 'hirer' && s.ctxActive]}>
                        <Briefcase size={12} color={activeContext === 'hirer' ? '#F0ECE6' : '#4A4656'} />
                        <Text style={[s.ctxText, activeContext === 'hirer' && s.ctxTextActive]}>Hirer</Text>
                    </Pressable>
                </View>

                {/* ═══ HIRER PERSPECTIVE (non-owner + hirer tab) ═══ */}
                {!isOwner && activeContext === 'hirer' && (
                    <>
                        {/* Hire banner */}
                        {baseRate > 0 && (
                            <View style={s.hireBanner}>
                                <View style={s.hireBannerGlow} />
                                <View style={{ flex: 1 }}>
                                    <Text style={s.hireBannerPrice}>Rs. {baseRate.toLocaleString('en-IN')}</Text>
                                    <Text style={s.hireBannerUnit}>per {rateUnit}{isNegotiable ? ' \u00b7 Negotiable' : ''}</Text>
                                    <View style={s.hireBannerMeta}>
                                        {responseRate > 0 && <View style={s.hireBannerTag}><Clock size={11} color="#6B6878" /><Text style={s.hireBannerTagText}>Responds {responseRate}%</Text></View>}
                                        {availability === 'available' && <View style={s.hireBannerTag}><Calendar size={11} color="#6B6878" /><Text style={s.hireBannerTagText}>Available</Text></View>}
                                    </View>
                                </View>
                                <Pressable style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
                                    <LinearGradient colors={['#EC4899', '#F97316']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.hireBtn}>
                                        <Text style={s.hireBtnText}>Hire</Text>
                                    </LinearGradient>
                                </Pressable>
                            </View>
                        )}

                        {/* Trust strip */}
                        <View style={s.trustStrip}>
                            <TrustCell val={gigsCompleted} label="Gigs" />
                            <TrustCell val={rating > 0 ? rating.toFixed(1) : '\u2014'} label="Rating" />
                            <TrustCell val={responseRate > 0 ? `${responseRate}%` : '\u2014'} label="Response" />
                            <TrustCell val={yearsExperience > 0 ? `${yearsExperience}yr` : '\u2014'} label="Exp" last />
                        </View>

                        {/* Match badge */}
                        {gigContext?.matchScore && (
                            <View style={{ alignItems: 'center', marginTop: 12 }}>
                                <View style={s.matchBadge}><Check size={12} color="#34D399" strokeWidth={2.5} /><Text style={s.matchText}>{gigContext.matchScore}% Match</Text></View>
                            </View>
                        )}
                    </>
                )}

                {/* No stats strip for owner artist view — matches HTML Variant G */}
                {/* Stats only shown in hirer perspective (trust strip for visitors) */}

                {/* ═══ 7. BIO — Editorial Quote Style ═══ */}
                {(bio || isOwner) && (
                    <View style={s.bioSection}>
                        <Text style={s.bioQuoteMark}>&ldquo;</Text>
                        {bio ? <Text style={s.bioText}>{bio}</Text> :
                            isOwner ? <Pressable onPress={() => openSheet('about')}><Text style={s.bioPlaceholder}>Tell hirers about yourself, your style, and what makes your performances unforgettable...</Text></Pressable> : null}
                    </View>
                )}

                {/* ═══ 8. SKILLS — Floating Pill Cloud ═══ */}
                {(skills.length > 0 || (Array.isArray(artistTypes) && artistTypes.length > 0) || isOwner) && (
                    <View style={s.skillsSection}>
                        <Text style={s.sectionLabel}>Skills</Text>
                        {skills.length > 0 ? (
                            <View style={s.skillCloud}>
                                {skills.map((sk: string, i: number) => (
                                    <View key={i} style={[s.skillPill, i % 3 === 0 && s.skillRotN1, i % 3 === 1 && s.skillRot05, i % 3 === 2 && s.skillRotN05]}>
                                        <Text style={s.skillPillText}>{sk}</Text>
                                        {endorsements[sk] > 0 && <View style={s.endorseDot}><Text style={s.endorseNum}>{endorsements[sk]}</Text></View>}
                                    </View>
                                ))}
                            </View>
                        ) : isOwner ? (
                            <Pressable onPress={() => openSheet('identity')} style={s.skillCloud}>
                                {['Your skill', 'Another skill', 'Add more'].map((t, i) => (
                                    <View key={i} style={[s.skillPillGhost, i % 3 === 0 && s.skillRotN1]}><Text style={s.skillPillGhostText}>{t}</Text></View>
                                ))}
                            </Pressable>
                        ) : null}
                        {Array.isArray(artistTypes) && artistTypes.length > 0 && (
                            <View style={s.artformRow}>
                                {artistTypes.map((at: string, i: number) => <View key={i} style={s.artformChip}><Text style={s.artformText}>{at}</Text></View>)}
                            </View>
                        )}
                    </View>
                )}

                {/* ═══ LANGUAGES (pill cloud style, no card) ═══ */}
                {(languages.length > 0 || isOwner) && (
                    <View style={s.skillsSection}>
                        <Text style={s.sectionLabel}>Languages</Text>
                        {languages.length > 0 ? (
                            <View style={s.artformRow}>
                                {languages.map((l: string, i: number) => <View key={i} style={s.artformChip}><Text style={s.artformText}>{l}</Text></View>)}
                            </View>
                        ) : isOwner ? <Pressable onPress={() => openSheet('header')}><Text style={s.placeholderTap}>Add languages you speak</Text></Pressable> : null}
                    </View>
                )}

                <View style={s.sectionDivider} />

                {/* ═══ 9. PORTFOLIO — BENTO GRID (always 9 slots like HTML) ═══ */}
                {(allMedia.length > 0 || isOwner) && (
                    <Card title="Portfolio" icon={<Camera size={14} color="#6B6878" />}>
                        {(() => {
                            // Build 9-slot grid: fill with real media, rest are placeholders
                            const SLOT_COUNT = 9;
                            const GRAD_COLORS: [string, string, string][] = [
                                ['#1a1520', '#2d1f3d', '#1a2030'], ['#201518', '#3d1f2d', '#201a30'],
                                ['#15201a', '#1f3d2d', '#1a3020'], ['#202015', '#3d3d1f', '#30201a'],
                                ['#201520', '#3d1f3d', '#301a30'], ['#152020', '#1f3d3d', '#1a3030'],
                                ['#1a1520', '#2d1f3d', '#1a2030'], ['#201518', '#3d1f2d', '#201a30'],
                                ['#15201a', '#1f3d2d', '#1a3020'],
                            ];
                            const slots = Array.from({ length: SLOT_COUNT }, (_, i) =>
                                i < allMedia.length ? { ...allMedia[i], isEmpty: false } : { url: '', type: 'image' as const, isEmpty: true }
                            );
                            return (
                                <View>
                                    {/* Row 1: large (2x2) + 2 small stacked */}
                                    <View style={{ flexDirection: 'row', gap: BENTO_GAP }}>
                                        <BentoSlot slot={slots[0]} idx={0} w={COL2} h={COL2} gradColors={GRAD_COLORS[0]} onPress={() => !slots[0].isEmpty && setMediaViewerIndex(0)} isOwner={isOwner} openSheet={openSheet} />
                                        <View style={{ gap: BENTO_GAP }}>
                                            <BentoSlot slot={slots[1]} idx={1} w={COL} h={COL} gradColors={GRAD_COLORS[1]} onPress={() => !slots[1].isEmpty && setMediaViewerIndex(1)} isOwner={isOwner} openSheet={openSheet} />
                                            <BentoSlot slot={slots[2]} idx={2} w={COL} h={COL} gradColors={GRAD_COLORS[2]} onPress={() => !slots[2].isEmpty && setMediaViewerIndex(2)} isOwner={isOwner} openSheet={openSheet} />
                                        </View>
                                    </View>
                                    {/* Row 2: 3 squares */}
                                    <View style={{ flexDirection: 'row', gap: BENTO_GAP, marginTop: BENTO_GAP }}>
                                        {[3, 4, 5].map(i => (
                                            <BentoSlot key={i} slot={slots[i]} idx={i} w={COL} h={COL} gradColors={GRAD_COLORS[i]} onPress={() => !slots[i].isEmpty && setMediaViewerIndex(i)} isOwner={isOwner} openSheet={openSheet} />
                                        ))}
                                    </View>
                                    {/* Row 3: 1 small + 1 wide (2x1) */}
                                    <View style={{ flexDirection: 'row', gap: BENTO_GAP, marginTop: BENTO_GAP }}>
                                        <BentoSlot slot={slots[6]} idx={6} w={COL} h={COL} gradColors={GRAD_COLORS[6]} onPress={() => !slots[6].isEmpty && setMediaViewerIndex(6)} isOwner={isOwner} openSheet={openSheet} />
                                        <BentoSlot slot={slots[7]} idx={7} w={COL2} h={COL} gradColors={GRAD_COLORS[7]} onPress={() => !slots[7].isEmpty && setMediaViewerIndex(7)} isOwner={isOwner} openSheet={openSheet} />
                                    </View>
                                </View>
                            );
                        })()}
                        <Text style={s.portfolioCount}>
                            {allMedia.length > 0 ? `${galleryUrls.length} photos${videoUrls.length > 0 ? ` \u00b7 ${videoUrls.length} videos` : ''}` : 'No media yet'}
                        </Text>
                    </Card>
                )}

                {/* ═══ MEDIA VIEWER MODAL ═══ */}
                {mediaViewerIndex !== null && allMedia.length > 0 && (
                    <Modal visible transparent animationType="fade" onRequestClose={() => setMediaViewerIndex(null)}>
                        <View style={s.viewerBg}>
                            <Pressable onPress={() => setMediaViewerIndex(null)} style={s.viewerClose}>
                                <X size={20} color="#fff" />
                            </Pressable>
                            <FlatList
                                data={allMedia}
                                horizontal
                                pagingEnabled
                                initialScrollIndex={mediaViewerIndex}
                                getItemLayout={(_, index) => ({ length: SCREEN_W, offset: SCREEN_W * index, index })}
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(_, i) => `media-${i}`}
                                renderItem={({ item }) => (
                                    <View style={{ width: SCREEN_W, justifyContent: 'center', alignItems: 'center' }}>
                                        <Image source={{ uri: item.url }} style={s.viewerImg} resizeMode="contain" />
                                        {item.type === 'video' && (
                                            <View style={s.viewerPlayBadge}><Play size={24} color="#fff" fill="#fff" /><Text style={s.viewerPlayText}>Video</Text></View>
                                        )}
                                    </View>
                                )}
                            />
                            <Text style={s.viewerCounter}>{(mediaViewerIndex || 0) + 1} / {allMedia.length}</Text>
                        </View>
                    </Modal>
                )}

                {/* ═══ 10. EXPERIENCE — Vertical Timeline ═══ */}
                {(experience.length > 0 || isOwner) && (
                    <View style={s.timelineSection}>
                        <Text style={[s.sectionLabel, { paddingLeft: 32 }]}>Experience</Text>
                        {experience.length > 0 ? (
                            <View style={s.timeline}>
                                <View style={s.timelineLine} />
                                {experience.map((exp: any, i: number) => (
                                    <View key={i} style={s.timelineItem}>
                                        <View style={[s.timelineDot, i === 0 && s.timelineDotFirst]} />
                                        <Text style={s.timelineTitle}>{exp.title || exp.role || 'Performance'}</Text>
                                        <Text style={s.timelineMeta}>{exp.organization || exp.projectName || ''}{exp.location ? ` \u00b7 ${exp.location}` : ''}{exp.date ? ` \u00b7 ${exp.date}` : ''}</Text>
                                        {exp.description ? <Text style={s.timelineDesc}>{exp.description}</Text> : null}
                                    </View>
                                ))}
                            </View>
                        ) : isOwner ? <EmptyCTA icon={<Briefcase size={16} color="#F97316" />} text="Add past performances & roles" onPress={() => openSheet('experience')} /> : null}
                    </View>
                )}

                <View style={s.sectionDivider} />

                {/* ═══ 11. AVAILABILITY — Accent Bar ═══ */}
                {(availability || travelPreference || isOwner) && (
                    <View style={[s.availSection, availability === 'busy' && s.availBusy, availability === 'tentative' && s.availTentative]}>
                        <Text style={s.availLabel}>Availability</Text>
                        {availability ? (
                            <View style={s.availStatusRow}>
                                <View style={[s.availDot, { backgroundColor: availability === 'available' ? '#34D399' : availability === 'busy' ? '#EF4444' : '#EAB308' }]} />
                                <Text style={s.availText}>{availability === 'available' ? 'Available for gigs' : availability === 'busy' ? 'Currently busy' : 'Tentatively available'}</Text>
                            </View>
                        ) : isOwner ? (
                            <Pressable onPress={() => openSheet('header')} style={s.availStatusRow}>
                                <View style={[s.availDot, { backgroundColor: '#4A4656' }]} />
                                <Text style={s.placeholderTap}>Set your availability status</Text>
                            </Pressable>
                        ) : null}
                        {travelPreference ? (
                            <View style={s.availTravelRow}>
                                <MapPinned size={13} color="#6B6878" />
                                <Text style={s.availTravelText}>{typeof travelPreference === 'string' ? travelPreference.charAt(0).toUpperCase() + travelPreference.slice(1) : ''} travel</Text>
                            </View>
                        ) : isOwner ? (
                            <Pressable onPress={() => openSheet('header')} style={s.availTravelRow}>
                                <MapPinned size={13} color="#4A4656" />
                                <Text style={s.placeholderTap}>Set travel preference</Text>
                            </Pressable>
                        ) : null}
                    </View>
                )}

                {/* ═══ 12. PRICING — Large Price Tag ═══ */}
                {(baseRate > 0 || isOwner) && (
                    <View style={s.pricingSection}>
                        <View style={s.pricingDivider} />
                        <Text style={s.pricingLabel}>Base Rate</Text>
                        {baseRate > 0 ? (
                            <>
                                <Text style={s.pricingAmount}>Rs. {baseRate.toLocaleString('en-IN')}</Text>
                                <Text style={s.pricingUnit}>per {rateUnit}</Text>
                                {isNegotiable && <View style={s.pricingNegPill}><Text style={s.pricingNegText}>Negotiable</Text></View>}
                            </>
                        ) : isOwner ? (
                            <Pressable onPress={() => openSheet('header')}>
                                <Text style={[s.pricingAmount, { color: '#3A3746' }]}>Rs. ---</Text>
                                <Text style={s.placeholderTap}>Tap to set your rate</Text>
                            </Pressable>
                        ) : null}
                    </View>
                )}

                <View style={s.sectionDivider} />

                {/* ═══ 13. SOCIAL LINKS — Icon Circles ═══ */}
                {(instagram || youtube || isOwner) && (
                    <View style={s.socialsSection}>
                        <Text style={s.sectionLabel}>Connect</Text>
                        <View style={s.socialsRow}>
                            {instagram ? (
                                <View style={s.socialCircle}><Instagram size={20} color="#E040A0" /></View>
                            ) : isOwner ? (
                                <Pressable onPress={() => openSheet('socials')} style={s.socialCircleGhost}><Instagram size={20} color="#3A3746" /></Pressable>
                            ) : null}
                            {youtube ? (
                                <View style={s.socialCircle}><Youtube size={20} color="#EF4444" /></View>
                            ) : isOwner ? (
                                <Pressable onPress={() => openSheet('socials')} style={s.socialCircleGhost}><Youtube size={20} color="#3A3746" /></Pressable>
                            ) : null}
                            <View style={s.socialCircle}><Globe size={20} color="#6B6878" /></View>
                        </View>
                    </View>
                )}

                {/* ═══ 14. REVIEWS — Testimonial Style ═══ */}
                {(reviews.length > 0 || totalReviews > 0 || isOwner) && (
                    <View style={s.reviewsSection}>
                        <Text style={s.sectionLabel}>Reviews ({totalReviews || reviews.length})</Text>
                        {reviews.length === 0 && isOwner ? (
                            <View style={s.placeholderCard}>
                                <Star size={20} color="#4A4656" />
                                <Text style={s.placeholderTitle}>No reviews yet</Text>
                                <Text style={s.placeholderDesc}>Complete your first gig to receive reviews from hirers</Text>
                            </View>
                        ) : null}
                        {reviews.slice(0, 3).map((rev: any, i: number) => (
                            <View key={i} style={s.testimonialCard}>
                                <Text style={s.testimonialQuote}>&ldquo;</Text>
                                <View style={s.starsRow}>
                                    {[1, 2, 3, 4, 5].map(n => <Star key={n} size={12} color={n <= (rev.rating || 5) ? '#EAB308' : '#2A2735'} fill={n <= (rev.rating || 5) ? '#EAB308' : 'transparent'} />)}
                                </View>
                                <Text style={s.testimonialText}>{rev.text || rev.comment || rev.review}</Text>
                                <View style={s.testimonialFooter}>
                                    <Text style={s.testimonialAuthor}>&mdash; {rev.reviewerName || rev.author || 'Anonymous'}</Text>
                                    {rev.context && <View style={s.revCtxBadge}><Text style={s.revCtxText}>{rev.context}</Text></View>}
                                </View>
                            </View>
                        ))}
                        {(totalReviews || reviews.length) > 3 && (
                            <Pressable style={s.seeAll}><Text style={s.seeAllText}>See all {totalReviews || reviews.length} reviews</Text><ChevronRight size={14} color="#F97316" /></Pressable>
                        )}
                    </View>
                )}

                {/* ═══ 16. EMPTY STATE ═══ */}
                {isOwner && !bio && skills.length === 0 && allMedia.length === 0 && (
                    <View style={s.emptyCard}>
                        <Award size={32} color="#F97316" strokeWidth={1.5} />
                        <Text style={s.emptyTitle}>Your profile is empty</Text>
                        <Text style={s.emptyDesc}>Add your bio, skills, and portfolio to get discovered by hirers.</Text>
                        <Pressable onPress={() => openSheet('header')} style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
                            <LinearGradient colors={['#EC4899', '#F97316']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.emptyCta}>
                                <Text style={s.emptyCtaText}>Complete Profile</Text><ChevronRight size={16} color="#fff" />
                            </LinearGradient>
                        </Pressable>
                    </View>
                )}

                <View style={{ height: 110 }} />
            </ScrollView>

            {/* ═══ 17. PROFILE EDIT MODAL ═══ */}
            {isOwner && <ProfileEditModal profileData={profileData} />}

            {/* ═══ CONNECTION REQUEST SHEET ═══ */}
            {!isOwner && showRequestSheet && (
                <ConnectionRequestSheet
                    recipientName={displayName}
                    isLoading={isConnectionLoading}
                    onSend={async (message, context) => {
                        try { await sendRequest(message, context); }
                        catch { Alert.alert('Error', 'Could not send connection request. Try again.'); }
                    }}
                    onClose={() => setShowRequestSheet(false)}
                />
            )}

            {/* ═══ CONNECTION ACTION MENU (Connected / Pending) ═══ */}
            {!isOwner && showActionMenu && (
                <ConnectionActionMenu
                    status={connectionStatus}
                    recipientName={displayName}
                    onClose={() => setShowActionMenu(false)}
                    onAction={(action) => {
                        setShowActionMenu(false);
                        setConfirmAction(action);
                    }}
                />
            )}

            {/* ═══ CONFIRM ACTION MODAL ═══ */}
            {confirmAction && (
                <ConfirmActionModal
                    action={confirmAction}
                    recipientName={displayName}
                    isLoading={isConnectionLoading}
                    onCancel={() => setConfirmAction(null)}
                    onConfirm={async () => {
                        try {
                            if (confirmAction === 'remove') await removeConnection();
                            else if (confirmAction === 'withdraw') await withdrawRequest();
                            else if (confirmAction === 'block' || confirmAction === 'block_report') await blockUser();
                            setConfirmAction(null);
                            if (confirmAction === 'block_report') {
                                Alert.alert('Reported', `${displayName} has been blocked and reported to our team.`);
                            }
                        } catch {
                            Alert.alert('Error', 'Action failed. Try again.');
                        }
                    }}
                />
            )}
        </View>
    );
};

// ══════════════════════════════════════
//  SUB-COMPONENTS (inline, no separate files)
// ══════════════════════════════════════

function Card({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
    return (
        <View style={s.card}>
            <View style={s.cardGlow} />
            <View style={s.cardHead}>
                {icon && <View style={s.cardIcon}>{icon}</View>}
                <Text style={s.cardTitle}>{title}</Text>
            </View>
            {children}
        </View>
    );
}

function BentoSlot({ slot, idx, w, h, gradColors, onPress, isOwner, openSheet }: {
    slot: { url: string; type: 'image' | 'video'; isEmpty?: boolean };
    idx: number; w: number; h: number;
    gradColors: [string, string, string];
    onPress: () => void;
    isOwner: boolean;
    openSheet: (s: any) => void;
}) {
    if (slot.isEmpty) {
        // Gradient placeholder (matches HTML)
        return (
            <Pressable onPress={isOwner ? () => openSheet('media') : undefined} style={[s.bentoItem, { width: w, height: h }]}>
                <LinearGradient colors={gradColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.bentoImg}>
                    <View style={s.bentoPlaceholder}>
                        <LucideImage size={w > COL ? 28 : 20} color="rgba(255,255,255,0.06)" strokeWidth={1.5} />
                    </View>
                </LinearGradient>
            </Pressable>
        );
    }
    return (
        <Pressable onPress={onPress} style={[s.bentoItem, { width: w, height: h }]}>
            <Image source={{ uri: slot.url }} style={s.bentoImg} />
            {slot.type === 'video' && (
                <>
                    <View style={s.bentoOverlay} />
                    <View style={s.bentoPlay}><Play size={14} color="#fff" fill="#fff" /></View>
                </>
            )}
        </Pressable>
    );
}

function TrustCell({ val, label, last }: { val: string | number; label: string; last?: boolean }) {
    return (
        <View style={[s.trustCell, !last && s.trustCellBorder]}>
            <Text style={s.trustCellVal}>{val}</Text>
            <Text style={s.trustCellLbl}>{label}</Text>
        </View>
    );
}

function EmptyCTA({ icon, text, onPress }: { icon: React.ReactNode; text: string; onPress: () => void }) {
    return (
        <Pressable onPress={onPress} style={s.emptyCTARow}>
            {icon}
            <Text style={s.emptyCTAText}>{text}</Text>
        </Pressable>
    );
}

// ── Connection Request Sheet ──
const CONNECTION_CONTEXTS: { key: ConnectionContext; label: string; desc: string }[] = [
    { key: 'worked_together', label: "We've worked together", desc: 'Verified against gig history' },
    { key: 'met_at_event', label: "We've met at an event", desc: 'Verified against attendance' },
    { key: 'mutual_introduction', label: 'Mutual connection introduced us', desc: '' },
    { key: 'know_outside', label: 'We know each other outside NETSA', desc: '' },
    { key: 'admire_work', label: 'I admire your work', desc: '' },
];

function ConnectionRequestSheet({ recipientName, isLoading, onSend, onClose }: {
    recipientName: string; isLoading: boolean;
    onSend: (message?: string, context?: ConnectionContext) => Promise<void>;
    onClose: () => void;
}) {
    const [note, setNote] = React.useState('');
    const [selectedCtx, setSelectedCtx] = React.useState<ConnectionContext | null>(null);

    const handleSend = () => {
        console.log('[ConnectionRequestSheet] handleSend called', { selectedCtx, note });
        if (!selectedCtx) { Alert.alert('Required', 'Please select how you know this person.'); return; }
        console.log('[ConnectionRequestSheet] calling onSend');
        onSend(note.trim() || undefined, selectedCtx);
    };

    return (
        <Modal visible transparent animationType="slide" onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' }}>
                <Pressable onPress={onClose} style={{ flex: 1 }} />
                <View style={{ backgroundColor: '#0A0A10', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0, borderColor: 'rgba(255,255,255,0.06)', paddingBottom: 40 }}>
                    {/* Handle */}
                    <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
                        <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)' }} />
                    </View>

                    {/* Header */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                        <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 18, color: '#F0ECE6' }}>Connect with {recipientName}</Text>
                        <Pressable onPress={onClose} style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={16} color="#6B6878" />
                        </Pressable>
                    </View>

                    <ScrollView style={{ maxHeight: 480 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20 }}>
                        {/* Context selector (required) */}
                        <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 10, color: '#F97316', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>How do you know them? *</Text>
                        {CONNECTION_CONTEXTS.map((ctx) => (
                            <Pressable key={ctx.key} onPress={() => setSelectedCtx(ctx.key)}
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, marginBottom: 6, backgroundColor: selectedCtx === ctx.key ? 'rgba(249,115,22,0.08)' : 'transparent', borderWidth: 1, borderColor: selectedCtx === ctx.key ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.04)' }}>
                                {/* Radio circle */}
                                <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: selectedCtx === ctx.key ? '#F97316' : '#4A4656', alignItems: 'center', justifyContent: 'center' }}>
                                    {selectedCtx === ctx.key && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#F97316' }} />}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontFamily: 'Outfit-Medium', fontSize: 14, color: selectedCtx === ctx.key ? '#F0ECE6' : '#6B6878' }}>{ctx.label}</Text>
                                    {ctx.desc ? <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 11, color: '#4A4656', marginTop: 1 }}>{ctx.desc}</Text> : null}
                                </View>
                            </Pressable>
                        ))}

                        {/* Note input */}
                        <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 10, color: '#6B6878', textTransform: 'uppercase', letterSpacing: 2, marginTop: 20, marginBottom: 8 }}>Add a note (optional)</Text>
                        <TextInput
                            value={note} onChangeText={(t) => setNote(t.slice(0, 250))}
                            placeholder={`Hey ${recipientName.split(' ')[0]}, great to connect!`}
                            placeholderTextColor="#3A3746" multiline
                            style={{ backgroundColor: 'rgba(18,16,24,0.8)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: '#F0ECE6', fontFamily: 'Outfit-Regular', fontSize: 14, minHeight: 80, textAlignVertical: 'top' }}
                        />
                        <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 11, color: '#4A4656', textAlign: 'right', marginTop: 4 }}>{note.length}/250</Text>

                        {/* Send button */}
                        <Pressable onPress={handleSend} disabled={isLoading} style={({ pressed }) => [{ marginTop: 16, opacity: isLoading ? 0.6 : pressed ? 0.9 : 1 }]}>
                            <LinearGradient colors={['#EC4899', '#F97316']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={{ paddingVertical: 15, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                {isLoading ? <ActivityIndicator size="small" color="#fff" /> : <UserPlus size={16} color="#fff" />}
                                <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 14, color: '#fff' }}>Send Request</Text>
                            </LinearGradient>
                        </Pressable>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

// ══════════════════════════════════════
//  CONNECTION ACTION MENU (dropdown)
// ══════════════════════════════════════
type ActionKey = 'remove' | 'withdraw' | 'block' | 'block_report';

function ConnectionActionMenu({ status, recipientName, onClose, onAction }: {
    status: 'none' | 'pending' | 'connected' | 'following';
    recipientName: string;
    onClose: () => void;
    onAction: (a: ActionKey) => void;
}) {
    const items: { key: ActionKey; label: string; icon: any; danger?: boolean }[] =
        status === 'pending'
            ? [{ key: 'withdraw', label: 'Withdraw Request', icon: UserMinus, danger: true }]
            : [
                { key: 'remove', label: 'Remove Connection', icon: UserMinus },
                { key: 'block', label: 'Block', icon: Ban, danger: true },
                { key: 'block_report', label: 'Block & Report', icon: Flag, danger: true },
            ];

    return (
        <Modal visible transparent animationType="fade" onRequestClose={onClose}>
            <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                <Pressable onPress={(e) => e.stopPropagation?.()} style={{
                    width: 260, backgroundColor: '#1A1824', borderRadius: 16,
                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
                    overflow: 'hidden',
                    shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 16,
                }}>
                    <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                        <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 10, color: '#6B6878', textTransform: 'uppercase', letterSpacing: 2 }}>
                            {status === 'pending' ? 'Request Actions' : 'Connection Actions'}
                        </Text>
                        <Text style={{ fontFamily: 'Outfit-Medium', fontSize: 13, color: '#F0ECE6', marginTop: 2 }} numberOfLines={1}>{recipientName}</Text>
                    </View>
                    {items.map((item, i) => {
                        const Icon = item.icon;
                        return (
                            <Pressable key={item.key} onPress={() => onAction(item.key)}
                                style={({ pressed }) => ({
                                    flexDirection: 'row', alignItems: 'center', gap: 12,
                                    paddingVertical: 14, paddingHorizontal: 16,
                                    backgroundColor: pressed ? 'rgba(255,255,255,0.04)' : 'transparent',
                                    borderBottomWidth: i < items.length - 1 ? 1 : 0,
                                    borderBottomColor: 'rgba(255,255,255,0.04)',
                                })}>
                                <Icon size={16} color={item.danger ? '#EF4444' : '#F0ECE6'} />
                                <Text style={{
                                    fontFamily: 'Outfit-Medium', fontSize: 14,
                                    color: item.danger ? '#EF4444' : '#F0ECE6',
                                }}>{item.label}</Text>
                            </Pressable>
                        );
                    })}
                </Pressable>
            </Pressable>
        </Modal>
    );
}

// ══════════════════════════════════════
//  CONFIRM ACTION MODAL
// ══════════════════════════════════════
function ConfirmActionModal({ action, recipientName, isLoading, onCancel, onConfirm }: {
    action: ActionKey; recipientName: string; isLoading: boolean;
    onCancel: () => void; onConfirm: () => void;
}) {
    const config = {
        remove: {
            icon: UserMinus, iconColor: '#EF4444',
            title: 'Remove Connection?',
            desc: `You'll no longer be connected with ${recipientName}. You can reconnect later.`,
            confirmLabel: 'Remove', destructive: true,
        },
        withdraw: {
            icon: UserMinus, iconColor: '#EAB308',
            title: 'Withdraw Request?',
            desc: `Your pending request to ${recipientName} will be cancelled. ${recipientName} won't be notified.`,
            confirmLabel: 'Withdraw', destructive: true,
        },
        block: {
            icon: Ban, iconColor: '#EF4444',
            title: `Block ${recipientName}?`,
            desc: `${recipientName} won't be able to see your profile or contact you. You won't see their content.`,
            confirmLabel: 'Block', destructive: true,
        },
        block_report: {
            icon: AlertTriangle, iconColor: '#EF4444',
            title: `Block & Report ${recipientName}?`,
            desc: `We'll block this user and review their account for policy violations. This action can't be undone.`,
            confirmLabel: 'Block & Report', destructive: true,
        },
    }[action];
    const Icon = config.icon;

    return (
        <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{
                    width: 320, backgroundColor: '#1A1824', borderRadius: 20,
                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
                    padding: 22,
                    shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.6, shadowRadius: 32, elevation: 20,
                }}>
                    <View style={{ alignItems: 'center', marginBottom: 14 }}>
                        <View style={{
                            width: 56, height: 56, borderRadius: 28,
                            backgroundColor: `${config.iconColor}15`,
                            borderWidth: 2, borderColor: `${config.iconColor}30`,
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Icon size={24} color={config.iconColor} />
                        </View>
                    </View>
                    <Text style={{
                        fontFamily: 'DMSerifDisplay_400Regular', fontSize: 20,
                        color: '#F0ECE6', textAlign: 'center', marginBottom: 8,
                    }}>{config.title}</Text>
                    <Text style={{
                        fontFamily: 'Outfit-Regular', fontSize: 13,
                        color: '#6B6878', textAlign: 'center', lineHeight: 20,
                        marginBottom: 20,
                    }}>{config.desc}</Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <Pressable onPress={onCancel} disabled={isLoading} style={({ pressed }) => [{
                            flex: 1, paddingVertical: 12, borderRadius: 12,
                            borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
                            alignItems: 'center', backgroundColor: pressed ? 'rgba(255,255,255,0.04)' : 'transparent',
                        }]}>
                            <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 13, color: '#6B6878', textTransform: 'uppercase', letterSpacing: 1 }}>Cancel</Text>
                        </Pressable>
                        <Pressable onPress={onConfirm} disabled={isLoading} style={({ pressed }) => [{
                            flex: 1, paddingVertical: 12, borderRadius: 12,
                            backgroundColor: config.destructive ? '#EF4444' : '#F97316',
                            alignItems: 'center',
                            opacity: isLoading ? 0.6 : pressed ? 0.9 : 1,
                        }]}>
                            {isLoading ? <ActivityIndicator size="small" color="#fff" /> :
                                <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 13, color: '#fff', textTransform: 'uppercase', letterSpacing: 1 }}>{config.confirmLabel}</Text>}
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

// ══════════════════════════════════════
//  STYLESHEET
// ══════════════════════════════════════
const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A10' },
    center: { flex: 1, backgroundColor: '#0A0A10', justifyContent: 'center', alignItems: 'center' },
    errorText: { color: '#EF4444', fontFamily: 'Outfit-Regular', fontSize: 16 },
    dimText: { color: '#6B6878', fontFamily: 'Outfit-Regular', fontSize: 16 },
    scroll: { paddingBottom: 40 },

    // ── 1. Cover ──
    cover: { height: 260, position: 'relative', overflow: 'hidden' },
    coverImg: { width: '100%', height: '100%', position: 'absolute' },
    coverDarken: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
    coverFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 160 },
    topBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 8 },
    topActions: { flexDirection: 'row', gap: 8 },
    topBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },

    // ── 2. Avatar ──
    avatarZone: { alignItems: 'center', marginTop: -70, zIndex: 5 },
    ringWrap: { position: 'relative' },
    ring: { width: 122, height: 122, borderRadius: 61, padding: 4, alignItems: 'center', justifyContent: 'center' },
    avatarImg: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#0A0A10' },
    avatarInitials: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#0A0A10', backgroundColor: '#1A1824', alignItems: 'center', justifyContent: 'center' },
    initialsText: { fontFamily: 'Outfit-Black', fontSize: 36, color: 'rgba(255,255,255,0.12)' },
    trustBadge: { position: 'absolute', bottom: 2, right: -4, width: 28, height: 28, borderRadius: 14, borderWidth: 3, borderColor: '#0A0A10', alignItems: 'center', justifyContent: 'center' },
    cameraBadge: { position: 'absolute', bottom: 2, left: -4, width: 28, height: 28, borderRadius: 14, borderWidth: 3, borderColor: '#0A0A10', backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
    scoreWrap: { position: 'absolute', top: -8, right: -10 },
    scorePill: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 10 },
    scoreText: { fontFamily: 'Outfit-Black', fontSize: 11, color: '#fff' },

    // ── 3. Identity ──
    identity: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 14 },
    name: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 30, color: '#F0ECE6', letterSpacing: -0.5, textAlign: 'center' },
    artistType: { fontFamily: 'Outfit-Regular', fontSize: 13, color: '#6B6878', marginTop: 4, textAlign: 'center' },
    locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
    locText: { fontFamily: 'Outfit-Regular', fontSize: 12, color: '#4A4656' },
    verifyRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
    verifyPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.03)' },
    verifyText: { fontFamily: 'Outfit-Medium', fontSize: 10, color: '#6B6878' },
    connRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
    connPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 3, paddingHorizontal: 10, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)' },
    connPillText: { fontFamily: 'Outfit-Bold', fontSize: 11, color: '#F0ECE6' },

    // ── 4. Connections ──
    connectionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14 },
    connectionsCount: { fontFamily: 'Outfit-Black', fontSize: 15, color: '#F0ECE6' },
    connectionsLabel: { fontFamily: 'Outfit-Regular', fontSize: 13, color: '#6B6878' },
    dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#4A4656' },
    mutualText: { fontFamily: 'Outfit-Regular', fontSize: 12, color: '#4A4656' },

    // ── 5. Compact Action Circles ──
    ctaRow: { flexDirection: 'row', justifyContent: 'center', gap: 28, paddingHorizontal: 20, marginTop: 16 },
    ctaAction: { alignItems: 'center', gap: 6 },
    ctaIconGrad: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowColor: '#EC4899', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 4 },
    ctaIconOutline: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    ctaLabel: { fontFamily: 'Outfit-SemiBold', fontSize: 10, color: '#6B6878', textTransform: 'uppercase', letterSpacing: 1 },

    // ── 6. Context tabs ──
    ctxTabs: { flexDirection: 'row', marginHorizontal: 14, marginTop: 18, padding: 4, borderRadius: 18, backgroundColor: 'rgba(18,16,24,0.9)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
    ctxTab: { flex: 1, paddingVertical: 10, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    ctxActive: { backgroundColor: 'rgba(255,255,255,0.07)' },
    ctxText: { fontFamily: 'Outfit-SemiBold', fontSize: 13, color: '#4A4656' },
    ctxTextActive: { color: '#F0ECE6' },

    // ── Hirer banner ──
    hireBanner: { marginHorizontal: 14, marginTop: 14, padding: 18, borderRadius: 20, backgroundColor: 'rgba(236,72,153,0.06)', borderWidth: 1, borderColor: 'rgba(236,72,153,0.12)', flexDirection: 'row', alignItems: 'center', gap: 14, overflow: 'hidden' },
    hireBannerGlow: { position: 'absolute', top: 0, left: 30, right: 30, height: 1, backgroundColor: 'rgba(236,72,153,0.15)' },
    hireBannerPrice: { fontFamily: 'Outfit-Black', fontSize: 22, color: '#F0ECE6', letterSpacing: -0.5 },
    hireBannerUnit: { fontFamily: 'Outfit-Regular', fontSize: 12, color: '#6B6878', marginTop: 1 },
    hireBannerMeta: { flexDirection: 'row', gap: 10, marginTop: 6 },
    hireBannerTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    hireBannerTagText: { fontFamily: 'Outfit-Medium', fontSize: 11, color: '#6B6878' },
    hireBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14 },
    hireBtnText: { fontFamily: 'Outfit-Bold', fontSize: 14, color: '#fff' },

    // ── Trust strip ──
    trustStrip: { flexDirection: 'row', marginHorizontal: 14, marginTop: 14, borderRadius: 16, backgroundColor: 'rgba(18,16,24,0.9)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3, overflow: 'hidden' },
    trustCell: { flex: 1, paddingVertical: 14, alignItems: 'center' },
    trustCellBorder: { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.05)' },
    trustCellVal: { fontFamily: 'Outfit-Black', fontSize: 18, color: '#F0ECE6', letterSpacing: -0.3 },
    trustCellLbl: { fontFamily: 'Outfit-Medium', fontSize: 9, color: '#4A4656', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 2 },

    // ── Match badge ──
    matchBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 5, paddingHorizontal: 12, borderRadius: 100, backgroundColor: 'rgba(52,211,153,0.08)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.15)' },
    matchText: { fontFamily: 'Outfit-Bold', fontSize: 12, color: '#34D399' },

    // ── 7. Bio — Editorial Quote ──
    bioSection: { paddingHorizontal: 24, paddingTop: 28, marginTop: 20, position: 'relative' },
    bioQuoteMark: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 72, lineHeight: 50, color: 'rgba(249,115,22,0.12)', position: 'absolute', top: 18, left: 18 },
    bioText: { fontFamily: 'Outfit-Light', fontSize: 16, color: '#F0ECE6', lineHeight: 30, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: 'rgba(249,115,22,0.15)', marginLeft: 4 },
    bioPlaceholder: { fontFamily: 'Outfit-Regular', fontSize: 15, color: '#3A3746', fontStyle: 'italic', paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: 'rgba(255,255,255,0.04)', marginLeft: 4, lineHeight: 26 },

    // ── Card (elevated floating) ──
    card: { marginHorizontal: 14, marginTop: 12, padding: 22, borderRadius: 24, backgroundColor: 'rgba(18,16,24,0.95)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 5, position: 'relative', overflow: 'hidden' },
    cardGlow: { position: 'absolute', top: 0, left: 20, right: 20, height: 1, backgroundColor: 'transparent', borderTopWidth: 0 },
    cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    cardIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' },
    cardTitle: { fontFamily: 'Outfit-Bold', fontSize: 11, color: '#6B6878', textTransform: 'uppercase', letterSpacing: 2 },

    // ── 8. Skills — Floating Pill Cloud ──
    skillsSection: { paddingHorizontal: 20, paddingTop: 20 },
    sectionLabel: { fontFamily: 'Outfit-Bold', fontSize: 10, color: '#4A4656', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14, paddingLeft: 4 },
    skillCloud: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 4 },
    skillPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 100, backgroundColor: 'rgba(249,115,22,0.06)', borderWidth: 1, borderColor: 'rgba(249,115,22,0.1)' },
    skillRotN1: { transform: [{ rotate: '-1deg' }] },
    skillRot05: { transform: [{ rotate: '0.5deg' }] },
    skillRotN05: { transform: [{ rotate: '-0.5deg' }] },
    skillPillText: { fontFamily: 'Outfit-Medium', fontSize: 13, color: '#F97316' },
    skillPillGhost: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 100, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.06)' },
    skillPillGhostText: { fontFamily: 'Outfit-Regular', fontSize: 13, color: '#3A3746', fontStyle: 'italic' },
    artformRow: { flexDirection: 'row', gap: 6, marginTop: 10, paddingHorizontal: 4 },
    artformChip: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'transparent' },
    artformText: { fontFamily: 'Outfit-Medium', fontSize: 12, color: '#6B6878' },
    endorseDot: { backgroundColor: 'rgba(52,211,153,0.15)', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 6, minWidth: 18, alignItems: 'center' },
    endorseNum: { fontFamily: 'Outfit-Bold', fontSize: 10, color: '#34D399' },
    sectionDivider: { marginHorizontal: 20, marginTop: 20, height: 1, backgroundColor: 'rgba(255,255,255,0.04)' },

    // ── Bento ──
    bentoItem: { borderRadius: 20, overflow: 'hidden', backgroundColor: '#1A1824', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
    bentoImg: { width: '100%', height: '100%' },
    bentoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
    bentoPlay: { position: 'absolute', top: '50%', left: '50%', marginTop: -18, marginLeft: -18, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.45)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    portfolioCount: { fontFamily: 'Outfit-Regular', fontSize: 11, color: '#4A4656', marginTop: 8, textAlign: 'right' },

    // ── 10. Experience — Vertical Timeline ──
    timelineSection: { paddingHorizontal: 20, paddingTop: 24 },
    timeline: { position: 'relative', paddingLeft: 28 },
    timelineLine: { position: 'absolute', left: 8, top: 6, bottom: 6, width: 2, backgroundColor: 'rgba(249,115,22,0.15)', borderRadius: 1 },
    timelineItem: { position: 'relative', paddingBottom: 24 },
    timelineDot: { position: 'absolute', left: -24, top: 6, width: 10, height: 10, borderRadius: 5, backgroundColor: '#F97316', borderWidth: 2, borderColor: '#0A0A10' },
    timelineDotFirst: { width: 12, height: 12, borderRadius: 6, left: -25, top: 5, shadowColor: '#F97316', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 8 },
    timelineTitle: { fontFamily: 'Outfit-SemiBold', fontSize: 15, color: '#F0ECE6', marginBottom: 3 },
    timelineMeta: { fontFamily: 'Outfit-Regular', fontSize: 12, color: '#6B6878' },
    timelineDesc: { fontFamily: 'Outfit-Regular', fontSize: 13, color: '#4A4656', marginTop: 4, lineHeight: 20 },

    // ── 11. Availability — Accent Bar ──
    availSection: { marginHorizontal: 20, marginTop: 16, paddingVertical: 16, paddingHorizontal: 18, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.02)', borderLeftWidth: 3, borderLeftColor: '#34D399' },
    availBusy: { borderLeftColor: '#EF4444' },
    availTentative: { borderLeftColor: '#EAB308' },
    availLabel: { fontFamily: 'Outfit-Bold', fontSize: 9, color: '#4A4656', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
    availStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    availDot: { width: 8, height: 8, borderRadius: 4 },
    availText: { fontFamily: 'Outfit-Regular', fontSize: 14, color: '#F0ECE6' },
    availTravelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    availTravelText: { fontFamily: 'Outfit-Regular', fontSize: 13, color: '#6B6878' },

    // ── 12. Pricing — Large Price Tag ──
    pricingSection: { marginHorizontal: 20, marginTop: 16, paddingVertical: 24, alignItems: 'center', position: 'relative' },
    pricingDivider: { position: 'absolute', top: 0, left: '20%', right: '20%', height: 1, backgroundColor: 'rgba(255,255,255,0.04)' },
    pricingLabel: { fontFamily: 'Outfit-Bold', fontSize: 9, color: '#4A4656', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
    pricingAmount: { fontFamily: 'Outfit-Black', fontSize: 36, color: '#F0ECE6', letterSpacing: -1 },
    pricingUnit: { fontFamily: 'Outfit-Regular', fontSize: 14, color: '#6B6878', marginTop: 4 },
    pricingNegPill: { marginTop: 8, paddingVertical: 3, paddingHorizontal: 10, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.03)' },
    pricingNegText: { fontFamily: 'Outfit-Medium', fontSize: 11, color: '#6B6878' },

    // ── 13. Social Links — Icon Circles ──
    socialsSection: { paddingHorizontal: 20, paddingTop: 20, alignItems: 'center' },
    socialsRow: { flexDirection: 'row', justifyContent: 'center', gap: 14 },
    socialCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
    socialCircleGhost: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },

    // ── 14. Reviews — Testimonial Style ──
    reviewsSection: { paddingHorizontal: 20, paddingTop: 24 },
    testimonialCard: { position: 'relative', paddingVertical: 18, paddingHorizontal: 18, paddingLeft: 22, marginBottom: 12, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
    testimonialQuote: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 48, lineHeight: 48, color: 'rgba(249,115,22,0.1)', position: 'absolute', top: 8, left: 14 },
    starsRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 8, marginLeft: 2 },
    testimonialText: { fontFamily: 'Outfit-Regular', fontSize: 14, color: '#F0ECE6', lineHeight: 22, fontStyle: 'italic', marginBottom: 8, paddingLeft: 2 },
    testimonialFooter: { flexDirection: 'row', alignItems: 'center', paddingLeft: 2 },
    testimonialAuthor: { fontFamily: 'Outfit-Medium', fontSize: 12, color: '#6B6878' },
    revCtxBadge: { marginLeft: 6, backgroundColor: 'rgba(249,115,22,0.06)', paddingVertical: 1, paddingHorizontal: 6, borderRadius: 4 },
    revCtxText: { fontFamily: 'Outfit-SemiBold', fontSize: 10, color: '#F97316', textTransform: 'uppercase', letterSpacing: 0.3 },
    seeAll: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 12, marginTop: 4 },
    seeAllText: { fontFamily: 'Outfit-SemiBold', fontSize: 13, color: '#F97316' },

    // ── Empty state ──
    emptyCard: { backgroundColor: '#121018', borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginHorizontal: 14, marginTop: 12 },
    emptyTitle: { fontFamily: 'Outfit-Bold', fontSize: 18, color: '#F0ECE6', marginTop: 16, marginBottom: 6 },
    emptyDesc: { fontFamily: 'Outfit-Regular', fontSize: 14, color: '#6B6878', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
    emptyCta: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14 },
    emptyCtaText: { fontFamily: 'Outfit-Bold', fontSize: 15, color: '#fff' },
    emptyCTARow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 16, paddingHorizontal: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(249,115,22,0.25)', borderRadius: 14 },
    emptyCTAText: { fontFamily: 'Outfit-Medium', fontSize: 13, color: '#6B6878', flex: 1 },

    // ── Placeholders (owner, no data) ──
    placeholderText: { fontFamily: 'Outfit-Regular', fontSize: 13, color: '#3A3746', fontStyle: 'italic' },
    placeholderTap: { fontFamily: 'Outfit-Regular', fontSize: 13, color: '#4A4656', fontStyle: 'italic', textDecorationLine: 'underline', textDecorationColor: 'rgba(255,255,255,0.06)' },
    placeholderCard: { alignItems: 'center', paddingVertical: 20 },
    placeholderTitle: { fontFamily: 'Outfit-SemiBold', fontSize: 14, color: '#4A4656', marginTop: 8 },
    placeholderDesc: { fontFamily: 'Outfit-Regular', fontSize: 12, color: '#3A3746', marginTop: 4, textAlign: 'center', lineHeight: 18 },

    // ── Verify pill dim (unverified owner) ──
    verifyPillDim: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)', backgroundColor: 'rgba(255,255,255,0.01)' },
    verifyTextDim: { fontFamily: 'Outfit-Medium', fontSize: 10, color: '#3A3746' },

    // ── Bento placeholder ──
    bentoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    // ── Media viewer ──
    viewerBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' },
    viewerClose: { position: 'absolute', top: 56, right: 20, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    viewerImg: { width: SCREEN_W - 20, height: SCREEN_W - 20 },
    viewerPlayBadge: { position: 'absolute', alignItems: 'center', gap: 4 },
    viewerPlayText: { fontFamily: 'Outfit-Bold', fontSize: 12, color: 'rgba(255,255,255,0.6)' },
    viewerCounter: { position: 'absolute', bottom: 40, alignSelf: 'center', fontFamily: 'Outfit-Bold', fontSize: 13, color: 'rgba(255,255,255,0.5)' },
});
