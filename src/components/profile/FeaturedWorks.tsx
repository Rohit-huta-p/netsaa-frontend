// src/components/profile/FeaturedWorks.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    Platform,
    StyleSheet,
    Animated,
    ActivityIndicator,
    useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
    Camera,
    Edit2,
    Plus,
    ImageIcon,
    Film,
} from "lucide-react-native";
import { FeaturedWorksProps, ProfileVideoReel } from "./types";
import { MasonryGrid } from "./MasonryGrid";
import { useProfileUiStore } from "@/stores/profileUiStore";
import { MediaViewerModal, MediaItem } from "./MediaViewerModal";
import { Colors } from "@/constants/Colors";
import NetsaVideoPlayer from "@/components/media/NetsaVideoPlayer";

type TabKey = "photos" | "videos";

// Hook to resolve image aspect ratios
function useImageAspectRatios(uris: string[]) {
    const [ratios, setRatios] = useState<Record<string, number>>({});

    useEffect(() => {
        uris.forEach((uri) => {
            if (!uri || ratios[uri]) return;
            Image.getSize(
                uri,
                (w, h) => {
                    setRatios((prev) => ({ ...prev, [uri]: h / w }));
                },
                () => {
                    // fallback to square
                    setRatios((prev) => ({ ...prev, [uri]: 1 }));
                }
            );
        });
    }, [uris]);

    return ratios;
}

// ─── Masonry Grid ──────────────────────────────────────
const MasonryGridInternal = ({
    uris,
    ratios,
    columnWidth,
    gap,
    onPress,
    onAdd,
}: {
    uris: string[];
    ratios: Record<string, number>;
    columnWidth: number;
    gap: number;
    onPress: (index: number) => void;
    onAdd?: () => void;
}) => {
    // Distribute items into 2 columns by shortest column
    const col1: { uri: string; idx: number }[] = [];
    const col2: { uri: string; idx: number }[] = [];
    let h1 = 0;
    let h2 = 0;

    uris.forEach((uri, idx) => {
        const ratio = ratios[uri] || 1;
        // Cap extreme portrait images to a max aspect ratio of 1.5 (e.g. 2:3)
        const displayRatio = Math.min(ratio, 1.5);
        const itemH = columnWidth * displayRatio;
        if (h1 <= h2) {
            col1.push({ uri, idx });
            h1 += itemH + gap;
        } else {
            col2.push({ uri, idx });
            h2 += itemH + gap;
        }
    });

    // Determine which column is shorter (to append the "Add" card)
    const addToCol1 = h1 <= h2;

    const renderColumn = (items: { uri: string; idx: number }[], showAddCard: boolean) => (
        <View style={{ width: columnWidth, gap }}>
            {items.map(({ uri, idx }) => {
                // If URI is empty/falsy, show a Plus placeholder card
                if (!uri) {
                    return (
                        <TouchableOpacity
                            key={idx}
                            activeOpacity={0.7}
                            onPress={() => onAdd?.()}
                            style={{
                                width: columnWidth,
                                height: columnWidth,
                                borderRadius: 14,
                                borderWidth: 2,
                                borderStyle: "dashed",
                                borderColor: "rgba(234,105,139,0.25)",
                                backgroundColor: "rgba(24,24,27,0.4)",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 10,
                            }}
                        >
                            <View
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 22,
                                    backgroundColor: "rgba(234,105,139,0.1)",
                                    borderWidth: 1,
                                    borderColor: "rgba(234,105,139,0.2)",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Plus size={20} color="#ea698b" />
                            </View>
                            <Text
                                style={{
                                    color: "#71717a",
                                    fontSize: 10,
                                    fontWeight: "800",
                                    textTransform: "uppercase",
                                    letterSpacing: 1.5,
                                }}
                            >
                                Add Photo
                            </Text>
                        </TouchableOpacity>
                    );
                }

                const ratio = ratios[uri] || 1;
                // Cap extreme portrait images to a max aspect ratio of 1.5 (e.g. 2:3)
                const displayRatio = Math.min(ratio, 1.5);
                const itemH = columnWidth * displayRatio;
                return (
                    <TouchableOpacity
                        key={idx}
                        activeOpacity={0.85}
                        onPress={() => onPress(idx)}
                        style={{
                            width: columnWidth,
                            height: itemH,
                            borderRadius: 14,
                            overflow: "hidden",
                            backgroundColor: "#18181b",
                        }}
                    >
                        <Image
                            source={{ uri }}
                            style={{ width: "100%", height: "100%" }}
                            // For portrait images, use 'contain' so the image fully fits inside without cropping
                            resizeMode={"cover"}
                        />
                        {/* Subtle bottom gradient for depth */}
                        <LinearGradient
                            colors={["transparent", "rgba(0,0,0,0.35)"]}
                            style={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                bottom: 0,
                                height: 40,
                            }}
                        />
                    </TouchableOpacity>
                );
            })}

        </View>
    );

    return (
        <View style={{ flexDirection: "row", gap, paddingBottom: 4 }}>
            {renderColumn(col1, addToCol1)}
            {renderColumn(col2, !addToCol1)}
        </View>
    );
};

