// src/components/profile/MediaViewer.tsx
//
// Editorial-plate media viewer — the fullscreen lightbox that opens when you tap
// a photo/video in the showcase. Design: DOCS/04-design/mockups/profile-media-viewer-editorial.html
//
// - Background is a TRANSLUCENT BLACK TINT over the blurred profile (BlurView +
//   an rgba overlay), so the profile shows through faintly — it's an overlay,
//   not a solid screen.
// - The media is CENTERED; title + location, then Connect / Share (Edit / Delete
//   for the owner), sit just above a thumbnail strip.
// - Swipe left/right to move between items (paged FlatList — works on web + native,
//   unlike react-native-pager-view which imports native-only modules); no TikTok snap.
//
// Replaces the two near-duplicate inline viewers in ProfileScreen.tsx and
// PerformerProfile.tsx. Video plays via NetsaVideoPlayer (Mux); photos via expo-image.
import { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Share, Alert, FlatList, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { X, MapPin, UserPlus, Check, Clock, Share2, Play, Pencil, Trash2 } from 'lucide-react-native';
import NetsaVideoPlayer, { parseAspectRatio, muxPoster } from '@/components/media/NetsaVideoPlayer';
import { useConnectionStatus } from '@/features/profile/hooks/useConnectionStatus';

export type MediaViewerItem = {
    url: string;                    // photo url, or the video's thumbnail/poster url
    type: 'image' | 'video';
    muxPlaybackId?: string;
    aspectRatio?: string;
    title?: string;                 // e.g. "Teentaal solo" — falls back to Reel/Photo
    location?: string;              // e.g. "Nritya Studio, Pune" — falls back to artist.location
};

type Props = {
    items: MediaViewerItem[];
    index: number;
    onClose: () => void;
    artist: { id: string; name: string; location?: string };
    isOwner?: boolean;
    onEdit?: (index: number) => void;
    onDelete?: (index: number) => void;
};

const TINT = 'rgba(6,4,9,0.70)';
const VIOLET = '#8B5CF6';

export default function MediaViewer({ items, index, onClose, artist, isOwner = false, onEdit, onDelete }: Props) {
    const insets = useSafeAreaInsets();
    const { width: winW, height: winH } = useWindowDimensions();
    const pagerRef = useRef<FlatList>(null);
    const stripRef = useRef<FlatList>(null);
    const [cur, setCur] = useState(index);
    const [pagerH, setPagerH] = useState(0);

    const { connectionStatus, isConnectionLoading, sendRequest, withdrawRequest } = useConnectionStatus(artist.id, isOwner);
    const [busy, setBusy] = useState(false);

    useEffect(() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); }, []);

    // keep the active thumbnail in view as the pager moves
    useEffect(() => {
        if (items.length > 1) stripRef.current?.scrollToIndex({ index: cur, animated: true, viewPosition: 0.5 });
    }, [cur, items.length]);

    const go = useCallback((i: number) => {
        if (i === cur) return;
        pagerRef.current?.scrollToIndex({ index: i, animated: true });
        setCur(i);
    }, [cur]);

    if (!items.length) return null;
    const m = items[cur];
    const title = m.title || (m.type === 'video' ? 'Reel' : 'Photo');
    const location = m.location || artist.location;

    // media box: centred, matted with side margins
    const boxW = Math.min(winW - 56, 520);
    const boxH = Math.round(winH * 0.54);

    const onConnect = async () => {
        if (busy || isConnectionLoading) return;
        setBusy(true);
        try {
            if (connectionStatus === 'none') await sendRequest();
            else if (connectionStatus === 'pending') await withdrawRequest();
        } catch { /* surfaced minimally */ } finally { setBusy(false); }
    };

    const onShare = async () => {
        try {
            await Share.share({ message: `${artist.name} on NETSA — https://netsa.app/profile/${artist.id}` });
        } catch { /* user dismissed */ }
    };

    const confirmDelete = () => {
        Alert.alert('Remove this from your showcase?', 'This can’t be undone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => onDelete?.(cur) },
        ]);
    };

    const connected = connectionStatus === 'connected';
    const pending = connectionStatus === 'pending';

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {/* translucent black tint over the blurred profile */}
            <BlurView
                intensity={38}
                tint="dark"
                style={StyleSheet.absoluteFill}
                // Android: enable behind-content blur; harmless on iOS.
                experimentalBlurMethod="dimezisBlurView"
            >
                <View style={[StyleSheet.absoluteFill, { backgroundColor: TINT }]} />
            </BlurView>

            {/* close */}
            <Pressable onPress={onClose} hitSlop={12} style={[styles.close, { top: insets.top + 8 }]} accessibilityLabel="Close">
                <X size={18} color="#fff" />
            </Pressable>

            {/* centred media — swipe left/right */}
            <FlatList
                ref={pagerRef}
                data={items}
                horizontal
                pagingEnabled
                initialScrollIndex={index}
                getItemLayout={(_, i) => ({ length: winW, offset: winW * i, index: i })}
                onScrollToIndexFailed={() => {}}
                onMomentumScrollEnd={(e) => setCur(Math.round(e.nativeEvent.contentOffset.x / winW))}
                showsHorizontalScrollIndicator={false}
                keyExtractor={(it, i) => `${it.url}-${i}`}
                style={styles.pager}
                onLayout={(e) => setPagerH(e.nativeEvent.layout.height)}
                renderItem={({ item: it }) => {
                    const h = pagerH ? Math.min(boxH, pagerH - 24) : boxH;
                    return (
                        <View style={{ width: winW, height: pagerH || boxH, alignItems: 'center', justifyContent: 'center' }}>
                            <View style={{ width: boxW, height: h, borderRadius: 4, overflow: 'hidden' }}>
                                {it.type === 'video' && it.muxPlaybackId ? (
                                    <NetsaVideoPlayer
                                        playbackId={it.muxPlaybackId}
                                        poster={it.url || muxPoster(it.muxPlaybackId)}
                                        fill
                                        contentFit="contain"
                                        showRotateCue={(parseAspectRatio(it.aspectRatio) ?? 0) >= 1.2}
                                        style={{ width: boxW, height: h, borderRadius: 4, backgroundColor: 'transparent' }}
                                    />
                                ) : (
                                    <ExpoImage source={{ uri: it.url }} style={{ width: boxW, height: h }} contentFit="contain" transition={150} />
                                )}
                            </View>
                        </View>
                    );
                }}
            />

            {/* caption · actions · thumbnail strip */}
            <View style={[styles.bottom, { paddingBottom: insets.bottom + 18 }]}>
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
                {!!location && (
                    <View style={styles.locRow}>
                        <MapPin size={12} color="#71717A" />
                        <Text style={styles.loc}>{location}</Text>
                    </View>
                )}

                <View style={styles.actions}>
                    {isOwner ? (
                        <>
                            {onEdit && (
                                <Pressable onPress={() => onEdit(cur)} style={[styles.pbtn, styles.pbtnGhost]}>
                                    <Pencil size={15} color="#F4F4F5" /><Text style={styles.pbtnGhostTxt}>Edit</Text>
                                </Pressable>
                            )}
                            {onDelete && (
                                <Pressable onPress={confirmDelete} style={[styles.pbtn, styles.pbtnGhost]}>
                                    <Trash2 size={15} color="#FCA5A5" /><Text style={[styles.pbtnGhostTxt, { color: '#FCA5A5' }]}>Delete</Text>
                                </Pressable>
                            )}
                            <Pressable onPress={onShare} style={[styles.pbtn, styles.pbtnGhost]}>
                                <Share2 size={14} color="#F4F4F5" /><Text style={styles.pbtnGhostTxt}>Share</Text>
                            </Pressable>
                        </>
                    ) : (
                        <>
                            <Pressable onPress={connected ? undefined : onConnect} disabled={connected || busy} style={[styles.pbtn, styles.pbtnConnect, (connected || busy) && { opacity: 0.7 }]}>
                                {connected ? <Check size={15} color="#34D399" /> : pending ? <Clock size={15} color="#A1A1AA" /> : <UserPlus size={15} color="#CDBBF5" />}
                                <Text style={[styles.pbtnConnectTxt, connected && { color: '#34D399' }, pending && { color: '#A1A1AA' }]}>
                                    {connected ? 'Connected' : pending ? 'Requested' : 'Connect'}
                                </Text>
                            </Pressable>
                            <Pressable onPress={onShare} style={[styles.pbtn, styles.pbtnGhost]}>
                                <Share2 size={14} color="#F4F4F5" /><Text style={styles.pbtnGhostTxt}>Share</Text>
                            </Pressable>
                        </>
                    )}
                </View>

                {items.length > 1 && (
                    <>
                        <Text style={styles.count}>{cur + 1} / {items.length}</Text>
                        <FlatList
                            ref={stripRef}
                            data={items}
                            keyExtractor={(it, i) => `${it.url}-${i}`}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.strip}
                            getItemLayout={(_, i) => ({ length: 53, offset: 53 * i, index: i })}
                            onScrollToIndexFailed={() => {}}
                            renderItem={({ item, index: i }) => (
                                <Pressable onPress={() => go(i)} style={[styles.thumb, i === cur && styles.thumbOn]}>
                                    <ExpoImage
                                        source={{ uri: item.type === 'video' && item.muxPlaybackId ? (item.url || muxPoster(item.muxPlaybackId)) : item.url }}
                                        style={StyleSheet.absoluteFill}
                                        contentFit="cover"
                                    />
                                    {item.type === 'video' && (
                                        <View style={styles.thumbPlay}><Play size={10} color="#fff" fill="#fff" /></View>
                                    )}
                                </Pressable>
                            )}
                        />
                    </>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    close: {
        position: 'absolute', right: 16, zIndex: 10,
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
        alignItems: 'center', justifyContent: 'center',
    },
    pager: { flex: 1 },
    bottom: { paddingHorizontal: 20, paddingTop: 10 },
    title: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 25, color: '#F4F4F5', textAlign: 'center', letterSpacing: -0.3 },
    locRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 9 },
    loc: { fontFamily: 'SpaceMono-Regular', fontSize: 10.5, letterSpacing: 1.3, textTransform: 'uppercase', color: '#71717A' },
    actions: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 15 },
    pbtn: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 9, borderWidth: 1 },
    pbtnConnect: { backgroundColor: 'rgba(139,92,246,0.10)', borderColor: 'rgba(139,92,246,0.4)' },
    pbtnConnectTxt: { fontFamily: 'Outfit-Bold', fontSize: 12.5, color: '#CDBBF5' },
    pbtnGhost: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.16)' },
    pbtnGhostTxt: { fontFamily: 'Outfit-Bold', fontSize: 12.5, color: '#F4F4F5' },
    count: { fontFamily: 'SpaceMono-Regular', fontSize: 11, color: 'rgba(255,255,255,0.72)', textAlign: 'center', marginTop: 22, marginBottom: 10, letterSpacing: 1 },
    strip: { gap: 7, paddingHorizontal: 2 },
    thumb: { width: 46, height: 60, borderRadius: 7, overflow: 'hidden', opacity: 0.42, borderWidth: 1, borderColor: 'transparent', backgroundColor: '#17151d' },
    thumbOn: { opacity: 1, borderColor: '#fff' },
    thumbPlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
});
