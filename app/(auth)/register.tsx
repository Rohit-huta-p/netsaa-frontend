// path: app/(auth)/register.tsx
import React, { useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
} from "react-native";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, User, ArrowLeft, Phone, Mic2, ClipboardList } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { Input } from "@/components/ui/Input";
import { GradientButton } from "@/components/ui/GradientButton";

// Schema for the registration form
const registerSchema = z.object({
    fullName: z.string().min(2, "Stage name or Full name is required"),
    email: z.string().email("Invalid email address"),
    phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["artist", "organizer"]),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

import useAuthStore from "@/stores/authStore";
import { useRegister } from "@/hooks/useAuthQueries";

const { width } = Dimensions.get("window");

export default function RegisterScreen() {
    const registerMutation = useRegister();
    const [formError, setFormError] = useState<string | null>(null);

    const {
        control,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            role: "artist",
        },
    });

    const selectedRole = watch("role");

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
                const serverMsg = error.response?.data?.msg || error.response?.data?.message || (error.response?.data?.errors && error.response.data.errors[0]?.message);
                setFormError(serverMsg || error.message || "Registration failed. Please try again.");
            }
        });
    };

    return (
        <View className="flex-1 bg-[#09090b]">.                    .
            {/* Ambient Background "Stage Lights" */}
            <LinearGradient
                colors={selectedRole === 'artist'
                    ? ["#1e1b4b", "#0f766e", "#09090b"]
                    : ["#2d1949ff", "#901247ff", "#09090b"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.8 }}
                style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '100%' }}
            />

            <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        contentContainerStyle={{
                            flexGrow: 1,
                            paddingBottom: 40
                        }}
                        showsVerticalScrollIndicator={false}
                    >
                        <View className="px-6 pt-4">
                            {/* Header Navigation */}
                            <TouchableOpacity
                                onPress={() => router.back()}
                                className="w-10 h-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md mb-6"
                            >
                                <ArrowLeft size={20} color="#fff" />
                            </TouchableOpacity>

                            {/* Playful Headline */}
                            <View className="mb-8">
                                <Text className="text-4xl font-black text-white tracking-tight leading-tight text-center">
                                    Join the{"\n"}
                                    <Text className={selectedRole === 'artist' ? "text-pink-400" : "text-teal-400"}>
                                        {selectedRole === 'artist' ? "Show." : "Crew."}
                                    </Text>
                                </Text>
                                <Text className="text-gray-300 text-base mt-2 font-medium text-center">
                                    Create your profile to get discovered.
                                </Text>
                            </View>

                            {/* Role Selection Cards - "Badge Style" */}
                            <View className="flex-row gap-4 mb-8">
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={() => setValue("role", "artist")}
                                    className={`flex-1 p-4 items-center justify-center rounded-3xl border transition-all ${selectedRole === "artist"
                                        ? "bg-pink-500/20 border-pink-500"
                                        : "bg-white/5 border-white/10"
                                        }`}
                                >
                                    <View className={`w-10 h-10 rounded-full items-center justify-center mb-3 ${selectedRole === "artist" ? "bg-pink-500" : "bg-white/10"
                                        }`}>
                                        <Mic2 size={20} color="#fff" />
                                    </View>
                                    <Text className="text-white font-bold text-lg">Artist</Text>
                                    <Text className="text-gray-400 text-xs">I want to perform</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={() => setValue("role", "organizer")}
                                    className={`flex-1 p-4 items-center justify-center rounded-3xl border transition-all ${selectedRole === "organizer"
                                        ? "bg-teal-500/20 border-teal-500"
                                        : "bg-white/5 border-white/10"
                                        }`}
                                >
                                    <View className={`w-10 h-10 rounded-full items-center justify-center mb-3 ${selectedRole === "organizer" ? "bg-teal-500" : "bg-white/10"
                                        }`}>
                                        <ClipboardList size={20} color="#fff" />
                                    </View>
                                    <Text className="text-white font-bold text-lg">Organizer</Text>
                                    <Text className="text-gray-400 text-xs">I want to hire</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Glassmorphism Form Container */}
                            <View className="bg-black/40 p-6 rounded-[32px] border border-white/10 space-y-5">

                                {formError && (
                                    <View className="bg-red-500/20 border border-red-500/50 p-3 rounded-xl">
                                        <Text className="text-red-200 text-center text-sm font-semibold">{formError}</Text>
                                    </View>
                                )}

                                <Input
                                    control={control}
                                    name="fullName"
                                    label="Stage Name / Full Name"
                                    placeholder="The Weeknd"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    startIcon={<User size={18} color="#A1A1AA" />}
                                    error={errors.fullName?.message}
                                // You might need to update Input component to accept custom styles if transparent bg is needed
                                />

                                <Input
                                    control={control}
                                    name="email"
                                    label="Email Address"
                                    placeholder="star@example.com"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    startIcon={<Mail size={18} color="#A1A1AA" />}
                                    error={errors.email?.message}
                                />

                                <Input
                                    control={control}
                                    name="phoneNumber"
                                    label="Phone"
                                    placeholder="+1 234 567 8900"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    keyboardType="phone-pad"
                                    startIcon={<Phone size={18} color="#A1A1AA" />}
                                    error={errors.phoneNumber?.message}
                                />

                                <Input
                                    control={control}
                                    name="password"
                                    label="Password"
                                    placeholder="••••••••"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    secureTextEntry
                                    startIcon={<Lock size={18} color="#A1A1AA" />}
                                    error={errors.password?.message}
                                />

                                <View className="pt-4">
                                    <GradientButton
                                        onPress={handleSubmit(onSubmit)}
                                        loading={registerMutation.isPending}
                                        label={registerMutation.isPending ? "Setting up stage..." : "Get Started"}
                                        colors={
                                            selectedRole === "organizer"
                                                ? ["#0d9488", "#2dd4bf"] // Teals
                                                : ["#db2777", "#f472b6"] // Pinks
                                        }
                                    // Add rounded-full or rounded-2xl to your GradientButton component for extra playfulness
                                    />
                                </View>
                            </View>

                            {/* Footer */}
                            <View className="flex-row justify-center items-center mt-8 pb-4">
                                <Text className="text-gray-400">Already in the club? </Text>
                                <Link href="/(auth)/login" asChild>
                                    <TouchableOpacity>
                                        <Text className={selectedRole === 'artist' ? "font-bold text-pink-400" : "font-bold text-teal-400"}>
                                            Log In
                                        </Text>
                                    </TouchableOpacity>
                                </Link>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}