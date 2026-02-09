// path: app/(auth)/login.tsx
import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    useWindowDimensions,
    Animated,
    Easing,
    ScrollView,
    Image,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Mail,
    Lock,
    ArrowLeft,
    Sparkles,
    Users,
    TrendingUp,
    Star,
    Zap,
    Music,
    Radio,
    Heart,
    Mic,
    Camera,
    Drama,
    Music2,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { Input } from "@/components/ui/Input";
import { GradientButton } from "@/components/ui/GradientButton";
import { LoadingAnimation } from "@/components/ui/LoadingAnimation";
import useAuthStore from "@/stores/authStore";
import { useLogin } from "@/hooks/useAuthQueries";

const isWeb = Platform.OS === "web";

// Schema for the login form
const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Floating particle component
const FloatingParticle = ({ delay = 0, duration = 3000, size = 4, color = "rgba(139, 92, 246, 0.3)" }: any) => {
    const translateY = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animate = () => {
            Animated.parallel([
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(translateY, {
                            toValue: -100,
                            duration: duration,
                            delay,
                            easing: Easing.inOut(Easing.ease),
                            useNativeDriver: true,
                        }),
                        Animated.timing(translateY, {
                            toValue: 0,
                            duration: 0,
                            useNativeDriver: true,
                        }),
                    ])
                ),
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(opacity, {
                            toValue: 1,
                            duration: duration / 2,
                            delay,
                            useNativeDriver: true,
                        }),
                        Animated.timing(opacity, {
                            toValue: 0,
                            duration: duration / 2,
                            useNativeDriver: true,
                        }),
                    ])
                ),
            ]).start();
        };

        animate();
    }, []);

    return (
        <Animated.View
            style={{
                position: 'absolute',
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: color,
                opacity,
                transform: [{ translateY }],
            }}
        />
    );
};

// Orbiting Artist Icons
const OrbitingIcon = ({ icon: Icon, radius = 120, duration = 8000, delay = 0, color = "#8B5CF6" }: any) => {
    const rotation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(rotation, {
                toValue: 1,
                duration,
                delay,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const rotate = rotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <Animated.View
            style={{
                position: 'absolute',
                transform: [
                    { rotate },
                    { translateX: radius },
                ],
            }}
        >
            <View
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    borderWidth: 2,
                    borderColor: `${color}40`,
                }}
            >
                <Icon size={20} color={color} />
            </View>
        </Animated.View>
    );
};

// Animated Art Form Badge
const ArtFormBadge = ({ icon: Icon, label, color, delay = 0 }: any) => {
    const scale = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
                Animated.spring(scale, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();

        // Continuous pulse
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(scale, {
                    toValue: 1.05,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(scale, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        );

        const timer = setTimeout(() => pulse.start(), delay + 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <Animated.View
            style={{
                opacity,
                transform: [{ scale }],
            }}
        >
            <View
                className="px-4 py-2 rounded-full flex-row items-center"
                style={{
                    backgroundColor: `${color}20`,
                    borderWidth: 1,
                    borderColor: `${color}40`,
                }}
            >
                <Icon size={16} color={color} />
                <Text
                    className="ml-2 text-xs font-bold uppercase tracking-wider"
                    style={{ color }}
                >
                    {label}
                </Text>
            </View>
        </Animated.View>
    );
};

// Live pulse indicator
const LivePulse = () => {
    const scale = useRef(new Animated.Value(1)).current;
    const opacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(scale, {
                        toValue: 1.5,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scale, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.sequence([
                    Animated.timing(opacity, {
                        toValue: 0,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacity, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ]),
            ])
        ).start();
    }, []);

    return (
        <Animated.View
            style={{
                position: 'absolute',
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: '#10B981',
                opacity,
                transform: [{ scale }],
            }}
        />
    );
};

// Stat ticker component
const StatTicker = ({ value, label, icon: Icon, color }: any) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setDisplayValue((prev) => {
                const newVal = prev + Math.floor(Math.random() * 3);
                return newVal > value ? value : newVal;
            });
        }, 100);

        return () => clearInterval(interval);
    }, [value]);

    return (
        <View className="items-center">
            <View className="flex-row items-center mb-1">
                <Icon size={14} color={color} />
                <Text className="text-white font-black text-lg ml-2 tracking-tight">
                    {displayValue.toLocaleString()}
                </Text>
            </View>
            <Text className="text-zinc-500 text-xs font-medium uppercase tracking-wider">
                {label}
            </Text>
        </View>
    );
};

