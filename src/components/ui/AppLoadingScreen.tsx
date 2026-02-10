// src/components/ui/AppLoadingScreen.tsx
// Branded loading screen shown globally while fonts/auth hydrate.
import React from "react";
import { View, Text, Animated } from "react-native";
import { LoadingAnimation } from "./LoadingAnimation";

const C = {
    bg: '#0a0a0f',
    w80: 'rgba(255,255,255,0.80)',
};

const SUBTITLES = [
    "Finding gigs that match your craft",
    "Where talent meets opportunity…",
    "Making work discoverable for artists"
];

export default function AppLoadingScreen() {
    const [index, setIndex] = React.useState(0);
    const fadeAnim = React.useRef(new Animated.Value(1)).current;

    React.useEffect(() => {
        const interval = setInterval(() => {
            // Fade out
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true
            }).start(() => {
                setIndex((prev) => (prev + 1) % SUBTITLES.length);
                // Fade in
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true
                }).start();
            });
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <View style={{
            flex: 1, backgroundColor: C.bg,
            alignItems: 'center', justifyContent: 'center',
        }}>
            <LoadingAnimation
                source="https://lottie.host/2e0a5021-47f1-4b3e-bc6b-237178415eca/YDhwl9ITVc.lottie"
                width={220}
                height={220}
                loop
                autoplay
            />
            <Text style={{ fontSize: 20, fontWeight: '700', letterSpacing: -0.5, color: C.w80, marginTop: 5, fontFamily: 'Outfit-Bold' }}>
                NETSA
            </Text>

            <Animated.Text style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.5)',
                marginTop: 12,
                textAlign: 'center',
                opacity: fadeAnim,
                fontFamily: 'Outfit-Regular',
                minHeight: 20
            }}>
                {SUBTITLES[index]}
            </Animated.Text>
        </View>
    );
}
