// app/(auth)/forgot-password.tsx — NETSA · Password Reset Flow
import React, { useState, useRef, useEffect } from "react";
import {
    View, Text, TouchableOpacity, Animated, Platform,
    KeyboardAvoidingView, Keyboard,
    Dimensions, StatusBar, ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
    Mail, Key, Lock, ChevronLeft, ArrowRight, CheckCircle, Eye, EyeOff
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useForgotPassword, useResetPassword } from "@/hooks/useAuthQueries";
import authService from "@/services/authService";
import { StepInput, LoginHero } from "@/components/auth";
import { Colors } from "@/constants/Colors";

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");
const C = Colors.auth;

type Step = "email" | "code" | "newPassword" | "success";

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ email?: string }>();
    const forgotMutation = useForgotPassword();
    const resetMutation = useResetPassword();

    /* ── State ── */
    const [step, setStep] = useState<Step>("email");
    const [email, setEmail] = useState(params.email ?? "");
    const [code, setCode] = useState("");
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [showRegisterLink, setShowRegisterLink] = useState(false);
    const [countdown, setCountdown] = useState(0);

    /* ── Animations ── */
    const sheetSlide = useRef(new Animated.Value(60)).current;
    const sheetFade = useRef(new Animated.Value(0)).current;
    const keyboardShift = useRef(new Animated.Value(0)).current;
    const ctaShimmer = useRef(new Animated.Value(-SCREEN_W)).current;
    const successScale = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const kbdShow = Keyboard.addListener(
            Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
            () => {
                Animated.timing(keyboardShift, {
                    toValue: -80, duration: 250, useNativeDriver: true,
                }).start();
            }
        );
        const kbdHide = Keyboard.addListener(
            Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
            () => {
                Animated.timing(keyboardShift, {
                    toValue: 0, duration: 250, useNativeDriver: true,
                }).start();
            }
        );
        return () => { kbdShow.remove(); kbdHide.remove(); };
    }, []);

    useEffect(() => {
        Animated.sequence([
            Animated.delay(400),
            Animated.parallel([
                Animated.spring(sheetSlide, { toValue: 0, friction: 9, tension: 55, useNativeDriver: true }),
                Animated.timing(sheetFade, { toValue: 1, duration: 350, useNativeDriver: true }),
            ]),
        ]).start();

        Animated.loop(
            Animated.sequence([
                Animated.delay(2500),
                Animated.timing(ctaShimmer, {
                    toValue: SCREEN_W * 2, duration: 900, useNativeDriver: true,
                }),
                Animated.timing(ctaShimmer, {
                    toValue: -SCREEN_W, duration: 0, useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    /* Countdown timer */
    useEffect(() => {
        if (countdown <= 0) return;
        const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [countdown]);

    /* ── Handlers ── */
    const handleSendCode = async () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim() || !emailRegex.test(email)) {
            setError("Please enter a valid email address.");
            return;
        }
        setError(null);

        // First check if the email is registered
        try {
            const checkResult = await authService.checkEmail({ email: email.trim() });
            if (!checkResult.exists) {
                setError("No account found with this email address.");
                setShowRegisterLink(true);
                return;
            }
        } catch {
            setError("Unable to verify email. Please try again.");
            return;
        }

        setShowRegisterLink(false);

        forgotMutation.mutate({ email: email.trim() }, {
            onSuccess: () => {
                setStep("code");
                setCountdown(60);
            },
            onError: (err: any) => {
                const msg = err.response?.data?.msg || err.response?.data?.meta?.message || err.response?.data?.message || err.message || "Failed to send reset code.";
                setError(msg);
            },
        });
    };

    const handleResendCode = () => {
        if (countdown > 0) return;
        setError(null);
        setShowRegisterLink(false);
        forgotMutation.mutate({ email: email.trim() }, {
            onSuccess: () => setCountdown(60),
            onError: (err: any) => {
                const msg = err.response?.data?.msg || err.response?.data?.meta?.message || err.response?.data?.message || err.message || "Failed to resend code.";
                setError(msg);
            },
        });
    };

    const handleVerifyCode = () => {
        if (!code.trim() || code.length !== 6) {
            setError("Please enter a valid 6-digit code.");
            return;
        }
        setError(null);
        setStep("newPassword");
    };

    const handleResetPassword = () => {
        if (!newPassword || newPassword.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setError(null);
        resetMutation.mutate({ email: email.trim(), code: code.trim(), newPassword }, {
            onSuccess: () => {
                setStep("success");
                Animated.spring(successScale, {
                    toValue: 1, friction: 5, tension: 60, useNativeDriver: true,
                }).start();
            },
            onError: (err: any) => {
                const msg = err.response?.data?.msg || err.response?.data?.meta?.message || err.response?.data?.message || err.message || "Failed to reset password.";
                setError(msg);
            },
        });
    };

    const handleBack = () => {
        setError(null);
        setShowRegisterLink(false);
        if (step === "code") setStep("email");
        else if (step === "newPassword") setStep("code");
        else router.back();
    };

    const isPending = forgotMutation.isPending || resetMutation.isPending;

    const ctaLabel = forgotMutation.isPending ? "Sending…"
        : resetMutation.isPending ? "Resetting…"
            : step === "email" ? "Send Reset Code"
                : step === "code" ? "Continue"
                    : "Reset Password";

    const sheetTitle = step === "email" ? "Forgot Password"
        : step === "code" ? "Enter Code"
            : step === "newPassword" ? "New Password"
                : "All Done!";

    const sheetSubtitle = step === "email" ? "Enter your email to receive a 6-digit reset code."
        : step === "code" ? `Enter the 6-digit code sent to ${email}`
            : step === "newPassword" ? "Choose a new password for your account."
                : "Your password has been reset successfully.";

    return (
        <View style={{ flex: 1, backgroundColor: C.bg }}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Hero */}
            <LoginHero />

            {/* Sheet */}
            <Animated.View style={{
                flex: 2,
                borderTopLeftRadius: 30, borderTopRightRadius: 30,
                backgroundColor: C.sheet,
                borderTopWidth: 1, borderColor: C.sheetBorder,
                opacity: sheetFade,
                transform: [
                    { translateY: sheetSlide },
                    { translateY: keyboardShift }
                ],
                overflow: "hidden",
            }}>
                {/* Top glow line */}
                <LinearGradient
                    colors={["rgba(139,92,246,0.28)", "transparent"]}
                    style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1 }}
                />

                {/* Ambient glow */}
                <View style={{
                    position: "absolute", top: -60, left: SCREEN_W * 0.2,
                    width: SCREEN_W * 0.6, height: 120, borderRadius: 60,
                    backgroundColor: "rgba(139,92,246,0.07)",
                }} />

                {/* Drag indicator */}
                <View style={{
                    alignSelf: "center", marginTop: 10, marginBottom: 2,
                    width: 38, height: 4, borderRadius: 2,
                    backgroundColor: C.w15,
                }} />

                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        contentContainerStyle={{
                            flexGrow: 1, paddingHorizontal: 24,
                            paddingTop: 22, paddingBottom: 28,
                        }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                    >
                        {/* Header, subtitle */}
                        <View>
                            <View style={{
                                flexDirection: "row", alignItems: "center",
                                marginBottom: 4, gap: 10,
                            }}>
                                {step !== "success" && (
                                    <TouchableOpacity
                                        onPress={handleBack}
                                        accessibilityRole="button"
                                        style={{
                                            width: 32, height: 32, borderRadius: 10,
                                            backgroundColor: C.w05,
                                            borderWidth: 1, borderColor: C.w08,
                                            alignItems: "center", justifyContent: "center",
                                        }}
                                    >
                                        <ChevronLeft size={16} color={C.w80} />
                                    </TouchableOpacity>
                                )}
                                <Text style={{
                                    fontSize: 24, fontWeight: "800",
                                    color: C.w95, letterSpacing: -0.5,
                                }}>
                                    {sheetTitle}
                                </Text>
                            </View>

                            <Text style={{
                                fontSize: 13, color: C.w40,
                                marginBottom: 20, lineHeight: 18,
                            }}>
                                {sheetSubtitle}
                            </Text>
                        </View>

                        <View style={{ gap: 16, justifyContent: "center", flex: 1, }}>
                            {/* ── Step: Email ── */}
                            {step === "email" && (
                                <StepInput
                                    label="Email Address"
                                    hideLabel
                                    value={email}
                                    onChangeText={(v) => { setEmail(v); setError(null); }}
                                    placeholder="name@example.com"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    icon={<Mail size={15} color={C.w40} />}
                                    error={!!error}
                                />
                            )}

                            {/* ── Step: Code ── */}
                            {step === "code" && (
                                <>
                                    <StepInput
                                        label={`Reset Code — ${email}`}
                                        hideLabel
                                        value={code}
                                        onChangeText={(v) => { setCode(v.replace(/[^0-9]/g, "").slice(0, 6)); setError(null); }}
                                        placeholder="Enter 6-digit code"
                                        keyboardType="number-pad"
                                        icon={<Key size={15} color={C.w40} />}
                                        error={!!error}
                                    />
                                    {/* Resend row */}
                                    <TouchableOpacity
                                        onPress={handleResendCode}
                                        activeOpacity={0.75}
                                        disabled={countdown > 0}
                                        accessibilityRole="button"
                                        style={{ alignSelf: "flex-end", marginTop: -4, marginBottom: 20 }}
                                    >
                                        <Text style={{
                                            fontSize: 12, fontWeight: "600",
                                            color: countdown > 0 ? C.w30 : C.primary,
                                        }}>
                                            {countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"}
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            )}

                            {/* ── Step: New Password ── */}
                            {step === "newPassword" && (
                                <>
                                    <StepInput
                                        label="New Password"
                                        hideLabel
                                        value={newPassword}
                                        onChangeText={(v) => { setNewPassword(v); setError(null); }}
                                        placeholder="Minimum 8 characters"
                                        secureTextEntry={!isPasswordVisible}
                                        icon={<Lock size={15} color={C.w40} />}
                                        rightIcon={isPasswordVisible ? <EyeOff size={16} color={C.w40} /> : <Eye size={16} color={C.w40} />}
                                        onRightIconPress={() => setIsPasswordVisible(!isPasswordVisible)}
                                        error={!!error}
                                    />
                                    <StepInput
                                        label="Confirm Password"
                                        hideLabel
                                        value={confirmPassword}
                                        onChangeText={(v) => { setConfirmPassword(v); setError(null); }}
                                        placeholder="Re-enter your password"
                                        secureTextEntry={!isPasswordVisible}
                                        icon={<Lock size={15} color={C.w40} />}
                                        rightIcon={isPasswordVisible ? <EyeOff size={16} color={C.w40} /> : <Eye size={16} color={C.w40} />}
                                        onRightIconPress={() => setIsPasswordVisible(!isPasswordVisible)}
                                        error={!!error}
                                    />
                                </>
                            )}

                            {/* ── Step: Success ── */}
                            {step === "success" && (
                                <Animated.View style={{
                                    alignItems: "center", paddingVertical: 32,
                                    transform: [{ scale: successScale }],
                                }}>
                                    <View style={{
                                        width: 72, height: 72, borderRadius: 36,
                                        backgroundColor: "rgba(34,197,94,0.15)",
                                        alignItems: "center", justifyContent: "center",
                                        marginBottom: 20,
                                    }}>
                                        <CheckCircle size={36} color="#22C55E" />
                                    </View>
                                    <Text style={{
                                        fontSize: 16, fontWeight: "700",
                                        color: C.w95, textAlign: "center", marginBottom: 8,
                                    }}>
                                        Password Reset!
                                    </Text>
                                    <Text style={{
                                        fontSize: 13, color: C.w40,
                                        textAlign: "center", lineHeight: 18,
                                    }}>
                                        You can now sign in with your new password.
                                    </Text>
                                </Animated.View>
                            )}

                            {/* ── Error banner ── */}
                            {error && (
                                <View style={{
                                    backgroundColor: C.error,
                                    borderWidth: 1, borderColor: C.errorBdr,
                                    borderRadius: 12, paddingVertical: 10,
                                    paddingHorizontal: 14, marginBottom: 16,
                                }}>
                                    <Text style={{
                                        color: C.errorText, fontSize: 13,
                                        textAlign: "center", lineHeight: 18,
                                    }}>{error}</Text>

                                    {showRegisterLink && (
                                        <TouchableOpacity
                                            onPress={() => router.replace({
                                                pathname: "/(auth)/register",
                                                params: { email: email.trim() },
                                            })}
                                            activeOpacity={0.7}
                                            style={{
                                                marginTop: 10,
                                                paddingVertical: 8,
                                                paddingHorizontal: 12,
                                                borderRadius: 8,
                                                backgroundColor: "rgba(139,92,246,0.15)",
                                                alignSelf: 'center',
                                                borderWidth: 1,
                                                borderColor: "rgba(139,92,246,0.3)",
                                            }}
                                        >
                                            <Text style={{ color: C.primary, fontWeight: '700', fontSize: 13 }}>
                                                Create an account
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}

                            {/* ── CTA Button ── */}
                            <View style={{ alignItems: "center", width: "100%" }}>
                                {step !== "success" ? (
                                    <TouchableOpacity
                                        onPress={
                                            step === "email" ? handleSendCode
                                                : step === "code" ? handleVerifyCode
                                                    : handleResetPassword
                                        }
                                        activeOpacity={0.87}
                                        disabled={isPending}
                                        accessibilityRole="button"
                                        style={{
                                            width: "85%",
                                            borderRadius: 16, overflow: "hidden",
                                            opacity: isPending ? 0.72 : 1,
                                            marginTop: !error ? 4 : 0,
                                        }}
                                    >
                                        <LinearGradient
                                            colors={["#7C3AED", "#8B5CF6", "#6366F1"]}
                                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                            style={{
                                                height: 54, borderRadius: 16,
                                                alignItems: "center", justifyContent: "center",
                                                flexDirection: "row", gap: 8,
                                            }}
                                        >
                                            <Text style={{
                                                color: "#fff", fontSize: 16,
                                                fontWeight: "700", letterSpacing: 0.3,
                                            }}>{ctaLabel}</Text>
                                            {!isPending && (
                                                <ArrowRight size={17} color="rgba(255,255,255,0.85)" />
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity
                                        onPress={() => router.replace("/(auth)/login")}
                                        activeOpacity={0.87}
                                        accessibilityRole="button"
                                        style={{ width: "85%", borderRadius: 16, overflow: "hidden", marginTop: 4 }}
                                    >
                                        <LinearGradient
                                            colors={["#7C3AED", "#8B5CF6", "#6366F1"]}
                                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                            style={{
                                                height: 54, borderRadius: 16,
                                                alignItems: "center", justifyContent: "center",
                                                flexDirection: "row", gap: 8,
                                            }}
                                        >
                                            <Text style={{
                                                color: "#fff", fontSize: 16,
                                                fontWeight: "700", letterSpacing: 0.3,
                                            }}>Back to Sign In</Text>
                                            <ArrowRight size={17} color="rgba(255,255,255,0.85)" />
                                        </LinearGradient>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </Animated.View>
        </View>
    );
}
