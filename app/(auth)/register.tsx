// path: app/(auth)/register.tsx
import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    useWindowDimensions,
    Animated,
    Easing,
} from "react-native";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Mic2, ClipboardList, Mail, Lock, User, Phone, Zap, Star, Sparkles } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { Input } from "@/components/ui/Input";
import { GradientButton } from "@/components/ui/GradientButton";
import useAuthStore from "@/stores/authStore";
import { useRegister } from "@/hooks/useAuthQueries";
import { registerSchema, RegisterFormValues } from "@/schemas/register.schema";

const isWeb = Platform.OS === "web";

// ═══════════════════════════════════════════════════════════════════════════
// ROLE CARD COMPONENT (Inline for matching login.tsx style)
// ═══════════════════════════════════════════════════════════════════════════

interface RoleCardProps {
    role: string;
    selected: boolean;
    onPress: () => void;
    icon: any;
    title: string;
    subtitle: string;
    gradientColors: readonly [string, string, ...string[]];
    accentColor: string;
}

const RoleCard = ({
    role,
    selected,
    onPress,
    icon: Icon,
    title,
    subtitle,
    gradientColors,
    accentColor,
}: RoleCardProps) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: selected ? 1.02 : 1,
            friction: 3,
            tension: 100,
            useNativeDriver: true,
        }).start();
    }, [selected]);

    return (
        <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={{ flex: 1 }}>
            <Animated.View
                style={[
                    {
                        padding: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 20,
                        backgroundColor: selected ? `${accentColor}15` : 'rgba(255,255,255,0.03)',
                        borderWidth: 2,
                        borderColor: selected ? accentColor : 'rgba(255,255,255,0.08)',
                        transform: [{ scale: scaleAnim }],
                    },
                    !isWeb && selected && {
                        shadowColor: accentColor,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.4,
                        shadowRadius: 15,
                    },
                ]}
            >
                {/* Icon container */}
                <View
                    style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 10,
                        overflow: 'hidden',
                    }}
                >
                    {selected ? (
                        <LinearGradient
                            colors={gradientColors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{
                                width: 44,
                                height: 54,
                                borderRadius: 22,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Icon size={22} color="#fff" />
                        </LinearGradient>
                    ) : (
                        <View
                            style={{
                                width: 44,
                                height: 54,
                                borderRadius: 22,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'rgba(255,255,255,0.08)',
                            }}
                        >
                            <Icon size={22} color="#71717A" />
                        </View>
                    )}
                </View>

                <Text className="text-white font-bold text-base mb-1">{title}</Text>
                <Text className="text-zinc-500 text-[10px] text-center leading-tight">{subtitle}</Text>

                {/* Selected indicator */}
                {selected && (
                    <View
                        style={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            backgroundColor: accentColor,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Sparkles size={12} color="#fff" />
                    </View>
                )}
            </Animated.View>
        </TouchableOpacity>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SCREEN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function RegisterScreen() {
    const registerMutation = useRegister();
    const [formError, setFormError] = useState<string | null>(null);
    const { height } = useWindowDimensions();
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    const {
        control,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: { role: "artist" },
    });

    const selectedRole = watch("role");

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

    const onSubmit = (data: RegisterFormValues) => {
        registerMutation.mutate({
            name: data.fullName,
            email: data.email,
            password: data.password,
            phoneNumber: data.phoneNumber,
            userType: data.role
        }, {
            onSuccess: () => {
                const { user } = useAuthStore.getState();
                if (user?.roles?.includes("organizer") || data.role === "organizer") {
                    router.replace("/(app)/organizer");
                } else {
                    router.replace("/gigs");
                }
            },
            onError: (error: any) => {
                const serverMsg = error.response?.data?.msg
                    || error.response?.data?.message
                    || (error.response?.data?.errors && error.response.data.errors[0]?.message);
                setFormError(serverMsg || error.message || "Registration failed. Please try again.");
            }
        });
    };

    // Dynamic colors based on role
    const isArtist = selectedRole === 'artist';
    const primaryColor = isArtist ? '#8B5CF6' : '#FF6B35';
    const secondaryColor = isArtist ? '#3B82F6' : '#FF9D55';
    const gradientColors: readonly [string, string] = isArtist
        ? ['#8B5CF6', '#3B82F6']
        : ['#FF6B35', '#FF9D55'];

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
                    colors={isArtist ? ['#000000', '#1A0B2E', '#000000'] : ['#000000', '#2E1A0B', '#000000']}
                    locations={[0, 0.5, 1]}
                    style={{ flex: 1 }}
                />
            </Animated.View>

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

                        {/* HERO HEADER */}
                        <View className="items-center mb-6 mt-10">
                            <Text className="text-white text-5xl font-black mb-3 text-center tracking-tighter">
                                {isArtist ? 'Join the Stage' : 'Find Talent'}
                            </Text>

                            <View className="flex-row items-center mb-3">
                                <LinearGradient
                                    colors={gradientColors}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    className="px-4 py-2 rounded-xl"
                                >
                                    <Text className="text-white text-lg font-black tracking-tight">
                                        {isArtist ? 'PERFORMER' : 'ORGANIZER'}
                                    </Text>
                                </LinearGradient>
                                <Zap size={24} color="#F59E0B" style={{ marginLeft: 8 }} />
                            </View>

                            <Text className="text-zinc-500 text-base text-center font-light max-w-xs">
                                {isArtist
                                    ? 'Create your profile and start getting discovered by top organizers.'
                                    : 'Connect with talented artists and bring your events to life.'}
                            </Text>
                        </View>

                        {/* GLASSMORPHIC FORM CARD */}
                        <View
                            className="w-full max-w-md self-center p-6 rounded-3xl"
                            style={{
                                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                borderWidth: 1,
                                borderColor: 'rgba(255, 255, 255, 0.1)',
                                shadowColor: primaryColor,
                                shadowOffset: { width: 0, height: 20 },
                                shadowOpacity: 0.3,
                                shadowRadius: 30,
                            }}
                        >
                            {/* Role Selection */}
                            <View className="flex-row gap-3 mb-5">
                                <RoleCard
                                    role="artist"
                                    selected={selectedRole === "artist"}
                                    onPress={() => setValue("role", "artist")}
                                    icon={Mic2}
                                    title="Artist"
                                    subtitle="Want to perform & get discovered"
                                    gradientColors={['#8B5CF6', '#3B82F6']}
                                    accentColor="#8B5CF6"
                                />
                                <RoleCard
                                    role="organizer"
                                    selected={selectedRole === "organizer"}
                                    onPress={() => setValue("role", "organizer")}
                                    icon={ClipboardList}
                                    title="Organizer"
                                    subtitle="I want to discover & hire the best talent"
                                    gradientColors={['#FF6B35', '#FF9D55']}
                                    accentColor="#FF6B35"
                                />
                            </View>

                            {/* Form Error */}
                            {formError && (
                                <View className="bg-red-500/20 border border-red-500/40 p-4 rounded-2xl mb-5 flex-row items-center">
                                    <View className="w-2 h-2 rounded-full bg-red-500 mr-3" />
                                    <Text className="text-red-300 text-sm font-medium flex-1">
                                        {formError}
                                    </Text>
                                </View>
                            )}

                            {/* Full Name Input */}
                            <View className="mb-4">
                                <Input
                                    label="Full Name"
                                    control={control}
                                    name="fullName"
                                    placeholder="Enter your full name"
                                    startIcon={<User size={20} color="#71717A" />}
                                    error={errors.fullName?.message}
                                    contentContainerClassName="bg-white/5 border-white/10 h-14 rounded-xl"
                                    inputClassName="text-white text-base"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                />
                            </View>

                            {/* Email Input */}
                            <View className="mb-4">
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

                            {/* Phone Input */}
                            <View className="mb-4">
                                <Input
                                    label="Phone Number"
                                    control={control}
                                    name="phoneNumber"
                                    placeholder="+91 98765 43210"
                                    keyboardType="phone-pad"
                                    startIcon={<Phone size={20} color="#71717A" />}
                                    error={errors.phoneNumber?.message}
                                    contentContainerClassName="bg-white/5 border-white/10 h-14 rounded-xl"
                                    inputClassName="text-white text-base"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                />
                            </View>

                            {/* Password Input */}
                            <View className="mb-5">
                                <Input
                                    label="Password"
                                    control={control}
                                    name="password"
                                    placeholder="Create a strong password"
                                    secureTextEntry
                                    startIcon={<Lock size={20} color="#71717A" />}
                                    error={errors.password?.message}
                                    contentContainerClassName="bg-white/5 border-white/10 h-14 rounded-xl"
                                    inputClassName="text-white text-base"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                />
                            </View>

                            {/* Submit Button */}
                            <Animated.View
                                style={!isWeb ? { transform: [{ scale: pulseAnim }] } : undefined}
                            >
                                <GradientButton
                                    onPress={handleSubmit(onSubmit)}
                                    loading={registerMutation.isPending}
                                    label={registerMutation.isPending ? "Creating..." : "Step into the Spotlight →"}
                                    colors={gradientColors as [string, string]}
                                />
                            </Animated.View>

                            {/* Social Proof */}
                            <View className="mt-5 pt-5 border-t border-white/10">
                                <View className="flex-row items-center justify-center">
                                    <Star size={14} color="#F59E0B" />
                                    <Text className="text-zinc-500 text-xs ml-2 font-medium">
                                        Join 10,000+ artists & organizers
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Footer CTA */}
                        <View className="flex-row justify-center items-center mt-8 mb-8">
                            <Text className="text-zinc-500 text-base">Already in the spotlight? </Text>
                            <Link href="/(auth)/login" asChild>
                                <TouchableOpacity>
                                    <Text style={{ color: primaryColor }} className="font-black text-base">
                                        Sign In →
                                    </Text>
                                </TouchableOpacity>
                            </Link>
                        </View>

                        {/* Bottom Decoration */}
                        <View className="items-center pb-6 mb-6">
                            <View className="flex-row items-center gap-2">
                                <View className="w-1 h-1 rounded-full" style={{ backgroundColor: `${primaryColor}66` }} />
                                <View className="w-1 h-1 rounded-full" style={{ backgroundColor: `${secondaryColor}66` }} />
                                <View className="w-1 h-1 rounded-full bg-pink-500/40" />
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}