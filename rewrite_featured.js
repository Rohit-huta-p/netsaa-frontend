const fs = require('fs');

const path = '/Users/rohithutagonna/Documents/Rohit/NETSA/NETSA-React/netsa-mobile/src/components/profile/FeaturedWorks.tsx';
let content = fs.readFileSync(path, 'utf8');

// Update imports
content = content.replace(
    /import {([\s\S]*?)Platform,([\s\S]*?)} from "react-native";/m,
    `import {
    View,
    Text,
    Image,
    TouchableOpacity,
    Platform,
    FlatList,
    NativeSyntheticEvent,
    NativeScrollEvent
} from "react-native";`
);

// Add state variables
content = content.replace(
    /const \[viewerInitialIndex, setViewerInitialIndex\] = useState\(0\);/g,
    `const [viewerInitialIndex, setViewerInitialIndex] = useState(0);
    const [containerWidth, setContainerWidth] = useState(0);
    const [activeIndex, setActiveIndex] = useState(0);`
);

// Add handleScroll
content = content.replace(
    /const mediaItems = \[/g,
    `const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const width = event.nativeEvent.layoutMeasurement.width;
        if (width > 0) {
            const index = Math.round(scrollPosition / width);
            if (activeIndex !== index) {
                setActiveIndex(index);
            }
        }
    };

    const mediaItems = [`
);

// Replace grids with Carousel
const gridRegex = /<View className="flex-col gap-4">[\s\S]*?(?=<\/View>\s*<MediaViewerModal)/m;

const carouselCode = `<View className="flex-col gap-4">
                <View 
                    className="w-full"
                    onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
                >
                    {containerWidth > 0 ? (
                        mediaItems.length > 0 ? (
                            <View className="rounded-2xl overflow-hidden bg-black/20 border border-white/5 relative">
                                <FlatList
                                    data={mediaItems}
                                    horizontal
                                    pagingEnabled
                                    showsHorizontalScrollIndicator={false}
                                    onScroll={handleScroll}
                                    scrollEventThrottle={16}
                                    keyExtractor={(_, index) => index.toString()}
                                    renderItem={({ item, index }) => (
                                        <TouchableOpacity
                                            activeOpacity={0.9}
                                            onPress={() => handleMediaClick(index)}
                                            style={{ width: containerWidth, aspectRatio: 4/5 }}
                                        >
                                            {item.type === 'photo' ? (
                                                <Image source={{ uri: item.url }} className="w-full h-full" style={{ resizeMode: 'cover' }} />
                                            ) : (
                                                <View pointerEvents="none" className="w-full h-full bg-black">
                                                    {Platform.OS === 'web' ? (
                                                        <video
                                                            src={item.url}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                    ) : (
                                                        <ExpoVideo
                                                            source={{ uri: item.url }}
                                                            style={{ width: '100%', height: '100%' }}
                                                            useNativeControls={false}
                                                            resizeMode={ResizeMode.COVER}
                                                            shouldPlay={false}
                                                            isLooping={false}
                                                        />
                                                    )}
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    )}
                                />
                                
                                {/* Instagram Pagination Dots */}
                                {mediaItems.length > 1 && (
                                    <View className="absolute bottom-4 left-0 right-0 flex-row justify-center items-center gap-1.5 z-10">
                                        {mediaItems.map((_, i) => (
                                            <View 
                                                key={i} 
                                                className={\`rounded-full \${i === activeIndex ? 'bg-pink-500 w-2 h-2' : 'bg-white/40 w-1.5 h-1.5'}\`} 
                                            />
                                        ))}
                                    </View>
                                )}
                            </View>
                        ) : (
                            <TouchableOpacity
                                onPress={() => isEditable ? openSheet('media') : null}
                                activeOpacity={isEditable ? 0.7 : 1}
                                className="w-full aspect-[4/5] rounded-2xl border-2 border-dashed border-white/20 items-center justify-center bg-zinc-900/40"
                            >
                                {(isSectionActive && isEditable) ? (
                                    <Plus size={32} color="#71717a" />
                                ) : (
                                    <Camera size={32} color="#52525b" />
                                )}
                                <Text className="text-zinc-500 mt-4 text-sm font-medium">
                                    {isEditable ? 'Add Featured Work' : 'No featured works yet'}
                                </Text>
                            </TouchableOpacity>
                        )
                    ) : null}
                </View>
            `;

content = content.replace(gridRegex, carouselCode);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully rewrote FeaturedWorks.tsx');
