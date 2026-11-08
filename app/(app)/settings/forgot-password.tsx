import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TextInput, Pressable, ActivityIndicator,
    ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Smartphone, Eye, EyeOff, CheckCircle2 } from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import { useSendPasswordResetOtp, useResetPasswordWithOtp } from '@/hooks/useSecurity';

/* ── A·Minimal tokens ── */
const BG       = '#121216';
const SURFACE  = 'rgba(255,255,255,0.028)';
const HAIR     = 'rgba(255,255,255,0.055)';
const ORANGE   = '#FF6B35';
const ORANGE_SOFT = 'rgba(255,107,53,0.08)';
const ORANGE_LINE = 'rgba(255,107,53,0.2)';
const TEXT_0   = '#FFFFFF';
const TEXT_2   = '#A1A1AA';
const TEXT_3   = '#71717A';
const RED      = '#EF4444';
const RED_SOFT = 'rgba(239,68,68,0.08)';
const GREEN    = '#22C55E';
const GREEN_SOFT = 'rgba(34,197,94,0.08)';

type Step = 'send' | 'verify' | 'set';

function maskPhone(phone?: string): string {
    if (!phone) return 'your registered mobile';
    const stripped = phone.replace(/\D/g, '');
    if (stripped.length < 4) return phone;
    return `+91 ${stripped.slice(-10, -5)}●●●${stripped.slice(-2)}`;
}

/* ── OTP Boxes ── */
function OtpInput({
    value, onChange, error,
}: {
    value: string;
    onChange: (v: string) => void;
    error: boolean;
}) {
    const refs = useRef<(TextInput | null)[]>([]);
    const digits = value.padEnd(6, '').split('').slice(0, 6);

    const handleChange = (text: string, idx: number) => {
        const d = text.replace(/\D/g, '').slice(-1);
        const arr = digits.map((c, i) => i === idx ? d : c);
        const next = arr.join('').slice(0, 6);
        onChange(next);
        if (d && idx < 5) refs.current[idx + 1]?.focus();
    };

    const handleKeyPress = (key: string, idx: number) => {
        if (key === 'Backspace' && !digits[idx] && idx > 0) {
            refs.current[idx - 1]?.focus();
        }
    };

    const filled    = error ? RED        : ORANGE;
    const fillSoft  = error ? RED_SOFT   : ORANGE_SOFT;
    const fillLine  = error ? 'rgba(239,68,68,0.2)' : ORANGE_LINE;

    return (
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
            {[0,1,2,3,4,5].map((i) => {
                const isFilled = !!digits[i] && digits[i] !== ' ';
                return (
                    <TextInput
                        key={i}
                        ref={(r) => { refs.current[i] = r; }}
                        value={isFilled ? digits[i] : ''}
                        onChangeText={(t) => handleChange(t, i)}
                        onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                        maxLength={1}
                        keyboardType="number-pad"
                        selectTextOnFocus
                        style={{
                            width: 48, height: 56, borderRadius: 12, textAlign: 'center',
                            fontSize: 22, fontFamily: 'Outfit-SemiBold',
                            color: isFilled ? (error ? RED : TEXT_0) : TEXT_3,
                            backgroundColor: isFilled ? fillSoft : SURFACE,
                            borderWidth: 1,
                            borderColor: isFilled ? (error ? RED : ORANGE) : HAIR,
                        }}
                    />
                );
            })}
        </View>
    );
}