// Energy bar component
const EnergyBar = () => {
    const width = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(width, {
                    toValue: 1,
                    duration: 2000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                }),
                Animated.timing(width, {
                    toValue: 0.3,
                    duration: 2000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                }),
            ])
        ).start();
    }, []);

    const widthInterpolate = width.interpolate({
        inputRange: [0, 1],
        outputRange: ['30%', '100%'],
    });

    return (
        <View className="h-1 bg-white/10 rounded-full overflow-hidden">
            <Animated.View
                style={{
                    width: widthInterpolate,
                    height: '100%',
                    backgroundColor: '#8B5CF6',
                }}
            />
        </View>
    );
};

// Animated Spotlight Silhouettes
const SilhouetteLayer = () => {
    const opacity1 = useRef(new Animated.Value(0.3)).current;
    const opacity2 = useRef(new Animated.Value(0.2)).current;
    const opacity3 = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(opacity1, { toValue: 0.5, duration: 2000, useNativeDriver: true }),
                    Animated.timing(opacity2, { toValue: 0.4, duration: 2500, useNativeDriver: true }),
                    Animated.timing(opacity3, { toValue: 0.3, duration: 1800, useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.timing(opacity1, { toValue: 0.3, duration: 2000, useNativeDriver: true }),
                    Animated.timing(opacity2, { toValue: 0.2, duration: 2500, useNativeDriver: true }),
                    Animated.timing(opacity3, { toValue: 0.5, duration: 1800, useNativeDriver: true }),
                ]),
            ])
        ).start();
    }, []);

    return (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 300 }}>
            {/* Dancer Silhouette */}
            <Animated.View style={{ position: 'absolute', bottom: 0, left: '10%', opacity: opacity1 }}>
                <LoadingAnimation
                    source="https://lottie.host/c89d4e6c-3f2e-4c8e-9b1e-8a9c3d5f8e4a/4KzXvY7mBi.json"
                    width={120}
                    height={120}
                />
            </Animated.View>

            {/* Singer Silhouette */}
            <Animated.View style={{ position: 'absolute', bottom: 0, right: '15%', opacity: opacity2 }}>
                <LoadingAnimation
                    source="https://lottie.host/a8e7f5d4-6c3b-4a2e-9f1d-7b8c4d6e9f2a/5LzYwX8nCj.json"
                    width={100}
                    height={100}
                />
            </Animated.View>

            {/* Musician Silhouette */}
            <Animated.View style={{ position: 'absolute', bottom: 20, left: '40%', opacity: opacity3 }}>
                <LoadingAnimation
                    source="https://lottie.host/b9f8g6e5-7d4c-5b3f-0g2e-8c9d5e7f0g3b/6MaZxY9odk.json"
                    width={90}
                    height={90}
                />
            </Animated.View>
        </View>
    );
};

