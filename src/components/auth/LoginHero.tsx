import React, { useRef, useEffect } from "react";
import { View, Text, Animated, Image, Dimensions, Platform } from "react-native";
import { Mic2, Music2, Users, Star, Sparkles } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

export const ARTIST_TAGS = [
    { icon: Mic2, label: "Singer" },
    { icon: Music2, label: "Musician" },
    { icon: Users, label: "Dancer" },
    { icon: Star, label: "Actor" },
];

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");
const isWeb = Platform.OS === "web";
// Responsive hero height: clamp between 180 and 320, scale based on screen
const TOP_H = Math.min(Math.max(SCREEN_H * 0.28, 180), 320);

// @ts-ignore
const tailwindConfig = require("../../../tailwind.config");
const C = tailwindConfig.theme.extend.colors.auth;

const ABS_FILL: any = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 };

export const LoginHero = () => {
    const heroFade = useRef(new Animated.Value(0)).current;
    const logoSlide = useRef(new Animated.Value(-20)).current;
    const logoFade = useRef(new Animated.Value(0)).current;
    const headSlide = useRef(new Animated.Value(20)).current;
    const headFade = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.timing(heroFade, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.parallel([
                Animated.timing(logoFade, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.timing(logoSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
            ]),
            Animated.parallel([
                Animated.timing(headFade, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.timing(headSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
            ]),
        ]).start();
    }, [heroFade, logoFade, logoSlide, headFade, headSlide]);

    return (
        <Animated.View style={{ flex: 1, opacity: heroFade }}>
            {/* Background login image */}
            <Image
                source={require("@/assets/login.jpg")}
                style={[ABS_FILL, { width: "100%", height: "100%" }]}
                resizeMode="cover"
            />

            {/* Deep gradient overlay (bottom-heavy) */}
            <LinearGradient
                colors={[
                    "rgba(7,5,15,0.15)",
                    "rgba(7,5,15,0.40)",
                    "rgba(7,5,15,0.82)",
                    C.bg,
                ]}
                locations={[0, 0.35, 0.75, 1]}
                style={ABS_FILL}
            />



            <SafeAreaView style={{ flex: 1 }}>
                {/* NETSA wordmark badge */}
                <Animated.View style={{
                    flexDirection: "row", alignItems: "center", gap: 7,
                    marginTop: 18, marginLeft: 24,
                    opacity: logoFade,
                    transform: [{ translateY: logoSlide }],
                }}>
                    <View style={{
                        width: 28, height: 28, borderRadius: 8,
                        backgroundColor: C.primarySoft,
                        borderWidth: 1, borderColor: C.primaryDim,
                        alignItems: "center", justifyContent: "center",
                    }}>
                        <Sparkles size={14} color={C.accent} />
                    </View>
                    <Text style={{
                        fontSize: 15, fontWeight: "800",
                        letterSpacing: 2, color: C.w95,
                    }}>NETSA</Text>
                </Animated.View>

                {/* Hero headline */}
                <Animated.View style={{
                    marginTop: 16, paddingHorizontal: 24,
                    opacity: headFade,
                    transform: [{ translateY: headSlide }],
                }}>
                    <Text style={{
                        fontSize: 44, fontWeight: "800",
                        color: "#FFFFFF", letterSpacing: -1.8,
                        lineHeight: 50,
                    }}>
                        Your Stage{"\n"}
                        <Text style={{
                            color: C.accent,
                            textShadowColor: "rgba(139,92,246,0.6)",
                            textShadowOffset: { width: 0, height: 0 },
                            textShadowRadius: 18,
                        }}>Awaits.</Text>
                    </Text>
                    <Text style={{
                        fontSize: 14, color: C.w40,
                        marginTop: 8, letterSpacing: 0.2, lineHeight: 20,
                    }}>
                        Connect with the performing arts community.
                    </Text>
                </Animated.View>

            </SafeAreaView>
        </Animated.View>
    );
};