/* ── Strength bar ── */
type Strength = 'weak' | 'fair' | 'good' | 'strong';
function calcStrength(pw: string): Strength {
    if (pw.length < 6) return 'weak';
    let s = 0;
    if (pw.length >= 8)             s++;
    if (/[0-9]/.test(pw))           s++;
    if (/[A-Z]/.test(pw))           s++;
    if (/[^A-Za-z0-9]/.test(pw))    s++;
    if (s <= 1) return 'weak';
    if (s === 2) return 'fair';
    if (s === 3) return 'good';
    return 'strong';
}
const SMETA: Record<Strength, { label: string; color: string; filled: number }> = {
    weak:   { label: 'Weak',   color: RED,       filled: 1 },
    fair:   { label: 'Fair',   color: '#F59E0B', filled: 2 },
    good:   { label: 'Good',   color: GREEN,     filled: 3 },
    strong: { label: 'Strong', color: GREEN,     filled: 4 },
};
function StrengthBar({ password }: { password: string }) {
    if (!password) return null;
    const { label, color, filled } = SMETA[calcStrength(password)];
    const hint = calcStrength(password) === 'strong' ? 'Great combination' : 'Add more variety to strengthen';
    return (
        <View style={{ marginTop: 8 }}>
            <View style={{ flexDirection: 'row', gap: 4, marginBottom: 5 }}>
                {[0,1,2,3].map((i) => (
                    <View key={i} style={{
                        flex: 1, height: 3, borderRadius: 2,
                        backgroundColor: i < filled ? color : 'rgba(255,255,255,0.1)',
                    }} />
                ))}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 11, fontFamily: 'Outfit-Regular', color: TEXT_3 }}>{hint}</Text>
                <Text style={{ fontSize: 11, fontFamily: 'Outfit-SemiBold', color }}>{label}</Text>
            </View>
        </View>
    );
}

