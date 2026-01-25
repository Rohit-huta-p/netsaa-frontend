// path: app/(auth)/register.tsx
import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    Animated,
    Easing,
} from "react-native";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Mic2, ClipboardList } from "lucide-react-native";

import { THEME_COLORS } from "@/hooks/useThemeColors";
import useAuthStore from "@/stores/authStore";
import { useRegister } from "@/hooks/useAuthQueries";

// Extracted components
import { BackgroundEffects, RoleCard, RegistrationHeader, RegistrationForm } from "@/components/auth";
import { registerSchema, RegisterFormValues, RoleCardColors } from "@/schemas/register.schema";

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const isWeb = Platform.OS === "web";

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SCREEN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function RegisterScreen() {
    // ─────────────────────────────────────────────────────────────────────────
    // State & Hooks
    // ─────────────────────────────────────────────────────────────────────────
    const registerMutation = useRegister();
    const [formError, setFormError] = useState<string | null>(null);

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const fadeInAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(50)).current;
    const screenHeight = Dimensions.get('window').height;

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

    // ─────────────────────────────────────────────────────────────────────────
    // Animations
    // ─────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeInAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideUpAnim, {
                toValue: 0,
                duration: 800,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    useEffect(() => {
        if (isWeb) return;
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.03,
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

    // ─────────────────────────────────────────────────────────────────────────
    // Form Submission
    // ─────────────────────────────────────────────────────────────────────────
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

    // ─────────────────────────────────────────────────────────────────────────
    // Theme Configuration
    // ─────────────────────────────────────────────────────────────────────────
    const primaryAccent = selectedRole === 'artist'
        ? THEME_COLORS.artist.secondary.colors[0]
        : THEME_COLORS.organizer.primary.colors[0];

    const spotlightColors = selectedRole === 'artist'
        ? [`${THEME_COLORS.artist.primary.colors[0]}33`, `${THEME_COLORS.artist.primary.colors[1]}1A`, 'transparent'] as const
        : [`${THEME_COLORS.organizer.primary.colors[0]}33`, `${THEME_COLORS.organizer.primary.colors[1]}1A`, 'transparent'] as const;

    const artistCardColors: RoleCardColors = {
        bg: `${THEME_COLORS.artist.secondary.colors[0]}15`,
        border: THEME_COLORS.artist.secondary.colors[0],
        iconBg: THEME_COLORS.artist.secondary.colors[0],
    };

    const organizerCardColors: RoleCardColors = {
        bg: `${THEME_COLORS.organizer.primary.colors[0]}15`,
        border: THEME_COLORS.organizer.primary.colors[0],
        iconBg: THEME_COLORS.organizer.primary.colors[0],
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <View className="flex-1 bg-netsa-dark">
            {/* Background Effects */}
            <BackgroundEffects
                primaryAccent={primaryAccent}
                spotlightColors={spotlightColors}
                screenHeight={screenHeight}
            />

            <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
                        showsVerticalScrollIndicator={false}
                    >
                        <Animated.View
                            className="px-4"
                            style={{
                                zIndex: 10,
                                opacity: fadeInAnim,
                                transform: [{ translateY: slideUpAnim }],
                            }}
                        >
                            {/* Back Button */}
                            <TouchableOpacity
                                onPress={() => router.back()}
                                className="w-10 h-10 items-center justify-center rounded-full mb-4"
                                style={{
                                    backgroundColor: 'rgba(255,255,255,0.08)',
                                    borderWidth: 1,
                                    borderColor: 'rgba(255,255,255,0.1)',
                                }}
                            >
                                <ArrowLeft size={20} color="#fff" />
                            </TouchableOpacity>

                            {/* Main Content Container */}
                            <View className="w-[80%] mx-auto">
                                {/* Header Section */}
                                <RegistrationHeader
                                    selectedRole={selectedRole}
                                    primaryAccent={primaryAccent}
                                />

                                {/* Role Selection */}
                                <View className="flex-row gap-4 mb-6">
                                    <RoleCard
                                        role="artist"
                                        selected={selectedRole === "artist"}
                                        onPress={() => setValue("role", "artist")}
                                        icon={Mic2}
                                        title="Artist"
                                        subtitle="I want to perform & get discovered"
                                        colors={artistCardColors}
                                    />
                                    <RoleCard
                                        role="organizer"
                                        selected={selectedRole === "organizer"}
                                        onPress={() => setValue("role", "organizer")}
                                        icon={ClipboardList}
                                        title="Organizer"
                                        subtitle="I want to discover & hire talent"
                                        colors={organizerCardColors}
                                    />
                                </View>

                                {/* Registration Form */}
                                <RegistrationForm
                                    control={control}
                                    errors={errors}
                                    formError={formError}
                                    onSubmit={handleSubmit(onSubmit)}
                                    isLoading={registerMutation.isPending}
                                    pulseAnim={pulseAnim}
                                />

                                {/* Footer */}
                                <View className="flex-row justify-center items-center mt-8 pb-4">
                                    <Text className="text-gray-500">Already in the spotlight? </Text>
                                    <Link href="/(auth)/login" asChild>
                                        <TouchableOpacity>
                                            <Text style={{ color: primaryAccent }} className="font-bold">
                                                Sign In
                                            </Text>
                                        </TouchableOpacity>
                                    </Link>
                                </View>
                            </View>
                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}