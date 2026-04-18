// app/(auth)/login.tsx — NETSA · Premium Redesign (ui-ux-pro-max)
import React, { useState, useRef, useEffect } from "react";
import {
    View, Text, TouchableOpacity, Animated, Platform,
    KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard,
    Dimensions, StatusBar, Image, ScrollView, Easing,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    Mail, Lock, ChevronLeft, Phone, Key, ArrowRight, Smartphone, X, Eye, EyeOff,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLogin, useSendOtp, useVerifyOtp } from "@/hooks/useAuthQueries";
import { useAuthStore } from "@/stores/authStore";
import { usePendingAuthActionStore } from "@/stores/pendingAuthActionStore";
import authService from "@/services/authService";
import { CountryCodePicker, StepInput, ArtistTag, AnimatedGlowOrb as GlowOrb, LoginHero, ARTIST_TAGS } from "@/components/auth";
import { OnboardingDetectedModal } from "@/components/common/OnboardingDetectedModal";
import type { VerifyOtpResponse } from "@/types/index";

/* ═══════════════════════════════════════════════════════ */
/*  CONSTANTS                                             */
/* ═══════════════════════════════════════════════════════ */

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");


import { Colors } from "@/constants/Colors";

const C = Colors.auth;

/* ═══════════════════════════════════════════════════════ */
/*  MAIN SCREEN                                           */
/* ═══════════════════════════════════════════════════════ */

