// src/components/profile/MediaViewer.tsx
//
// Immersive media viewer — the fullscreen lightbox that opens when you tap a
// photo/video in a showcase or an event gallery.
// Design: DOCS/04-design/mockups/media-viewer-immersive.html
//
// - Media fills the whole screen with `contain`: a portrait clip fills the
//   viewport (hairline letterbox), a landscape clip is centered with equal
//   top/bottom gaps. Chrome overlays the media on fades-out gradients.
// - Chrome: a Back button (top-left) and, top-right, either the owner's ⋯ menu
//   (Share · Edit · Delete) or a lone Share for visitors. Thumbnails sit along
//   the bottom. Tapping the media fades the chrome for a clean, immersive look
//   (on video the tap zone leaves the bottom strip free for the player's own
//   controls).
// - Swipe left/right to move between items (paged FlatList — works on web +
//   native, unlike react-native-pager-view's native-only modules).
import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet, Share, Alert, FlatList, useWindowDimensions, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, MoreHorizontal, Share2, Play, Pencil, Trash2 } from 'lucide-react-native';
import NetsaVideoPlayer, { parseAspectRatio, muxPoster } from '@/components/media/NetsaVideoPlayer';
import { useUiStore } from '@/stores/uiStore';

export type MediaViewerItem = {
    url: string;                    // photo url, or the video's thumbnail/poster url
    type: 'image' | 'video';
    muxPlaybackId?: string;
    aspectRatio?: string;
    title?: string;                 // retained for compat; not shown in the immersive viewer
    location?: string;              // retained for compat; not shown in the immersive viewer
};

type Props = {
    items: MediaViewerItem[];
    index: number;
    onClose: () => void;
    /** The media's owner — used only for the default share message. */
    artist?: { id: string; name: string; location?: string };
    isOwner?: boolean;
    onEdit?: (index: number) => void;
    onDelete?: (index: number) => void;
    /** Overrides the default "share this profile" action (e.g. share an event). */
    onShare?: () => void;
    /** Hide the Share action entirely (e.g. the event viewer shares from its hero instead). Default true. */
    showShare?: boolean;
};

const TINT = 'rgba(6,4,9,0.72)';
const THUMB_H = 60;
// On a video the bottom band owns the player's controls (native <video> bar on
// web, custom bar on native) — keep the tap-to-fade zone clear of it.
const VIDEO_TAP_BOTTOM = 64;

