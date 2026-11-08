import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { useChangePassword } from '@/hooks/useSecurity';

/* ── A·Minimal tokens ── */
const BG = '#121216';
const SURFACE = 'rgba(255,255,255,0.028)';
const HAIR = 'rgba(255,255,255,0.055)';
const ORANGE = '#FF6B35';
const TEXT_0 = '#FFFFFF';
const TEXT_2 = '#A1A1AA';
const TEXT_3 = '#71717A';
const RED = '#EF4444';
const RED_SOFT = 'rgba(239,68,68,0.06)';
const GREEN = '#22C55E';

/* ── Password strength ── */
type Strength = 'weak' | 'fair' | 'good' | 'strong';

function calcStrength(pw: string): Strength {
    if (pw.length < 6) return 'weak';
    let score = 0;
    if (pw.length >= 8)             score++;
    if (/[0-9]/.test(pw))           score++;
    if (/[A-Z]/.test(pw))           score++;
    if (/[^A-Za-z0-9]/.test(pw))    score++;
    if (score <= 1) return 'weak';
    if (score === 2) return 'fair';
    if (score === 3) return 'good';
    return 'strong';
}

const STRENGTH_META: Record<Strength, { label: string; color: string; filled: number }> = {
    weak:   { label: 'Weak',   color: RED,     filled: 1 },
    fair:   { label: 'Fair',   color: '#F59E0B', filled: 2 },
    good:   { label: 'Good',   color: '#22C55E', filled: 3 },
    strong: { label: 'Strong', color: '#22C55E', filled: 4 },
};

function StrengthBar({ password }: { password: string }) {
    if (!password) return null;
    const s = calcStrength(password);
    const { label, color, filled } = STRENGTH_META[s];
    const hint = s === 'weak'   ? 'Use letters and numbers'
               : s === 'fair'   ? 'Add an uppercase letter'
               : s === 'good'   ? 'Add a special character (@#$) to strengthen'
               : 'Great combination';
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

/* ── Password field ── */
function PasswordField({
    label, placeholder, value, onChangeText,
    error, hint, hintColor, showForgot, onForgot,
}: {
    label: string; placeholder: string; value: string;
    onChangeText: (v: string) => void; error?: boolean;
    hint?: string; hintColor?: string;
    showForgot?: boolean; onForgot?: () => void;
}) {
    const [show, setShow] = useState(false);
    return (
        <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 12, fontFamily: 'Outfit-SemiBold', color: TEXT_2, marginBottom: 6 }}>
                {label}
            </Text>
            <View style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: SURFACE, borderRadius: 12,
                borderWidth: 1,
                borderColor: error ? RED : value ? ORANGE : HAIR,
                paddingHorizontal: 14, paddingVertical: 12,
            }}>
                <TextInput
                    style={{ flex: 1, fontSize: 15, fontFamily: 'Outfit-Regular', color: TEXT_0 }}
                    placeholder={placeholder}
                    placeholderTextColor={TEXT_3}
                    secureTextEntry={!show}
                    value={value}
                    onChangeText={onChangeText}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                <Pressable onPress={() => setShow(s => !s)} hitSlop={8}>
                    {show
                        ? <EyeOff size={18} color={TEXT_3} />
                        : <Eye size={18} color={TEXT_3} />
                    }
                </Pressable>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: showForgot ? 'space-between' : 'flex-end', marginTop: 5 }}>
                {hint && (
                    <Text style={{ fontSize: 12, fontFamily: 'Outfit-Regular', color: hintColor ?? TEXT_3 }}>
                        {hint}
                    </Text>
                )}
                {showForgot && (
                    <Pressable onPress={onForgot}>
                        <Text style={{ fontSize: 12, fontFamily: 'Outfit-Medium', color: ORANGE }}>
                            Forgot password?
                        </Text>
                    </Pressable>
                )}
            </View>
        </View>
    );
}

