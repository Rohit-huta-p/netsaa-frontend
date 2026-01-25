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
} from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, ArrowLeft, Sparkles, Users } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { Input } from "@/components/ui/Input";
import { GradientButton } from "@/components/ui/GradientButton";
import useAuthStore from "@/stores/authStore";
import { useLogin } from "@/hooks/useAuthQueries";

const isWeb = Platform.OS === "web";

// Schema for the login form
const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Glowing orb decoration component
const GlowOrb = ({ color, size, top, left, blur }: { color: string; size: number; top: number; left: number | string; blur: number }) => (
    <View
        style={{
            position: 'absolute',
            top,
            left: typeof left === 'string' ? undefined : left,
            right: typeof left === 'string' ? 0 : undefined,
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            opacity: 0.15,
            ...(isWeb ? { filter: `blur(${blur}px)` } : {}),
        }}
    />
);

export default function LoginScreen() {
    const router = useRouter();
    const loginMutation = useLogin();
    const [formError, setFormError] = useState<string | null>(null);
    const { height, width } = useWindowDimensions();
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Pulse animation for CTA button
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
                setFormError(serverMsg || error.message || "Invalid email or password. Please try again.");
            }
        });
    };

    return (
        <View className="flex-1" style={{ backgroundColor: '#0a0a0f' }}>
            {/* Deep dark gradient background */}
            <LinearGradient
                colors={['#0a0510', '#1a0b2e', '#0f0a1a', '#0a0a0f'] as const}
                locations={[0, 0.3, 0.7, 1]}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />

            {/* Spotlight Effect from top */}
            <View
                style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    marginLeft: -width * 0.75,
                    width: width * 1.5,
                    height: height * 0.6,
                }}
            >
                <LinearGradient
                    colors={['rgba(255,0,110,0.2)', 'rgba(131,56,236,0.1)', 'transparent'] as const}
                    locations={[0, 0.4, 1]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={{
                        width: '100%',
                        height: '100%',
                        borderBottomLeftRadius: width,
                        borderBottomRightRadius: width,
                    }}
                />
            </View>

            {/* Glow Orbs for depth */}
            <GlowOrb color="#ff006e" size={300} top={-80} left={-80} blur={80} />
            <GlowOrb color="#8338ec" size={250} top={height * 0.4} left="right" blur={60} />
            <GlowOrb color="#3b82f6" size={180} top={height * 0.7} left={-40} blur={50} />

            {/* Stage light beams */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: height * 0.4 }} pointerEvents="none">
                {[...Array(5)].map((_, i) => (
                    <View
                        key={i}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: `${15 + i * 18}%`,
                            width: 1,
                            height: '60%',
                            backgroundColor: 'rgba(255,255,255,0.02)',
                            transform: [{ rotate: `${-15 + i * 8}deg` }],
                        }}
                    />
                ))}
            </View>

            {/* Animated ring decorations */}
            <View
                style={{
                    position: 'absolute',
                    top: height * 0.12,
                    right: -60,
                    width: 150,
                    height: 150,
                    borderRadius: 75,
                    borderWidth: 1,
                    borderColor: 'rgba(255,0,110,0.2)',
                }}
            />
            <View
                style={{
                    position: 'absolute',
                    bottom: height * 0.15,
                    left: -40,
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    borderWidth: 1,
                    borderColor: 'rgba(131,56,236,0.2)',
                }}
            />

            <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    className="flex-1 justify-center px-6"
                    style={{ zIndex: 10 }}
                >
                    {/* Back Button */}
                    <View className="absolute top-4 left-0">
                        <Link href="/" asChild>
                            <TouchableOpacity
                                className="w-10 h-10 items-center justify-center rounded-full"
                                style={{
                                    backgroundColor: 'rgba(255,255,255,0.08)',
                                    borderWidth: 1,
                                    borderColor: 'rgba(255,255,255,0.1)',
                                }}
                            >
                                <ArrowLeft size={20} color="white" />
                            </TouchableOpacity>
                        </Link>
                    </View>

                    {/* Live indicator badge */}
                    <View className="flex-row items-center justify-center mb-6">
                        <View
                            className="flex-row items-center px-4 py-2 rounded-full"
                            style={{
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.1)',
                            }}
                        >
                            <View
                                className="w-2 h-2 rounded-full mr-2"
                                style={{ backgroundColor: '#22c55e' }}
                            />
                            <Users size={14} color="#8338ec" style={{ marginRight: 6 }} />
                            <Text className="text-xs font-medium" style={{ color: '#9CA3AF' }}>
                                2,847 artists online
                            </Text>
                        </View>
                    </View>

                    {/* Header */}
                    <View className="items-center mb-8">
                        <Text className="text-white text-4xl font-black mb-2 text-center">
                            Welcome Back
                        </Text>
                        <View className="flex-row items-center">
                            <LinearGradient
                                colors={['#ff006e', '#8338ec'] as const}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                className="px-3 py-1 rounded-lg"
                            >
                                <Text className="text-white text-lg font-bold">Star</Text>
                            </LinearGradient>
                            <Sparkles size={20} color="#fbbf24" style={{ marginLeft: 8 }} />
                        </View>
                        <Text className="text-gray-400 text-base text-center mt-3">
                            Enter the spotlight and continue your journey
                        </Text>
                    </View>

                    {/* Glassmorphism Form Container */}
                    <View
                        className="w-full max-w-md self-center p-6 rounded-[28px]"
                        style={{
                            backgroundColor: 'rgba(0,0,0,0.4)',
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.1)',
                        }}
                    >
                        {/* Form Error */}
                        {formError ? (
                            <View className="bg-red-500/20 border border-red-500/30 p-3 rounded-xl mb-4">
                                <Text className="text-red-300 text-center text-sm font-medium">{formError}</Text>
                            </View>
                        ) : null}

                        {/* Email Input */}
                        <Input
                            control={control}
                            name="email"
                            label="Email Address"
                            placeholder="star@example.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            startIcon={<Mail size={18} color="#A1A1AA" />}
                            error={errors.email?.message}
                            containerClassName="mb-4"
                            labelClassName="text-gray-300"
                            contentContainerClassName="bg-white/5 border-white/10"
                            inputClassName="text-white"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                        />

                        {/* Password Input */}
                        <View>
                            <Input
                                control={control}
                                name="password"
                                label="Password"
                                placeholder="••••••••"
                                secureTextEntry
                                startIcon={<Lock size={18} color="#A1A1AA" />}
                                error={errors.password?.message}
                                containerClassName="mb-2"
                                labelClassName="text-gray-300"
                                contentContainerClassName="bg-white/5 border-white/10"
                                inputClassName="text-white"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                            />
                            <TouchableOpacity className="self-end">
                                <Text style={{ color: '#ff006e' }} className="text-sm font-medium">
                                    Forgot Password?
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Submit Button */}
                        <Animated.View
                            className="mt-6"
                            style={!isWeb ? { transform: [{ scale: pulseAnim }] } : undefined}
                        >
                            <GradientButton
                                onPress={handleSubmit(onSubmit)}
                                loading={loginMutation.isPending}
                                label="Take the Stage"
                                colors={["#ff006e", "#ff4d94"]}
                            />
                        </Animated.View>
                    </View>

                    {/* Footer */}
                    <View className="flex-row justify-center items-center mt-8">
                        <Text className="text-gray-500">New to the scene? </Text>
                        <Link href="/(auth)/register" asChild>
                            <TouchableOpacity>
                                <Text style={{ color: '#ff006e' }} className="font-bold">
                                    Join Now
                                </Text>
                            </TouchableOpacity>
                        </Link>
                    </View>

                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
