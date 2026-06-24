// app/(app)/client/posted.tsx
import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { CircleCheck, Users, Clock, MessageCircle, Check } from 'lucide-react-native';
import authService from '@/services/authService';
import { useMobileTabBarHeight } from '@/components/MobileTabBar';

const WHO = [
    {
        key: 'individual' as const,
        label: 'Myself',
        cap: 'Personal events. Switch anytime — this just tunes invoices and your dashboard.',
    },
    {
        key: 'corporate' as const,
        label: 'My company',
        cap: 'GST invoices in your company name + a multi-event dashboard.',
    },
    {
        key: 'agency' as const,
        label: 'An agency',
        cap: 'Booking for clients? GST invoices, multi-event dashboard, agency tag on posts.',
    },
    {
        key: 'institution' as const,
        label: 'Venue / college',
        cap: 'For restaurants, venues and institutions — recurring bookings and GST invoices.',
    },
] as const;

type WhoKey = (typeof WHO)[number]['key'];

export default function Posted() {
    const router = useRouter();
    const navClearance = (useMobileTabBarHeight() || 64) + 56;
    const [who, setWho] = useState<WhoKey>('individual');
    // Fix 6: double-tap guard + inline save feedback
    const [savingWho, setSavingWho] = useState(false);
    const [savedWho, setSavedWho] = useState(false);
    const [saveWhoError, setSaveWhoError] = useState(false);

    const pickWho = async (key: WhoKey) => {
        if (savingWho) return; // guard double-tap
        setWho(key);
        setSavedWho(false);
        setSaveWhoError(false);
        if (key !== 'individual') {
            setSavingWho(true);
            try {
                await authService.updateOrganizerProfile({ organizerTypeCategory: key });
                setSavedWho(true);
                // briefly show confirmation then clear it
                setTimeout(() => setSavedWho(false), 2000);
            } catch {
                setSaveWhoError(true);
            } finally {
                setSavingWho(false);
            }
        }
    };

    const Row = ({
        icon: Icon,
        color,
        children,
    }: {
        icon: React.ComponentType<{ size: number; color: string; style?: object }>;
        color: string;
        children: React.ReactNode;
    }) => (
        <View className="flex-row items-start mb-3">
            <Icon size={16} color={color} style={{ marginTop: 2 }} />
            <Text
                style={{ fontFamily: 'Outfit-Regular' }}
                className="text-zinc-300 text-[13px] ml-2.5 flex-1"
            >
                {children}
            </Text>
        </View>
    );

    const currentWho = WHO.find((w) => w.key === who)!;

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View className="flex-1 bg-[#09090b] px-5 pt-20" style={{ paddingBottom: navClearance }}>
                <View className="items-center mb-2">
                    <CircleCheck size={46} color="#22C55E" />
                </View>
                <Text
                    style={{ fontFamily: 'DMSerifDisplay_400Regular' }}
                    className="text-zinc-100 text-[21px] text-center mb-6"
                >
                    Proposals on the way
                </Text>

                <Row icon={Users} color="#FF6B35">
                    Up to 5 Creative Leads in your city will see this
                </Row>
                <Row icon={Clock} color="#FF6B35">
                    Most clients hear back within 24 hours
                </Row>
                <Row icon={MessageCircle} color="#22C55E">
                    We&apos;ll message you on WhatsApp the moment one arrives
                </Row>

                <View className="border-t border-white/10 my-4" />

                <Text
                    style={{ fontFamily: 'Outfit-Regular' }}
                    className="text-zinc-500 text-[11px] uppercase tracking-wider mb-2"
                >
                    Who&apos;s this booking for?
                </Text>
                <View className="flex-row flex-wrap mb-1">
                    {WHO.map((w) => (
                        <Pressable
                            key={w.key}
                            onPress={() => pickWho(w.key)}
                            className={`border rounded-full px-3.5 py-1.5 mr-2 mb-2 ${
                                who === w.key
                                    ? 'border-[#FF6B35] bg-[#FF6B35]/10'
                                    : 'border-white/10'
                            }`}
                        >
                            <Text
                                style={{
                                    fontFamily:
                                        who === w.key ? 'Outfit-SemiBold' : 'Outfit-Regular',
                                }}
                                className={`text-[12px] ${who === w.key ? 'text-[#FF6B35]' : 'text-zinc-400'}`}
                            >
                                {w.label}
                            </Text>
                        </Pressable>
                    ))}
                </View>
                {/* Fix 6: inline save feedback */}
                {savedWho && (
                    <View className="flex-row items-center mb-1">
                        <Check size={12} color="#22C55E" />
                        <Text
                            style={{ fontFamily: 'Outfit-Regular' }}
                            className="text-green-500 text-[11px] ml-1"
                        >
                            Saved
                        </Text>
                    </View>
                )}
                {saveWhoError && (
                    <Text
                        style={{ fontFamily: 'Outfit-Regular' }}
                        className="text-zinc-500 text-[11px] mb-1"
                    >
                        Could not save, you can change this later in Settings
                    </Text>
                )}
                <Text
                    style={{ fontFamily: 'Outfit-Regular' }}
                    className="text-zinc-600 text-[11px] mb-6"
                >
                    {currentWho.cap}
                </Text>

                <Pressable
                    onPress={() => router.replace('/(app)/client' as any)}
                    className="border border-white/15 rounded-xl py-4 items-center"
                >
                    <Text
                        style={{ fontFamily: 'Outfit-SemiBold' }}
                        className="text-zinc-100 text-[14px]"
                    >
                        View my requirement
                    </Text>
                </Pressable>
            </View>
        </>
    );
}