export default function LoginScreen() {
    const router = useRouter();
    const loginMutation = useLogin();
    const sendOtpMutation = useSendOtp();
    const verifyOtpMutation = useVerifyOtp();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [loginError, setLoginError] = useState<string | null>(null);

    /* ── New-user modal ── */
    const [showNewUserModal, setShowNewUserModal] = useState(false);
    const [verifiedPhone, setVerifiedPhone] = useState("");

    /* ── Field state ── */
    const [loginMode, setLoginMode] = useState<"phone" | "otp" | "email">("email");
    const [countryCode, setCountryCode] = useState("+91");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = React.useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
    const [countdown, setCountdown] = useState(0);

    /* ── Animations ── */
    const passwordAnim = useRef(new Animated.Value(0)).current;
    const sheetSlide = useRef(new Animated.Value(60)).current;
    const sheetFade = useRef(new Animated.Value(0)).current;
    const ctaShimmer = useRef(new Animated.Value(-SCREEN_W)).current;
    const keyboardShift = useRef(new Animated.Value(0)).current;

    /* ── Marquee scroll for artist tags ── */
    const marqueeAnim = useRef(new Animated.Value(0)).current;
    // Estimated width of one full set of tags (4 tags × ~110px each + gaps)
    const TAG_SET_WIDTH = ARTIST_TAGS.length * 118;

    useEffect(() => {
        const kbdShow = Keyboard.addListener(
            Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
            () => {
                Animated.timing(keyboardShift, {
                    toValue: -80, // Slide the sheet up by 80 points
                    duration: 450,
                    useNativeDriver: true,
                }).start();
            }
        );
        const kbdHide = Keyboard.addListener(
            Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
            () => {
                Animated.timing(keyboardShift, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }).start();
            }
        );
        return () => { kbdShow.remove(); kbdHide.remove(); };
    }, []);

    useEffect(() => {
        // Staggered entry sequence: wait for hero to animate, then slide sheet
        Animated.sequence([
            Animated.delay(800),
            Animated.parallel([
                Animated.spring(sheetSlide, { toValue: 0, friction: 9, tension: 55, useNativeDriver: true }),
                Animated.timing(sheetFade, { toValue: 1, duration: 550, useNativeDriver: true }),
            ]),
        ]).start();

        // CTA button shimmer sweep loop
        Animated.loop(
            Animated.sequence([
                Animated.delay(2500),
                Animated.timing(ctaShimmer, {
                    toValue: SCREEN_W * 2, duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(ctaShimmer, {
                    toValue: -SCREEN_W, duration: 0,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    /* ── Marquee infinite loop ── */
    useEffect(() => {
        let isCancelled = false;

        const animateMarquee = () => {
            if (isCancelled) return;
            marqueeAnim.setValue(0);
            Animated.timing(marqueeAnim, {
                toValue: -TAG_SET_WIDTH,
                duration: 35000,
                useNativeDriver: true,
                easing: Easing.linear,
            }).start(({ finished }) => {
                if (finished && !isCancelled) {
                    animateMarquee();
                }
            });
        };

        // Start after the sheet entrance animation finishes
        const timer = setTimeout(animateMarquee, 1200);
        return () => {
            isCancelled = true;
            clearTimeout(timer);
            marqueeAnim.stopAnimation();
        };
    }, []);

    /* Countdown timer */
    useEffect(() => {
        if (countdown <= 0) return;
        const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [countdown]);

    /* ── Submission handlers ── */
    const handleLogin = () => {
        if (!showPassword) {
            // Step 1: Validate email only
            // Basic email regex
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email.trim() || !emailRegex.test(email)) {
                setLoginError("Please enter a valid email address.");
                return;
            }
            setLoginError(null);
            setShowPassword(true);

            // Animate password container open
            Animated.spring(passwordAnim, {
                toValue: 1,
                friction: 8,
                tension: 50,
                useNativeDriver: true,
            }).start();
            return;
        }

        // Step 2: Actually log in
        if (!password) {
            setLoginError("Please enter your password.");
            return;
        }
        setLoginError(null);
        loginMutation.mutate({ email, password }, {
            onError: (err: any) => {
                const msg = err.response?.data?.msg || err.response?.data?.meta?.message || err.response?.data?.message || err.message || "Invalid credentials.";
                setLoginError(msg);
            },
        });
    };

    const handleSendOtp = () => {
        if (!phone.trim()) {
            setLoginError("Please enter your phone number.");
            return;
        }
        setLoginError(null);
        const formattedPhone = `${countryCode}${phone.replace(/[^0-9]/g, "")}`;
        sendOtpMutation.mutate({ phone: formattedPhone }, {
            onSuccess: () => { setLoginMode("otp"); setCountdown(30); },
            onError: (err: any) => {
                const msg = err.response?.data?.msg || err.response?.data?.meta?.message || err.response?.data?.message || "Failed to send OTP.";
                setLoginError(msg);
            },
        });
    };

    const handleVerifyOtp = () => {
        if (!otp.trim() || otp.length !== 6) {
            setLoginError("Please enter a valid 6-digit OTP.");
            return;
        }
        setLoginError(null);
        const formattedPhone = `${countryCode}${phone.replace(/[^0-9]/g, "")}`;
        verifyOtpMutation.mutate({ phone: formattedPhone, otp }, {
            onSuccess: async (data: VerifyOtpResponse) => {
                if (data.data.userExists === false) {
                    setVerifiedPhone(data.data.phoneNumber || formattedPhone);
                    setShowNewUserModal(true);
                    return;
                }
                const token = data.data.token;
                if (!token) { setLoginError("Login failed — no token received."); return; }
                const user = data.data.user || await authService.getMe();
                setAuth({ user, accessToken: token });
                const { pendingAction } = usePendingAuthActionStore.getState();
                if (pendingAction) {
                    await usePendingAuthActionStore.getState().executePendingAction();
                    router.back();
                } else {
                    if (user?.roles?.includes("organizer")) {
                        router.replace("/(app)/dashboard");
                    } else {
                        router.replace("/(app)/gigs");
                    }
                }
            },
            onError: (err: any) => {
                const msg =
                    err.response?.data?.msg ||
                    err.response?.data?.meta?.message ||
                    err.response?.data?.message ||
                    "Invalid OTP.";
                setLoginError(msg);
            },
        });
    };

    const handleResendOtp = () => {
        if (countdown > 0) return;
        setLoginError(null);
        const formattedPhone = `${countryCode}${phone.replace(/[^0-9]/g, "")}`;
        sendOtpMutation.mutate({ phone: formattedPhone }, {
            onSuccess: () => setCountdown(30),
            onError: (err: any) => {
                const msg = err.response?.data?.msg || err.response?.data?.meta?.message || err.response?.data?.message || "Failed to resend OTP.";
                setLoginError(msg);
            },
        });
    };

    const isPending =
        sendOtpMutation.isPending ||
        verifyOtpMutation.isPending ||
        loginMutation.isPending;

    const ctaLabel = sendOtpMutation.isPending ? "Sending code…"
        : verifyOtpMutation.isPending ? "Verifying…"
            : loginMutation.isPending ? "Signing in…"
                : loginMode === "phone" ? "Send OTP"
                    : loginMode === "otp" ? "Verify Code"
                        : !showPassword ? "Continue"
                            : "Sign In";

    /* ── Derived mode for toggle ── */
    const toggleMode: "phone" | "email" = loginMode === "email" ? "email" : "phone";

    return (
        <View style={{ flex: 1, backgroundColor: C.bg }}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Full-page scroll wrapper for responsive layout */}
            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                {/* ══════════════════════════════════════════ */}
                {/*  HERO SECTION                             */}
                {/* ══════════════════════════════════════════ */}
                <LoginHero />

                {/* ══════════════════════════════════════════ */}
                {/*  FORM SHEET                               */}
                {/* ══════════════════════════════════════════ */}
                <Animated.View style={{
                    borderTopLeftRadius: 30, borderTopRightRadius: 30,
                    backgroundColor: C.sheet,
                    borderTopWidth: 1, borderColor: C.sheetBorder,
                    opacity: sheetFade,
                    transform: [
                        { translateY: sheetSlide },
                        { translateY: keyboardShift }
                    ],
                    overflow: "hidden",
                    flex: 2,
                }}>
                    {/* Inner top glow line */}
                    <LinearGradient
                        colors={["rgba(139,92,246,0.28)", "transparent"]}
                        style={{
                            position: "absolute", top: 0, left: 0, right: 0, height: 1,
                        }}
                    />

                    {/* Ambient sheet glow */}
                    <View style={{
                        position: "absolute", top: -60, left: SCREEN_W * 0.2,
                        width: SCREEN_W * 0.6, height: 120,
                        borderRadius: 60,
                        backgroundColor: "rgba(139,92,246,0.07)",
                    }} />

                    {/* Drag indicator */}
                    <View style={{
                        alignSelf: "center", marginTop: 12, marginBottom: 2,
                        width: 38, height: 4, borderRadius: 2,
                        backgroundColor: C.w15,
                    }} />

                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : undefined}
                        style={{ flex: 1 }}
                    >
                        <View
                            style={{
                                flex: 1, justifyContent: "center",
                                paddingHorizontal: 24,
                                paddingTop: 14, paddingBottom: 28,
                            }}
                        >
                            {/* ── Sheet header & Tags── */}
                            <View style={{ marginBottom: 20, marginTop: 20 }}>
                                <View style={{
                                    flexDirection: "row", alignItems: "center",
                                    justifyContent: (loginMode === "otp" || (loginMode === "email" && showPassword)) ? "flex-start" : "center",
                                    marginBottom: 14, gap: 10,
                                }}>
                                    {(loginMode === "otp" || (loginMode === "email" && showPassword)) && (
                                        <TouchableOpacity
                                            onPress={() => {
                                                setLoginError(null);
                                                if (loginMode === "email" && showPassword) {
                                                    setShowPassword(false);
                                                    Animated.timing(passwordAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start();
                                                    setPassword("");
                                                } else {
                                                    setLoginMode("email");
                                                }
                                            }}
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
                                        fontSize: 28, fontWeight: "700",
                                        color: C.w95, letterSpacing: -0.3, marginBottom: 10,
                                    }}>
                                        {loginMode === "otp" ? "Verify OTP" : "Welcome back"}
                                    </Text>
                                </View>

                                {/* ── Subtitle (only for OTP / password steps) ── */}
                                {(loginMode === "otp" || (loginMode === "email" && showPassword)) && (
                                    <Text style={{
                                        fontSize: 13, color: C.w40,
                                        marginBottom: 16, lineHeight: 18,
                                    }}>
                                        {loginMode === "otp"
                                            ? `Enter the 6-digit code sent to ${countryCode} ${phone}`
                                            : ``}
                                    </Text>
                                )}

                                {/* ── Artist tag pills — horizontal marquee ── */}
                                <View style={{
                                    overflow: "hidden",
                                    marginBottom: 18,
                                    marginHorizontal: -24, // bleed edge-to-edge
                                }}>
                                    {/* Fade masks on left & right edges */}
                                    <LinearGradient
                                        colors={[C.sheet, "transparent"]}
                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                        style={{
                                            position: "absolute", left: 0, top: 0, bottom: 0,
                                            width: 32, zIndex: 2,
                                        }}
                                        pointerEvents="none"
                                    />
                                    <LinearGradient
                                        colors={["transparent", C.sheet]}
                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                        style={{
                                            position: "absolute", right: 0, top: 0, bottom: 0,
                                            width: 32, zIndex: 2,
                                        }}
                                        pointerEvents="none"
                                    />

                                    <Animated.View style={{
                                        flexDirection: "row", gap: 10,
                                        paddingHorizontal: 24,
                                        transform: [{ translateX: marqueeAnim }],
                                    }}>
                                        {/* Render 3 copies for seamless infinite scroll */}
                                        {[0, 1, 2].map((setIdx) =>
                                            ARTIST_TAGS.map(({ icon, label }, i) => (
                                                <ArtistTag
                                                    key={`${setIdx}-${label}`}
                                                    icon={icon} label={label}
                                                    delay={setIdx === 0 ? 700 + i * 80 : 0}
                                                />
                                            ))
                                        )}
                                    </Animated.View>
                                </View>
                            </View>

                            {/* ── Mode toggle temporarily removed ── */}
                            <View style={{ flex: 1, marginTop: 10, paddingHorizontal: 14 }}>
                                {/* ── Phone Input ── */}
                                {loginMode === "phone" && (
                                    <StepInput
                                        label="Phone Number"
                                        value={phone}
                                        onChangeText={(v) => { setPhone(v.replace(/[^0-9]/g, "")); setLoginError(null); }}
                                        placeholder="9876543210"
                                        keyboardType="phone-pad"
                                        icon={<Phone size={15} color={C.w40} />}
                                        prefix={<CountryCodePicker selectedCode={countryCode} onSelect={setCountryCode} />}
                                        error={!!loginError}
                                    />
                                )}

                                {/* ── OTP Input ── */}
                                {loginMode === "otp" && (
                                    <>
                                        <StepInput
                                            label={`OTP Code — ${countryCode}${phone}`}
                                            value={otp}
                                            onChangeText={(v) => { setOtp(v.replace(/[^0-9]/g, "").slice(0, 6)); setLoginError(null); }}
                                            placeholder="Enter 6-digit code"
                                            keyboardType="number-pad"
                                            icon={<Key size={15} color={C.w40} />}
                                            error={!!loginError}
                                        />
                                        {/* Resend row */}
                                        <TouchableOpacity
                                            onPress={handleResendOtp}
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

                                {/* ── Email + Password Inputs ── */}
                                {loginMode === "email" && !showPassword && (
                                    <StepInput
                                        label="Email Address"
                                        hideLabel
                                        value={email}
                                        onChangeText={(v) => {
                                            setEmail(v);
                                            setLoginError(null);
                                        }}
                                        placeholder="name@example.com"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        icon={<Mail size={15} color={C.w40} />}
                                        error={!!loginError}
                                    />
                                )}

                                {loginMode === "email" && showPassword && (
                                    <>
                                        <StepInput
                                            label="Password"
                                            hideLabel
                                            value={password}
                                            onChangeText={(v) => { setPassword(v); setLoginError(null); }}
                                            placeholder="Enter your password"
                                            secureTextEntry={!isPasswordVisible}
                                            icon={<Lock size={15} color={C.w40} />}
                                            rightIcon={isPasswordVisible ? <EyeOff size={16} color={C.w40} /> : <Eye size={16} color={C.w40} />}
                                            onRightIconPress={() => setIsPasswordVisible(!isPasswordVisible)}
                                            error={!!loginError}
                                        />
                                        <View style={{
                                            flexDirection: "row", justifyContent: "space-between",
                                            marginTop: -8, marginBottom: 20
                                        }}>
                                            <TouchableOpacity
                                                style={{ alignSelf: "flex-start" }}
                                                activeOpacity={0.75}
                                                accessibilityRole="button"
                                                onPress={() => {
                                                    setLoginError(null);
                                                    setShowPassword(false);
                                                    Animated.timing(passwordAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start();
                                                    setPassword("");
                                                }}
                                            >
                                                <Text style={{ fontSize: 12, color: C.w40, fontWeight: "600" }}>
                                                    Change email?
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                activeOpacity={0.75}
                                                accessibilityRole="button"
                                                onPress={() => router.push({
                                                    pathname: "/(auth)/forgot-password",
                                                    params: { email },
                                                })}
                                            >
                                                <Text style={{ fontSize: 12, color: C.primary, fontWeight: "600" }}>
                                                    Forgot password?
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </>
                                )}

                                {/* ── Error banner ── */}
                                {loginError && (
                                    <View style={{
                                        backgroundColor: C.error,
                                        borderWidth: 1, borderColor: C.errorBdr,
                                        borderRadius: 12, paddingVertical: 10,
                                        paddingHorizontal: 14, marginBottom: 16,
                                    }}>
                                        <Text style={{
                                            color: C.errorText, fontSize: 13,
                                            textAlign: "center", lineHeight: 18,
                                        }}>{loginError}</Text>
                                    </View>
                                )}

                                {/* ── CTA Button with shimmer + glow ── */}
                                <View style={{ marginTop: !loginError ? 4 : 0, alignItems: "center" }}>
                                    {/* Purple glow behind button */}
                                    <View style={{
                                        position: "absolute",
                                        bottom: -6, width: "75%",
                                        height: 42,
                                        borderRadius: 30,
                                        backgroundColor: "rgba(139,92,246,0.45)",
                                    } as any} />
                                    <TouchableOpacity
                                        onPress={
                                            loginMode === "phone" ? handleSendOtp
                                                : loginMode === "otp" ? handleVerifyOtp
                                                    : handleLogin
                                        }
                                        activeOpacity={0.87}
                                        disabled={isPending}
                                        accessibilityRole="button"
                                        style={{
                                            width: "85%",
                                            borderRadius: 28, overflow: "hidden",
                                            opacity: isPending ? 0.72 : 1,

                                        }}
                                    >
                                        <LinearGradient
                                            colors={["#9333EA", "#A855F7", "#7C3AED"]}
                                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                            style={{
                                                height: 54, borderRadius: 28,
                                                alignItems: "center", justifyContent: "center",
                                                flexDirection: "row", gap: 8,
                                            }}
                                        >
                                            {/* Shimmer sweep */}
                                            <Animated.View
                                                pointerEvents="none"
                                                style={{
                                                    position: "absolute",
                                                    top: 0, bottom: 0, width: 80,
                                                    transform: [{ translateX: ctaShimmer }],
                                                    backgroundColor: "rgba(255,255,255,0.12)",
                                                    skewX: "-20deg",
                                                } as any}
                                            />
                                            <Text style={{
                                                color: "#fff", fontSize: 16,
                                                fontWeight: "700", letterSpacing: 0.3,
                                            }}>{ctaLabel}</Text>
                                            {/* {!isPending && (
                                                <ArrowRight size={17} color="rgba(255,255,255,0.85)" />
                                            )} */}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>

                                {/* ── Register link ── */}
                                <TouchableOpacity
                                    onPress={() => router.push("/(auth)/register")}
                                    style={{ marginTop: 28, alignItems: "center" }}
                                    activeOpacity={0.7}
                                    accessibilityRole="button"
                                >
                                    <Text style={{ fontSize: 13, color: C.w40 }}>
                                        Don&apos;t have an account?{" "}
                                        <Text style={{ fontWeight: "700", color: C.primary, textDecorationLine: "underline", letterSpacing: 0.3 }}>
                                            Register
                                        </Text>
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Animated.View>
            </ScrollView>

            {/* ══════════════════════════════════════════ */}
            {/*  NEW-USER MODAL (unchanged)               */}
            {/* ══════════════════════════════════════════ */}
            <OnboardingDetectedModal
                visible={showNewUserModal}
                phoneNumber={verifiedPhone}
                onContinue={() => {
                    setShowNewUserModal(false);
                    router.replace({
                        pathname: "/(auth)/register",
                        params: { phone: verifiedPhone },
                    });
                }}
                onClose={() => setShowNewUserModal(false)}
            />
        </View>
    );
}

/* Shared absolute fill helper */
const ABS_FILL = {
    position: "absolute" as const,
    top: 0, left: 0, right: 0, bottom: 0,
};