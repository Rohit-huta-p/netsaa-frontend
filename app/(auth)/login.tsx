// app/(auth)/login.tsx — NETSA · V2 Poster (cinematic)
// Full-bleed hero photo + dark gradient + glass card at bottom.
// Modes: phone → OTP → verify · email → password.
// Reuses existing auth mutations, stores, OnboardingDetectedModal, and
// the /(auth)/forgot-password route unchanged.
import React, { useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Animated,
    Platform,
    KeyboardAvoidingView,
    StatusBar,
    Image,
    Dimensions,
    StyleSheet,
    ScrollView,
    Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
    ChevronLeft,
    ChevronRight,
    Phone as PhoneIcon,
    Mail,
    Lock,
    Eye,
    EyeOff,
    ChevronDown,
    AlertCircle,
} from "lucide-react-native";
import { useLogin, useSendOtp, useVerifyOtp } from "@/hooks/useAuthQueries";
import { useResponsive } from "@/hooks/useResponsive";
import { useAuthStore } from "@/stores/authStore";
import { usePendingAuthActionStore } from "@/stores/pendingAuthActionStore";
import authService from "@/services/authService";
import { CountryCodePicker } from "@/components/auth";
import { OnboardingDetectedModal } from "@/components/common/OnboardingDetectedModal";
import type { VerifyOtpResponse } from "@/types/index";


/* ═══════════════════════════════════════════════════════
   TOKENS · V2 poster palette (brand orange kept)
   ═══════════════════════════════════════════════════════ */
const C = {
    bg: "#000",
    bg2: "#0E0C12",
    cardBg: "rgba(14,12,18,0.82)",
    surface: "rgba(255,255,255,0.05)",
    surfaceHi: "rgba(255,255,255,0.07)",
    hairline: "rgba(255,255,255,0.07)",
    hairline2: "rgba(255,255,255,0.10)",
    hairline3: "rgba(255,255,255,0.14)",
    text0: "#F3EFE8",
    text1: "#a1a1aa",
    text2: "#71717a",
    text3: "#52525b",
    text4: "#3f3f46",
    orange: "#FF6B35",
    orange2: "#E85A24",
    orangeSoft: "rgba(255,107,53,0.18)",
    orangeLine: "rgba(255,107,53,0.32)",
    orangeInk: "#1A0D06",
    red: "#EF4444",
    redSoft: "rgba(239,68,68,0.10)",
    redBorder: "rgba(239,68,68,0.30)",
    redText: "#FCA5A5",
};

const FONT = {
    serif: "DMSerifDisplay_400Regular",
    body: "Outfit-Regular",
    med: "Outfit-Medium",
    semi: "Outfit-SemiBold",
    bold: "Outfit-Bold",
};

type Mode = "phone" | "otp" | "email";

/* ═══════════════════════════════════════════════════════
   HERO IMAGES · state-driven, cross-faded
   ═══════════════════════════════════════════════════════ */
const HEROES = {
    phone: require("@/assets/login/Bharatnatyam-dancer.png"),
    otp: require("@/assets/login/singer-login.png"),
    email: require("@/assets/login/actor-login.png"),
    password: require("@/assets/login/model-login.png"),
};
/* md+ (split) screens use dedicated art shaped for the 42% portrait panel.
   Keyed identically to HEROES so the cross-fade + HERO_KEYS logic is unchanged. */
const HEROES_MDPLUS = {
    phone: require("@/assets/login/bharatnatyam-login-mdplus.png"),
    otp: require("@/assets/login/singer-login-mdplus.png"),
    email: require("@/assets/login/actor-login-mdplus.png"),
    password: require("@/assets/login/model-login-mdplus.png"),
};
type HeroKey = keyof typeof HEROES;
const HERO_KEYS: HeroKey[] = ["phone", "otp", "email", "password"];

/* ═══════════════════════════════════════════════════════ */

