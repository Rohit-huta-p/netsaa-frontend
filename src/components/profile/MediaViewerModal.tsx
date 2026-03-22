// src/components/profile/MediaViewerModal.tsx
import React, { useRef, useState, useCallback } from "react";
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    Image,
    FlatList,
    useWindowDimensions,
    Platform,
    StatusBar,
    ViewToken,
} from "react-native";
import Video from "react-native-video";
import { X, ChevronLeft, ChevronRight } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type MediaItem = {
    uri: string;
    type: "photo" | "video";
};

// Separate component for video slides
const VideoSlide = ({
    uri,
    width,
    height,
}: {
    uri: string;
    width: number;
    height: number;
}) => {
    return (
        <View style={{ width, height, backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
            {Platform.OS === "web" ? (
                <video
                    src={uri}
                    controls
                    autoPlay
                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                />
            ) : (
                <Video
                    source={{ uri }}
                    style={{ width, height: width * (9 / 16) }}
                    controls
                    resizeMode="contain"
                    repeat={false}
                    paused={false}
                />
            )}
        </View>
    );
};

interface MediaViewerModalProps {
    visible: boolean;
    onClose: () => void;
    mediaItems: MediaItem[];
    initialIndex?: number;
}

export const MediaViewerModal: React.FC<MediaViewerModalProps> = ({
    visible,
    onClose,
    mediaItems,
    initialIndex = 0,
}) => {
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const flatListRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    // Reset index when modal opens
    React.useEffect(() => {
        if (visible) {
            setCurrentIndex(initialIndex);
            // Scroll to initial index after a small delay so layout is ready
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({
                    index: initialIndex,
                    animated: false,
                });
            }, 50);
        }
    }, [visible, initialIndex]);

    const onViewableItemsChanged = useCallback(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
            if (viewableItems.length > 0 && viewableItems[0].index != null) {
                setCurrentIndex(viewableItems[0].index);
            }
        },
        []
    );

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
    }).current;

    const goToPrev = () => {
        if (currentIndex > 0) {
            flatListRef.current?.scrollToIndex({
                index: currentIndex - 1,
                animated: true,
            });
        }
    };

    const goToNext = () => {
        if (currentIndex < mediaItems.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true,
            });
        }
    };

    const renderItem = ({ item }: { item: MediaItem }) => {
        if (item.type === "photo") {
            return (
                <View
                    style={{
                        width,
                        height,
                        backgroundColor: "#000",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <Image
                        source={{ uri: item.uri }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="contain"
                    />
                </View>
            );
        }

        // Video — rendered by its own component so the hook runs at top level
        return <VideoSlide uri={item.uri} width={width} height={height} />;
    };

    if (!visible || mediaItems.length === 0) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            <View style={{ flex: 1, backgroundColor: "#000" }}>
                {/* Close Button */}
                <TouchableOpacity
                    onPress={onClose}
                    style={{
                        position: "absolute",
                        top: insets.top + 12,
                        right: 16,
                        zIndex: 100,
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: "rgba(255,255,255,0.12)",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <X size={22} color="#fff" />
                </TouchableOpacity>

                {/* Swipeable Content */}
                <FlatList
                    ref={flatListRef}
                    data={mediaItems}
                    renderItem={renderItem}
                    keyExtractor={(item, i) => `${item.type}-${i}`}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    getItemLayout={(_, index) => ({
                        length: width,
                        offset: width * index,
                        index,
                    })}
                    initialScrollIndex={initialIndex}
                    bounces={false}
                />

                {/* Navigation Arrows (desktop / web) */}
                {Platform.OS === "web" && mediaItems.length > 1 && (
                    <>
                        {currentIndex > 0 && (
                            <TouchableOpacity
                                onPress={goToPrev}
                                style={{
                                    position: "absolute",
                                    left: 16,
                                    top: "50%",
                                    zIndex: 100,
                                    width: 44,
                                    height: 44,
                                    borderRadius: 22,
                                    backgroundColor: "rgba(255,255,255,0.12)",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <ChevronLeft size={24} color="#fff" />
                            </TouchableOpacity>
                        )}
                        {currentIndex < mediaItems.length - 1 && (
                            <TouchableOpacity
                                onPress={goToNext}
                                style={{
                                    position: "absolute",
                                    right: 16,
                                    top: "50%",
                                    zIndex: 100,
                                    width: 44,
                                    height: 44,
                                    borderRadius: 22,
                                    backgroundColor: "rgba(255,255,255,0.12)",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <ChevronRight size={24} color="#fff" />
                            </TouchableOpacity>
                        )}
                    </>
                )}

                {/* Counter */}
                {mediaItems.length > 1 && (
                    <View
                        style={{
                            position: "absolute",
                            bottom: insets.bottom + 24,
                            alignSelf: "center",
                            backgroundColor: "rgba(0,0,0,0.6)",
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            borderRadius: 20,
                            borderWidth: 1,
                            borderColor: "rgba(255,255,255,0.1)",
                        }}
                    >
                        <Text
                            style={{
                                color: "#fff",
                                fontSize: 12,
                                fontWeight: "700",
                                letterSpacing: 2,
                            }}
                        >
                            {currentIndex + 1} / {mediaItems.length}
                        </Text>
                    </View>
                )}
            </View>
        </Modal>
    );
};

export default MediaViewerModal;
