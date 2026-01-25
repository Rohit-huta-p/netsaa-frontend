import React, { useEffect, useRef } from 'react';
import { View, Text, Platform, ScrollView, TouchableOpacity, Image, Animated, Easing, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { NETSA_COLORS } from '@/hooks/useThemeColors';

const isWeb = Platform.OS === 'web';

// Artist data
const artists = [
    { name: 'Rahul S.', role: 'Contemporary Dancer', img: 'https://i.pravatar.cc/150?u=1' },
    { name: 'Aryan K.', role: 'Sitarist', img: 'https://i.pravatar.cc/150?u=2' },
    { name: 'Priya M.', role: 'Theatre Director', img: 'https://i.pravatar.cc/150?u=3' },
    { name: 'Sneha G.', role: 'Jazz Vocalist', img: 'https://i.pravatar.cc/150?u=4' },
    { name: 'Vikram R.', role: 'Hip-hop Artist', img: 'https://i.pravatar.cc/150?u=5' },
    { name: 'Ananya B.', role: 'Kathak Maestro', img: 'https://i.pravatar.cc/150?u=6' },
];

// Artist card component
const ArtistCard = ({ artist, isMobile }: { artist: typeof artists[0]; isMobile: boolean }) => (
    <View
        style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(24, 24, 27, 0.5)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.05)',
            padding: isMobile ? 8 : 12,
            paddingRight: isMobile ? 24 : 32,
            borderRadius: 50,
            gap: isMobile ? 12 : 16,
            minWidth: isMobile ? 200 : 240,
        }}
    >
        <View
            style={{
                width: isMobile ? 40 : 48,
                height: isMobile ? 40 : 48,
                borderRadius: isMobile ? 20 : 24,
                borderWidth: 2,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                overflow: 'hidden',
            }}
        >
            <Image
                source={{ uri: artist.img }}
                style={{ width: '100%', height: '100%' }}
            />
        </View>
        <View>
            <Text style={{ fontSize: isMobile ? 13 : 14, fontWeight: '700', color: '#fff' }}>
                {artist.name}
            </Text>
            <Text style={{ fontSize: isMobile ? 9 : 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: 2 }}>
                {artist.role}
            </Text>
        </View>
    </View>
);

// Marquee row component
const MarqueeRow = ({ reverse = false, isMobile }: { reverse?: boolean; isMobile: boolean }) => {
    const scrollAnim = useRef(new Animated.Value(0)).current;
    const { width } = useWindowDimensions();

    useEffect(() => {
        if (!isWeb) {
            Animated.loop(
                Animated.timing(scrollAnim, {
                    toValue: reverse ? 100 : -100,
                    duration: 30000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();
        }
    }, []);

    return (
        <View style={{ flexDirection: 'row', gap: isMobile ? 16 : 32 }}>
            <Animated.View
                style={{
                    flexDirection: 'row',
                    gap: isMobile ? 16 : 32,
                    transform: isWeb ? undefined : [{ translateX: Animated.multiply(scrollAnim, 10) }],
                }}
            >
                {artists.map((artist, i) => (
                    <ArtistCard key={`1-${i}`} artist={artist} isMobile={isMobile} />
                ))}
            </Animated.View>
            <Animated.View
                style={{
                    flexDirection: 'row',
                    gap: isMobile ? 16 : 32,
                    transform: isWeb ? undefined : [{ translateX: Animated.multiply(scrollAnim, 10) }],
                }}
            >
                {artists.map((artist, i) => (
                    <ArtistCard key={`2-${i}`} artist={artist} isMobile={isMobile} />
                ))}
            </Animated.View>
        </View>
    );
};

export default function ArtistShowcase({ scrollY }: { scrollY: any }) {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;

    return (
        <View
            style={{
                paddingVertical: isMobile ? 48 : isTablet ? 72 : 96,
                backgroundColor: '#000',
                borderTopWidth: 1,
                borderBottomWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.05)',
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <View
                style={{
                    paddingHorizontal: isMobile ? 16 : 24,
                    marginBottom: isMobile ? 32 : 48,
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    justifyContent: 'space-between',
                    maxWidth: 1200,
                    alignSelf: 'center',
                    width: '100%',
                }}
            >
                <Text style={{ fontSize: isMobile ? 20 : 24, fontWeight: '700', color: '#fff', letterSpacing: -0.5 }}>
                    Rising Stars <Text style={{ color: NETSA_COLORS.netsa[10] }}>Live</Text>
                </Text>

                <TouchableOpacity
                    onPress={() => router.push('/search')}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        marginTop: isMobile ? 12 : 0,
                    }}
                >
                    <Text style={{ fontSize: isMobile ? 13 : 14, color: '#71717a' }}>
                        View all 2,400+ artists
                    </Text>
                    <ArrowRight size={16} color="#71717a" />
                </TouchableOpacity>
            </View>

            {/* Scrolling marquee */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                scrollEnabled={!isWeb}
                contentContainerStyle={{
                    paddingHorizontal: 16,
                    gap: isMobile ? 16 : 32,
                }}
                style={{
                    overflow: 'hidden',
                }}
            >
                <MarqueeRow isMobile={isMobile} />
            </ScrollView>
        </View>
    );
}