export default function LoginScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    // md+ (>=768): split screen — left 2/3 photo+branding, right 1/3 form
    const { width, height: winH } = useResponsive();
    const isSplit = width >= 768;
    const loginMutation = useLogin();
    const sendOtpMutation = useSendOtp();
    const verifyOtpMutation = useVerifyOtp();
    const setAuth = useAuthStore((s) => s.setAuth);

    /* ── Form state ── */
    const [mode, setMode] = useState<Mode>("phone");
    const [countryCode, setCountryCode] = useState("+91");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false); // reveal password step
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [loginError, setLoginError] = useState<string | null>(null);

    /* ── New-user modal ── */
    const [showNewUserModal, setShowNewUserModal] = useState(false);
    const [verifiedPhone, setVerifiedPhone] = useState("");

    /* ── Entry animation ── */
    const heroFade = useRef(new Animated.Value(0)).current;
    const cardSlide = useRef(new Animated.Value(80)).current;
    const cardFade = useRef(new Animated.Value(0)).current;
    const captionFade = useRef(new Animated.Value(0)).current;
    const captionSlide = useRef(new Animated.Value(20)).current;
    const kbdShift = useRef(new Animated.Value(0)).current;

    /* ── Hero swap: one Animated.Value per hero; cross-fades on state change ── */
    const heroKey: HeroKey =
        mode === "otp" ? "otp" :
            mode === "email" && showPassword ? "password" :
                mode === "email" ? "email" :
                    "phone";
    const heroOpacities = useRef({
        phone: new Animated.Value(1),
        otp: new Animated.Value(0),
        email: new Animated.Value(0),
        password: new Animated.Value(0),
    }).current;
    useEffect(() => {
        HERO_KEYS.forEach((k) => {
            Animated.timing(heroOpacities[k], {
                toValue: k === heroKey ? 1 : 0,
                duration: 550,
                useNativeDriver: true,
            }).start();
        });
    }, [heroKey]);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(heroFade, { toValue: 1, duration: 700, useNativeDriver: true }),
            Animated.sequence([
                Animated.delay(300),
                Animated.parallel([
                    Animated.timing(captionFade, { toValue: 1, duration: 600, useNativeDriver: true }),
                    Animated.timing(captionSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
                ]),
            ]),
            Animated.sequence([
                Animated.delay(500),
                Animated.parallel([
                    Animated.spring(cardSlide, { toValue: 0, friction: 9, tension: 55, useNativeDriver: true }),
                    Animated.timing(cardFade, { toValue: 1, duration: 500, useNativeDriver: true }),
                ]),
            ]),
        ]).start();
    }, []);

    /* ── Keyboard shift ── */
    useEffect(() => {
        const show = Keyboard.addListener(
            Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
            () => {
                Animated.timing(kbdShift, { toValue: -40, duration: 260, useNativeDriver: true }).start();
            }
        );
        const hide = Keyboard.addListener(
            Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
            () => {
                Animated.timing(kbdShift, { toValue: 0, duration: 220, useNativeDriver: true }).start();
            }
        );
        return () => {
            show.remove();
            hide.remove();
        };
    }, []);

    /* ── Resend countdown ── */
    useEffect(() => {
        if (countdown <= 0) return;
        const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [countdown]);

    /* ─────────────────────────────────────────────────
       Handlers (business logic unchanged from prior file)
       ───────────────────────────────────────────────── */

    const handleSendOtp = () => {
        if (!phone.trim()) {
            setLoginError("Please enter your phone number.");
            return;
        }
        setLoginError(null);
        const formattedPhone = `${countryCode}${phone.replace(/[^0-9]/g, "")}`;
        sendOtpMutation.mutate(
            { phone: formattedPhone },
            {
                onSuccess: () => {
                    setMode("otp");
                    setCountdown(30);
                    setOtp("");
                },
                onError: (err: any) => {
                    const msg =
                        err.response?.data?.msg ||
                        err.response?.data?.meta?.message ||
                        err.response?.data?.message ||
                        "Failed to send OTP.";
                    setLoginError(msg);
                },
            }
        );
    };

    const handleResendOtp = () => {
        if (countdown > 0) return;
        setLoginError(null);
        const formattedPhone = `${countryCode}${phone.replace(/[^0-9]/g, "")}`;
        sendOtpMutation.mutate(
            { phone: formattedPhone },
            {
                onSuccess: () => setCountdown(30),
                onError: (err: any) => {
                    const msg =
                        err.response?.data?.msg ||
                        err.response?.data?.meta?.message ||
                        err.response?.data?.message ||
                        "Failed to resend OTP.";
                    setLoginError(msg);
                },
            }
        );
    };

    const handleVerifyOtp = () => {
        if (otp.length !== 6) {
            setLoginError("Please enter the 6-digit code.");
            return;
        }
        setLoginError(null);
        const formattedPhone = `${countryCode}${phone.replace(/[^0-9]/g, "")}`;
        verifyOtpMutation.mutate(
            { phone: formattedPhone, otp },
            {
                onSuccess: async (data: VerifyOtpResponse) => {
                    if (data.data.userExists === false) {
                        setVerifiedPhone(data.data.phoneNumber || formattedPhone);
                        setShowNewUserModal(true);
                        return;
                    }
                    const token = data.data.token;
                    if (!token) {
                        setLoginError("Login failed — no token received.");
                        return;
                    }
                    const user = data.data.user || (await authService.getMe());
                    setAuth({ user, accessToken: token });
                    const { pendingAction } = usePendingAuthActionStore.getState();
                    if (pendingAction) {
                        await usePendingAuthActionStore.getState().executePendingAction();
                        router.back();
                    } else if (user?.roles?.includes("organizer")) {
                        router.replace("/(app)/dashboard");
                    } else {
                        router.replace("/(app)/gigs");
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
            }
        );
    };

    const handleLogin = () => {
        if (!showPassword) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email.trim() || !emailRegex.test(email)) {
                setLoginError("Please enter a valid email address.");
                return;
            }
            setLoginError(null);
            setShowPassword(true);
            return;
        }
        if (!password) {
            setLoginError("Please enter your password.");
            return;
        }
        setLoginError(null);
        loginMutation.mutate(
            { email, password },
            {
                onError: (err: any) => {
                    const msg =
                        err.response?.data?.msg ||
                        err.response?.data?.meta?.message ||
                        err.response?.data?.message ||
                        err.message ||
                        "Invalid credentials.";
                    setLoginError(msg);
                },
            }
        );
    };

    /* ── Derived ── */
    const isPending =
        sendOtpMutation.isPending || verifyOtpMutation.isPending || loginMutation.isPending;
    const canPhone = phone.replace(/[^0-9]/g, "").length >= 8;
    const canOtp = otp.length === 6;
    const canEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const canPassword = password.length > 0;

    /* ─────────────────────────────────────────────────
       Card content per mode
       ───────────────────────────────────────────────── */

    const renderPhoneCard = () => (
        <>
            <Text style={s.cardEyebrow}>Welcome back</Text>
            <Text style={s.cardTitle}>Enter the wings.</Text>
            <Text style={s.cardSub}>One-time code sent to your phone. No password.</Text>

            <View style={[s.input, phone.length > 0 && s.inputFocused, loginError && s.inputError]}>
                <TouchableOpacity
                    onPress={() => { /* CountryCodePicker via prefix below */ }}
                    activeOpacity={1}
                    style={s.ccWrap}
                >
                    <CountryCodePicker selectedCode={countryCode} onSelect={setCountryCode} />
                </TouchableOpacity>
                <TextInput
                    value={phone}
                    onChangeText={(v) => {
                        setPhone(v.replace(/[^0-9]/g, ""));
                        if (loginError) setLoginError(null);
                    }}
                    placeholder="98765 43210"
                    placeholderTextColor={C.text3}
                    keyboardType="phone-pad"
                    style={s.inputField}
                    autoComplete="tel"
                    autoCorrect={false}
                />
            </View>

            {renderErrorBanner()}

            <TouchableOpacity
                onPress={handleSendOtp}
                disabled={!canPhone || isPending}
                activeOpacity={0.88}
                style={[s.ctaWrap, (!canPhone || isPending) && s.ctaDisabled]}
            >
                {canPhone && !isPending ? (
                    <LinearGradient
                        colors={[C.orange, C.orange2]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={s.ctaGradient}
                    >
                        {sendOtpMutation.isPending ? (
                            <Text style={s.ctaLabel}>Sending your code…</Text>
                        ) : (
                            <>
                                <Text style={s.ctaLabel}>Send my code</Text>
                                <ChevronRight size={17} color={C.orangeInk} strokeWidth={2.5} />
                            </>
                        )}
                    </LinearGradient>
                ) : (
                    <View style={s.ctaDisabledInner}>
                        {sendOtpMutation.isPending ? (
                            <Text style={s.ctaDisabledLabel}>Sending your code…</Text>
                        ) : (
                            <Text style={s.ctaDisabledLabel}>Send my code</Text>
                        )}
                    </View>
                )}
            </TouchableOpacity>

            {renderTabToggle("phone")}

            <TouchableOpacity onPress={() => router.push("/(auth)/welcome")} activeOpacity={0.7}>
                <Text style={s.altCreate}>
                    First time here?{" "}
                    <Text style={s.altCreateAccent}>Create account</Text>
                </Text>
            </TouchableOpacity>
        </>
    );

    const renderOtpCard = () => (
        <>
            <Text style={s.cardEyebrow}>Step 2 of 2</Text>
            <Text style={s.cardTitle}>Enter the 6-digit code</Text>
            <Text style={s.cardSub}>
                Sent to <Text style={s.cardSubStrong}>{countryCode} {phone}</Text>.
                It should arrive in seconds.
            </Text>

            <View style={s.otpRow}>
                {[0, 1, 2, 3, 4, 5].map((i) => {
                    const digit = otp[i] || "";
                    const isFilled = !!digit;
                    const isFocused = i === otp.length;
                    return (
                        <View
                            key={i}
                            style={[
                                s.otpBox,
                                isFilled && s.otpBoxFilled,
                                isFocused && !loginError && s.otpBoxFocused,
                                loginError && s.otpBoxError,
                            ]}
                        >
                            <Text
                                style={[
                                    s.otpDigit,
                                    loginError && { color: C.red },
                                ]}
                            >
                                {digit}
                            </Text>
                        </View>
                    );
                })}
                {/* invisible input capturing digits */}
                <TextInput
                    value={otp}
                    onChangeText={(v) => {
                        setOtp(v.replace(/[^0-9]/g, "").slice(0, 6));
                        if (loginError) setLoginError(null);
                    }}
                    keyboardType="number-pad"
                    style={s.otpHiddenInput}
                    maxLength={6}
                    autoFocus
                    caretHidden
                    textContentType="oneTimeCode"
                />
            </View>

            <View style={s.resendRow}>
                <Text style={s.resendTimer}>
                    {countdown > 0 ? (
                        <>
                            Resend in{" "}
                            <Text style={s.resendTimerStrong}>
                                0:{countdown.toString().padStart(2, "0")}
                            </Text>
                        </>
                    ) : (
                        " "
                    )}
                </Text>
                <TouchableOpacity onPress={handleResendOtp} disabled={countdown > 0} activeOpacity={0.7}>
                    <Text style={[s.resendLink, countdown > 0 && s.resendLinkDisabled]}>Resend code</Text>
                </TouchableOpacity>
            </View>

            {renderErrorBanner()}

            <TouchableOpacity
                onPress={handleVerifyOtp}
                disabled={!canOtp || isPending}
                activeOpacity={0.88}
                style={[s.ctaWrap, (!canOtp || isPending) && s.ctaDisabled]}
            >
                {canOtp && !isPending ? (
                    <LinearGradient colors={[C.orange, C.orange2]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={s.ctaGradient}>
                        <Text style={s.ctaLabel}>Verify code</Text>
                        <ChevronRight size={17} color={C.orangeInk} strokeWidth={2.5} />
                    </LinearGradient>
                ) : (
                    <View style={s.ctaDisabledInner}>
                        <Text style={s.ctaDisabledLabel}>
                            {verifyOtpMutation.isPending
                                ? "Verifying…"
                                : canOtp
                                    ? "Verify code"
                                    : `Verify code · ${6 - otp.length} more`}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setMode("phone"); setOtp(""); setLoginError(null); }} activeOpacity={0.7}>
                <Text style={s.altCreate}>
                    Wrong number?{" "}
                    <Text style={s.altCreateAccent}>Change</Text>
                </Text>
            </TouchableOpacity>
        </>
    );

    const renderEmailCard = () => (
        <>
            <Text style={s.cardEyebrow}>Step 1 of 2</Text>
            <Text style={s.cardTitle}>Your email address</Text>
            <Text style={s.cardSub}>We'll ask for the password on the next step.</Text>

            <View style={[s.input, email.length > 0 && s.inputFocused, loginError && s.inputError]}>
                <View style={s.inputIcon}>
                    <Mail size={16} color={email ? C.orange : C.text2} strokeWidth={2} />
                </View>
                <TextInput
                    value={email}
                    onChangeText={(v) => {
                        setEmail(v);
                        if (loginError) setLoginError(null);
                    }}
                    placeholder="name@example.com"
                    placeholderTextColor={C.text3}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    style={s.inputField}
                />
            </View>

            {renderErrorBanner()}

            <TouchableOpacity
                onPress={handleLogin}
                disabled={!canEmail || isPending}
                activeOpacity={0.88}
                style={[s.ctaWrap, (!canEmail || isPending) && s.ctaDisabled]}
            >
                {canEmail && !isPending ? (
                    <LinearGradient colors={[C.orange, C.orange2]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={s.ctaGradient}>
                        <Text style={s.ctaLabel}>Continue</Text>
                        <ChevronRight size={17} color={C.orangeInk} strokeWidth={2.5} />
                    </LinearGradient>
                ) : (
                    <View style={s.ctaDisabledInner}>
                        <Text style={s.ctaDisabledLabel}>Continue</Text>
                    </View>
                )}
            </TouchableOpacity>

            {renderTabToggle("email")}

            <TouchableOpacity onPress={() => router.push("/(auth)/welcome")} activeOpacity={0.7}>
                <Text style={s.altCreate}>
                    First time here?{" "}
                    <Text style={s.altCreateAccent}>Create account</Text>
                </Text>
            </TouchableOpacity>
        </>
    );

    const renderPasswordCard = () => (
        <>
            <Text style={s.cardEyebrow}>Step 2 of 2</Text>
            <Text style={s.cardTitle}>Enter your password</Text>
            <Text style={s.cardSub}>
                Signing in as <Text style={s.cardSubStrong}>{email}</Text>.
            </Text>

            {/* locked email */}
            <View style={[s.input, s.inputLocked, { marginBottom: 10 }]}>
                <View style={s.inputIcon}>
                    <Mail size={16} color={C.text3} strokeWidth={2} />
                </View>
                <Text style={s.inputLockedText} numberOfLines={1}>{email}</Text>
                <TouchableOpacity
                    onPress={() => {
                        setShowPassword(false);
                        setPassword("");
                        setLoginError(null);
                    }}
                    activeOpacity={0.7}
                    style={{ paddingHorizontal: 8 }}
                >
                    <Text style={s.inputChange}>Change</Text>
                </TouchableOpacity>
            </View>

            <View style={[s.input, password.length > 0 && s.inputFocused, loginError && s.inputError]}>
                <View style={s.inputIcon}>
                    <Lock size={16} color={password ? C.orange : C.text2} strokeWidth={2} />
                </View>
                <TextInput
                    value={password}
                    onChangeText={(v) => {
                        setPassword(v);
                        if (loginError) setLoginError(null);
                    }}
                    placeholder="Enter your password"
                    placeholderTextColor={C.text3}
                    secureTextEntry={!isPasswordVisible}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={s.inputField}
                />
                <TouchableOpacity
                    onPress={() => setIsPasswordVisible((v) => !v)}
                    activeOpacity={0.7}
                    style={{ paddingHorizontal: 12 }}
                >
                    {isPasswordVisible ? <EyeOff size={16} color={C.text2} /> : <Eye size={16} color={C.text2} />}
                </TouchableOpacity>
            </View>

            <View style={s.forgotRow}>
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                    onPress={() =>
                        router.push({ pathname: "/(auth)/forgot-password", params: { email } })
                    }
                    activeOpacity={0.7}
                >
                    <Text style={s.forgotLink}>Forgot password?</Text>
                </TouchableOpacity>
            </View>

            {renderErrorBanner()}

            <TouchableOpacity
                onPress={handleLogin}
                disabled={!canPassword || isPending}
                activeOpacity={0.88}
                style={[s.ctaWrap, (!canPassword || isPending) && s.ctaDisabled]}
            >
                {canPassword && !isPending ? (
                    <LinearGradient colors={[C.orange, C.orange2]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={s.ctaGradient}>
                        <Text style={s.ctaLabel}>Sign in</Text>
                        <ChevronRight size={17} color={C.orangeInk} strokeWidth={2.5} />
                    </LinearGradient>
                ) : (
                    <View style={s.ctaDisabledInner}>
                        <Text style={s.ctaDisabledLabel}>
                            {loginMutation.isPending ? "Signing in…" : "Sign in"}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/(auth)/welcome")} activeOpacity={0.7}>
                <Text style={s.altCreate}>
                    New here? <Text style={s.altCreateAccent}>Create account</Text>
                </Text>
            </TouchableOpacity>
        </>
    );

    const renderTabToggle = (active: "phone" | "email") => (
        <View style={s.tabToggle}>
            <TouchableOpacity
                onPress={() => {
                    if (mode === "phone") return;
                    setMode("phone");
                    setShowPassword(false);
                    setPassword("");
                    setLoginError(null);
                }}
                activeOpacity={0.7}
                style={s.tabItem}
            >
                <Text style={[s.tabLabel, active === "phone" && s.tabLabelActive]}>Phone</Text>
                {active === "phone" && <View style={s.tabUnderline} />}
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => {
                    if (mode === "email") return;
                    setMode("email");
                    setShowPassword(false);
                    setPassword("");
                    setOtp("");
                    setLoginError(null);
                }}
                activeOpacity={0.7}
                style={s.tabItem}
            >
                <Text style={[s.tabLabel, active === "email" && s.tabLabelActive]}>Email</Text>
                {active === "email" && <View style={s.tabUnderline} />}
            </TouchableOpacity>
        </View>
    );

    const renderErrorBanner = () =>
        loginError ? (
            <View style={s.errBanner}>
                <AlertCircle size={14} color={C.red} strokeWidth={2} />
                <Text style={s.errBannerText} numberOfLines={2}>
                    {loginError}
                </Text>
            </View>
        ) : null;

    /* ═════════════════════════════════════════════════ */

    const content = (
        <View style={[s.root, isSplit && { height: winH }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* ── HERO PHOTOS · state-driven cross-fade ── */}
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: heroFade }, isSplit && s.heroSplit]}>
                {HERO_KEYS.map((k) => (
                    <Animated.View
                        key={k}
                        style={[
                            StyleSheet.absoluteFill,
                            {
                                opacity: heroOpacities[k],
                                backgroundColor: "#000",
                                alignItems: "center",
                                justifyContent: "center",
                            },
                        ]}
                        pointerEvents="none"
                    >
                        <Image
                            source={(isSplit ? HEROES_MDPLUS : HEROES)[k]}
                            style={[s.heroImage, isSplit && s.heroImageSplit]}
                            resizeMode={isSplit ? "cover" : "contain"}
                        />
                    </Animated.View>
                ))}
                <LinearGradient
                    colors={[
                        "rgba(9,9,11,0.55)",
                        "rgba(9,9,11,0.30)",
                        "rgba(9,9,11,0.85)",
                        "rgba(0,0,0,0.98)",
                    ]}
                    locations={[0, 0.28, 0.72, 1]}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>

            {/* ── FOREGROUND CONTENT ── */}
            <SafeAreaView style={[s.safeArea, isSplit && s.safeAreaSplit]} edges={["top"]}>
                <View style={s.topNav}>
                    {mode !== "phone" || (mode === "phone" && false) ? (
                        <TouchableOpacity
                            onPress={() => {
                                if (mode === "otp") {
                                    setMode("phone");
                                    setOtp("");
                                    setLoginError(null);
                                } else if (mode === "email" && showPassword) {
                                    setShowPassword(false);
                                    setPassword("");
                                    setLoginError(null);
                                } else if (mode === "email") {
                                    setMode("phone");
                                    setEmail("");
                                    setLoginError(null);
                                } else {
                                    router.back();
                                }
                            }}
                            activeOpacity={0.7}
                            style={s.navBack}
                        >
                            <ChevronLeft size={16} color={C.text0} strokeWidth={2} />
                        </TouchableOpacity>
                    ) : (
                        <View style={{ width: 38, height: 38 }} />
                    )}
                    <View style={{ flex: 1 }} />
                    <TouchableOpacity activeOpacity={0.7}>
                        <Text style={s.navHelp}>Need help?</Text>
                    </TouchableOpacity>
                </View>

                {/* Brand mark (landing only) */}
                {(isSplit || mode === "phone") && (
                    <Animated.View
                        style={[
                            s.brand,
                            isSplit && s.brandSplit,
                            { opacity: captionFade, transform: [{ translateY: captionSlide }] },
                        ]}
                    >
                        <Text style={[s.brandMark, isSplit && s.brandMarkSplit]}>NETSA</Text>
                        <Text style={[s.brandSub, isSplit && s.brandSubSplit]}>कला · कलाकार</Text>
                    </Animated.View>
                )}

                {/* Photo caption */}
                {(isSplit || mode === "phone") && (
                    <Animated.View
                        style={[
                            s.caption,
                            isSplit && { top: undefined as unknown as number, bottom: 40, paddingHorizontal: 26 },
                            { opacity: captionFade, transform: [{ translateY: captionSlide }] },
                        ]}
                    >
                        <Text style={s.kicker}>— Est. 2026 · Pune</Text>
                        <Text style={[s.captionH2, isSplit && s.captionH2Split]}>
                            Every movement{"\n"}needs an audience.
                        </Text>
                    </Animated.View>
                )}

                {/* OTP header */}
                {!isSplit && mode === "otp" && (
                    <Animated.View
                        style={[
                            s.caption,
                            { opacity: captionFade, transform: [{ translateY: captionSlide }], top: 100 },
                        ]}
                    >
                        <Text style={s.kicker}>— Verifying · {countryCode}</Text>
                        <Text style={s.captionH2}>Check your{"\n"}messages.</Text>
                    </Animated.View>
                )}

                {/* Email header */}
                {!isSplit && mode === "email" && !showPassword && (
                    <Animated.View
                        style={[
                            s.caption,
                            { opacity: captionFade, transform: [{ translateY: captionSlide }], top: 140 },
                        ]}
                    >
                        <Text style={s.kicker}>— Sign in · email</Text>
                        <Text style={s.captionH2}>Same account,{"\n"}different door.</Text>
                    </Animated.View>
                )}

                {!isSplit && mode === "email" && showPassword && (
                    <Animated.View
                        style={[
                            s.caption,
                            { opacity: captionFade, transform: [{ translateY: captionSlide }], top: 120 },
                        ]}
                    >
                        <Text style={s.kicker}>— Sign in · email</Text>
                        <Text style={s.captionH2}>One more{"\n"}thing.</Text>
                    </Animated.View>
                )}
            </SafeAreaView>

            {/* ── GLASS CARD (bottom, centered, max-width) ── */}
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={[
                    s.cardWrap,
                    { paddingBottom: 20 + Math.max(insets.bottom - 8, 0) },
                    isSplit && s.cardWrapSplit,
                ]}
                pointerEvents="box-none"
            >
                <Animated.View
                    style={[
                        s.card,
                        isSplit && s.cardSplit,
                        {
                            opacity: cardFade,
                            transform: [{ translateY: cardSlide }, { translateY: kbdShift }],
                        },
                    ]}
                >
                    {mode === "phone" && renderPhoneCard()}
                    {mode === "otp" && renderOtpCard()}
                    {mode === "email" && !showPassword && renderEmailCard()}
                    {mode === "email" && showPassword && renderPasswordCard()}
                </Animated.View>
            </KeyboardAvoidingView>

            {/* ── NEW-USER MODAL (unchanged) ── */}
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

    return content;
}

/* ═══════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════ */

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg, overflow: "hidden" },

    /* Hero image · centered, capped at md width. On mobile the image fills
       the phone width; on desktop it stops at 768 so it doesn't stretch
       across the entire viewport. `contain` keeps every image fully in
       frame regardless of composition. */
    heroImage: {
        width: "100%",
        height: "100%",
        maxWidth: 768,
    },

    /* md+ split (responsive %-ratio, scales with viewport): left photo/branding
       56% · right form panel 44%. V1 "editorial" — the form sits directly on the
       panel (no card box), centered. */
    heroSplit: { right: "44%" as const },
    heroImageSplit: { maxWidth: "100%" as const },   // fill the whole left panel (cover)
    safeAreaSplit: { position: "absolute" as const, left: 0, top: 0, bottom: 0, width: "56%" as const },
    cardWrapSplit: {
        left: "56%" as const,
        right: 0,
        top: 0,
        bottom: 0,
        justifyContent: "center" as const,
        alignItems: "center" as const,
        paddingHorizontal: 48,
        backgroundColor: C.bg,
        borderLeftWidth: 1,
        borderLeftColor: "rgba(255,255,255,0.07)",
    },
    /* V1 editorial: strip the card box so the form is the panel */
    cardSplit: { backgroundColor: "transparent" as const, borderWidth: 0, padding: 0, maxWidth: 400 },
    /* V1 editorial · left-panel branding top-left + caption to bottom */
    brandSplit: { flexDirection: "row" as const, alignItems: "center" as const, gap: 10, marginTop: 6, alignSelf: "flex-start" as const, paddingHorizontal: 26 },
    brandMarkSplit: { fontSize: 20, letterSpacing: 3 },
    brandSubSplit: { marginTop: 0 },
    captionH2Split: { fontSize: 27, lineHeight: 30, maxWidth: 340 },

    safeArea: { flex: 1 },

    topNav: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 20,
        paddingTop: 4,
    },
    navBack: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 1,
        borderColor: C.hairline3,
        backgroundColor: "rgba(0,0,0,0.35)",
        alignItems: "center",
        justifyContent: "center",
    },
    navHelp: {
        color: "rgba(243,239,232,0.7)",
        fontSize: 12,
        fontFamily: FONT.med,
        paddingHorizontal: 4,
    },

    brand: {
        alignItems: "center",
        marginTop: 28,
    },
    brandMark: {
        fontFamily: FONT.serif,
        color: C.text0,
        fontSize: 26,
        letterSpacing: 6.5,
    },
    brandSub: {
        color: "rgba(243,239,232,0.5)",
        fontSize: 14,
        fontFamily: FONT.body,
        marginTop: 6,
        letterSpacing: 0.4,
    },

    caption: {
        paddingHorizontal: 24,
        marginTop: 44,
        position: "absolute",
        left: 0,
        right: 0,
        top: 210,
    },
    kicker: {
        fontFamily: FONT.med,
        color: C.orange,
        fontSize: 10.5,
        letterSpacing: 2.2,
        textTransform: "uppercase",
        marginBottom: 12,
    },
    captionH2: {
        fontFamily: FONT.serif,
        fontStyle: "italic",
        color: C.text0,
        fontSize: 34,
        lineHeight: 36,
        letterSpacing: -0.3,
        maxWidth: 380,
    },

    /* Card anchored bottom, centered horizontally, capped at 460 on wide
       viewports so it looks like a login card on desktop instead of a
       full-width slab. */
    cardWrap: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 20,
        paddingBottom: 20,
        alignItems: "center",
    },
    card: {
        width: "100%",
        maxWidth: 460,
        backgroundColor: C.cardBg,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        borderRadius: 22,
        padding: 22,
    },

    cardEyebrow: {
        fontFamily: FONT.semi,
        color: C.orange,
        fontSize: 9.5,
        letterSpacing: 2,
        textTransform: "uppercase",
        marginBottom: 8,
    },
    cardTitle: {
        fontFamily: FONT.serif,
        color: C.text0,
        fontSize: 24,
        lineHeight: 28,
        letterSpacing: -0.3,
        marginBottom: 6,
    },
    cardSub: {
        color: C.text2,
        fontSize: 12.5,
        fontFamily: FONT.body,
        lineHeight: 18,
        marginBottom: 16,
    },
    cardSubStrong: { color: C.text1, fontFamily: FONT.semi },

    /* Input */
    input: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
        borderRadius: 12,
        minHeight: 52,
        marginBottom: 12,
        paddingRight: 4,
    },
    inputFocused: {
        borderColor: "rgba(255,107,53,0.45)",
        backgroundColor: "rgba(255,107,53,0.05)",
    },
    inputLocked: {
        backgroundColor: "rgba(255,255,255,0.02)",
    },
    inputLockedText: {
        flex: 1,
        color: C.text2,
        fontFamily: FONT.body,
        fontSize: 14.5,
        paddingHorizontal: 4,
    },
    inputChange: {
        color: C.text2,
        fontFamily: FONT.semi,
        fontSize: 12,
    },
    inputError: {
        borderColor: C.redBorder,
        backgroundColor: C.redSoft,
    },
    inputIcon: {
        paddingLeft: 14,
        paddingRight: 8,
    },
    inputField: {
        flex: 1,
        color: C.text0,
        fontFamily: FONT.body,
        fontSize: 15,
        paddingHorizontal: 8,
        paddingVertical: Platform.OS === "ios" ? 16 : 12,
    },
    ccWrap: {
        paddingLeft: 14,
        paddingRight: 4,
        height: "100%",
        justifyContent: "center",
    },

    /* OTP */
    otpRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 14,
        position: "relative",
    },
    otpBox: {
        flex: 1,
        height: 54,
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    otpBoxFilled: {
        borderColor: "rgba(255,107,53,0.35)",
        backgroundColor: "rgba(255,107,53,0.06)",
    },
    otpBoxFocused: {
        borderColor: C.orange,
        backgroundColor: "rgba(255,107,53,0.10)",
    },
    otpBoxError: {
        borderColor: C.redBorder,
        backgroundColor: C.redSoft,
    },
    otpDigit: {
        fontFamily: FONT.serif,
        color: C.text0,
        fontSize: 22,
    },
    otpHiddenInput: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0,
        color: "transparent",
    },

    /* Resend row */
    resendRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
        marginTop: -2,
    },
    resendTimer: {
        color: C.text3,
        fontFamily: FONT.med,
        fontSize: 11,
        letterSpacing: 0.6,
    },
    resendTimerStrong: {
        color: C.orange,
        fontFamily: FONT.semi,
    },
    resendLink: {
        color: C.orange,
        fontSize: 12,
        fontFamily: FONT.semi,
    },
    resendLinkDisabled: { color: C.text3 },

    /* Forgot row */
    forgotRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: -2,
        marginBottom: 12,
    },
    forgotLink: { color: C.orange, fontSize: 12, fontFamily: FONT.semi },

    /* Error banner */
    errBanner: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
        backgroundColor: C.redSoft,
        borderWidth: 1,
        borderColor: C.redBorder,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 12,
    },
    errBannerText: {
        flex: 1,
        color: C.text0,
        fontSize: 12.5,
        fontFamily: FONT.body,
        lineHeight: 18,
    },

    /* CTA */
    ctaWrap: {
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 14,
    },
    ctaGradient: {
        height: 52,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    ctaLabel: {
        color: C.orangeInk,
        fontFamily: FONT.bold,
        fontSize: 14,
        letterSpacing: 0.3,
    },
    ctaDisabled: {},
    ctaDisabledInner: {
        height: 52,
        backgroundColor: "rgba(255,255,255,0.06)",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
    },
    ctaDisabledLabel: {
        color: C.text3,
        fontFamily: FONT.bold,
        fontSize: 14,
        letterSpacing: 0.3,
    },

    /* Tab toggle */
    tabToggle: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 26,
        paddingTop: 4,
        marginBottom: 14,
    },
    tabItem: {
        alignItems: "center",
        paddingBottom: 5,
    },
    tabLabel: {
        color: "rgba(243,239,232,0.55)",
        fontFamily: FONT.med,
        fontSize: 12.5,
        letterSpacing: 0.3,
    },
    tabLabelActive: {
        color: C.text0,
        fontFamily: FONT.bold,
    },
    tabUnderline: {
        marginTop: 4,
        width: "100%",
        height: 2,
        backgroundColor: C.orange,
        borderRadius: 1,
    },

    /* Alt link */
    altCreate: {
        textAlign: "center",
        color: "rgba(243,239,232,0.65)",
        fontSize: 12.5,
        fontFamily: FONT.body,
    },
    altCreateAccent: {
        color: C.orange,
        fontFamily: FONT.bold,
        textDecorationLine: "underline",
    },
});
