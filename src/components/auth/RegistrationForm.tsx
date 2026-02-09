// src/components/auth/RegistrationForm.tsx
import React, { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, Animated, Platform, TouchableOpacity } from "react-native";
import { Controller } from "react-hook-form";

import { LinearGradient } from "expo-linear-gradient";
import { GradientButton } from "@/components/ui/GradientButton";
import { THEME_COLORS } from "@/hooks/useThemeColors";
import { Eye, EyeOff, Lock, Mail, Phone, User, LucideIcon, EyeOffIcon } from "lucide-react-native";

const isWeb = Platform.OS === "web";

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATED FLOATING INPUT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface FloatingInputProps {
    control: any;
    name: string;
    label: string;
    Icon: LucideIcon;
    error?: string;
    secureTextEntry?: boolean;
    keyboardType?: 'default' | 'email-address' | 'phone-pad';
    autoCapitalize?: 'none' | 'sentences';
}

const FloatingInput = ({
    control,
    name,
    label,
    Icon,
    error,
    secureTextEntry = false,
    keyboardType = 'default',
    autoCapitalize = 'sentences',
}: FloatingInputProps) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const labelAnim = useRef(new Animated.Value(0)).current;
    const borderAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const animateLabel = (shouldFloat: boolean) => {
        Animated.parallel([
            Animated.spring(labelAnim, {
                toValue: shouldFloat ? 1 : 0,
                friction: 8,
                tension: 100,
                useNativeDriver: true,
            }),
            Animated.timing(borderAnim, {
                toValue: shouldFloat ? 1 : 0,
                duration: 200,
                useNativeDriver: false,
            }),
        ]).start();
    };

    const labelTranslateY = labelAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -28],
    });

    const labelScale = labelAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.85],
    });

    const labelColor = labelAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(161, 161, 170, 1)', 'rgba(244, 114, 182, 1)'],
    });

    const borderColor = borderAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(255, 255, 255, 0.1)', 'rgba(244, 114, 182, 0.5)'],
    });

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.98,
            friction: 10,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 10,
            useNativeDriver: true,
        }).start();
    };

    // Get the icon color based on state
    const getIconColor = () => {
        if (error) return '#ef4444';
        if (isFocused) return '#F472B6';
        return '#71717A';
    };

    return (
        <Controller
            control={control}
            name={name}
            render={({ field: { onChange, onBlur, value } }) => {
                const hasValue = value && value.length > 0;
                const shouldFloat = isFocused || hasValue;

                useEffect(() => {
                    animateLabel(shouldFloat);
                }, [shouldFloat]);

                return (
                    <View className="mb-5">
                        <Animated.View
                            style={{ transform: [{ scale: scaleAnim }] }}
                        >
                            <Animated.View
                                style={{
                                    borderWidth: 1.5,
                                    borderColor: error ? '#ef4444' : borderColor,
                                    borderRadius: 16,
                                    backgroundColor: error
                                        ? 'rgba(239, 68, 68, 0.08)'
                                        : isFocused
                                            ? 'rgba(244, 114, 182, 0.05)'
                                            : 'rgba(255, 255, 255, 0.03)',
                                }}
                            >
                                {/* Subtle glow effect when focused */}
                                {isFocused && !error && (
                                    <View
                                        style={{
                                            position: 'absolute',
                                            top: -1,
                                            left: -1,
                                            right: -1,
                                            bottom: -1,
                                            borderRadius: 17,
                                            borderWidth: 2,
                                            borderColor: 'rgba(244, 114, 182, 0.2)',
                                        }}
                                    />
                                )}

                                <View className="flex-row items-center px-4 h-16">
                                    {/* Icon */}
                                    <View className="mr-3">
                                        <Icon size={20} color={getIconColor()} />
                                    </View>

                                    {/* Input container with floating label */}
                                    <View className="flex-1 justify-center">
                                        {/* Floating Label with background notch */}
                                        <Animated.View
                                            style={{
                                                position: 'absolute',
                                                left: -4,
                                                paddingHorizontal: 4,
                                                transform: [
                                                    { translateY: labelTranslateY },
                                                    { scale: labelScale },
                                                ],
                                                backgroundColor: shouldFloat
                                                    ? 'rgba(24, 24, 32, 1)'
                                                    : 'transparent',
                                            }}
                                            pointerEvents="none"
                                        >
                                            <Animated.Text
                                                style={{
                                                    color: error ? '#ef4444' : labelColor,
                                                    fontSize: 15,
                                                    fontWeight: '500',
                                                }}
                                            >
                                                {label}
                                            </Animated.Text>
                                        </Animated.View>

                                        {/* Actual Input */}
                                        <TextInput
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={() => {
                                                setIsFocused(false);
                                                onBlur();
                                                handlePressOut();
                                            }}
                                            onFocus={() => {
                                                setIsFocused(true);
                                                handlePressIn();
                                            }}
                                            secureTextEntry={secureTextEntry && !showPassword}
                                            keyboardType={keyboardType}
                                            autoCapitalize={autoCapitalize}
                                            className="text-white text-base pt-3 outline-none"
                                            style={{
                                                height: 48,
                                                opacity: shouldFloat ? 1 : 0,
                                            }}
                                            selectionColor="#F472B6"
                                            cursorColor="#F472B6"
                                        />
                                    </View>

                                    {/* Password toggle */}
                                    {secureTextEntry && (
                                        <TouchableOpacity
                                            onPress={() => setShowPassword(!showPassword)}
                                            className="p-2 ml-2"
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        >
                                            {showPassword ? (
                                                <EyeOff size={18} color="#71717A" />
                                            ) : (
                                                <Eye size={18} color="#71717A" />
                                            )}
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </Animated.View>
                        </Animated.View>

                        {/* Animated Error Message */}
                        {error && (
                            <View className="flex-row items-center mt-2 ml-1">
                                <View className="w-1 h-1 rounded-full bg-red-400 mr-2" />
                                <Text className="text-red-400 text-xs font-medium">
                                    {error}
                                </Text>
                            </View>
                        )}
                    </View>
                );
            }}
        />
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FORM COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface RegistrationFormProps {
    control: any;
    errors: any;
    formError: string | null;
    onSubmit: () => void;
    isLoading: boolean;
    pulseAnim: Animated.Value;
}

/** Modern registration form with floating labels and smooth animations */
export const RegistrationForm = ({
    control,
    errors,
    formError,
    onSubmit,
    isLoading,
    pulseAnim,
}: RegistrationFormProps) => {
    const ctaColors = THEME_COLORS.cta;
    const errorAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (formError) {
            Animated.sequence([
                Animated.timing(errorAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(errorAnim, {
                    toValue: 0.95,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(errorAnim, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [formError]);

    return (
        <View
            className="p-6 rounded-[28px]"
            style={{
                backgroundColor: 'rgba(24, 24, 32, 0.95)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.08)',
            }}
        >
            {/* Subtle inner glow */}
            <LinearGradient
                colors={['rgba(244, 114, 182, 0.03)', 'transparent', 'rgba(99, 102, 241, 0.02)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: 28,
                }}
            />

            {/* Error Message with shake animation */}
            {formError && (
                <Animated.View
                    className="bg-red-500/15 border border-red-500/30 p-4 rounded-2xl mb-5"
                    style={{
                        transform: [{ scale: errorAnim }],
                    }}
                >
                    <View className="flex-row items-center">
                        <View className="w-2 h-2 rounded-full bg-red-400 mr-3" />
                        <Text className="text-red-300 text-sm font-medium flex-1">
                            {formError}
                        </Text>
                    </View>
                </Animated.View>
            )}

            {/* Form Inputs with floating labels */}
            <FloatingInput
                control={control}
                name="fullName"
                label="Stage Name / Full Name"
                Icon={User}
                error={errors.fullName?.message}
            />

            <FloatingInput
                control={control}
                name="email"
                label="Email Address"
                Icon={Mail}
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <FloatingInput
                control={control}
                name="phoneNumber"
                label="Phone Number"
                Icon={Phone}
                error={errors.phoneNumber?.message}
                keyboardType="phone-pad"
            />

            <FloatingInput
                control={control}
                name="password"
                label="Password"
                Icon={Lock}
                error={errors.password?.message}
                secureTextEntry
            />

            {/* Submit Button */}
            <Animated.View
                className="mt-3"
                style={!isWeb ? { transform: [{ scale: pulseAnim }] } : undefined}
            >
                <GradientButton
                    onPress={onSubmit}
                    loading={isLoading}
                    label={isLoading ? "Setting up stage..." : "Take Center Stage"}
                    colors={[ctaColors.colors[0], ctaColors.colors[1], ctaColors.colors[2]]}
                />
            </Animated.View>

            {/* Terms text */}
            <Text className="text-gray-500 text-xs text-center mt-5 px-4 leading-5">
                By continuing, you agree to our{' '}
                <Text className="text-pink-400">Terms of Service</Text>
                {' '}and{' '}
                <Text className="text-pink-400">Privacy Policy</Text>
            </Text>
        </View>
    );
};
