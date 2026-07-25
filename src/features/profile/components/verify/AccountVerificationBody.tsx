import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Check, ShieldCheck } from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import authService from '@/services/authService';
import { P, Field, Input } from '../edit/EditModalPrimitives';

/**
 * Account-security verification body — the ONE reusable block (spec principle:
 * one block, many surfaces; DOCS/08-planning/specs/2026-07-21-email-verification-design.md).
 * Mounted in the Edit Profile "Verify" section AND the profile status-pill sheet.
 *
 * Self-contained: reads/writes the auth store, owns the add-email → 6-digit
 * code → verified flow via authService. The phone rung is READ-ONLY (OTP already
 * verified it at signup); success copy stays plain — no "KYC"/"Level" wording.
 */
export function AccountVerificationBody() {
    const { user, setAuth, accessToken } = useAuthStore();
    const u = user as any;
    const emailVerified = !!u?.emailVerifiedAt;
    const phone = u?.phoneNumber || '';

    const [email, setEmail] = useState('');
    const [stage, setStage] = useState<'idle' | 'code'>('idle');
    const [code, setCode] = useState('');
    const [busy, setBusy] = useState(false);

    const onSend = async () => {
        if (busy) return;
        setBusy(true);
        try {
            await authService.sendEmailCode(email.trim().toLowerCase());
            setStage('code');
        } catch (e: any) {
            Alert.alert('Could not send code', e?.response?.data?.meta?.message || 'Try again.');
        } finally {
            setBusy(false);
        }
    };

    const onVerify = async () => {
        if (busy) return;
        setBusy(true);
        try {
            const updated = await authService.verifyEmailCode(email.trim().toLowerCase(), code.trim());
            setAuth({ user: { ...u, ...updated }, accessToken: accessToken || '' });
            setStage('idle');
            setCode('');
        } catch (e: any) {
            Alert.alert('Verification failed', e?.response?.data?.meta?.message || 'Check the code and try again.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            {/* Account-security ladder */}
            <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: P.border, borderRadius: 16, padding: 16, marginBottom: 22 }}>
                {/* Rung 1 — phone, read-only */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: emailVerified ? 14 : 16 }}>
                    <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: P.green, alignItems: 'center', justifyContent: 'center' }}><Check size={14} color={P.green} /></View>
                    <View style={{ flex: 1 }}><Text style={{ fontFamily: 'Outfit-SemiBold', fontSize: 15, color: P.textPrimary }}>Phone secured</Text><Text style={{ fontFamily: 'Outfit-Regular', fontSize: 12, color: P.textMuted }}>{phone}</Text></View>
                    <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 10, color: P.green, letterSpacing: 1 }}>SECURED</Text>
                </View>
                {/* Rung 2 — email */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: emailVerified ? P.green : P.orange, borderStyle: emailVerified ? 'solid' : 'dashed', alignItems: 'center', justifyContent: 'center' }}>{emailVerified ? <Check size={14} color={P.green} /> : null}</View>
                    <View style={{ flex: 1 }}><Text style={{ fontFamily: 'Outfit-SemiBold', fontSize: 15, color: P.textPrimary }}>{emailVerified ? 'Email secured' : 'Add a backup email'}</Text><Text style={{ fontFamily: 'Outfit-Regular', fontSize: 12, color: P.textMuted }}>{emailVerified ? u?.email : 'So you never lose access to your account'}</Text></View>
                    {emailVerified ? <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 10, color: P.green, letterSpacing: 1 }}>SECURED</Text> : null}
                </View>
            </View>

            {!emailVerified && stage === 'idle' && (
                <>
                    <Field label="Backup email"><Input value={email} onChangeText={setEmail} placeholder="name@email.com" keyboardType="email-address" autoCapitalize="none" /></Field>
                    <Pressable onPress={onSend} disabled={busy} style={{ opacity: busy ? 0.6 : 1 }}>
                        <View style={{ paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: P.orange }}>
                            {busy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontFamily: 'Outfit-Bold', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>Send code</Text>}
                        </View>
                    </Pressable>
                    <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 11, color: P.textMuted, fontStyle: 'italic', marginTop: 10 }}>Used only for receipts, alerts, and account recovery. Never shown publicly.</Text>
                </>
            )}

            {!emailVerified && stage === 'code' && (
                <>
                    <Field label="Enter the code"><Input value={code} onChangeText={setCode} placeholder="6-digit code" keyboardType="number-pad" /></Field>
                    <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 12, color: P.textSecondary, marginBottom: 14 }}>Sent to {email} · <Text style={{ color: P.orange }} onPress={() => setStage('idle')}>Change</Text></Text>
                    <Pressable onPress={onVerify} disabled={busy} style={{ opacity: busy ? 0.6 : 1 }}>
                        <View style={{ paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: P.orange }}>
                            {busy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontFamily: 'Outfit-Bold', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>Verify</Text>}
                        </View>
                    </Pressable>
                </>
            )}

            {emailVerified && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ShieldCheck size={15} color={P.green} /><Text style={{ fontFamily: 'Outfit-Medium', fontSize: 13, color: P.green }}>Your account is protected.</Text>
                </View>
            )}
        </>
    );
}

export default AccountVerificationBody;
