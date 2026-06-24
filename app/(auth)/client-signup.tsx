// app/(auth)/client-signup.tsx
// Client OTP signup screens C1 (details) + C2 (OTP verify).
// Created by welcome.tsx when the user taps "I'm a Client".
import { useState, useRef, useEffect } from 'react';
import {
    View, Text, TextInput, Pressable, ActivityIndicator, Alert,
    Platform, ScrollView, KeyboardAvoidingView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, Check } from 'lucide-react-native';
import authService from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';

export default function ClientSignup() {
    const router = useRouter();
    const setAuth = useAuthStore((s) => s.setAuth);

    const [step, setStep] = useState<'details' | 'otp'>('details');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [ageOk, setAgeOk] = useState(false);
    const [otp, setOtp] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [cooldown, setCooldown] = useState(0);
    const otpRef = useRef<TextInput>(null);

    // Fix 4 — countdown timer
    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    const fullPhone = `+91${phone.replace(/[^0-9]/g, '')}`;
    const detailsValid =
        name.trim().length >= 1 &&
        phone.replace(/[^0-9]/g, '').length === 10 &&
        ageOk;

    // Fix 6a — phone sanitize: strip country code / leading zero on paste
    const onPhoneChange = (v: string) => {
        let d = v.replace(/[^0-9]/g, '');
        if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
        if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
        setPhone(d.slice(0, 10));
    };

    // Fix 1 — web-safe confirm for existing-account flow
    const confirmSwitch = (onSwitch: () => void, onSkip: () => void) => {
        const title = 'You already have an account';
        const msg = 'This number is registered as an Artist or Creative Lead. Switch to Client to post a requirement?';
        if (Platform.OS === 'web') {
            if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${msg}`)) onSwitch();
            else onSkip();
            return;
        }
        Alert.alert(title, msg, [
            { text: 'Not now', onPress: onSkip },
            { text: 'Switch to Client', onPress: onSwitch },
        ]);
    };

    const sendOtp = async () => {
        if (busy) return; // Fix 3
        if (!detailsValid) return;
        setBusy(true);
        setError('');
        try {
            await authService.sendOtp({ phone: fullPhone });
            setStep('otp');
            setOtp('');      // Fix 4 — clear stale OTP state
            setError('');    // Fix 4 — clear stale error
            setCooldown(30); // Fix 4 — start cooldown
            setTimeout(() => otpRef.current?.focus(), 300);
        } catch (e: any) {
            setError(e.response?.data?.meta?.message || 'Could not send OTP. Try again.');
        } finally {
            setBusy(false);
        }
    };

    const verify = async (code: string) => {
        if (busy) return; // Fix 3
        if (code.length !== 6) return;
        setBusy(true);
        setError('');
        try {
            const res: any = await authService.verifyOtp({
                phone: fullPhone,
                otp: code,
                registration: { displayName: name.trim(), role: 'client', ageConfirmed: true },
            });
            // authService returns res.data (the HTTP body) = { meta, data: { token, user, created } }
            const data = res?.data ?? res;
            const token = data?.token;
            const user = data?.user;
            if (!token) throw new Error('No token in response');
            setAuth({ user, accessToken: token });
            if (user?.role !== 'client') {
                // Existing artist/CL account on this phone: logged in, offer the switch.
                confirmSwitch(
                    // onSwitch
                    async () => {
                        try {
                            const sw = await authService.switchRole('client');
                            setAuth({ user: sw.data.user, accessToken: sw.data.token });
                            router.replace('/(app)/client/new-requirement' as any);
                        } catch {
                            setError('Could not switch role. Try again from Settings.');
                            router.replace('/(app)' as any);
                        }
                    },
                    // onSkip
                    () => router.replace('/(app)' as any),
                );
                return;
            }
            router.replace('/(app)/client/new-requirement' as any);
        } catch (e: any) {
            // Fix 6c — distinguish No-token errors from invalid-code errors
            setError(
                e.response?.data?.meta?.message ||
                (e.message === 'No token in response'
                    ? 'Something went wrong. Please try again.'
                    : 'Invalid code. Try again.')
            );
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            {/* Fix 6d — ScrollView + KeyboardAvoidingView (mirrors login.tsx pattern) */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    <View className="flex-1 bg-[#09090b] px-5 pt-16">
                        <Pressable
                            onPress={() => {
                                if (step === 'otp') {
                                    setError(''); // Fix 6b
                                    setOtp('');   // Fix 6b
                                    setStep('details');
                                } else {
                                    router.back();
                                }
                            }}
                            className="mb-5"
                        >
                            <ChevronLeft size={22} color="#a1a1aa" />
                        </Pressable>

                        {step === 'details' ? (
                            <>
                                <Text
                                    className="text-zinc-100 text-[20px]"
                                    style={{ fontFamily: 'Outfit-SemiBold' }}
                                >
                                    Get proposals for your event
                                </Text>
                                <Text
                                    className="text-zinc-500 text-[13px] mb-6"
                                    style={{ fontFamily: 'Outfit-Regular' }}
                                >
                                    Takes about 2 minutes
                                </Text>

                                <Text
                                    className="text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5"
                                    style={{ fontFamily: 'Outfit-Regular' }}
                                >
                                    Your name
                                </Text>
                                <TextInput
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Full name"
                                    placeholderTextColor="#52525b"
                                    className="bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-zinc-100 mb-4"
                                    style={{ fontFamily: 'Outfit-Regular' }}
                                />

                                <Text
                                    className="text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5"
                                    style={{ fontFamily: 'Outfit-Regular' }}
                                >
                                    Phone
                                </Text>
                                <View className="flex-row items-center bg-white/[0.04] border border-white/10 rounded-xl px-4">
                                    <Text
                                        className="text-zinc-500 mr-2"
                                        style={{ fontFamily: 'Outfit-Regular' }}
                                    >
                                        +91
                                    </Text>
                                    <TextInput
                                        value={phone}
                                        onChangeText={onPhoneChange}
                                        keyboardType="number-pad"
                                        // maxLength removed (Fix 6a — allow paste, sanitize instead)
                                        placeholder="98765 43210"
                                        placeholderTextColor="#52525b"
                                        className="flex-1 py-3 text-zinc-100"
                                        style={{ fontFamily: 'Outfit-Regular' }}
                                    />
                                </View>
                                <Text
                                    className="text-zinc-600 text-[11px] mt-1.5 mb-4"
                                    style={{ fontFamily: 'Outfit-Regular' }}
                                >
                                    Used only for login and proposal alerts. Never shared.
                                </Text>

                                <Pressable
                                    onPress={() => setAgeOk(!ageOk)}
                                    className="flex-row items-center mb-6"
                                >
                                    <View
                                        className={`w-5 h-5 rounded-md border items-center justify-center mr-2 ${
                                            ageOk ? 'bg-[#FF6B35] border-[#FF6B35]' : 'border-white/20'
                                        }`}
                                    >
                                        {ageOk && <Check size={14} color="#1A0D06" />}
                                    </View>
                                    <Text
                                        className="text-zinc-300 text-[13px]"
                                        style={{ fontFamily: 'Outfit-Regular' }}
                                    >
                                        I confirm I'm 18 or older
                                    </Text>
                                </Pressable>

                                {!!error && (
                                    <Text
                                        className="text-red-400 text-[12px] mb-3"
                                        style={{ fontFamily: 'Outfit-Regular' }}
                                    >
                                        {error}
                                    </Text>
                                )}

                                <Pressable
                                    onPress={sendOtp}
                                    disabled={!detailsValid || busy}
                                    className={`rounded-xl py-4 items-center ${
                                        detailsValid ? 'bg-[#FF6B35]' : 'bg-white/10'
                                    }`}
                                >
                                    {busy ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text
                                            className={`text-[15px] ${
                                                detailsValid ? 'text-[#1A0D06]' : 'text-zinc-500'
                                            }`}
                                            style={{ fontFamily: 'Outfit-SemiBold' }}
                                        >
                                            Send OTP
                                        </Text>
                                    )}
                                </Pressable>
                            </>
                        ) : (
                            <>
                                <Text
                                    className="text-zinc-100 text-[20px]"
                                    style={{ fontFamily: 'Outfit-SemiBold' }}
                                >
                                    Enter the code
                                </Text>
                                <Text
                                    className="text-zinc-500 text-[13px] mb-6"
                                    style={{ fontFamily: 'Outfit-Regular' }}
                                >
                                    Sent to {fullPhone}
                                </Text>

                                <TextInput
                                    ref={otpRef}
                                    value={otp}
                                    onChangeText={(v) => {
                                        setOtp(v);
                                        if (v.length === 6) verify(v);
                                    }}
                                    editable={!busy}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    placeholder="6-digit code"
                                    placeholderTextColor="#52525b"
                                    className="bg-white/[0.04] border border-white/10 rounded-xl px-4 py-4 text-zinc-100 text-[18px] mb-3"
                                    style={{ fontFamily: 'Outfit-Regular', letterSpacing: 8 }}
                                />

                                {!!error && (
                                    <Text
                                        className="text-red-400 text-[12px] mb-3"
                                        style={{ fontFamily: 'Outfit-Regular' }}
                                    >
                                        {error}
                                    </Text>
                                )}

                                {busy && <ActivityIndicator color="#FF6B35" />}

                                <Pressable
                                    onPress={sendOtp}
                                    disabled={busy || cooldown > 0}
                                    className="mt-4"
                                >
                                    <Text
                                        className="text-zinc-400 text-[13px]"
                                        style={{ fontFamily: 'Outfit-Regular' }}
                                    >
                                        {cooldown > 0
                                            ? `Resend in 0:${String(cooldown).padStart(2, '0')}`
                                            : <>Didn't get it?{' '}<Text style={{ color: '#FF6B35' }}>Resend</Text></>
                                        }
                                    </Text>
                                </Pressable>
                            </>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </>
    );
}