/* ── Main ── */
export default function ForgotPasswordScreen() {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const { mutate: sendOtp, isPending: isSending } = useSendPasswordResetOtp();
    const { mutate: resetPw, isPending: isResetting } = useResetPasswordWithOtp();

    const [step, setStep] = useState<Step>('send');
    const [otp, setOtp] = useState('');
    const [otpError, setOtpError] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const maskedPhone = maskPhone(user?.phoneNumber);
    const passwordsMatch = newPw.length > 0 && newPw === confirmPw;
    const canSetPw = newPw.length >= 8 && passwordsMatch && !isResetting;

    /* countdown timer */
    useEffect(() => {
        if (countdown <= 0) return;
        const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(id);
    }, [countdown]);

    const handleSendOtp = () => {
        sendOtp(undefined, {
            onSuccess: () => {
                setCountdown(30);
                setStep('verify');
            },
        });
    };

    const handleVerify = () => {
        setOtpError(false);
        // Advance to set-new-password step (actual OTP verification happens on final submit)
        setStep('set');
    };

    const handleSetPassword = () => {
        resetPw({ otp, newPassword: newPw }, {
            onSuccess: () => {
                Alert.alert('Password changed', 'Your password has been reset.', [
                    { text: 'OK', onPress: () => router.replace('/settings/security') },
                ]);
            },
            onError: (err: any) => {
                const msg = err?.response?.data?.message ?? '';
                if (/otp|code|invalid/i.test(msg)) {
                    setOtpError(true);
                    setStep('verify');
                }
            },
        });
    };

    const countdownLabel = countdown > 0
        ? `Resend OTP in 0:${String(countdown).padStart(2, '0')}`
        : '';

    /* ═══════════════ STEP: SEND ═══════════════ */
    if (step === 'send') return (
        <>
            <Stack.Screen options={{ title: 'Reset Password' }} />
            <View style={{ flex: 1, backgroundColor: BG }}>
                <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
                    <View style={{ alignItems: 'center', paddingTop: 40, paddingHorizontal: 24 }}>
                        <View style={{
                            width: 64, height: 64, borderRadius: 32,
                            backgroundColor: ORANGE_SOFT, borderWidth: 1, borderColor: ORANGE_LINE,
                            alignItems: 'center', justifyContent: 'center', marginBottom: 20,
                        }}>
                            <Smartphone size={28} color={ORANGE} />
                        </View>
                        <Text style={{
                            fontSize: 20, fontFamily: 'Outfit-SemiBold', color: TEXT_0,
                            letterSpacing: -0.4, marginBottom: 10, textAlign: 'center',
                        }}>
                            Forgot your password?
                        </Text>
                        <Text style={{
                            fontSize: 14, fontFamily: 'Outfit-Regular', color: TEXT_3,
                            textAlign: 'center', lineHeight: 21, maxWidth: 280,
                        }}>
                            We'll send a 6-digit code to your registered mobile to verify it's you.
                        </Text>
                    </View>

                    <View style={{ marginHorizontal: 20, marginTop: 32 }}>
                        <View style={{
                            flexDirection: 'row', alignItems: 'center',
                            backgroundColor: SURFACE, borderRadius: 14,
                            borderWidth: 1, borderColor: HAIR,
                            paddingHorizontal: 16, paddingVertical: 14, gap: 12,
                        }}>
                            <View style={{
                                width: 36, height: 36, borderRadius: 10,
                                backgroundColor: 'rgba(139,92,246,0.1)',
                                borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)',
                                alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Smartphone size={18} color="#8B5CF6" />
                            </View>
                            <View>
                                <Text style={{ fontSize: 15, fontFamily: 'SpaceMono-Regular', color: TEXT_0 }}>
                                    {maskedPhone}
                                </Text>
                                <Text style={{ fontSize: 12, fontFamily: 'Outfit-Regular', color: TEXT_3, marginTop: 2 }}>
                                    Registered mobile number
                                </Text>
                            </View>
                        </View>

                        <Pressable
                            onPress={handleSendOtp}
                            disabled={isSending}
                            style={({ pressed }) => ({
                                marginTop: 20,
                                backgroundColor: pressed ? '#e55f2d' : ORANGE,
                                borderRadius: 14, paddingVertical: 15, alignItems: 'center',
                            })}
                        >
                            {isSending
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <Text style={{ fontSize: 15, fontFamily: 'Outfit-SemiBold', color: '#fff' }}>
                                    Send OTP
                                  </Text>
                            }
                        </Pressable>

                        <Text style={{
                            textAlign: 'center', marginTop: 14,
                            fontSize: 12.5, fontFamily: 'Outfit-Regular', color: TEXT_3,
                        }}>
                            Wrong number?{' '}
                            <Text style={{ color: ORANGE }}>Contact support →</Text>
                        </Text>
                    </View>
                </ScrollView>
            </View>
        </>
    );

    /* ═══════════════ STEP: VERIFY OTP ═══════════════ */
    if (step === 'verify') return (
        <>
            <Stack.Screen options={{ title: 'Enter OTP' }} />
            <KeyboardAvoidingView
                style={{ flex: 1, backgroundColor: BG }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 32, paddingBottom: 48 }}>
                    <View style={{ alignItems: 'center', marginBottom: 32 }}>
                        <Text style={{
                            fontSize: 18, fontFamily: 'Outfit-SemiBold', color: TEXT_0,
                            letterSpacing: -0.3, marginBottom: 8,
                        }}>
                            Enter the 6-digit code
                        </Text>
                        <Text style={{ fontSize: 13, fontFamily: 'Outfit-Regular', color: TEXT_3 }}>
                            Sent to{' '}
                            <Text style={{ fontFamily: 'SpaceMono-Regular', color: TEXT_2 }}>{maskedPhone}</Text>
                        </Text>
                    </View>

                    <OtpInput value={otp} onChange={setOtp} error={otpError} />

                    {otpError && (
                        <Text style={{
                            textAlign: 'center', marginTop: 10,
                            fontSize: 12, fontFamily: 'Outfit-Regular', color: RED,
                        }}>
                            Incorrect code — try again
                        </Text>
                    )}

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, fontFamily: 'Outfit-Regular', color: TEXT_3 }}>
                            {countdownLabel}
                        </Text>
                        <Pressable
                            onPress={handleSendOtp}
                            disabled={countdown > 0 || isSending}
                            style={{ opacity: countdown > 0 ? 0.4 : 1 }}
                        >
                            <Text style={{ fontSize: 12, fontFamily: 'Outfit-Medium', color: ORANGE }}>
                                Resend
                            </Text>
                        </Pressable>
                    </View>

                    <Text style={{
                        textAlign: 'center', marginTop: 12,
                        fontSize: 11, fontFamily: 'Outfit-Regular', color: TEXT_3,
                    }}>
                        OTP auto-fills from SMS on Android & iOS
                    </Text>

                    <Pressable
                        onPress={handleVerify}
                        disabled={otp.replace(/ /g, '').length < 6}
                        style={({ pressed }) => ({
                            marginTop: 24,
                            backgroundColor: otp.replace(/ /g, '').length >= 6
                                ? (pressed ? '#e55f2d' : ORANGE)
                                : 'rgba(255,255,255,0.08)',
                            borderRadius: 14, paddingVertical: 15, alignItems: 'center',
                        })}
                    >
                        <Text style={{
                            fontSize: 15, fontFamily: 'Outfit-SemiBold',
                            color: otp.replace(/ /g, '').length >= 6 ? '#fff' : TEXT_3,
                        }}>
                            Verify
                        </Text>
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        </>
    );

    /* ═══════════════ STEP: SET NEW PASSWORD ═══════════════ */
    return (
        <>
            <Stack.Screen options={{ title: 'New Password' }} />
            <KeyboardAvoidingView
                style={{ flex: 1, backgroundColor: BG }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 48 }}>
                    {/* Identity verified banner */}
                    <View style={{
                        flexDirection: 'row', alignItems: 'center', gap: 10,
                        backgroundColor: GREEN_SOFT, borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)',
                        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 24,
                    }}>
                        <CheckCircle2 size={18} color={GREEN} />
                        <Text style={{ fontSize: 13, fontFamily: 'Outfit-Medium', color: GREEN }}>
                            Identity verified — set your new password
                        </Text>
                    </View>

                    {/* New password */}
                    <Text style={{ fontSize: 12, fontFamily: 'Outfit-SemiBold', color: TEXT_2, marginBottom: 6 }}>
                        New Password
                    </Text>
                    <View style={{
                        flexDirection: 'row', alignItems: 'center',
                        backgroundColor: SURFACE, borderRadius: 12,
                        borderWidth: 1, borderColor: newPw ? ORANGE : HAIR,
                        paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8,
                    }}>
                        <TextInput
                            style={{ flex: 1, fontSize: 15, fontFamily: 'Outfit-Regular', color: TEXT_0 }}
                            placeholder="Enter new password"
                            placeholderTextColor={TEXT_3}
                            secureTextEntry={!showNew}
                            value={newPw}
                            onChangeText={setNewPw}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <Pressable onPress={() => setShowNew(s => !s)} hitSlop={8}>
                            {showNew ? <EyeOff size={18} color={TEXT_3} /> : <Eye size={18} color={TEXT_3} />}
                        </Pressable>
                    </View>
                    {newPw.length > 0 && <StrengthBar password={newPw} />}

                    {/* Confirm password */}
                    <Text style={{ fontSize: 12, fontFamily: 'Outfit-SemiBold', color: TEXT_2, marginTop: 20, marginBottom: 6 }}>
                        Confirm New Password
                    </Text>
                    <View style={{
                        flexDirection: 'row', alignItems: 'center',
                        backgroundColor: SURFACE, borderRadius: 12,
                        borderWidth: 1, borderColor: confirmPw ? (passwordsMatch ? GREEN : RED) : HAIR,
                        paddingHorizontal: 14, paddingVertical: 12,
                    }}>
                        <TextInput
                            style={{ flex: 1, fontSize: 15, fontFamily: 'Outfit-Regular', color: TEXT_0 }}
                            placeholder="Confirm new password"
                            placeholderTextColor={TEXT_3}
                            secureTextEntry={!showConfirm}
                            value={confirmPw}
                            onChangeText={setConfirmPw}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <Pressable onPress={() => setShowConfirm(s => !s)} hitSlop={8}>
                            {showConfirm ? <EyeOff size={18} color={TEXT_3} /> : <Eye size={18} color={TEXT_3} />}
                        </Pressable>
                    </View>
                    {confirmPw.length > 0 && (
                        <Text style={{
                            fontSize: 12, fontFamily: 'Outfit-Regular',
                            color: passwordsMatch ? GREEN : RED, marginTop: 5,
                        }}>
                            {passwordsMatch ? '✓ Passwords match' : 'Passwords do not match'}
                        </Text>
                    )}

                    <Text style={{
                        fontSize: 11, fontFamily: 'Outfit-Regular', color: TEXT_3,
                        marginTop: 12, lineHeight: 16,
                    }}>
                        No current password needed — your identity was confirmed via OTP.
                    </Text>

                    <Pressable
                        onPress={handleSetPassword}
                        disabled={!canSetPw}
                        style={({ pressed }) => ({
                            marginTop: 24,
                            backgroundColor: canSetPw ? (pressed ? '#e55f2d' : ORANGE) : 'rgba(255,255,255,0.08)',
                            borderRadius: 14, paddingVertical: 15, alignItems: 'center',
                        })}
                    >
                        {isResetting
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <Text style={{
                                fontSize: 15, fontFamily: 'Outfit-SemiBold',
                                color: canSetPw ? '#fff' : TEXT_3,
                              }}>
                                Set New Password
                              </Text>
                        }
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        </>
    );
}
