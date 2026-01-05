// path: app/(auth)/login.tsx
import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, useWindowDimensions } from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, ArrowLeft } from "lucide-react-native";
import { Video, ResizeMode } from 'expo-av';

import { Input } from "@/components/ui/Input";
import { GradientButton } from "@/components/ui/GradientButton";
import useAuthStore from "@/stores/authStore";
import { useLogin } from "@/hooks/useAuthQueries";

// Schema for the login form
const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginScreen() {
    const router = useRouter();
    const loginMutation = useLogin();
    // const [isLoading, setIsLoading] = useState(false); // Handled by mutation
    const [formError, setFormError] = useState<string | null>(null);
    const video = useRef(null);
    const { height } = useWindowDimensions();

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = (data: LoginFormValues) => {
        console.log("Tapped 'login button` ");
        setFormError(null);
        console.log("Login attempt");
        loginMutation.mutate({ email: data.email, password: data.password }, {
            onError: (error: any) => {
                const serverMsg = error.response?.data?.msg || error.response?.data?.message || (error.response?.data?.errors && error.response.data.errors[0]?.message);
                console.error("Login failed:", serverMsg || error.message);
                setFormError(serverMsg || error.message || "Invalid email or password. Please try again.");
            }
        });
    };

    return (
        <View className="flex-1">

            <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    className="flex-1 justify-center px-6"
                >
                    {/* Header */}
                    <View className="items-center mb-10">
                        <Text className="text-black text-4xl font-extrabold mb-2 text-center">
                            Welcome Back
                        </Text>
                        <Text className="text-black/80 text-base text-center">
                            Sign in to continue your journey
                        </Text>
                    </View>

                    {/* Form Fields */}
                    <View className="space-y-4 w-full max-w-md self-center">
                        <Input
                            control={control}
                            name="email"
                            label="Email Address"
                            placeholder="john@example.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            startIcon={<Mail size={20} color="#9CA3AF" />}
                            error={errors.email?.message}
                            // Dark theme styling
                            containerClassName="mb-4"
                            contentContainerClassName="bg-white/10 border-white/20 "
                            inputClassName="text-black placeholder:text-gray-400 focus:outline-none"
                            placeholderTextColor="#9CA3AF"
                        />
                        {/* Form Level Error Message */}
                        {formError ? (
                            <View className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg mt-2">
                                <Text className="text-red-400 text-center text-sm">{formError}</Text>
                            </View>
                        ) : null}

                        <View>
                            <Input
                                control={control}
                                name="password"
                                label="Password"
                                placeholder="••••••••"
                                secureTextEntry
                                startIcon={<Lock size={20} color="#9CA3AF" />}
                                error={errors.password?.message}
                                // Dark theme styling
                                containerClassName="mb-1"
                                contentContainerClassName="bg-white/10 border-white/20"
                                inputClassName="text-black placeholder:text-gray-400  focus:outline-none"
                                placeholderTextColor="#9CA3AF"
                            />
                            <TouchableOpacity className="self-end p-1">
                                <Text className="text-pink-400 text-sm font-medium">Forgot Password?</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Submit Button */}
                    <View className="mt-8 mb-6 w-full max-w-md self-center">
                        <GradientButton
                            onPress={handleSubmit(onSubmit)}
                            loading={loginMutation.isPending}
                            label="Sign In"
                            colors={["#FB7185", "#FB923C"]}
                        />
                    </View>

                    {/* Footer */}
                    <View className="flex-row justify-center items-center mt-4">
                        <Text className="text-white/70">Don't have an account? </Text>
                        <Link href="/(auth)/register" asChild>
                            <TouchableOpacity>
                                <Text className="font-bold text-pink-400">Sign Up</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>

                    {/* Back Button (Absolute positioned top-left) */}
                    <View className="absolute top-4 left-0">
                        <Link href="/" asChild>
                            <TouchableOpacity className="p-2 rounded-full bg-white/10">
                                <ArrowLeft size={24} color="white" />
                            </TouchableOpacity>
                        </Link>
                    </View>

                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
