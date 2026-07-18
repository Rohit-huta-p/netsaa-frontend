// src/features/profile/PerformerProfile.tsx
// Mockup-matched performer profile shown to a CLIENT viewing an artist/Creative
// Lead (from a proposal header or Talent). Reuses the same useUser data +
// useConnectionStatus as ProfileScreen, so reviews/media/tier are real. The
// shared ProfileScreen is left untouched for artist self-view / gig-hiring.
import { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Image, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, Star, MessageCircle, Check, Clock, UserPlus, Play } from 'lucide-react-native';
import { useUser } from '@/hooks/useUser';
import { useConnectionStatus } from '@/features/profile/hooks/useConnectionStatus';
import { useMobileTabBarHeight } from '@/components/MobileTabBar';
import conversationService from '@/services/conversationService';
import authService from '@/services/authService';

const TIER: Record<string, { c: string; label: string }> = {
    new: { c: '#6B7280', label: 'New' },
    rising: { c: '#3B82F6', label: 'Rising' },
    trusted: { c: '#34D399', label: 'Trusted' },
    verified: { c: '#EAB308', label: 'Verified' },
};
const initialsOf = (n: string) => n.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

function SectionLabel({ children }: { children: string }) {
    return (
        <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#a1a1aa', fontSize: 10.5, letterSpacing: 1.4, textTransform: 'uppercase', marginTop: 24, marginBottom: 12 }}>
            {children}
        </Text>
    );
}