// ─── Video Card (Mux playback via NetsaVideoPlayer) ────
const VideoCard = ({
    reel,
    width: cardWidth,
    index,
    onRemove,
}: {
    reel: ProfileVideoReel;
    width: number;
    index: number;
    onRemove?: () => void;
}) => {
    const cardH = cardWidth * (9 / 16);
    const aspectRatio = reel.aspectRatio ? Number(reel.aspectRatio) || 16 / 9 : 16 / 9;

    if (reel.status === 'processing') {
        return (
            <View
                style={{
                    width: cardWidth,
                    height: cardH,
                    borderRadius: 16,
                    backgroundColor: "#09090b",
                    marginBottom: 16,
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.06)",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                }}
            >
                <ActivityIndicator size="small" color="#ea698b" />
                <Text
                    style={{
                        color: "#71717a",
                        fontSize: 10,
                        fontWeight: "800",
                        textTransform: "uppercase",
                        letterSpacing: 1.5,
                    }}
                >
                    Processing…
                </Text>
            </View>
        );
    }

    if (reel.status === 'errored') {
        return (
            <View
                style={{
                    width: cardWidth,
                    height: cardH,
                    borderRadius: 16,
                    backgroundColor: "#09090b",
                    marginBottom: 16,
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: "rgba(239,68,68,0.25)",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                }}
            >
                <Text
                    style={{
                        color: "#ef4444",
                        fontSize: 10,
                        fontWeight: "800",
                        textTransform: "uppercase",
                        letterSpacing: 1.5,
                    }}
                >
                    Couldn't process video
                </Text>
                {onRemove ? (
                    <TouchableOpacity
                        onPress={onRemove}
                        style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 20,
                            backgroundColor: "rgba(239,68,68,0.1)",
                            borderWidth: 1,
                            borderColor: "rgba(239,68,68,0.25)",
                        }}
                    >
                        <Text style={{ color: "#ef4444", fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 }}>
                            Remove
                        </Text>
                    </TouchableOpacity>
                ) : null}
            </View>
        );
    }

    // status === 'ready'
    return (
        <View style={{ marginBottom: 16 }}>
            <NetsaVideoPlayer
                playbackId={reel.muxPlaybackId}
                poster={reel.thumbnailUrl}
                aspectRatio={aspectRatio}
                style={{ width: cardWidth }}
            />
        </View>
    );
};