export default function MediaViewer({ items, index, onClose, artist, isOwner = false, onEdit, onDelete, onShare: onShareProp, showShare = true }: Props) {
    const insets = useSafeAreaInsets();
    const { width: winW, height: winH } = useWindowDimensions();
    const pagerRef = useRef<FlatList>(null);
    const stripRef = useRef<FlatList>(null);
    const [cur, setCur] = useState(index);
    const [chromeOn, setChromeOn] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);

    const multi = items.length > 1;

    useEffect(() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); }, []);

    // Full-screen viewer → hide the global bottom nav while it's open.
    useEffect(() => {
        const { pushFullscreenOverlay, popFullscreenOverlay } = useUiStore.getState();
        pushFullscreenOverlay();
        return () => popFullscreenOverlay();
    }, []);

    // keep the active thumbnail in view as the pager moves
    useEffect(() => {
        if (multi) stripRef.current?.scrollToIndex({ index: cur, animated: true, viewPosition: 0.5 });
    }, [cur, multi]);

    // chrome fade (top bar + thumbnails + scrims fade together on a tap)
    const chromeOpacity = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        Animated.timing(chromeOpacity, { toValue: chromeOn ? 1 : 0, duration: 220, useNativeDriver: true }).start();
    }, [chromeOn, chromeOpacity]);

    const go = useCallback((i: number) => {
        if (i === cur) return;
        pagerRef.current?.scrollToIndex({ index: i, animated: true });
        setCur(i);
    }, [cur]);

    const toggleChrome = useCallback(() => { setMenuOpen(false); setChromeOn((v) => !v); }, []);

    if (!items.length) return null;

    const onShare = async () => {
        if (onShareProp) { onShareProp(); return; }
        try {
            await Share.share({ message: `${artist?.name ?? 'This artist'} on NETSA — https://netsa.app/profile/${artist?.id ?? ''}` });
        } catch { /* user dismissed */ }
    };

    const confirmDelete = () => {
        Alert.alert('Remove this from your showcase?', 'This can’t be undone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => onDelete?.(cur) },
        ]);
    };

    return (
        <View style={StyleSheet.absoluteFill}>
            {/* translucent black tint over the blurred profile */}
            <BlurView intensity={38} tint="dark" style={StyleSheet.absoluteFill} experimentalBlurMethod="dimezisBlurView">
                <View style={[StyleSheet.absoluteFill, { backgroundColor: TINT }]} />
            </BlurView>

            {/* MEDIA — full-screen; contain = portrait fills, landscape centers w/ gaps */}
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
                style={StyleSheet.absoluteFill}
                renderItem={({ item: it }) => (
                    <View style={{ width: winW, height: winH, alignItems: 'center', justifyContent: 'center' }}>
                        {it.type === 'video' && it.muxPlaybackId ? (
                            <>
                                <NetsaVideoPlayer
                                    playbackId={it.muxPlaybackId}
                                    poster={it.url || muxPoster(it.muxPlaybackId)}
                                    fill
                                    contentFit="contain"
                                    showRotateCue={(parseAspectRatio(it.aspectRatio) ?? 0) >= 1.2}
                                    style={{ backgroundColor: 'transparent', borderWidth: 0, borderRadius: 0 }}
                                />
                                {/* tap-to-fade over the video, leaving the bottom controls strip free */}
                                <Pressable style={[StyleSheet.absoluteFill, { bottom: insets.bottom + VIDEO_TAP_BOTTOM }]} onPress={toggleChrome} />
                            </>
                        ) : (
                            <Pressable style={StyleSheet.absoluteFill} onPress={toggleChrome}>
                                <ExpoImage source={{ uri: it.url }} style={StyleSheet.absoluteFill} contentFit="contain" transition={150} />
                            </Pressable>
                        )}
                    </View>
                )}
            />

            {/* scrims for chrome legibility — fade with the chrome */}
            <Animated.View pointerEvents="none" style={[styles.topScrim, { height: insets.top + 92, opacity: chromeOpacity }]}>
                <LinearGradient colors={['rgba(0,0,0,0.55)', 'transparent']} style={StyleSheet.absoluteFill} />
            </Animated.View>
            <Animated.View pointerEvents="none" style={[styles.botScrim, { height: insets.bottom + (multi ? 150 : 90), opacity: chromeOpacity }]}>
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={StyleSheet.absoluteFill} />
            </Animated.View>

            {/* TOP BAR — back (left) · owner ⋯ menu / visitor share (right) */}
            <Animated.View
                style={[styles.topbar, { paddingTop: insets.top + 10, opacity: chromeOpacity }]}
                pointerEvents={chromeOn ? 'box-none' : 'none'}
            >
                <Pressable onPress={onClose} hitSlop={10} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Back">
                    <ChevronLeft size={16} color="#fff" />
                </Pressable>
                <View style={{ flex: 1 }} />

                {isOwner ? (
                    <View>
                        <Pressable onPress={() => setMenuOpen((v) => !v)} hitSlop={10} style={[styles.iconBtn, styles.iconBtnStrong]} accessibilityRole="button" accessibilityLabel="More options">
                            <MoreHorizontal size={16} color="#fff" />
                        </Pressable>
                        {menuOpen && (
                            <View style={styles.menu}>
                                {showShare && (
                                    <MenuRow label="Share" onPress={() => { setMenuOpen(false); onShare(); }}>
                                        <Share2 size={14} color="#fff" />
                                    </MenuRow>
                                )}
                                {onEdit && (
                                    <MenuRow label="Edit" onPress={() => { setMenuOpen(false); onEdit(cur); }}>
                                        <Pencil size={14} color="#fff" />
                                    </MenuRow>
                                )}
                                {onDelete && (
                                    <MenuRow label="Delete" danger onPress={() => { setMenuOpen(false); confirmDelete(); }}>
                                        <Trash2 size={14} color="#fca5a5" />
                                    </MenuRow>
                                )}
                            </View>
                        )}
                    </View>
                ) : showShare ? (
                    <Pressable onPress={onShare} hitSlop={10} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Share">
                        <Share2 size={15} color="#fff" />
                    </Pressable>
                ) : null}
            </Animated.View>

            {/* THUMBNAILS — along the bottom, fade with the chrome */}
            {multi && (
                <Animated.View
                    style={[styles.thumbsWrap, { paddingBottom: insets.bottom + 14, opacity: chromeOpacity }]}
                    pointerEvents={chromeOn ? 'box-none' : 'none'}
                >
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
                </Animated.View>
            )}
        </View>
    );
}

/** A right-aligned menu row: label pill + circular icon button, stacked vertically. */
function MenuRow({ label, danger, onPress, children }: { label: string; danger?: boolean; onPress: () => void; children: ReactNode }) {
    return (
        <Pressable onPress={onPress} style={styles.menuRow} accessibilityRole="button" accessibilityLabel={label}>
            <Text style={[styles.menuLabel, danger && { color: '#fca5a5' }]}>{label}</Text>
            <View style={styles.iconBtn}>{children}</View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    topScrim: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 },
    botScrim: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2 },
    topbar: {
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 6,
        flexDirection: 'row', alignItems: 'flex-start',
        paddingHorizontal: 14, paddingBottom: 8,
    },
    iconBtn: {
        width: 32, height: 32, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.10)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    },
    iconBtnStrong: { backgroundColor: 'rgba(255,255,255,0.16)' },
    // Owner menu — drops below the ⋯, right-aligned, vertically stacked.
    menu: { position: 'absolute', top: 42, right: 0, alignItems: 'flex-end', gap: 11 },
    menuRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    menuLabel: {
        fontFamily: 'Outfit-SemiBold', fontSize: 11.5, color: '#fff',
        backgroundColor: 'rgba(0,0,0,0.46)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
        paddingHorizontal: 9, paddingVertical: 4, borderRadius: 7, overflow: 'hidden',
    },
    thumbsWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 5 },
    strip: { gap: 7, paddingHorizontal: 14 },
    thumb: { width: 46, height: THUMB_H, borderRadius: 7, overflow: 'hidden', opacity: 0.42, borderWidth: 1.5, borderColor: 'transparent', backgroundColor: '#17151d' },
    thumbOn: { opacity: 1, borderColor: '#fff' },
    thumbPlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
});
