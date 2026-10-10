// src/features/profile/SpotlightProfile.tsx
//
// "Spotlight" — the redesigned artist profile (editorial single column).
// Rendered in place of the legacy ProfileScreen when the `spotlightProfile`
// feature flag is on (ProfileScreen stays as the fallback). Same prop
// contract + same data source (useUser / useConnectionStatus), so the routes
// can swap the two freely.
//
// Stage A (this file) is the PRESENTATIONAL rebuild — everything in the final
// mockup except the LinkedIn-style "Featured" reel, which needs a new backend
// data model and lands in stage B. Zones: halo header + quiet connect logic,
// about, skills, showcase bento (kept from the current design), experience
// timeline, languages, "Find me on" rows, owner edit affordances.
//
// Mockup:  DOCS/04-design/mockups/profile-artist-spotlight-FINAL.html
// Viewer:  src/components/profile/MediaViewer.tsx (editorial-plate lightbox)
import { useState } from 'react';
import {
    View, Text, Pressable, ScrollView, Image, ActivityIndicator,
    Linking, Share, StyleSheet, Dimensions, Alert, useWindowDimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import {
    ChevronLeft, Share2, Settings, UserPlus, Clock, MessageCircle, MoreHorizontal,
    MapPin, Play, BadgeCheck, Instagram, Youtube, Globe, ExternalLink, Pencil, Camera,
    Music2, UserMinus, Ban, Flag, Image as LucideImage, FileText, Plus,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useUser } from '@/hooks/useUser';
import { useConnectionStatus } from '@/features/profile/hooks/useConnectionStatus';
import { useMutualConnections, useConnectionDegree, useMyConnectionsCount } from '@/hooks/useConnectionMeta';
import { useMobileTabBarHeight } from '@/components/MobileTabBar';
import { useProfileUiStore } from '@/stores/profileUiStore';
import conversationService from '@/services/conversationService';
import { ProfileEditModal } from '@/features/profile/components/ProfileEditModal';
import type { ProfileData, ProfileVideoReel, FeaturedItem, FeaturedAttachment } from '@/components/profile/types';
import MediaViewer from '@/components/profile/MediaViewer';
import FeaturedEditSheet, { type ShowcaseRef } from '@/features/profile/components/FeaturedEditSheet';
import MarkdownText from '@/components/inputs/MarkdownText';

type MediaItem = { url: string; type: 'image' | 'video'; muxPlaybackId?: string; aspectRatio?: string; title?: string; location?: string };
type LinkRow = { key: string; label: string; display: string; url: string; icon: React.ReactNode };

// ── Palette (mirrors the mockup tokens) ──
const C = {
    screen: '#0A0A10', card: '#0F0F12', border: '#1F1F23', border2: '#27272A',
    orange: '#FF6B35', green: '#22C55E', blue: '#3B82F6', violet: '#8B5CF6',
    t1: '#FFFFFF', t2: '#E5E5E5', t3: '#D4D4D8', t4: '#A1A1AA', t5: '#71717A', t6: '#52525B',
};
const PAD = 18;
const GAP = 7;
const SCREEN_W = Dimensions.get('window').width;
const GRID_W = SCREEN_W - PAD * 2;
const COL = (GRID_W - GAP * 2) / 3;
const COL2 = COL * 2 + GAP;

// Gradient placeholders for empty owner slots (warm, never flat grey).
const GRAD: [string, string][] = [
    ['#2a1206', '#120a14'], ['#2a0f22', '#120710'], ['#1a1030', '#0d0a16'],
    ['#07202a', '#0a0f14'], ['#2a2208', '#121005'], ['#2a1206', '#120a0a'],
    ['#1a1030', '#0d0a16'], ['#07202a', '#0a0f14'],
];

const initialsOf = (n: string) => n.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
const urlify = (v: string) => (/^https?:\/\//i.test(v) ? v : `https://${v}`);
const stripProto = (v: string) => v.replace(/^https?:\/\//i, '').replace(/\/$/, '');

// ── Section header: mono label + hairline rule across the row (locked S·4) ──
function Section({ label, children, style }: { label: string; children: React.ReactNode; style?: any }) {
    return (
        <View style={[{ paddingHorizontal: PAD }, style]}>
            <View style={st.secHead}>
                <Text style={st.secLabel}>{label}</Text>
                <View style={st.secRule} />
            </View>
            {children}
        </View>
    );
}

export function SpotlightProfile({ userId, isOwner }: {
    userId: string;
    isOwner: boolean;
    gigContext?: { gigId?: string; applicationId?: string; fromGig?: string };
    highlightMissing?: boolean;
}) {
    const router = useRouter();
    const navClearance = (useMobileTabBarHeight() || 64) + 24;
    const openSheet = useProfileUiStore((s) => s.openSheet);
    // Explicit px size for the ambient-bloom <Svg>: without width/height it
    // falls back to the SVG default intrinsic size (300x150) on web, painting
    // only a small box instead of the full screen.
    const { width: winW, height: winH } = useWindowDimensions();

    const { data, isLoading, error } = useUser(userId);
    const {
        connectionStatus, sendRequest, withdrawRequest, removeConnection, blockUser, isConnectionLoading,
    } = useConnectionStatus(userId, isOwner);
    const { data: mutualData } = useMutualConnections(isOwner ? undefined : userId);
    const { data: degreeData } = useConnectionDegree(isOwner ? undefined : userId);
    const { data: myConnectionsCount } = useMyConnectionsCount(isOwner);

    const [viewerIndex, setViewerIndex] = useState<number | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [featuredEdit, setFeaturedEdit] = useState<{ open: boolean; index: number | null }>({ open: false, index: null });
    const openEditor = (index: number | null) => setFeaturedEdit({ open: true, index });
    const [connBusy, setConnBusy] = useState(false);
    const [msgBusy, setMsgBusy] = useState(false);

    if (isLoading && !data) {
        return <View style={st.center}><ActivityIndicator size="large" color={C.orange} /></View>;
    }
    if (error || !data) {
        return (
            <View style={[st.center, { padding: 30 }]}>
                <Text style={{ fontFamily: 'Outfit-Regular', color: C.t5, fontSize: 14, textAlign: 'center' }}>
                    Couldn't load this profile.
                </Text>
            </View>
        );
    }

    // ── Data extraction (same backend mapping as ProfileScreen) ──
    const u = data as any;
    const name = u.displayName || u.firstName || 'Artist';
    const craftRaw = u.artistType || u.artistTypes || [];
    const craftList: string[] = Array.isArray(craftRaw) ? craftRaw.filter(Boolean).map(String) : craftRaw ? [String(craftRaw)] : [];
    const CRAFT_CAP = 3;
    const craftsShown = craftList.slice(0, CRAFT_CAP);
    const craftsHidden = craftList.length - craftsShown.length;
    const kicker = craftsShown.join('  ·  ').toUpperCase() + (craftsHidden > 0 ? `  +${craftsHidden}` : '');
    const city = u.location || u.cached?.primaryCity || '';
    const bio = u.bio || u.headline || '';
    const skills: string[] = u.skills || [];
    const languages: string[] = u.languages || u.artistDetails?.languages || [];
    const experience: any[] = u.experience || [];
    const featured: FeaturedItem[] = u.featured || [];
    const avatarUrl: string | undefined = u.profileImageUrl;
    const availability: string | null = u.availability || u.availabilityStatus || null;

    const phoneVerified = !!(u.phoneVerifiedAt || u.phoneVerified || u.isPhoneVerified);
    const emailVerified = !!(u.emailVerifiedAt || u.emailVerified || u.isEmailVerified);
    const verified = (phoneVerified && emailVerified) || u.trustTier === 'verified' || !!u.isVerified;

    // Connections as quiet meta (degree/mutual are viewer-relative → visitor only).
    const connections = isOwner ? (myConnectionsCount ?? 0) : (u.stats?.connections || 0);
    const mutual = mutualData?.count ?? 0;
    const degreeNum: number | null = isOwner ? null : (degreeData?.degree ?? null);
    const degree = degreeNum === 1 ? '1st' : degreeNum === 2 ? '2nd' : degreeNum === 3 ? '3rd' : null;

    // Showcase media — prefer structured `gallery` (per-photo caption/location).
    const photoItems = (u.gallery?.length ? u.gallery : ((u.galleryUrls || []) as string[]).map((url) => ({ url }))) as { url: string; caption?: string; location?: string }[];
    const readyReels = ((u.videoReels || []) as ProfileVideoReel[]).filter((r) => r.status === 'ready');
    const media: MediaItem[] = [
        ...photoItems.map((p) => ({ url: p.url, type: 'image' as const, title: p.caption, location: p.location })),
        ...readyReels.map((r) => ({ url: r.thumbnailUrl || '', type: 'video' as const, muxPlaybackId: r.muxPlaybackId, aspectRatio: r.aspectRatio, title: r.caption, location: r.location })),
    ];
    const photoCount = photoItems.length;
    const reelCount = readyReels.length;
    // Showcase media the owner can attach to a Featured item (photos + reels).
    const showcaseRefs: ShowcaseRef[] = media.map((m) => ({ type: m.type === 'video' ? 'video' : 'photo', url: m.url, thumbnailUrl: m.url, muxPlaybackId: m.muxPlaybackId, label: m.title }));

    // "Find me on" — labelled rows for whichever socials are present.
    const links: LinkRow[] = [];
    if (u.instagramHandle) {
        const h = String(u.instagramHandle).trim();
        links.push({ key: 'ig', label: 'Instagram', display: h.startsWith('@') ? h : `@${h}`, url: `https://instagram.com/${h.replace(/^@/, '')}`, icon: <Instagram size={17} color="#E863B0" /> });
    }
    if (u.youtubeUrl) {
        const v = String(u.youtubeUrl).trim();
        links.push({ key: 'yt', label: 'YouTube', display: stripProto(v), url: urlify(v), icon: <Youtube size={17} color="#F06A6A" /> });
    }
    if (u.spotifyUrl) {
        const v = String(u.spotifyUrl).trim();
        links.push({ key: 'sp', label: 'Spotify', display: stripProto(v), url: urlify(v), icon: <Music2 size={17} color="#1DB954" /> });
    }
    if (u.soundcloudUrl) {
        const v = String(u.soundcloudUrl).trim();
        links.push({ key: 'sc', label: 'SoundCloud', display: stripProto(v), url: urlify(v), icon: <Music2 size={17} color="#FF7700" /> });
    }
    const site = u.website || u.organizationWebsite;
    if (site) {
        const v = String(site).trim();
        links.push({ key: 'web', label: 'Website', display: stripProto(v), url: urlify(v), icon: <Globe size={17} color="#5BC7DE" /> });
    }

    const availColor = availability === 'available' ? C.green : availability === 'tentative' ? '#EAB308' : availability === 'busy' ? '#EF4444' : null;

    // ── Actions ──
    const haptic = () => { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch { /* noop */ } };

    const onConnect = async () => {
        if (connBusy || isConnectionLoading) return;
        haptic();
        setConnBusy(true);
        try {
            if (connectionStatus === 'none') await sendRequest();
            else if (connectionStatus === 'pending') await withdrawRequest();
        } catch { /* hook surfaces its own errors */ }
        finally { setConnBusy(false); }
    };

    const openMessage = async () => {
        if (msgBusy) return;
        setMsgBusy(true);
        try {
            const conv = await conversationService.createConversation(userId);
            router.push((conv?._id ? `/(app)/inbox?c=${conv._id}` : '/(app)/inbox') as any);
        } catch { /* user can retry */ }
        finally { setMsgBusy(false); }
    };

    const onRemove = () => {
        setMenuOpen(false);
        Alert.alert('Remove connection?', `You'll no longer be connected with ${name}.`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => { removeConnection().catch(() => {}); } },
        ]);
    };
    const onBlock = () => {
        setMenuOpen(false);
        Alert.alert(`Block ${name}?`, "They won't be able to connect with or message you.", [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Block', style: 'destructive', onPress: () => { blockUser().catch(() => {}); } },
        ]);
    };
    const onReport = () => { setMenuOpen(false); router.push('/(app)/support' as any); };

    const onShare = async () => {
        try { await Share.share({ message: `${name}${kicker ? ` — ${craftsShown.join(', ')}` : ''} on NETSA` }); } catch { /* cancelled */ }
    };

    const connected = connectionStatus === 'connected';
    const pending = connectionStatus === 'pending';

    // ── Bento slot (kept from the current design; Spotlight tile styling) ──
    const Slot = ({ i, w, h }: { i: number; w: number; h: number }) => {
        const item = media[i];
        if (!item) {
            if (!isOwner) return <View style={{ width: w, height: h }} />; // visitor: no fake placeholder
            return (
                <Pressable onPress={() => openSheet('media')} style={[st.tile, { width: w, height: h }]}>
                    <LinearGradient colors={GRAD[i % GRAD.length]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.fill}>
                        <View style={st.tilePh}><LucideImage size={w > COL ? 26 : 20} color="rgba(255,255,255,0.08)" strokeWidth={1.5} /></View>
                    </LinearGradient>
                </Pressable>
            );
        }
        return (
            <Pressable onPress={() => setViewerIndex(i)} style={[st.tile, { width: w, height: h }]}>
                <Image source={{ uri: item.url }} style={st.fill} />
                {item.type === 'video' && (
                    <>
                        <View style={st.tileScrim} />
                        <View style={st.tilePlay}><Play size={13} color="#fff" fill="#fff" /></View>
                    </>
                )}
            </Pressable>
        );
    };

    // ── Featured attachment + card (LinkedIn-style highlights under About) ──
    const openAttachment = (a: FeaturedAttachment) => {
        const href = a.url || a.thumbnailUrl;
        if (href) Linking.openURL(href).catch(() => {});
    };
    const ATT_LABEL: Record<FeaturedAttachment['type'], string> = { photo: 'Photo', video: 'Video', pdf: 'PDF', link: 'Link' };
    const Att = ({ a }: { a: FeaturedAttachment }) => {
        const hasThumb = !!a.thumbnailUrl && (a.type === 'photo' || a.type === 'video');
        return (
            <Pressable onPress={() => openAttachment(a)} style={st.att}>
                <View style={st.athumb}>
                    {hasThumb && <Image source={{ uri: a.thumbnailUrl }} style={StyleSheet.absoluteFill} />}
                    <View style={st.atypeBadge}><Text style={st.atypeTx}>{ATT_LABEL[a.type]}</Text></View>
                    {a.type === 'video' ? (
                        <View style={st.aplay}><Play size={12} color="#fff" fill="#fff" /></View>
                    ) : a.type === 'pdf' ? (
                        <FileText size={21} color={C.t4} />
                    ) : a.type === 'link' ? (
                        <Globe size={21} color={C.t4} />
                    ) : null}
                </View>
                {!!a.label && <Text style={st.albl} numberOfLines={2}>{a.label}</Text>}
            </Pressable>
        );
    };
    const FeaturedCard = ({ item, index, full }: { item: FeaturedItem; index: number; full?: boolean }) => {
        const atts = item.attachments || [];
        return (
            <View style={[st.fitem, full ? { width: '100%' } : { width: 268 }]}>
                <View style={st.fcardHead}>
                    <Text style={[st.fititle, { flex: 1, paddingHorizontal: 0 }]} numberOfLines={2}>{item.title}</Text>
                    {isOwner && (
                        <Pressable onPress={() => openEditor(index)} hitSlop={8} style={st.fcardEdit}><Pencil size={13} color={C.t4} /></Pressable>
                    )}
                </View>
                {!!item.description && (
                    <MarkdownText value={item.description} color={C.t4} size={12} lineHeight={18} accent={C.orange} style={{ paddingHorizontal: 15, marginTop: 6 }} />
                )}
                {atts.length > 0 && (
                    <>
                        <Text style={st.attlab}>{atts.length} attachment{atts.length === 1 ? '' : 's'}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 9, paddingHorizontal: 15, paddingTop: 9 }}>
                            {atts.map((a, i) => <Att key={i} a={a} />)}
                        </ScrollView>
                    </>
                )}
            </View>
        );
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={{ flex: 1, backgroundColor: C.screen }}>
                {/* Ambient soft-orange blooms over near-black (B·4) */}
                <Svg width={winW} height={winH} style={StyleSheet.absoluteFill} pointerEvents="none">
                    <Defs>
                        <RadialGradient id="b1" cx="10%" cy="4%" r="60%"><Stop offset="0" stopColor="#FF6B35" stopOpacity={0.16} /><Stop offset="1" stopColor="#FF6B35" stopOpacity={0} /></RadialGradient>
                        <RadialGradient id="b2" cx="98%" cy="22%" r="55%"><Stop offset="0" stopColor="#FF7A38" stopOpacity={0.12} /><Stop offset="1" stopColor="#FF7A38" stopOpacity={0} /></RadialGradient>
                        <RadialGradient id="b3" cx="50%" cy="104%" r="60%"><Stop offset="0" stopColor="#FF8C46" stopOpacity={0.1} /><Stop offset="1" stopColor="#FF8C46" stopOpacity={0} /></RadialGradient>
                    </Defs>
                    <Rect x="0" y="0" width={winW} height={winH} fill="url(#b1)" />
                    <Rect x="0" y="0" width={winW} height={winH} fill="url(#b2)" />
                    <Rect x="0" y="0" width={winW} height={winH} fill="url(#b3)" />
                </Svg>

                {/* Nav overlay — back + (owner: settings | visitor: share) */}
                <View style={st.nav}>
                    <Pressable onPress={() => router.back()} style={st.navBtn}><ChevronLeft size={18} color="#fff" /></Pressable>
                    {isOwner ? (
                        <Pressable onPress={() => router.push('/(app)/settings' as any)} style={st.navBtn}><Settings size={16} color="#fff" /></Pressable>
                    ) : (
                        <Pressable onPress={onShare} style={st.navBtn}><Share2 size={16} color="#fff" /></Pressable>
                    )}
                </View>

                <ScrollView contentContainerStyle={{ paddingBottom: navClearance + 40 }} showsVerticalScrollIndicator={false}>
                    {/* ── Header — centered halo portrait ── */}
                    <View style={st.header}>
                        <View style={st.avatarWrap}>
                            <View style={st.ring}>
                                {avatarUrl ? (
                                    <Image source={{ uri: avatarUrl }} style={st.avatar} />
                                ) : (
                                    <LinearGradient colors={['#3a2418', '#17151d']} start={{ x: 0.7, y: 0.2 }} end={{ x: 0, y: 1 }} style={st.avatar}>
                                        <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', color: '#FFB488', fontSize: 38 }}>{initialsOf(name)}</Text>
                                    </LinearGradient>
                                )}
                            </View>
                            {availColor && <View style={[st.pdot, { backgroundColor: availColor, shadowColor: availColor }]} />}
                            {isOwner && (
                                <Pressable onPress={() => openSheet('media')} style={st.camBadge}><Camera size={14} color="#fff" /></Pressable>
                            )}
                        </View>

                        <View style={st.nameRow}>
                            <Text style={st.name}>{name}</Text>
                            {verified && <BadgeCheck size={18} color={C.blue} fill="rgba(59,130,246,0.14)" />}
                        </View>
                        {!!kicker && <Text style={st.kicker} numberOfLines={1}>{kicker}</Text>}
                        {!!city && (
                            <View style={st.cityRow}><MapPin size={12} color={C.t5} /><Text style={st.city}>{city}</Text></View>
                        )}

                        {(connections > 0 || degree || mutual > 0) && (
                            <Text style={st.cmeta}>
                                {degree && <Text style={st.cdeg}>{degree}</Text>}
                                {degree && (connections > 0 || mutual > 0) ? <Text style={st.csep}>  ·  </Text> : null}
                                {connections > 0 && <><Text style={st.cstrong}>{connections}</Text> connections</>}
                                {connections > 0 && mutual > 0 ? <Text style={st.csep}>  ·  </Text> : null}
                                {mutual > 0 && <><Text style={st.cstrong}>{mutual}</Text> mutual</>}
                            </Text>
                        )}

                        {/* One quiet contextual action */}
                        <View style={st.actWrap}>
                            {isOwner ? (
                                <Pressable onPress={() => openSheet('header')} style={[st.abtn, st.abtnGhost]}>
                                    <Pencil size={14} color={C.t3} /><Text style={[st.abtnTx, { color: C.t3 }]}>Edit profile</Text>
                                </Pressable>
                            ) : connected ? (
                                <View style={{ alignItems: 'center' }}>
                                    <View style={st.actRow}>
                                        <Pressable onPress={openMessage} disabled={msgBusy} style={[st.abtn, st.abtnConnect]}>
                                            {msgBusy ? <ActivityIndicator size="small" color="#CDBBF5" /> : <><MessageCircle size={15} color="#CDBBF5" /><Text style={[st.abtnTx, { color: '#CDBBF5' }]}>Message</Text></>}
                                        </Pressable>
                                        <Pressable onPress={() => { haptic(); setMenuOpen((v) => !v); }} style={st.moreBtn}><MoreHorizontal size={18} color={C.t4} /></Pressable>
                                    </View>
                                    {menuOpen && (
                                        <View style={st.menu}>
                                            <Pressable onPress={onRemove} style={st.menuItem}><UserMinus size={15} color={C.t3} /><Text style={st.menuTx}>Remove connection</Text></Pressable>
                                            <View style={st.menuDiv} />
                                            <Pressable onPress={onBlock} style={st.menuItem}><Ban size={15} color="#EF8A8A" /><Text style={[st.menuTx, { color: '#EF8A8A' }]}>Block</Text></Pressable>
                                            <View style={st.menuDiv} />
                                            <Pressable onPress={onReport} style={st.menuItem}><Flag size={15} color={C.t4} /><Text style={st.menuTx}>Report</Text></Pressable>
                                        </View>
                                    )}
                                </View>
                            ) : pending ? (
                                <Pressable onPress={onConnect} disabled={connBusy} style={[st.abtn, st.abtnGhost]}>
                                    {connBusy ? <ActivityIndicator size="small" color={C.t4} /> : <><Clock size={14} color={C.t4} /><Text style={[st.abtnTx, { color: C.t4 }]}>Requested</Text></>}
                                </Pressable>
                            ) : (
                                <Pressable onPress={onConnect} disabled={connBusy} style={[st.abtn, st.abtnConnect]}>
                                    {connBusy ? <ActivityIndicator size="small" color="#CDBBF5" /> : <><UserPlus size={15} color={C.violet} /><Text style={[st.abtnTx, { color: '#CDBBF5' }]}>Connect</Text></>}
                                </Pressable>
                            )}
                        </View>
                    </View>

                    {/* ── About ── */}
                    {(!!bio || isOwner) && (
                        <Section label="About" style={{ marginTop: 20 }}>
                            {bio ? (
                                <View style={st.quote}>
                                    <Text style={st.quoteMark}>“</Text>
                                    <Text style={st.bio}>{bio}</Text>
                                </View>
                            ) : (
                                <Pressable onPress={() => openSheet('about')}><Text style={st.addTx}>Tell people about your craft and journey</Text></Pressable>
                            )}
                        </Section>
                    )}

                    {/* ── Featured (one highlight at a time) ── */}
                    {(featured.length > 0 || isOwner) && (
                        <View style={{ marginTop: 22 }}>
                            <View style={{ paddingHorizontal: PAD }}>
                                <View style={st.secHead}>
                                    <Text style={st.secLabel}>Featured</Text>
                                    <View style={st.secRule} />
                                </View>
                            </View>
                            {featured.length === 0 ? (
                                <View style={{ paddingHorizontal: PAD }}>
                                    <Pressable onPress={() => openEditor(null)} style={st.featAdd}>
                                        <Plus size={15} color={C.orange} /><Text style={st.featAddTx}>Add featured highlight</Text>
                                    </Pressable>
                                </View>
                            ) : featured.length === 1 ? (
                                <View style={{ paddingHorizontal: PAD }}><FeaturedCard item={featured[0]} index={0} full /></View>
                            ) : (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingLeft: PAD, paddingRight: PAD }}>
                                    {featured.map((item, i) => <FeaturedCard key={i} item={item} index={i} />)}
                                </ScrollView>
                            )}
                            {isOwner && featured.length > 0 && (
                                <View style={{ paddingHorizontal: PAD, marginTop: 11 }}>
                                    <Pressable onPress={() => openEditor(null)} style={st.addAnother}>
                                        <Plus size={13} color={C.orange} /><Text style={st.addAnotherTx}>Add another highlight</Text>
                                    </Pressable>
                                </View>
                            )}
                        </View>
                    )}

                    {/* ── Skills ── */}
                    {(skills.length > 0 || isOwner) && (
                        <Section label="Skills" style={{ marginTop: 22 }}>
                            {skills.length > 0 ? (
                                <View style={st.pills}>
                                    {skills.map((sk, i) => (
                                        <View key={i} style={st.pill}><Text style={st.pillTx}>{sk}</Text></View>
                                    ))}
                                </View>
                            ) : (
                                <Pressable onPress={() => openSheet('identity')}><Text style={st.addTx}>Add your skills</Text></Pressable>
                            )}
                        </Section>
                    )}

                    {/* ── Showcase (bento) ── */}
                    {(media.length > 0 || isOwner) && (
                        <Section label={`Showcase${photoCount || reelCount ? `  ·  ${photoCount} photo${photoCount === 1 ? '' : 's'}${reelCount ? `  ·  ${reelCount} reel${reelCount === 1 ? '' : 's'}` : ''}` : ''}`} style={{ marginTop: 22 }}>
                            <View>
                                <View style={{ flexDirection: 'row', gap: GAP }}>
                                    <Slot i={0} w={COL2} h={COL2} />
                                    <View style={{ gap: GAP }}>
                                        <Slot i={1} w={COL} h={COL} />
                                        <Slot i={2} w={COL} h={COL} />
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row', gap: GAP, marginTop: GAP }}>
                                    <Slot i={3} w={COL} h={COL} /><Slot i={4} w={COL} h={COL} /><Slot i={5} w={COL} h={COL} />
                                </View>
                                <View style={{ flexDirection: 'row', gap: GAP, marginTop: GAP }}>
                                    <Slot i={6} w={COL} h={COL} /><Slot i={7} w={COL2} h={COL} />
                                </View>
                            </View>
                        </Section>
                    )}

                    {/* ── Experience ── */}
                    {(experience.length > 0 || isOwner) && (
                        <Section label="Experience" style={{ marginTop: 22 }}>
                            {experience.length > 0 ? (
                                <View style={st.tlWrap}>
                                    <View style={st.tlLine} />
                                    {experience.map((e: any, i: number) => (
                                        <View key={i} style={st.exp}>
                                            <View style={[st.expDot, i === 0 && st.expDotFirst]} />
                                            <Text style={st.expRole}>{e.title || e.role || 'Performance'}</Text>
                                            <Text style={st.expMeta}>
                                                {[e.organization || e.projectName, e.location, e.date].filter(Boolean).join('  ·  ')}
                                            </Text>
                                            {!!e.description && <Text style={st.expDesc}>{e.description}</Text>}
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <Pressable onPress={() => openSheet('experience')}><Text style={st.addTx}>Add past performances & roles</Text></Pressable>
                            )}
                        </Section>
                    )}

                    {/* ── Languages ── */}
                    {languages.length > 0 && (
                        <Section label="Languages" style={{ marginTop: 22 }}>
                            <View style={st.pills}>
                                {languages.map((l, i) => (
                                    <View key={i} style={[st.pill, st.pillPlain]}><Text style={[st.pillTx, { color: C.t4 }]}>{l}</Text></View>
                                ))}
                            </View>
                        </Section>
                    )}

                    {/* ── Find me on ── */}
                    {(links.length > 0 || isOwner) && (
                        <Section label="Find me on" style={{ marginTop: 22 }}>
                            {links.length > 0 ? (
                                <View style={st.lrows}>
                                    {links.map((lnk, i) => (
                                        <Pressable key={lnk.key} onPress={() => Linking.openURL(lnk.url).catch(() => {})} style={[st.lrow, i === 0 && { borderTopWidth: 0 }]}>
                                            <View style={st.lsi}>{lnk.icon}</View>
                                            <View style={{ flex: 1, minWidth: 0 }}>
                                                <Text style={st.llabel}>{lnk.label}</Text>
                                                <Text style={st.lval} numberOfLines={1}>{lnk.display}</Text>
                                            </View>
                                            <ExternalLink size={15} color={C.t5} />
                                        </Pressable>
                                    ))}
                                </View>
                            ) : (
                                <Pressable onPress={() => openSheet('socials')}><Text style={st.addTx}>Add Instagram, YouTube or a website</Text></Pressable>
                            )}
                        </Section>
                    )}
                </ScrollView>

                {/* Editorial-plate media viewer (shared) */}
                {viewerIndex !== null && media[viewerIndex] && (
                    <MediaViewer
                        items={media}
                        index={viewerIndex}
                        onClose={() => setViewerIndex(null)}
                        artist={{ id: userId, name, location: city }}
                        isOwner={isOwner}
                        onEdit={isOwner ? () => { setViewerIndex(null); openSheet('media'); } : undefined}
                    />
                )}

                {/* Owner edit sheets */}
                {isOwner && <ProfileEditModal profileData={buildProfileData(u, { name, city, bio, skills, experience })} />}
                {isOwner && (
                    <FeaturedEditSheet
                        visible={featuredEdit.open}
                        onClose={() => setFeaturedEdit({ open: false, index: null })}
                        userId={userId}
                        featured={featured}
                        editIndex={featuredEdit.index}
                        showcase={showcaseRefs}
                    />
                )}
            </View>
        </>
    );
}

// Assemble the ProfileData the edit modal expects (same shape ProfileScreen builds).
function buildProfileData(u: any, d: { name: string; city: string; bio: string; skills: string[]; experience: any[] }): ProfileData {
    const artistTypes = u.artistType || u.artistTypes || [];
    return {
        fullName: d.name, headline: u.headline || '', location: d.city,
        age: u.age || '', gender: u.gender || '', height: u.height || '',
        skinTone: u.skinTone || '', skinToneHex: u.skinToneHex || '',
        artistType: Array.isArray(artistTypes) ? artistTypes.join(' · ') : artistTypes,
        skills: d.skills, bio: d.bio,
        instagramHandle: u.instagramHandle || '', youtubeUrl: u.youtubeUrl || '',
        spotifyUrl: u.spotifyUrl || '', soundcloudUrl: u.soundcloudUrl || '',
        experience: d.experience,
        featured: u.featured || [],
        hasPhotos: (u.galleryUrls?.length || 0) > 0 || !!u.profileImageUrl,
        profileImageUrl: u.profileImageUrl || '', galleryUrls: u.galleryUrls || [],
        videoUrls: u.videoUrls || [], videoReels: u.videoReels || [],
        organizationName: u.organizationName || '', organizationWebsite: u.organizationWebsite || '',
        organizerTypeCategory: u.organizerTypeCategory || '',
        primaryContactName: u.primaryContactName || '', primaryContactPhone: u.primaryContactPhone || '',
        primaryContactEmail: u.primaryContactEmail || '',
        availability: u.availability || u.availabilityStatus || undefined,
        // @ts-ignore — billingDetails is optional/loose in the modal
        billingDetails: u.billingDetails || u.organizerDetails?.billingDetails || {},
    } as ProfileData;
}

const st = StyleSheet.create({
    center: { flex: 1, backgroundColor: C.screen, alignItems: 'center', justifyContent: 'center' },

    nav: { position: 'absolute', top: 52, left: 16, right: 16, zIndex: 8, flexDirection: 'row', justifyContent: 'space-between' },
    navBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },

    header: { alignItems: 'center', paddingHorizontal: PAD, paddingTop: 108, textAlign: 'center' as any },
    avatarWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center', width: 150, height: 150 },
    ring: { borderRadius: 60, borderWidth: 1.5, borderColor: 'rgba(255,186,130,0.45)', padding: 3 },
    avatar: { width: 104, height: 104, borderRadius: 52, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
    pdot: { position: 'absolute', right: 26, bottom: 26, width: 19, height: 19, borderRadius: 10, borderWidth: 3, borderColor: C.screen, shadowOpacity: 0.7, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
    camBadge: { position: 'absolute', right: 24, top: 24, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },

    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
    name: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 27, color: '#F4F4F5', letterSpacing: -0.3 },
    kicker: { fontFamily: 'SpaceMono-Regular', fontSize: 10, letterSpacing: 1.4, color: C.t4, marginTop: 7, textAlign: 'center' },
    cityRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
    city: { fontFamily: 'Outfit-Regular', fontSize: 12, color: C.t5 },

    cmeta: { fontFamily: 'Outfit-Medium', fontSize: 12.5, color: C.t5, marginTop: 11 },
    cstrong: { fontFamily: 'Outfit-Bold', color: C.t3 },
    cdeg: { fontFamily: 'Outfit-Bold', color: C.violet },
    csep: { color: C.t6 },

    actWrap: { marginTop: 16, alignItems: 'center' },
    actRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
    abtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 22, borderWidth: 1, borderColor: 'transparent', minHeight: 40 },
    abtnTx: { fontFamily: 'Outfit-Bold', fontSize: 13 },
    abtnConnect: { backgroundColor: 'rgba(139,92,246,0.08)', borderColor: 'rgba(139,92,246,0.4)' },
    abtnGhost: { borderColor: 'rgba(255,255,255,0.14)' },
    moreBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },

    menu: { marginTop: 10, width: 210, backgroundColor: '#141418', borderWidth: 1, borderColor: C.border2, borderRadius: 14, overflow: 'hidden' },
    menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14 },
    menuTx: { fontFamily: 'Outfit-SemiBold', fontSize: 13, color: C.t3 },
    menuDiv: { height: 1, backgroundColor: C.border },

    // section header
    secHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 11 },
    secLabel: { fontFamily: 'SpaceMono-Bold', fontSize: 9.5, letterSpacing: 1.6, color: C.t4, textTransform: 'uppercase' },
    secRule: { flex: 1, height: 1, backgroundColor: C.border2 },

    addTx: { fontFamily: 'Outfit-Regular', fontSize: 13, color: C.orange },

    quote: { position: 'relative', paddingTop: 8 },
    quoteMark: { position: 'absolute', top: -20, left: -4, fontFamily: 'DMSerifDisplay_400Regular', fontSize: 60, color: 'rgba(255,107,53,0.18)' },
    bio: { fontFamily: 'Outfit-Light', fontSize: 13.5, lineHeight: 23, color: '#C9C4CC' },

    pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
    pill: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(255,107,53,0.1)', borderWidth: 1, borderColor: 'rgba(255,107,53,0.28)' },
    pillTx: { fontFamily: 'Outfit-Medium', fontSize: 12, color: '#FFC2A8' },
    pillPlain: { backgroundColor: 'transparent', borderColor: C.border2 },

    // bento
    tile: { borderRadius: 13, overflow: 'hidden', backgroundColor: '#17151d' },
    fill: { width: '100%', height: '100%' },
    tilePh: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    tileScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.28)' },
    tilePlay: { position: 'absolute', top: '50%', left: '50%', marginTop: -16, marginLeft: -16, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.45)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.65)', alignItems: 'center', justifyContent: 'center' },

    // experience timeline
    tlWrap: { position: 'relative', paddingLeft: 20 },
    tlLine: { position: 'absolute', left: 4, top: 4, bottom: 4, width: 2, backgroundColor: 'rgba(255,107,53,0.35)' },
    exp: { position: 'relative', marginBottom: 15 },
    expDot: { position: 'absolute', left: -20, top: 4, width: 9, height: 9, borderRadius: 5, backgroundColor: C.orange },
    expDotFirst: {},
    expRole: { fontFamily: 'Outfit-Bold', fontSize: 13, color: '#F4F4F5' },
    expMeta: { fontFamily: 'SpaceMono-Regular', fontSize: 10.5, color: C.t5, marginTop: 2, letterSpacing: 0.3 },
    expDesc: { fontFamily: 'Outfit-Light', fontSize: 11.5, lineHeight: 17, color: C.t4, marginTop: 4 },

    // find me on
    lrows: { borderWidth: 1, borderColor: C.border, borderRadius: 14, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.015)' },
    lrow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: C.border },
    lsi: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: C.border },
    llabel: { fontFamily: 'Outfit-Bold', fontSize: 13, color: '#F4F4F5' },
    lval: { fontFamily: 'Outfit-Regular', fontSize: 11, color: C.t5, marginTop: 1 },

    // featured
    secAction: { marginLeft: 10, padding: 2 },
    featAdd: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: C.border2, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 14 },
    featAddTx: { fontFamily: 'Outfit-SemiBold', fontSize: 13, color: C.orange },
    addAnother: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: C.border2 },
    addAnotherTx: { fontFamily: 'Outfit-SemiBold', fontSize: 12, color: C.t3 },
    fcardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 15 },
    fcardEdit: { padding: 2, marginTop: 1 },
    fitem: { borderWidth: 1, borderColor: C.border, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.015)', paddingTop: 14, paddingBottom: 12, overflow: 'hidden' },
    fititle: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 16, color: '#F4F4F5', paddingHorizontal: 15 },
    fidesc: { fontFamily: 'Outfit-Light', fontSize: 12, lineHeight: 19, color: C.t4, marginTop: 6, paddingHorizontal: 15 },
    attlab: { fontFamily: 'SpaceMono-Regular', fontSize: 8.5, letterSpacing: 1.2, color: C.t6, textTransform: 'uppercase', marginTop: 13, paddingHorizontal: 15 },
    att: { width: 112, borderWidth: 1, borderColor: C.border, borderRadius: 11, overflow: 'hidden', backgroundColor: '#0E0E13' },
    athumb: { height: 72, alignItems: 'center', justifyContent: 'center', backgroundColor: '#15131b' },
    atypeBadge: { position: 'absolute', top: 6, left: 6, zIndex: 1, backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
    atypeTx: { fontFamily: 'SpaceMono-Bold', fontSize: 7, letterSpacing: 0.8, color: '#fff', textTransform: 'uppercase' },
    aplay: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' },
    albl: { paddingHorizontal: 9, paddingTop: 7, paddingBottom: 8, fontFamily: 'Outfit-SemiBold', fontSize: 10.5, lineHeight: 14, color: '#E4E4EA' },
});

export default SpotlightProfile;