// ─── Empty State ───────────────────────────────────────
const EmptyState = ({
    type,
    isEditable,
    onAdd,
}: {
    type: "photos" | "videos";
    isEditable: boolean;
    isSectionActive?: boolean;
    onAdd: () => void;
}) => {
    if (!isEditable) {
        return (
            <View
                style={{
                    height: 180,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.05)",
                    backgroundColor: "rgba(24,24,27,0.4)",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                }}
            >
                <View
                    style={{
                        width: 52,
                        height: 52,
                        borderRadius: 26,
                        backgroundColor: "rgba(255,255,255,0.03)",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {type === "photos" ? <ImageIcon size={24} color="#52525b" /> : <Film size={24} color="#52525b" />}
                </View>
                <Text
                    style={{
                        color: "#52525b",
                        fontSize: 11,
                        fontWeight: "800",
                        textTransform: "uppercase",
                        letterSpacing: 1.5,
                    }}
                >
                    {`No ${type === "photos" ? "Photos" : "Videos"} Yet`}
                </Text>
            </View>
        );
    }

    return (
        <TouchableOpacity
            onPress={onAdd}
            activeOpacity={0.7}
            style={{
                height: 180,
                borderRadius: 16,
                borderWidth: 2,
                borderStyle: "dashed",
                borderColor: "rgba(234,105,139,0.25)",
                backgroundColor: "rgba(24,24,27,0.4)",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
            }}
        >
            <View
                style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: "rgba(234,105,139,0.1)",
                    borderWidth: 1,
                    borderColor: "rgba(234,105,139,0.2)",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Plus size={24} color="#ea698b" />
            </View>
            <Text
                style={{
                    color: "#71717a",
                    fontSize: 11,
                    fontWeight: "800",
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                }}
            >
                {`Add ${type === "photos" ? "Photos" : "Videos"}`}
            </Text>
        </TouchableOpacity>
    );
};

// ─── Main Component ────────────────────────────────────
export const FeaturedWorks: React.FC<FeaturedWorksProps> = ({
    galleryUrls,
    videoReels,
    hasPhotos,
    isEditable = false,
    isDesktop,
    isOrganizer,
}) => {
    const { activeEditSection, setEditSection, openSheet } =
        useProfileUiStore();
    const isSectionActive = activeEditSection === "media";
    const { width: screenWidth } = useWindowDimensions();

    const [activeTab, setActiveTab] = useState<TabKey>("photos");

    // Media Viewer state
    const [viewerVisible, setViewerVisible] = useState(false);
    const [viewerItems, setViewerItems] = useState<MediaItem[]>([]);
    const [viewerIndex, setViewerIndex] = useState(0);

    // Measure actual container width via onLayout (fluid, matches parent)
    const [containerWidth, setContainerWidth] = useState(0);
    const contentWidth = containerWidth > 0 ? containerWidth - 28 : screenWidth - 32; // 28 = padding*2 (14 each side)
    const columnGap = 20;
    const columnWidth = (contentWidth - columnGap) / 2;

    const displayGalleryUrls = isEditable ? galleryUrls : galleryUrls.filter(Boolean);
    // Reels are structured records (not raw URLs) — nothing to filter for
    // falsy entries the way string arrays needed; every reel is a real item.
    const displayVideoReels = videoReels || [];

    const photoCount = displayGalleryUrls.filter(Boolean).length;
    const videoCount = displayVideoReels.length;

    // Resolve aspect ratios for photos
    const aspectRatios = useImageAspectRatios(displayGalleryUrls);

    const openPhotoViewer = useCallback(
        (index: number) => {
            const validUrls = displayGalleryUrls.filter(Boolean);
            const items: MediaItem[] = validUrls.map((uri) => ({
                uri,
                type: "photo",
            }));
            const targetUri = displayGalleryUrls[index];
            const validIndex = validUrls.indexOf(targetUri);

            setViewerItems(items);
            setViewerIndex(validIndex >= 0 ? validIndex : 0);
            setViewerVisible(true);
        },
        [displayGalleryUrls]
    );

    return (
        <View
            onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
            style={{
                // backgroundColor: "rgba(24,24,27,0.6)",
                borderRadius: 16,
                padding: 14,
                gap: 16,
            }}
        >
            {/* Header row */}
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <Text
                    style={{
                        fontSize: 14,
                        fontWeight: "900",
                        color: '#fff',
                        letterSpacing: 1.5,
                    }}
                >
                    FEATURED WORK
                </Text>
                {isEditable && (
                    <TouchableOpacity
                        onPress={() => {
                            setEditSection("media");
                            openSheet("media");
                        }}
                        style={{
                            padding: 8,
                            borderRadius: 20,
                            borderWidth: 1,
                            backgroundColor: isSectionActive
                                ? "rgba(234,105,139,0.1)"
                                : "rgba(255,255,255,0.05)",
                            borderColor: isSectionActive
                                ? "rgba(234,105,139,0.2)"
                                : "transparent",
                        }}
                    >
                        <Edit2
                            size={16}
                            color={isSectionActive ? "#ea698b" : "#71717a"}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {/* Tab Switcher */}
            <View
                style={{
                    flexDirection: "row",
                    backgroundColor: "rgba(9,9,11,0.6)",
                    borderRadius: 12,
                    padding: 4,
                    gap: 6,
                }}
            >
                {(["photos", "videos"] as TabKey[]).map((tab) => {
                    const isActive = activeTab === tab;
                    const count = tab === "photos" ? photoCount : videoCount;
                    const TabIcon = tab === "photos" ? ImageIcon : Film;
                    return (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            style={{
                                flex: 1,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 6,
                                paddingVertical: 10,
                                borderRadius: 10,
                                backgroundColor: isActive
                                    ? "rgba(234,105,139,0.12)"
                                    : "transparent",
                                borderWidth: isActive ? 1 : 0,
                                borderColor: isActive
                                    ? "rgba(234,105,139,0.25)"
                                    : "transparent",
                            }}
                        >
                            <TabIcon
                                size={14}
                                color={isActive ? "#ea698b" : "#52525b"}
                            />
                            <Text
                                style={{
                                    fontSize: 8,
                                    fontWeight: "800",
                                    textTransform: "uppercase",
                                    letterSpacing: 1.5,
                                    color: isActive ? "#ea698b" : "#52525b",
                                }}
                            >
                                {tab === "photos" ? "Photos" : "Videos"}
                            </Text>
                            {count > 0 && (
                                <View
                                    style={{
                                        backgroundColor: isActive
                                            ? "rgba(234,105,139,0.2)"
                                            : "rgba(255,255,255,0.06)",
                                        paddingHorizontal: 7,
                                        paddingVertical: 2,
                                        borderRadius: 8,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 10,
                                            fontWeight: "900",
                                            color: isActive
                                                ? "#ea698b"
                                                : "#52525b",
                                        }}
                                    >
                                        {count}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Tab Content */}
            {activeTab === "photos" ? (
                displayGalleryUrls.length > 0 ? (
                    <MasonryGrid
                        uris={displayGalleryUrls}
                        ratios={aspectRatios}
                        columnWidth={columnWidth}
                        gap={columnGap}
                        onPress={openPhotoViewer}
                        onAdd={() => openSheet("media")}
                    />
                ) : (
                    <EmptyState
                        type="photos"
                        isEditable={isEditable}
                        onAdd={() => openSheet("media")}
                    />
                )
            ) : displayVideoReels.length > 0 ? (
                <View>
                    {displayVideoReels.map((reel, i) => (
                        <VideoCard
                            key={reel.uploadId || reel.muxPlaybackId || i}
                            reel={reel}
                            width={contentWidth}
                            index={i}
                            onRemove={isEditable ? () => openSheet("media") : undefined}
                        />
                    ))}
                    {isEditable && displayVideoReels.length < 3 && (
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => openSheet("media")}
                            style={{
                                width: contentWidth,
                                height: contentWidth * (9 / 16),
                                borderRadius: 14,
                                borderWidth: 2,
                                borderStyle: "dashed",
                                borderColor: "rgba(234,105,139,0.25)",
                                backgroundColor: "rgba(24,24,27,0.4)",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 10,
                                marginBottom: 12,
                            }}
                        >
                            <View
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 22,
                                    backgroundColor: "rgba(234,105,139,0.1)",
                                    borderWidth: 1,
                                    borderColor: "rgba(234,105,139,0.2)",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Plus size={20} color="#ea698b" />
                            </View>
                            <Text
                                style={{
                                    color: "#71717a",
                                    fontSize: 10,
                                    fontWeight: "800",
                                    textTransform: "uppercase",
                                    letterSpacing: 1.5,
                                }}
                            >
                                Add Video
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <EmptyState
                    type="videos"
                    isEditable={isEditable}
                    onAdd={() => openSheet("media")}
                />
            )}

            {/* Add Button (visible in edit mode) */}
            {isSectionActive && isEditable && (
                <TouchableOpacity
                    onPress={() => openSheet("media")}
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        paddingVertical: 12,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderStyle: "dashed",
                        borderColor: "rgba(234,105,139,0.3)",
                        backgroundColor: "rgba(234,105,139,0.05)",
                    }}
                >
                    <Plus size={16} color="#ea698b" />
                    <Text
                        style={{
                            color: "#ea698b",
                            fontSize: 11,
                            fontWeight: "800",
                            textTransform: "uppercase",
                            letterSpacing: 1.5,
                        }}
                    >
                        Upload Media
                    </Text>
                </TouchableOpacity>
            )}

            {/* Media Viewer Modal */}
            <MediaViewerModal
                visible={viewerVisible}
                onClose={() => setViewerVisible(false)}
                mediaItems={viewerItems}
                initialIndex={viewerIndex}
            />
        </View>
    );
};

export default FeaturedWorks;
