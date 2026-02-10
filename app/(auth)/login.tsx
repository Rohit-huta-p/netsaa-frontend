// app/(auth)/login.tsx — 100vh scroll-free login matching register style
import React, { useState, useRef, useEffect } from "react";
import {
    View, Text, TouchableOpacity, Animated, TextInput, Platform,
    KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    Sparkles, Mail, Lock, ChevronLeft
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLogin } from "@/hooks/useAuthQueries";

/* ════════════════════════════════════════════════════ */
/*  CONSTANTS                                          */
/* ════════════════════════════════════════════════════ */

const C = {
    primary: '#8B5CF6', secondary: '#3B82F6', bg: '#0a0a0f',
    w95: 'rgba(255,255,255,0.95)', w80: 'rgba(255,255,255,0.80)',
    w60: 'rgba(255,255,255,0.60)', w50: 'rgba(255,255,255,0.50)',
    w40: 'rgba(255,255,255,0.40)', w30: 'rgba(255,255,255,0.30)',
    w25: 'rgba(255,255,255,0.25)', w15: 'rgba(255,255,255,0.15)',
    w10: 'rgba(255,255,255,0.10)', w08: 'rgba(255,255,255,0.08)',
    w06: 'rgba(255,255,255,0.06)', w03: 'rgba(255,255,255,0.03)',
    activeB: 'rgba(139,92,246,0.6)', activeBg: 'rgba(139,92,246,0.1)',
};

/* ════════════════════════════════════════════════════ */
/*  SUB-COMPONENTS                                     */
/* ════════════════════════════════════════════════════ */

/* -- Text input -- */
const StepInput = ({ label, value, onChangeText, icon, error, ...props }: {
    label: string; value: string; onChangeText: (v: string) => void;
    icon?: React.ReactNode; error?: boolean;[k: string]: any;
}) => (
    <View style={{ marginBottom: 16 }}>
        <Text style={{ color: C.w30, fontSize: 12, fontWeight: '500', marginBottom: 6 }}>{label}</Text>
        <View style={{
            flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 16,
            borderWidth: 1, borderColor: error ? 'rgba(239,68,68,0.5)' : C.w08,
            backgroundColor: C.w03, paddingHorizontal: icon ? 0 : 16,
        }}>
            {icon && <View style={{ paddingLeft: 14, paddingRight: 6 }}>{icon}</View>}
            <TextInput
                value={value} onChangeText={onChangeText}
                placeholderTextColor={C.w15}
                style={{ flex: 1, color: C.w80, fontSize: 15, paddingHorizontal: icon ? 8 : 0, height: '100%' }}
                {...props}
            />
        </View>
    </View>
);

/* ════════════════════════════════════════════════════ */
/*  MAIN SCREEN                                        */
/* ════════════════════════════════════════════════════ */

export default function LoginScreen() {
    const router = useRouter();
    const loginMutation = useLogin();
    const [loginError, setLoginError] = useState<string | null>(null);

    /* ── Field state ── */
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    /* ── Animation ── */
    const slideY = useRef(new Animated.Value(20)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.spring(slideY, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
        ]).start();
    }, []);

    /* ── Submission ── */
    const handleLogin = () => {
        if (!email.trim() || !password) {
            setLoginError("Please enter your email and password.");
            return;
        }

        setLoginError(null);
        loginMutation.mutate({ email, password }, {
            onError: (err: any) => {
                const msg = err.response?.data?.msg || err.response?.data?.message || err.message || "Invalid credentials.";
                setLoginError(msg);
            },
        });
    };

    return (
        <View style={{ flex: 1, backgroundColor: C.bg }}>
            <SafeAreaView style={{ flex: 1 }}>

                {/* ═══ HEADER ═══ */}
                <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 }}>
                    <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{
                            width: 32, height: 32, borderRadius: 10, backgroundColor: C.w06,
                            borderWidth: 1, borderColor: C.w10, alignItems: 'center', justifyContent: 'center',
                        }}>
                            <ChevronLeft size={16} color={C.w40} />
                        </View>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: C.w40 }}>Back</Text>
                    </TouchableOpacity>
                </View>

                {/* ═══ CONTENT ═══ */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1 }}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>

                            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideY }] }}>
                                <View style={{ alignItems: 'center', marginBottom: 32 }}>
                                    <View style={{
                                        width: 48, height: 48, borderRadius: 16, backgroundColor: C.w06,
                                        borderWidth: 1, borderColor: C.w10, alignItems: 'center', justifyContent: 'center',
                                        marginBottom: 16
                                    }}>
                                        <Sparkles size={24} color={C.primary} />
                                    </View>
                                    <View style={{ alignItems: 'center' }}>
                                        <Text style={{ fontSize: 28, fontWeight: '800', color: C.w95, textAlign: 'center', marginBottom: 8 }}>
                                            Welcome back
                                        </Text>
                                        <Text style={{ fontSize: 14, color: C.w30, textAlign: 'center' }}>
                                            Sign in to continue your journey.
                                        </Text>
                                    </View>
                                </View>

                                {/* Form */}
                                <View style={{ gap: 12 }}>
                                    <StepInput
                                        label="Email Address"
                                        value={email}
                                        onChangeText={(v) => { setEmail(v); setLoginError(null); }}
                                        placeholder="name@example.com"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        icon={<Mail size={16} color={C.w25} />}
                                        error={!!loginError}
                                    />
                                    <StepInput
                                        label="Password"
                                        value={password}
                                        onChangeText={(v) => { setPassword(v); setLoginError(null); }}
                                        placeholder="Enter your password"
                                        secureTextEntry
                                        icon={<Lock size={16} color={C.w25} />}
                                        error={!!loginError}
                                    />
                                </View>

                                <TouchableOpacity style={{ alignSelf: 'flex-end', marginTop: 8, marginBottom: 24 }}>
                                    <Text style={{ fontSize: 12, color: C.primary, fontWeight: '600' }}>Forgot password?</Text>
                                </TouchableOpacity>

                                {/* Error */}
                                {loginError && (
                                    <View style={{
                                        backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1,
                                        borderColor: 'rgba(239,68,68,0.25)', borderRadius: 12,
                                        paddingVertical: 10, paddingHorizontal: 14, marginBottom: 16,
                                    }}>
                                        <Text style={{ color: '#fca5a5', fontSize: 13, textAlign: 'center' }}>{loginError}</Text>
                                    </View>
                                )}

                                {/* CTA */}
                                <TouchableOpacity
                                    onPress={handleLogin}
                                    activeOpacity={0.85}
                                    disabled={loginMutation.isPending}
                                    style={{ borderRadius: 16, overflow: 'hidden', opacity: loginMutation.isPending ? 0.7 : 1 }}
                                >
                                    <LinearGradient
                                        colors={[C.primary, C.secondary]}
                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                        style={{ height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>
                                            {loginMutation.isPending ? "Signing in..." : "Sign In"}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>

                                {/* Register Link */}
                                <TouchableOpacity
                                    onPress={() => router.push("/(auth)/register")}
                                    style={{ marginTop: 24, alignItems: 'center' }}
                                >
                                    <Text style={{ fontSize: 13, color: C.w30 }}>
                                        Don't have an account?{' '}
                                        <Text style={{ fontWeight: '600', color: C.w80 }}>Create one</Text>
                                    </Text>
                                </TouchableOpacity>

                            </Animated.View>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>

            </SafeAreaView>
        </View>
    );
}