export function PerformerProfile({ userId }: { userId: string }) {
    const router = useRouter();
    const navClearance = (useMobileTabBarHeight() || 64) + 24;
    const { data, isLoading, error } = useUser(userId);
    const { connectionStatus, sendRequest, withdrawRequest, isConnectionLoading } = useConnectionStatus(userId, false);

    const [msgBusy, setMsgBusy] = useState(false);
    const [connBusy, setConnBusy] = useState(false);

    // Record a profile view. This screen only renders for a client viewing
    // another person's performer profile, so it is always a non-owner view.
    useEffect(() => {
        if (userId) authService.recordProfileView(userId);
    }, [userId]);

    if (isLoading && !data) {
        return <View style={{ flex: 1, backgroundColor: '#09090b', alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color="#FF6B35" /></View>;
    }
    if (error || !data) {
        return (
            <View style={{ flex: 1, backgroundColor: '#09090b', alignItems: 'center', justifyContent: 'center', padding: 30 }}>
                <Text style={{ fontFamily: 'Outfit-Regular', color: '#71717a', fontSize: 14, textAlign: 'center' }}>Couldn't load this profile.</Text>
            </View>
        );
    }

    const u = data as any;
    const name = u.displayName || u.firstName || 'Creative Lead';
    const craftArr = u.artistType || u.artistTypes || [];
    const craft = Array.isArray(craftArr) ? craftArr.join(' · ') : craftArr;
    const location = u.location || u.cached?.primaryCity || '';
    const bio = u.bio || u.headline || '';
    const tierKey = (u.trustTier || 'new') as string;
    const tier = TIER[tierKey] || TIER.new;
    const rating = u.cached?.averageRating || u.rating || 0;
    const totalReviews = u.cached?.totalReviews || (u.reviews?.length ?? 0);
    const reviews: any[] = u.reviews || u.cached?.recentReviews || [];
    const gigs = u.stats?.gigsCompleted || u.gigsCompleted || 0;
    const years = u.yearsOfExperience || (Array.isArray(u.experience) ? u.experience.length : 0) || 0;
    const responseRate = u.cached?.responseRate || u.stats?.responseRate || 0;
    const languages: string[] = u.languages || u.artistDetails?.languages || [];
    const travel = u.travelPreference || u.travelWillingness || u.artistDetails?.travelPreferences || '';
    const skills: string[] = u.skills || [];
    const avatarUrl: string | undefined = u.profileImageUrl;
    const media = [
        ...((u.galleryUrls || []) as string[]).map((url) => ({ url, type: 'image' as const })),
        ...((u.videoUrls || []) as string[]).map((url) => ({ url, type: 'video' as const })),
    ];

    const stats = [
        rating > 0 ? { v: `★${Number(rating).toFixed(1)}`, l: `${totalReviews} review${totalReviews === 1 ? '' : 's'}`, gold: true } : null,
        gigs > 0 ? { v: String(gigs), l: 'gigs' } : null,
        years > 0 ? { v: `${years}y`, l: 'experience' } : null,
        responseRate > 0 ? { v: `${responseRate}%`, l: 'responds' } : null,
    ].filter(Boolean) as { v: string; l: string; gold?: boolean }[];

    const facts = [
        languages.length ? { k: 'Languages', v: languages.join(', ') } : null,
        travel ? { k: 'Travel', v: typeof travel === 'string' ? travel.charAt(0).toUpperCase() + travel.slice(1) : 'Yes' } : null,
        ...skills.slice(0, 3).map((s) => ({ k: 'Skill', v: s })),
    ].filter(Boolean) as { k: string; v: string }[];

    const openMessage = async () => {
        if (msgBusy) return;
        setMsgBusy(true);
        try {
            const conv = await conversationService.createConversation(userId);
            router.push((conv?._id ? `/(app)/messages?c=${conv._id}` : '/(app)/messages') as any);
        } catch {
            // keep quiet; user can retry
        } finally {
            setMsgBusy(false);
        }
    };

    const onConnect = async () => {
        if (connBusy || isConnectionLoading) return;
        setConnBusy(true);
        try {
            if (connectionStatus === 'none') await sendRequest();
            else if (connectionStatus === 'pending') await withdrawRequest();
        } catch {
            // surfaced minimally
        } finally {
            setConnBusy(false);
        }
    };
    const connected = connectionStatus === 'connected';
    const pending = connectionStatus === 'pending';

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={{ flex: 1, backgroundColor: '#09090b' }}>
                {/* Nav */}
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 54, paddingBottom: 6 }}>
                    <Pressable onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronLeft size={18} color="#f4f4f5" />
                    </Pressable>
                </View>

                <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: navClearance + 92 }} showsVerticalScrollIndicator={false}>
                    {/* Hero */}
                    <View style={{ alignItems: 'center', marginTop: 6 }}>
                        <View style={{ position: 'relative', marginBottom: 12 }}>
                            {avatarUrl ? (
                                <Image source={{ uri: avatarUrl }} style={{ width: 84, height: 84, borderRadius: 26 }} />
                            ) : (
                                <View style={{ width: 84, height: 84, borderRadius: 26, backgroundColor: 'rgba(255,107,53,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', color: '#FF6B35', fontSize: 30 }}>{initialsOf(name)}</Text>
                                </View>
                            )}
                            <View style={{ position: 'absolute', bottom: -4, alignSelf: 'center', flexDirection: 'row', backgroundColor: tier.c, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 2, borderColor: '#09090b' }}>
                                <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#0b0b0b', fontSize: 9, letterSpacing: 0.3, textTransform: 'uppercase' }}>{tier.label}</Text>
                            </View>
                        </View>
                        <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', color: '#f4f4f5', fontSize: 26, letterSpacing: -0.3 }}>{name}</Text>
                        {!!(craft || location) && (
                            <Text style={{ fontFamily: 'Outfit-Regular', color: '#a1a1aa', fontSize: 12.5, marginTop: 4 }}>
                                {[craft, location].filter(Boolean).join(' · ')}
                            </Text>
                        )}
                    </View>

                    {/* Stats */}
                    {stats.length > 0 && (
                        <View style={{ flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingVertical: 14, marginTop: 18 }}>
                            {stats.map((st, i) => (
                                <View key={i} style={{ flex: 1, alignItems: 'center', borderLeftWidth: i === 0 ? 0 : 1, borderLeftColor: 'rgba(255,255,255,0.07)' }}>
                                    <Text style={{ fontFamily: 'Outfit-SemiBold', color: st.gold ? '#EAB308' : '#f4f4f5', fontSize: 15 }}>{st.v}</Text>
                                    <Text style={{ fontFamily: 'Outfit-Regular', color: '#52525b', fontSize: 9.5, letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 3 }}>{st.l}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Showcase */}
                    {media.length > 0 && (
                        <>
                            <SectionLabel>Showcase</SectionLabel>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={{ flexDirection: 'row', gap: 9 }}>
                                    {media.slice(0, 8).map((m, i) => (
                                        <View key={i} style={{ width: 104, height: 138, borderRadius: 14, overflow: 'hidden', backgroundColor: '#17151d' }}>
                                            <Image source={{ uri: m.url }} style={{ width: '100%', height: '100%' }} />
                                            {m.type === 'video' && (
                                                <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
                                                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.45)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Play size={13} color="#fff" fill="#fff" />
                                                    </View>
                                                </View>
                                            )}
                                        </View>
                                    ))}
                                </View>
                            </ScrollView>
                        </>
                    )}

                    {/* About */}
                    {!!bio && (
                        <>
                            <SectionLabel>About</SectionLabel>
                            <Text style={{ fontFamily: 'Outfit-Regular', color: '#c9c4cc', fontSize: 13, lineHeight: 20 }}>{bio}</Text>
                        </>
                    )}

                    {/* Good to know */}
                    {facts.length > 0 && (
                        <>
                            <SectionLabel>Good to know</SectionLabel>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                {facts.map((f, i) => (
                                    <View key={i} style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingVertical: 9, paddingHorizontal: 12 }}>
                                        <Text style={{ fontFamily: 'Outfit-Regular', color: '#71717a', fontSize: 11.5 }}>
                                            <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#f4f4f5' }}>{f.k}</Text> · {f.v}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}

                    {/* Reviews */}
                    {reviews.filter((r) => r?.text || r?.comment || r?.review).length > 0 && (
                        <>
                            <SectionLabel>Reviews</SectionLabel>
                            {reviews.slice(0, 3).map((r, i) => {
                                const text = r?.text || r?.comment || r?.review || '';
                                if (!text) return null;
                                const who = r?.reviewerName || r?.authorName || r?.name || 'Client';
                                return (
                                    <View key={i} style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 10 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                                            <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#f4f4f5', fontSize: 12.5, flex: 1 }} numberOfLines={1}>{who}</Text>
                                            {!!r?.rating && (
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                                                    <Star size={11} color="#EAB308" fill="#EAB308" />
                                                    <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#EAB308', fontSize: 11 }}>{Number(r.rating).toFixed(1)}</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={{ fontFamily: 'Outfit-Regular', color: '#a1a1aa', fontSize: 12.5, lineHeight: 18, fontStyle: 'italic' }} numberOfLines={4}>"{text}"</Text>
                                    </View>
                                );
                            })}
                        </>
                    )}
                </ScrollView>

                {/* Sticky actions */}
                <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, backgroundColor: '#09090b', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }}>
                    <Pressable onPress={openMessage} disabled={msgBusy} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 14, paddingVertical: 15, opacity: msgBusy ? 0.6 : 1 }}>
                        {msgBusy ? <ActivityIndicator size="small" color="#f4f4f5" /> : <><MessageCircle size={17} color="#f4f4f5" /><Text style={{ fontFamily: 'Outfit-SemiBold', color: '#f4f4f5', fontSize: 14.5 }}>Message</Text></>}
                    </Pressable>
                    <Pressable
                        onPress={connected ? undefined : onConnect}
                        disabled={connected || connBusy}
                        style={{
                            flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 15,
                            backgroundColor: connected ? 'rgba(52,211,153,0.14)' : pending ? 'rgba(255,255,255,0.06)' : '#8B5CF6',
                            opacity: connBusy ? 0.6 : 1,
                        }}
                    >
                        {connBusy ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : connected ? (
                            <><Check size={16} color="#34D399" /><Text style={{ fontFamily: 'Outfit-SemiBold', color: '#34D399', fontSize: 14.5 }}>Connected</Text></>
                        ) : pending ? (
                            <><Clock size={16} color="#a1a1aa" /><Text style={{ fontFamily: 'Outfit-SemiBold', color: '#a1a1aa', fontSize: 14.5 }}>Requested</Text></>
                        ) : (
                            <><UserPlus size={16} color="#fff" /><Text style={{ fontFamily: 'Outfit-SemiBold', color: '#fff', fontSize: 14.5 }}>Connect</Text></>
                        )}
                    </Pressable>
                </View>
            </View>
        </>
    );
}

export default PerformerProfile;
