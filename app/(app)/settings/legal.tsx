import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { FileText, Shield, Cookie, CheckCircle2 } from 'lucide-react-native';
import AppScrollView from '@/components/AppScrollView';
import SettingRow from '@/components/settings/SettingRow';
import { useAuthStore } from '@/stores/authStore';
import settingsService from '@/services/settingsService';
import type { MarketingConsent } from '@/types';

/* ── A·Minimal tokens ── */
const BG = '#121216';
const SURFACE = 'rgba(255,255,255,0.028)';
const HAIR = 'rgba(255,255,255,0.055)';
const ORANGE = '#FF6B35';
const TEXT_0 = '#FFFFFF';
const TEXT_2 = '#A1A1AA';
const TEXT_3 = '#71717A';
const GREEN = '#22C55E';
const GREEN_SOFT = 'rgba(34,197,94,0.08)';
const RED = '#EF4444';

const DOCS = [
    { key: 'terms',   label: 'Terms of Service',  Icon: FileText },
    { key: 'privacy', label: 'Privacy Policy',     Icon: Shield },
    { key: 'cookies', label: 'Cookie Policy',      Icon: Cookie },
] as const;

function formatDate(iso: string | null | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function LegalSettings() {
    const user = useAuthStore((s) => s.user);

    const [consent, setConsent] = useState<MarketingConsent | undefined>(user?.marketingConsent);
    const [loading, setLoading] = useState(false);

    const isConsented = consent?.accepted === true;

    const handleToggleConsent = async () => {
        setLoading(true);
        try {
            const updated = await settingsService.updateMarketingConsent(!isConsented);
            setConsent((prev) => ({ ...prev, ...updated }));
        } catch {
            // silent — user sees no change
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{ title: 'Legal' }} />
            <View style={{ flex: 1, backgroundColor: BG }}>
                <AppScrollView>

                    {/* ── Documents ── */}
                    <View style={{ marginTop: 24 }}>
                        <Text style={{
                            fontSize: 11, fontFamily: 'Outfit-SemiBold', color: TEXT_3,
                            letterSpacing: 0.8, textTransform: 'uppercase',
                            paddingHorizontal: 20, marginBottom: 8,
                        }}>
                            Documents
                        </Text>
                        <View style={{
                            backgroundColor: SURFACE, borderRadius: 14,
                            marginHorizontal: 16, overflow: 'hidden',
                            borderWidth: 1, borderColor: HAIR,
                        }}>
                            {DOCS.map((doc) => (
                                <SettingRow
                                    key={doc.key}
                                    type="nav"
                                    label={doc.label}
                                    icon={<doc.Icon size={18} color={TEXT_2} />}
                                    onPress={() => {}}
                                />
                            ))}
                        </View>
                    </View>

                    {/* ── DPDP Consent (Digital Personal Data Protection Act 2023) ── */}
                    <View style={{ marginTop: 24, marginBottom: 48 }}>
                        <Text style={{
                            fontSize: 11, fontFamily: 'Outfit-SemiBold', color: TEXT_3,
                            letterSpacing: 0.8, textTransform: 'uppercase',
                            paddingHorizontal: 20, marginBottom: 8,
                        }}>
                            Data Consent
                        </Text>

                        {isConsented ? (
                            /* ── State A: Consented ── */
                            <View style={{
                                marginHorizontal: 16, borderRadius: 14, overflow: 'hidden',
                                borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)',
                                backgroundColor: GREEN_SOFT,
                            }}>
                                <View style={{ padding: 16 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                        <CheckCircle2 size={18} color={GREEN} />
                                        <Text style={{ fontSize: 15, fontFamily: 'Outfit-SemiBold', color: GREEN }}>
                                            Consent Given
                                        </Text>
                                    </View>
                                    <Text style={{ fontSize: 13, fontFamily: 'Outfit-Regular', color: TEXT_2, lineHeight: 19 }}>
                                        You have consented to NETSA processing your personal data under the Digital Personal Data Protection Act 2023.
                                    </Text>
                                    {consent?.acceptedAt && (
                                        <Text style={{ fontSize: 11, fontFamily: 'Outfit-Regular', color: TEXT_3, marginTop: 6 }}>
                                            Consented on {formatDate(consent.acceptedAt)}
                                        </Text>
                                    )}
                                </View>
                                <View style={{ height: 1, backgroundColor: 'rgba(34,197,94,0.15)' }} />
                                <Pressable
                                    onPress={handleToggleConsent}
                                    disabled={loading}
                                    style={({ pressed }) => ({
                                        paddingHorizontal: 16, paddingVertical: 14,
                                        backgroundColor: pressed ? 'rgba(239,68,68,0.08)' : 'transparent',
                                        flexDirection: 'row', alignItems: 'center', gap: 8,
                                    })}
                                >
                                    {loading
                                        ? <ActivityIndicator size="small" color={RED} />
                                        : <Text style={{ fontSize: 14, fontFamily: 'Outfit-Medium', color: RED }}>
                                            Withdraw Consent
                                          </Text>
                                    }
                                </Pressable>
                            </View>
                        ) : (
                            /* ── State B: Not consented ── */
                            <View style={{
                                marginHorizontal: 16, borderRadius: 14, overflow: 'hidden',
                                borderWidth: 1, borderColor: HAIR,
                                backgroundColor: SURFACE,
                            }}>
                                <View style={{ padding: 16 }}>
                                    <Text style={{ fontSize: 15, fontFamily: 'Outfit-SemiBold', color: TEXT_0, marginBottom: 6 }}>
                                        No Consent on Record
                                    </Text>
                                    <Text style={{ fontSize: 13, fontFamily: 'Outfit-Regular', color: TEXT_2, lineHeight: 19 }}>
                                        NETSA is required under the DPDP Act 2023 to record your explicit consent before processing personal data for non-essential purposes.
                                    </Text>
                                </View>
                                <View style={{ height: 1, backgroundColor: HAIR }} />
                                <Pressable
                                    onPress={handleToggleConsent}
                                    disabled={loading}
                                    style={({ pressed }) => ({
                                        paddingHorizontal: 16, paddingVertical: 14,
                                        backgroundColor: pressed ? 'rgba(255,107,53,0.08)' : 'transparent',
                                        flexDirection: 'row', alignItems: 'center', gap: 8,
                                    })}
                                >
                                    {loading
                                        ? <ActivityIndicator size="small" color={ORANGE} />
                                        : <Text style={{ fontSize: 14, fontFamily: 'Outfit-Medium', color: ORANGE }}>
                                            Give Consent
                                          </Text>
                                    }
                                </Pressable>
                            </View>
                        )}

                        <Text style={{
                            fontSize: 11, fontFamily: 'Outfit-Regular', color: TEXT_3,
                            paddingHorizontal: 20, marginTop: 10, lineHeight: 16,
                        }}>
                            Withdrawing consent may limit certain personalisation features. Essential communications (payments, security) continue regardless.
                        </Text>
                    </View>

                </AppScrollView>
            </View>
        </>
    );
}
