import { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, User, Briefcase, Building, Store, Check } from 'lucide-react-native';
import authService from '@/services/authService';
import { useOrganizer } from '@/hooks/useOrganizer';
import { useMobileTabBarHeight } from '@/components/MobileTabBar';

/**
 * Business / agency account (Client Experience spec Part C/D entry).
 * Lets a client tell us who's booking — sets hirerType (organizerTypeCategory)
 * for invoicing + unlocks business tools as they ship. The full agency supplier
 * experience (find client work, rich agency profile) is Part C/D — flagged here.
 */
const TYPES = [
    { key: 'individual', icon: User, label: 'Myself', cap: 'Personal events. Simple invoices, no business details.' },
    { key: 'corporate', icon: Briefcase, label: 'My company', cap: 'GST invoices in your company name + a multi-event view.' },
    { key: 'agency', icon: Building, label: 'An agency', cap: 'You book for clients. GST invoices, multi-event view, agency tag on posts.' },
    { key: 'institution', icon: Store, label: 'Venue / college', cap: 'Restaurants, venues, institutions — recurring bookings + GST invoices.' },
] as const;

type TypeKey = (typeof TYPES)[number]['key'];

export default function BusinessAccount() {
    const router = useRouter();
    const queryClient = useQueryClient();
    // Clear the floating bottom nav + Post FAB so the Save button isn't hidden.
    const navClearance = (useMobileTabBarHeight() || 64) + 56;
    const [selected, setSelected] = useState<TypeKey>('individual');
    const [orgName, setOrgName] = useState('');
    const [busy, setBusy] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    // Pre-select whatever the user already is (don't always default to "Myself").
    const { organizer } = useOrganizer();
    const [hydrated, setHydrated] = useState(false);
    useEffect(() => {
        if (organizer && !hydrated) {
            const cat = organizer.organizerTypeCategory;
            if (cat && TYPES.some((t) => t.key === cat)) setSelected(cat as TypeKey);
            if (organizer.organizationName) setOrgName(organizer.organizationName);
            setHydrated(true);
        }
    }, [organizer, hydrated]);

    const needsOrg = selected !== 'individual';

    const save = async () => {
        if (busy) return;
        setBusy(true);
        setError('');
        setSaved(false);
        try {
            await authService.updateOrganizerProfile({
                organizerTypeCategory: selected,
                ...(needsOrg && orgName.trim() ? { organizationName: orgName.trim() } : {}),
            });
            // Refresh the organizer status so the home reveals the agency
            // dual-home toggle ("My requirements" / "Find work") on return.
            queryClient.invalidateQueries({ queryKey: ['organizer', 'me'] });
            setSaved(true);
            setTimeout(() => router.back(), 900);
        } catch (e: any) {
            setError(e?.response?.data?.message || 'Could not save. Try again.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView
                style={{ flex: 1, backgroundColor: '#09090b' }}
                contentContainerStyle={{ paddingTop: 64, paddingHorizontal: 20, paddingBottom: navClearance }}
                showsVerticalScrollIndicator={false}
            >
                <Pressable onPress={() => router.back()} className="mb-4">
                    <ChevronLeft size={22} color="#a1a1aa" />
                </Pressable>

                <Text style={{ fontFamily: 'DMSerifDisplay_400Regular' }} className="text-zinc-100 text-[22px] mb-1">
                    Business account
                </Text>
                <Text style={{ fontFamily: 'Outfit-Regular' }} className="text-zinc-500 text-[13px] mb-6 leading-5">
                    Tell us who's booking — it tailors your invoices and unlocks business tools.
                </Text>

                {TYPES.map((t) => {
                    const active = selected === t.key;
                    const Icon = t.icon;
                    return (
                        <Pressable
                            key={t.key}
                            onPress={() => setSelected(t.key)}
                            className={`flex-row items-start rounded-2xl px-4 py-3.5 mb-2.5 border ${active ? 'border-[#FF6B35] bg-[#FF6B35]/[0.07]' : 'border-white/10'}`}
                        >
                            <Icon size={19} color={active ? '#FF6B35' : '#a1a1aa'} style={{ marginTop: 2 }} />
                            <View className="flex-1 ml-3">
                                <Text style={{ fontFamily: 'Outfit-SemiBold' }} className={`text-[14px] ${active ? 'text-[#FF6B35]' : 'text-zinc-200'}`}>
                                    {t.label}
                                </Text>
                                <Text style={{ fontFamily: 'Outfit-Regular' }} className="text-zinc-500 text-[12px] mt-0.5 leading-4">
                                    {t.cap}
                                </Text>
                            </View>
                            {active && <Check size={17} color="#FF6B35" style={{ marginTop: 2 }} />}
                        </Pressable>
                    );
                })}

                {needsOrg && (
                    <View className="mt-2">
                        <Text style={{ fontFamily: 'Outfit-Regular' }} className="text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">
                            Organization name
                        </Text>
                        <TextInput
                            value={orgName}
                            onChangeText={setOrgName}
                            placeholder="e.g. Sundara Events"
                            placeholderTextColor="#52525b"
                            style={{ fontFamily: 'Outfit-Regular' }}
                            className="bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-zinc-100"
                        />
                    </View>
                )}

                {selected === 'agency' && (
                    <Text style={{ fontFamily: 'Outfit-Regular' }} className="text-[#FF6B35]/80 text-[11.5px] mt-3 leading-4">
                        Agency tools unlocked — find client work from your home with the “Find work” tab.
                    </Text>
                )}

                {!!error && <Text style={{ fontFamily: 'Outfit-Regular' }} className="text-red-400 text-[12px] mt-3">{error}</Text>}

                <Pressable
                    onPress={save}
                    disabled={busy}
                    className="bg-[#FF6B35] rounded-xl py-4 items-center mt-6"
                >
                    {busy ? (
                        <ActivityIndicator color="#1A0D06" />
                    ) : (
                        <Text style={{ fontFamily: 'Outfit-SemiBold' }} className="text-[#1A0D06] text-[15px]">
                            {saved ? 'Saved ✓' : 'Save'}
                        </Text>
                    )}
                </Pressable>
            </ScrollView>
        </>
    );
}