export default function LoginScreen() {
    const router = useRouter();
    const loginMutation = useLogin();
    const [formError, setFormError] = useState<string | null>(null);
    const { height, width } = useWindowDimensions();
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    // Continuous glow animation
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 1,
                    duration: 2000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                }),
                Animated.timing(glowAnim, {
                    toValue: 0,
                    duration: 2000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                }),
            ])
        ).start();
    }, []);

    // Pulse animation for CTA button
    useEffect(() => {
        if (isWeb) return;
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.02,
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = (data: LoginFormValues) => {
        setFormError(null);
        loginMutation.mutate({ email: data.email, password: data.password }, {
            onError: (error: any) => {
                const serverMsg = error.response?.data?.msg || error.response?.data?.message || (error.response?.data?.errors && error.response.data.errors[0]?.message);
                console.error("Login failed:", serverMsg || error.message);
                setFormError(serverMsg || error.message || "Invalid credentials. Please try again.");
            }
        });
    };

    const glowColor = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(139, 92, 246, 0.15)', 'rgba(139, 92, 246, 0.35)'],
    });

    return (
        <View className="flex-1" style={{ backgroundColor: '#000000' }}>
            {/* Animated Background Gradient */}
            <Animated.View
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                }}
            >
                <LinearGradient
                    colors={['#000000', '#1A0B2E', '#000000']}
                    locations={[0, 0.5, 1]}
                    style={{ flex: 1 }}
                />
            </Animated.View>

            {/* Dynamic Spotlight */}
            {/* <Animated.View
                style={{
                    position: 'absolute',
                    top: -height * 0.2,
                    left: width * 0.1
                    width: width * 0.8,
                    height: height * 0.6,
                    backgroundColor: glowColor,
                    borderRadius: width,
                }}
            /> */}

            {/* Stage Silhouettes (Bottom) */}
            {/* {!isWeb && <SilhouetteLayer />} */}

            {/* Floating Particles */}
            {/* {!isWeb && [...Array(15)].map((_, i) => (
                <View
                    key={i}
                    style={{
                        position: 'absolute',
                        left: `${Math.random() * 100}%`,
                        bottom: -20,
                    }}
                >
                    <FloatingParticle
                        delay={i * 200}
                        duration={3000 + Math.random() * 2000}
                        size={2 + Math.random() * 3}
                        color={
                            i % 3 === 0
                                ? 'rgba(139, 92, 246, 0.4)'
                                : i % 3 === 1
                                    ? 'rgba(59, 130, 246, 0.4)'
                                    : 'rgba(236, 72, 153, 0.4)'
                        }
                    />
                </View>
            ))} */}

            {/* Grid Pattern Overlay */}
            {/* <View
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    opacity: 0.03,
                }}
            >
                {[...Array(20)].map((_, i) => (
                    <View
                        key={i}
                        style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: i * (height / 20),
                            height: 1,
                            backgroundColor: '#8B5CF6',
                        }}
                    />
                ))}
            </View> */}

            <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        className="flex-1 justify-center px-6"
                        style={{ zIndex: 10, minHeight: height }}
                    >
                        {/* Back Button */}
                        <View className="absolute top-4 left-6 z-50">
                            <Link href="/" asChild>
                                <TouchableOpacity
                                    className="w-12 h-12 items-center justify-center rounded-full"
                                    style={{
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        borderWidth: 1,
                                        borderColor: 'rgba(255,255,255,0.1)',
                                    }}
                                >
                                    <ArrowLeft size={20} color="white" />
                                </TouchableOpacity>
                            </Link>
                        </View>

                        {/* ORBITING ARTIST ICONS */}
                        {/* <View className="items-center justify-center absolute top-32 self-center">
                            <View style={{ width: 280, height: 280, justifyContent: 'center', alignItems: 'center' }}>
                                <OrbitingIcon icon={Music} radius={100} duration={12000} delay={0} color="#8B5CF6" />
                                <OrbitingIcon icon={Mic} radius={100} duration={12000} delay={2000} color="#3B82F6" />
                                <OrbitingIcon icon={Drama} radius={100} duration={12000} delay={4000} color="#EC4899" />
                                <OrbitingIcon icon={Camera} radius={100} duration={12000} delay={6000} color="#F59E0B" />
                                <OrbitingIcon icon={Music2} radius={100} duration={12000} delay={8000} color="#10B981" />
                                <OrbitingIcon icon={Radio} radius={100} duration={12000} delay={10000} color="#EF4444" />
                            </View>
                        </View> */}

                        {/* LIVE STATS BANNER */}
                        {/* <View className="items-center mb-8" style={{ marginTop: height * 0.45 }}> */}
                        {/* <View
                                className="flex-row items-center justify-between px-6 py-4 rounded-2xl"
                                style={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                    borderWidth: 1,
                                    borderColor: 'rgba(139, 92, 246, 0.3)',
                                    width: '100%',
                                    maxWidth: 400,
                                }}
                            > */}
                        {/* Live Indicator */}
                        {/* <View className="flex-row items-center">
                                    <View className="relative w-3 h-3 mr-2">
                                        <LivePulse />
                                        <View
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: '#10B981' }}
                                        />
                                    </View>
                                    <Text className="text-zinc-400 text-xs font-black uppercase tracking-wider">
                                        Live Now
                                    </Text>
                                </View> */}

                        {/* Stats */}
                        {/* <StatTicker
                                    value={2847}
                                    label="Artists"
                                    icon={Users}
                                    color="#8B5CF6"
                                />

                                <StatTicker
                                    value={156}
                                    label="Gigs"
                                    icon={TrendingUp}
                                    color="#3B82F6"
                                /> */}
                        {/* </View> */}

                        {/* Energy Bar */}
                        {/* <View className="w-full max-w-sm mt-4 px-2">
                                <EnergyBar />
                                <View className="flex-row justify-between mt-1">
                                    <Text className="text-zinc-600 text-[10px] uppercase font-bold tracking-wider">
                                        Platform Energy
                                    </Text>
                                    <Text className="text-purple-400 text-[10px] uppercase font-bold tracking-wider">
                                        High Activity
                                    </Text>
                                </View>
                            </View> */}
                        {/* </View> */}

                        {/* HERO HEADER */}
                        <View className="items-center mb-8 mt-10">
                            {/* Art Form Badges */}
                            {/* <View className="flex-row flex-wrap justify-center gap-2 mb-6">
                                <ArtFormBadge icon={Music} label="Musician" color="#8B5CF6" delay={0} />
                                <ArtFormBadge icon={Mic} label="Singer" color="#3B82F6" delay={100} />
                                <ArtFormBadge icon={Drama} label="Actor" color="#EC4899" delay={200} />
                                <ArtFormBadge icon={Camera} label="Model" color="#F59E0B" delay={300} />
                            </View> */}

                            <Text className="text-white text-5xl font-black mb-3 text-center tracking-tighter">
                                Welcome Back
                            </Text>

                            <View className="flex-row items-center mb-3">
                                <LinearGradient
                                    colors={['#8B5CF6', '#3B82F6']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    className="px-4 py-2 rounded-xl"
                                >
                                    <Text className="text-white text-lg font-black tracking-tight">
                                        PERFORMER
                                    </Text>
                                </LinearGradient>
                                <Zap size={24} color="#F59E0B" style={{ marginLeft: 8 }} />
                            </View>

                            <Text className="text-zinc-500 text-base text-center font-light max-w-xs">
                                Your stage awaits. Step into the spotlight and continue your journey.
                            </Text>
                        </View>

                        {/* GLASSMORPHIC FORM CARD */}
                        <View
                            className="w-full max-w-md self-center p-8 rounded-3xl"
                            style={{
                                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                borderWidth: 1,
                                borderColor: 'rgba(255, 255, 255, 0.1)',
                                shadowColor: '#8B5CF6',
                                shadowOffset: { width: 0, height: 20 },
                                shadowOpacity: 0.3,
                                shadowRadius: 30,
                            }}
                        >
                            {/* Form Error */}
                            {formError && (
                                <View className="bg-red-500/20 border border-red-500/40 p-4 rounded-2xl mb-6 flex-row items-center">
                                    <View className="w-2 h-2 rounded-full bg-red-500 mr-3" />
                                    <Text className="text-red-300 text-sm font-medium flex-1">
                                        {formError}
                                    </Text>
                                </View>
                            )}

                            {/* Email Input */}
                            <View className="mb-5">

                                <Input
                                    label="Email"
                                    control={control}
                                    name="email"
                                    placeholder="your.email@example.com"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    startIcon={<Mail size={20} color="#71717A" />}
                                    error={errors.email?.message}
                                    contentContainerClassName="bg-white/5 border-white/10 h-14 rounded-xl"
                                    inputClassName="text-white text-base"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                />
                            </View>

                            {/* Password Input */}
                            <View className="mb-3">
                                <Input
                                    label="Password"
                                    control={control}
                                    name="password"
                                    placeholder="Enter your password"
                                    secureTextEntry
                                    startIcon={<Lock size={20} color="#71717A" />}
                                    error={errors.password?.message}
                                    contentContainerClassName="bg-white/5 border-white/10 h-14 rounded-xl"
                                    inputClassName="text-white text-base"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                />
                            </View>

                            {/* Forgot Password */}
                            <TouchableOpacity className="self-end mb-6">
                                <Text className="text-purple-400 text-sm font-bold">
                                    Forgot Password?
                                </Text>
                            </TouchableOpacity>

                            {/* Submit Button */}
                            <Animated.View
                                style={!isWeb ? { transform: [{ scale: pulseAnim }] } : undefined}
                            >
                                <GradientButton
                                    onPress={handleSubmit(onSubmit)}
                                    loading={loginMutation.isPending}
                                    label={loginMutation.isPending ? "Entering..." : "Take the Stage →"}
                                    colors={["#8B5CF6", "#3B82F6"]}
                                />
                            </Animated.View>

                            {/* Social Proof */}
                            <View className="mt-6 pt-6 border-t border-white/10">
                                <View className="flex-row items-center justify-center">
                                    <Star size={14} color="#F59E0B" />
                                    <Text className="text-zinc-500 text-xs ml-2 font-medium">
                                        Trusted by 10,000+ performing artists
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Footer CTA */}
                        <View className="flex-row justify-center items-center mt-10 mb-8">
                            <Text className="text-zinc-500 text-base">New to the scene? </Text>
                            <Link href="/(auth)/register" asChild>
                                <TouchableOpacity>
                                    <Text className="text-purple-400 font-black text-base">
                                        Join Now →
                                    </Text>
                                </TouchableOpacity>
                            </Link>
                        </View>

                        {/* Bottom Decoration */}
                        <View className="items-center pb-6 mb-6">
                            <View className="flex-row items-center gap-2">
                                <View className="w-1 h-1 rounded-full bg-purple-500/40" />
                                <View className="w-1 h-1 rounded-full bg-blue-500/40" />
                                <View className="w-1 h-1 rounded-full bg-pink-500/40" />
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}