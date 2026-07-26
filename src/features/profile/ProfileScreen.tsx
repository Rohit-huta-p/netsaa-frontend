import React, { useState, useEffect } from 'react';
import {
    View, Text, Image, ScrollView, Pressable, StyleSheet,
    ActivityIndicator, Dimensions, Modal, FlatList, TextInput, Alert, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
    Edit3, Settings, Share2, UserPlus, Check,
    Briefcase, Award, ChevronRight, ChevronLeft,
    MessageCircle, Clock, Camera, ShieldCheck,
    Globe, Zap, DollarSign, GraduationCap,
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
import { ProfileData, ProfileVideoReel } from '@/components/profile/types';
import NetsaVideoPlayer, { parseAspectRatio } from '@/components/media/NetsaVideoPlayer';
import type { ConnectionContext } from '@/types/connection';
import { useMutualConnections, useConnectionDegree, useMyConnectionsCount } from '@/hooks/useConnectionMeta';
import { SimilarRail } from '@/components/profile/SimilarRail';
import { useSimilarRail } from '@/hooks/useSimilar';

// NOTE: module-load snapshot — fine for the bento grid math below, but the
// fullscreen viewer must use the REACTIVE useWindowDimensions() hook instead
// (this static value is stale/0 on web and pins the video top-left). See winW/winH.
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
    // Context is fixed to 'artist' now that the Artist/Lead tabs are gone.
    const [activeContext] = useState<'artist' | 'hirer'>('artist');
    // "+N" crafts popover in the masthead kicker (see craftsHidden below).
    const [showCrafts, setShowCrafts] = useState(false);
    const [mediaViewerIndex, setMediaViewerIndex] = useState<number | null>(null);
    // Live index inside the fullscreen viewer — drives the nav pill counter and
    // arrow enabled/disabled state. Synced to the tapped slot on open, then to
    // whichever page settles after a swipe (onMomentumScrollEnd).
    const [activeMedia, setActiveMedia] = useState(0);
    // True while a video owns the screen in native fullscreen — the viewer hides
    // its own chrome (nav pill) so it doesn't float over the expanded video.
    const [videoFullscreen, setVideoFullscreen] = useState(false);
    const mediaListRef = React.useRef<FlatList>(null);
    // Reactive viewport size for the fullscreen viewer — correct on web (the
    // module-level SCREEN_W/SCREEN_H snapshot is stale/0 there and mis-sizes the
    // paged items, pinning the video top-left).
    const { width: winW, height: winH } = useWindowDimensions();
    const [confirmAction, setConfirmAction] = useState<null | 'remove' | 'withdraw' | 'block' | 'block_report'>(null);

    useEffect(() => {
        if (mediaViewerIndex !== null) setActiveMedia(mediaViewerIndex);
        else setVideoFullscreen(false); // never leave the pill hidden after close
    }, [mediaViewerIndex]);

    // ── ALL hooks must run before any early return below. The first render
    // bails out at `isLoading && !isOwner` while data fetches; the second
    // render proceeds past that guard. If hook calls live below the early
    // returns, the second render calls more hooks than the first → React
    // throws "Rendered more hooks than during the previous render". Keep
    // every hook above the loading guards. ──
    const { data: mutualData } = useMutualConnections(isOwner ? undefined : userId);
    const { data: degreeData } = useConnectionDegree(isOwner ? undefined : userId);
    const { data: similarData } = useSimilarRail(!isOwner ? userId : '');
    // Owner-only: User doc has no stats.connections counter, so mirror /network
    // and derive count from the accepted-connections list.
    const { data: myConnectionsCount } = useMyConnectionsCount(isOwner);

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
    // Masthead kicker is uppercase + letter-spaced (the widest way to set text), so
    // cap the crafts at two and carry the rest as "+N". Keeps the line to ONE row at
    // any craft count and stops the city being pushed out of sight. The full list
    // stays available via the +N popover (and in Skills further down).
    const craftList: string[] = Array.isArray(artistTypes)
        ? artistTypes.filter(Boolean).map(String)
        : artistTypes ? [String(artistTypes)] : [];
    const CRAFT_CAP = 2;
    const craftsShown = craftList.slice(0, CRAFT_CAP);
    const craftsHidden = craftList.slice(CRAFT_CAP);
    const location = u.location || u.cached?.primaryCity || '';
    const bio = u.bio || u.headline || '';
    const skills: string[] = u.skills || [];
    const experience: any[] = u.experience || [];
    const galleryUrls: string[] = u.galleryUrls || [];
    const videoUrls: string[] = u.videoUrls || [];
    const videoReels: ProfileVideoReel[] = u.videoReels || [];
    const profileImageUrl: string | undefined = u.profileImageUrl;
    const tier = (u.trustTier || trustTier || 'new') as string;
    const tierColor = TRUST_COLORS[tier] || '#6B6878';
    const score = u.trustScore || trustScore || 0;
    const rating = u.cached?.averageRating || u.rating || 0;
    const instagram = u.instagramHandle;
    const youtube = u.youtubeUrl;
    const languages: string[] = u.languages || u.artistDetails?.languages || [];
    const gigsCompleted = u.stats?.gigsCompleted || u.gigsCompleted || 0;
    const eventsAttended = u.stats?.eventsAttended || u.eventsAttended || 0;
    const yearsExperience = u.yearsOfExperience || u.experience?.length || 0;
    const responseRate = u.cached?.responseRate || u.stats?.responseRate || 0;
    const phoneVerified = !!(u.phoneVerifiedAt || u.phoneVerified || u.isPhoneVerified);
    const emailVerified = !!(u.emailVerifiedAt || u.emailVerified || u.isEmailVerified);
    const kycStatus = u.kycLevel >= 2 ? 'verified' : u.kycLevel === 1 ? 'pending' : (u.kycStatus || 'none');
    // connectionDegree comes from the useConnectionDegree hook above (real data).
    const workedTogether = u.workedTogether || false;
    const availability = u.availability || u.availabilityStatus || null;
    const travelPreference = u.travelPreference || u.travelWillingness || u.artistDetails?.travelPreferences || '';
    const certifications: any[] = u.certifications || u.training || [];
    const gigsPosted = u.stats?.gigsPosted || u.organizerDetails?.hirerStats?.gigsPosted || 0;
    const totalHired = u.stats?.totalHired || u.organizerDetails?.hirerStats?.artistsHired || 0;
    const hirerRating = u.cached?.hirerRating || u.organizerDetails?.hirerStats?.averageRating || 0;
    const eventsHosted = u.stats?.eventsHosted || u.organizerDetails?.hirerStats?.eventsCreated || 0;
    const connections = isOwner ? (myConnectionsCount ?? 0) : (u.stats?.connections || 0);

    // Derived values from the connection / follow hooks (which run above the
    // early returns to satisfy the rules-of-hooks). These are pure reads,
    // safe to compute here.
    const mutualConnections = mutualData?.count ?? 0;
    const connectionDegree = degreeData?.degree ?? null;
    const profileScore = isOwner ? computeOverallScore(u) : null;
    const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

    // ── Portfolio items (combined for bento) ──
    // Video items come from `videoReels` (Mux-backed), not the legacy `videoUrls`.
    // Only `ready` reels are shown; `processing`/`errored` reels are hidden here
    // (they're visible in the edit modal's upload state instead). The Mux
    // thumbnail is used as the bento/viewer poster `url`.
    const readyReels = videoReels.filter((r) => r.status === 'ready');
    const readyReelsCount = readyReels.length;
    const allMedia: { url: string; type: 'image' | 'video'; muxPlaybackId?: string; aspectRatio?: string }[] = [
        ...galleryUrls.map((url: string) => ({ url, type: 'image' as const })),
        ...readyReels.map((r) => ({ url: r.thumbnailUrl || '', type: 'video' as const, muxPlaybackId: r.muxPlaybackId, aspectRatio: r.aspectRatio })),
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
        profileImageUrl: profileImageUrl || '', galleryUrls, videoUrls, videoReels,
        organizationName: u.organizationName || '', organizationWebsite: u.organizationWebsite || '',
        organizerTypeCategory: u.organizerTypeCategory || '',
        primaryContactName: u.primaryContactName || '', primaryContactPhone: u.primaryContactPhone || '',
        primaryContactEmail: u.primaryContactEmail || '',
        availability: u.availability || u.availabilityStatus || undefined,
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
                        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
                            <ChevronLeft size={22} color="#fff" />
                        </Pressable>
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

                {/* ═══ 3. IDENTITY (left masthead) ═══ */}
                <View style={s.identity}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={s.name}>{displayName}</Text>
                        {kycStatus === 'verified' && <BadgeCheck size={20} color="#EAB308" fill="#EAB308" style={{ marginLeft: 6 }} />}
                    </View>

                    {/* Kicker: CRAFT · CRAFT +N · CITY — one line at any craft count. */}
                    {(craftList.length > 0 || location) ? (
                        <Text style={s.kicker} numberOfLines={1}>
                            {craftsShown.map((c) => c.toUpperCase()).join(' · ')}
                            {craftsHidden.length > 0 && (
                                <Text
                                    style={s.kickerMore}
                                    onPress={() => setShowCrafts((v) => !v)}
                                    suppressHighlighting
                                    accessibilityRole="button"
                                    accessibilityLabel={`Also works as ${craftsHidden.join(', ')}`}
                                >
                                    {` +${craftsHidden.length}`}
                                </Text>
                            )}
                            {location ? (
                                <Text style={s.kickerCity}>
                                    {`${craftsShown.length > 0 ? ' · ' : ''}${location.toUpperCase()}`}
                                </Text>
                            ) : null}
                        </Text>
                    ) : isOwner ? (
                        <Pressable onPress={() => openSheet('header')}><Text style={s.placeholderTap}>Add your craft and city</Text></Pressable>
                    ) : null}

                    {/* "+N" popover — the hidden crafts only; the visible two are right above. */}
                    {showCrafts && craftsHidden.length > 0 && (
                        <View style={s.craftPop} testID="craft-popover">
                            <Text style={s.craftPopHead}>Also works as</Text>
                            {craftsHidden.map((c, i) => (
                                <View key={`${c}-${i}`} style={s.craftPopItem}>
                                    <View style={s.craftPopDot} />
                                    <Text style={s.craftPopText}>{c}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Verification pills + connection count share one wrapping row */}
                    <View style={s.verifyRow}>
                        {phoneVerified ? <View style={s.verifyPill}><Check size={9} color="#6B6878" strokeWidth={3} /><Text style={s.verifyText}>Phone</Text></View>
                            : isOwner ? <View style={s.verifyPillDim}><Check size={9} color="#3A3746" strokeWidth={3} /><Text style={s.verifyTextDim}>Phone</Text></View> : null}
                        {emailVerified ? <View style={s.verifyPill}><Check size={9} color="#6B6878" strokeWidth={3} /><Text style={s.verifyText}>Email</Text></View>
                            : isOwner ? <View style={s.verifyPillDim}><Check size={9} color="#3A3746" strokeWidth={3} /><Text style={s.verifyTextDim}>Email</Text></View> : null}
                        {kycStatus === 'verified' ? <View style={s.verifyPill}><ShieldCheck size={10} color="#6B6878" /><Text style={s.verifyText}>KYC</Text></View>
                            : kycStatus === 'pending' ? <View style={s.verifyPillDim}><ShieldCheck size={10} color="#4A4656" /><Text style={s.verifyTextDim}>KYC Pending</Text></View>
                            : isOwner ? <View style={s.verifyPillDim}><ShieldCheck size={10} color="#3A3746" /><Text style={s.verifyTextDim}>KYC</Text></View> : null}

                        {/* Connections — §2D entry point #2. Lives inline here now, styled as a
                            real link (orange count + chevron) so it reads tappable. */}
                        {(connections > 0 || isOwner) && (
                            <Pressable
                                onPress={() => router.push('/network' as any)}
                                style={({ pressed }) => [s.connectionsLink, pressed && { opacity: 0.6 }]}
                                accessibilityRole="button"
                                accessibilityLabel="Open network"
                            >
                                <Text style={s.connectionsCount}>{connections}</Text>
                                <Text style={s.connectionsLabel}>
                                    {connections === 1 ? 'connection' : 'connections'}
                                    {mutualConnections > 0 ? ` · ${mutualConnections} mutual` : ''}
                                </Text>
                                <ChevronRight size={11} color="#FF6B35" />
                            </Pressable>
                        )}
                    </View>

                    {/* Connection degree + Worked Together */}
                    {!isOwner && (connectionDegree || workedTogether) && (
                        <View style={s.connRow}>
                            {connectionDegree && <View style={s.connPill}><Users size={10} color="#6B6878" /><Text style={s.connPillText}>{connectionDegree === 1 ? '1st' : connectionDegree === 2 ? '2nd' : '3rd+'}</Text></View>}
                            {workedTogether && <View style={s.connPill}><Handshake size={10} color="#6B6878" /><Text style={s.connPillText}>Worked Together</Text></View>}
                        </View>
                    )}
                </View>

                {/* ═══ 5. COMPACT ACTION CIRCLES ═══ */}
                <View style={s.ctaRow}>
                    {isOwner ? (
                        <>
                            <Pressable onPress={() => openSheet('header')} style={({ pressed }) => [s.ctaPillWrap, pressed && { opacity: 0.85 }]}>
                                <LinearGradient colors={['#EC4899', '#F97316']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.ctaPillSolid}>
                                    <Edit3 size={14} color="#fff" />
                                    <Text style={s.ctaPillSolidText}>Edit profile</Text>
                                </LinearGradient>
                            </Pressable>
                            <Pressable style={({ pressed }) => [s.ctaPillOutline, pressed && { opacity: 0.7 }]}>
                                <Share2 size={14} color="#D6D1DE" />
                                <Text style={s.ctaPillText}>Share profile</Text>
                            </Pressable>
                            {/* Settings navigates away from the profile — icon-only, not a peer of Edit. */}
                            <Pressable
                                onPress={() => router.push('/settings')}
                                style={({ pressed }) => [s.ctaPillIcon, pressed && { opacity: 0.7 }]}
                                accessibilityRole="button"
                                accessibilityLabel="Settings"
                            >
                                <Settings size={15} color="#9A94A6" />
                            </Pressable>
                        </>
                    ) : (
                        <>
                            <Pressable onPress={handleConnect} disabled={isConnectionLoading} style={({ pressed }) => [s.ctaPillWrap, pressed && { opacity: 0.85 }]}>
                                <LinearGradient
                                    colors={connectionStatus === 'connected' ? ['#34D399', '#059669'] : connectionStatus === 'pending' ? ['#6B6878', '#4A4656'] : ['#EC4899', '#F97316']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.ctaPillSolid}
                                >
                                    {isConnectionLoading ? <ActivityIndicator size="small" color="#fff" /> :
                                        connectionStatus === 'connected' ? <Check size={14} color="#fff" /> :
                                        connectionStatus === 'pending' ? <Clock size={14} color="#fff" /> :
                                        <UserPlus size={14} color="#fff" />}
                                    <Text style={s.ctaPillSolidText}>{connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'pending' ? 'Pending' : 'Connect'}</Text>
                                </LinearGradient>
                            </Pressable>
                            <Pressable style={({ pressed }) => [s.ctaPillOutline, pressed && { opacity: 0.7 }]}>
                                <MessageCircle size={14} color="#D6D1DE" />
                                <Text style={s.ctaPillText}>Message</Text>
                            </Pressable>
                            <Pressable
                                style={({ pressed }) => [s.ctaPillIcon, pressed && { opacity: 0.7 }]}
                                accessibilityRole="button"
                                accessibilityLabel="Share profile"
                            >
                                <Share2 size={15} color="#9A94A6" />
                            </Pressable>
                        </>
                    )}
                </View>

                {/* ═══ HIRER PERSPECTIVE (non-owner + hirer tab) ═══ */}
                {!isOwner && activeContext === 'hirer' && (
                    <>
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
                            {allMedia.length > 0 ? `${galleryUrls.length} photos${readyReelsCount > 0 ? ` \u00b7 ${readyReelsCount} videos` : ''}` : 'No media yet'}
                        </Text>
                    </Card>
                )}

                {/* ═══ MEDIA VIEWER MODAL ═══ */}
                {mediaViewerIndex !== null && allMedia.length > 0 && (
                    <Modal visible transparent animationType="fade" onRequestClose={() => setMediaViewerIndex(null)}>
                        <View style={s.viewerBg}>
                            <SafeAreaView edges={['top']} pointerEvents="box-none" style={s.viewerTopSafe}>
                                <Pressable onPress={() => setMediaViewerIndex(null)} style={s.viewerClose} hitSlop={10}>
                                    <X size={20} color="#fff" />
                                </Pressable>
                            </SafeAreaView>
                            <FlatList
                                ref={mediaListRef}
                                data={allMedia}
                                horizontal
                                pagingEnabled
                                initialScrollIndex={mediaViewerIndex ?? 0}
                                getItemLayout={(_, index) => ({ length: winW, offset: winW * index, index })}
                                onMomentumScrollEnd={(e) => setActiveMedia(Math.round(e.nativeEvent.contentOffset.x / winW))}
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(item, i) => item.muxPlaybackId || item.url || `media-${i}`}
                                renderItem={({ item }) => (
                                    <View style={{ width: winW, height: winH, justifyContent: 'center', alignItems: 'center' }}>
                                        {item.type === 'video' && item.muxPlaybackId ? (
                                            <NetsaVideoPlayer playbackId={item.muxPlaybackId} poster={item.url || undefined} fill contentFit="contain" showRotateCue={(parseAspectRatio(item.aspectRatio) ?? 0) >= 1.2} onFullscreenChange={setVideoFullscreen} style={[s.viewerVideo, { width: winW, height: winH }]} />
                                        ) : (
                                            <Image source={{ uri: item.url }} style={{ width: winW, height: winH }} resizeMode="contain" />
                                        )}
                                    </View>
                                )}
                            />
                            {/* Nav pill — prev · counter · next (V2 design). Thumb-height;
                                arrows dim at the first/last frame. box-none so the full-width
                                safe wrapper never intercepts photo swipes. Hidden while a video
                                is in fullscreen — swiping doesn't apply there and it would
                                float over the expanded video. */}
                            {!videoFullscreen && (
                            <SafeAreaView edges={['bottom']} pointerEvents="box-none" style={s.viewerBottomSafe}>
                                <View style={s.viewerPill}>
                                    <Pressable
                                        disabled={activeMedia === 0}
                                        hitSlop={8}
                                        onPress={() => {
                                            const n = Math.max(0, activeMedia - 1);
                                            setActiveMedia(n);
                                            mediaListRef.current?.scrollToIndex({ index: n, animated: true });
                                        }}
                                        style={[s.viewerPillBtn, activeMedia === 0 && s.viewerPillBtnOff]}>
                                        <ChevronLeft size={20} color="#fff" />
                                    </Pressable>
                                    <Text style={s.viewerPillCount}>
                                        <Text style={{ color: '#FF6B35' }}>{activeMedia + 1}</Text> / {allMedia.length}
                                    </Text>
                                    <Pressable
                                        disabled={activeMedia === allMedia.length - 1}
                                        hitSlop={8}
                                        onPress={() => {
                                            const n = Math.min(allMedia.length - 1, activeMedia + 1);
                                            setActiveMedia(n);
                                            mediaListRef.current?.scrollToIndex({ index: n, animated: true });
                                        }}
                                        style={[s.viewerPillBtn, activeMedia === allMedia.length - 1 && s.viewerPillBtnOff]}>
                                        <ChevronRight size={20} color="#fff" />
                                    </Pressable>
                                </View>
                            </SafeAreaView>
                            )}
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

                {/* ═══ 17. SIMILAR ARTISTS RAIL (visitor-only) ═══ */}
                {!isOwner && (
                    <View style={{ marginHorizontal: SECTION_PX }}>
                        <SimilarRail
                            items={similarData?.items ?? []}
                            total={similarData?.total ?? 0}
                            onSeeAll={() => router.push(`/profile/similar/${userId}` as any)}
                            onItemPress={(peerId) => router.push(`/profile/${peerId}` as any)}
                        />
                    </View>
                )}

                <View style={{ height: 110 }} />
            </ScrollView>

            {/* Tap anywhere to dismiss the "+N" crafts popover. Sits above the scroll
                view so any tap closes it; the card itself is informational, nothing
                inside it needs to stay tappable. */}
            {showCrafts && (
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={() => setShowCrafts(false)}
                    accessibilityRole="button"
                    accessibilityLabel="Dismiss"
                />
            )}

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
    status: 'none' | 'pending' | 'connected';
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
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },

    // ── 2. Avatar ──
    // Left masthead: avatar aligns with the name/kicker below it, not centred.
    avatarZone: { alignItems: 'flex-start', paddingLeft: 20, marginTop: -70, zIndex: 5 },
    ringWrap: { position: 'relative' },
    ring: { width: 116, height: 116, borderRadius: 58, padding: 2, alignItems: 'center', justifyContent: 'center' },
    avatarImg: { width: 110, height: 110, borderRadius: 55, borderWidth: 1, borderColor: '#0A0A10' },
    avatarInitials: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#0A0A10', backgroundColor: '#1A1824', alignItems: 'center', justifyContent: 'center' },
    initialsText: { fontFamily: 'Outfit-Black', fontSize: 36, color: 'rgba(255,255,255,0.12)' },
    trustBadge: { position: 'absolute', bottom: 2, right: -4, width: 28, height: 28, borderRadius: 14, borderWidth: 3, borderColor: '#0A0A10', alignItems: 'center', justifyContent: 'center' },
    cameraBadge: { position: 'absolute', bottom: 2, left: -4, width: 28, height: 28, borderRadius: 14, borderWidth: 3, borderColor: '#0A0A10', backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
    scoreWrap: { position: 'absolute', top: -8, right: -10 },
    scorePill: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 10 },
    scoreText: { fontFamily: 'Outfit-Black', fontSize: 11, color: '#fff' },

    // ── 3. Identity (left masthead) ──
    identity: { alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 14, position: 'relative' },
    name: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 30, color: '#F0ECE6', letterSpacing: -0.5 },
    // Kicker sets the craft + city as a Space Mono rubric under the name.
    kicker: { fontFamily: 'SpaceMono-Regular', fontSize: 10.5, letterSpacing: 1.6, color: '#6B6878', marginTop: 7 },
    kickerMore: { color: '#FF6B35' },
    kickerCity: { color: '#4A4656' },
    // "+N" popover — floats, so the masthead never changes height.
    craftPop: { position: 'absolute', left: 20, top: 78, zIndex: 30, minWidth: 150, paddingVertical: 9, paddingHorizontal: 4, borderRadius: 12, backgroundColor: 'rgba(18,16,24,0.97)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.55, shadowRadius: 20, elevation: 12 },
    craftPopHead: { fontFamily: 'SpaceMono-Regular', fontSize: 8, letterSpacing: 1.4, textTransform: 'uppercase', color: '#4A4656', paddingHorizontal: 10, paddingBottom: 6 },
    craftPopItem: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 5, paddingHorizontal: 10 },
    craftPopDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#FF6B35' },
    craftPopText: { fontFamily: 'Outfit-Regular', fontSize: 12, color: '#D6D1DE' },
    verifyRow: { flexDirection: 'row', gap: 6, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' },
    verifyPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.03)' },
    verifyText: { fontFamily: 'Outfit-Medium', fontSize: 10, color: '#6B6878' },
    connRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
    connPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 3, paddingHorizontal: 10, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)' },
    connPillText: { fontFamily: 'Outfit-Bold', fontSize: 11, color: '#F0ECE6' },

    // ── 4. Connections ──
    // Inline link in the verify row — orange count + chevron so it reads tappable.
    connectionsLink: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2 },
    connectionsCount: { fontFamily: 'Outfit-Bold', fontSize: 12.5, color: '#FF6B35' },
    connectionsLabel: { fontFamily: 'Outfit-Regular', fontSize: 11.5, color: '#9A94A6' },

    // ── 5. Action pills (labelled, left-aligned under the masthead) ──
    ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 20, marginTop: 16 },
    ctaPillWrap: { borderRadius: 100, overflow: 'hidden' },
    ctaPillSolid: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 100 },
    ctaPillSolidText: { fontFamily: 'Outfit-SemiBold', fontSize: 12.5, color: '#fff' },
    ctaPillOutline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
    ctaPillText: { fontFamily: 'Outfit-Medium', fontSize: 12.5, color: '#D6D1DE' },
    ctaPillIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },

    // ── 6. Context tabs ──

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

    // ── 13. Social Links — Icon Circles ──
    socialsSection: { paddingHorizontal: 20, paddingTop: 20, alignItems: 'center' },
    socialsRow: { flexDirection: 'row', justifyContent: 'center', gap: 14 },
    socialCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
    socialCircleGhost: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },

    // ── 14. Reviews — Testimonial Style ──

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
    viewerTopSafe: { position: 'absolute', top: 0, right: 0, left: 0, zIndex: 20, alignItems: 'flex-end' },
    viewerClose: { margin: 12, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
    // Fullscreen video: no card chrome — letterbox falls back to the viewer's own
    // black. Size (winW/winH) is applied inline from useWindowDimensions, not here,
    // because a static snapshot mis-sizes it on web. (NetsaVideoPlayer contain-fits.)
    viewerVideo: { borderRadius: 0, borderWidth: 0, backgroundColor: 'transparent' },
    viewerPlayBadge: { position: 'absolute', alignItems: 'center', gap: 4 },
    viewerPlayText: { fontFamily: 'Outfit-Bold', fontSize: 12, color: 'rgba(255,255,255,0.6)' },
    // Nav pill (V2): floating glass cluster — prev · counter · next.
    viewerBottomSafe: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20, alignItems: 'center', paddingBottom: 24 },
    viewerPill: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6, borderRadius: 999, backgroundColor: 'rgba(10,9,14,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
    viewerPillBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    viewerPillBtnOff: { opacity: 0.28 },
    viewerPillCount: { fontFamily: 'Outfit-Bold', fontSize: 13, letterSpacing: 1, color: '#fff', paddingHorizontal: 12, minWidth: 58, textAlign: 'center' },
});