/* ── Requirements ── */
function ReqItem({ ok, label }: { ok: boolean; label: string }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <View style={{
                width: 16, height: 16, borderRadius: 8,
                backgroundColor: ok ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
                borderWidth: 1, borderColor: ok ? GREEN : HAIR,
                alignItems: 'center', justifyContent: 'center',
            }}>
                {ok && <Text style={{ fontSize: 10, color: GREEN, fontWeight: '700' }}>✓</Text>}
                {!ok && <Text style={{ fontSize: 10, color: TEXT_3, fontWeight: '400' }}>–</Text>}
            </View>
            <Text style={{ fontSize: 12, fontFamily: 'Outfit-Regular', color: ok ? TEXT_2 : TEXT_3 }}>
                {label}
            </Text>
        </View>
    );
}

/* ── Main ── */
export default function ChangePasswordScreen() {
    const router = useRouter();
    const { mutate: changePassword, isPending } = useChangePassword();

    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirm, setConfirm] = useState('');
    const [currentError, setCurrentError] = useState(false);
    const [currentErrorMsg, setCurrentErrorMsg] = useState('');

    const hasMinLength    = next.length >= 8;
    const hasNumber       = /[0-9]/.test(next);
    const hasSpecial      = /[^A-Za-z0-9]/.test(next);
    const passwordsMatch  = next.length > 0 && next === confirm;
    const canSubmit       = current.length > 0 && next.length >= 8 && passwordsMatch && !isPending;

    const confirmHint  = confirm.length > 0 && next !== confirm ? 'Passwords do not match' : undefined;
    const confirmColor = confirm.length > 0 && passwordsMatch ? GREEN : RED;

    const handleSubmit = () => {
        setCurrentError(false);
        setCurrentErrorMsg('');
        changePassword({ currentPassword: current, newPassword: next }, {
            onSuccess: () => {
                router.back();
            },
            onError: (err: any) => {
                const msg = err?.response?.data?.message ?? '';
                if (err?.response?.status === 401 || /incorrect|current|wrong/i.test(msg)) {
                    setCurrentError(true);
                    setCurrentErrorMsg('Incorrect password. Try again.');
                }
            },
        });
    };

    return (
        <>
            <Stack.Screen options={{ title: 'Change Password' }} />
            <KeyboardAvoidingView
                style={{ flex: 1, backgroundColor: BG }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 48 }}>

                    <PasswordField
                        label="Current Password"
                        placeholder="Enter current password"
                        value={current}
                        onChangeText={(v) => { setCurrent(v); setCurrentError(false); setCurrentErrorMsg(''); }}
                        error={currentError}
                        hint={currentError ? currentErrorMsg : undefined}
                        hintColor={RED}
                        showForgot
                        onForgot={() => router.push('/settings/forgot-password')}
                    />

                    <PasswordField
                        label="New Password"
                        placeholder="Enter new password"
                        value={next}
                        onChangeText={setNext}
                    />
                    {next.length > 0 && <StrengthBar password={next} />}
                    {next.length > 0 && (
                        <View style={{ marginTop: 12, marginBottom: 4 }}>
                            <ReqItem ok={hasMinLength} label="8 or more characters" />
                            <ReqItem ok={hasNumber}    label="Contains a number" />
                            <ReqItem ok={hasSpecial}   label="Special character (@, #, $, !)" />
                        </View>
                    )}

                    <View style={{ marginTop: next.length > 0 ? 8 : 0 }}>
                        <PasswordField
                            label="Confirm New Password"
                            placeholder="Confirm new password"
                            value={confirm}
                            onChangeText={setConfirm}
                            hint={confirm.length > 0 ? (passwordsMatch ? '✓ Passwords match' : 'Passwords do not match') : undefined}
                            hintColor={confirm.length > 0 ? (passwordsMatch ? GREEN : RED) : TEXT_3}
                        />
                    </View>

                    <Pressable
                        onPress={handleSubmit}
                        disabled={!canSubmit}
                        style={({ pressed }) => ({
                            marginTop: 8,
                            backgroundColor: canSubmit ? (pressed ? '#e55f2d' : ORANGE) : 'rgba(255,255,255,0.08)',
                            borderRadius: 14, paddingVertical: 15, alignItems: 'center',
                        })}
                    >
                        {isPending
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <Text style={{
                                fontSize: 15, fontFamily: 'Outfit-SemiBold',
                                color: canSubmit ? '#fff' : TEXT_3,
                              }}>
                                Update Password
                              </Text>
                        }
                    </Pressable>

                </ScrollView>
            </KeyboardAvoidingView>
        </>
    );
}
