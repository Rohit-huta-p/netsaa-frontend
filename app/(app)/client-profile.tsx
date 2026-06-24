import { View, Text, Pressable, Image, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
    Repeat, LogOut, BadgeCheck, Building, Bell, ShieldAlert,
    Store, ChevronRight, ExternalLink,
} from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import { useOrganizer } from '@/hooks/useOrganizer';
import { useMobileTabBarHeight } from '@/components/MobileTabBar';

/**
 * Client account screen (Client Experience spec Part D / D.1).
 * A lean account hub for clients: identity header + a link to the public
 * profile, then grouped rows composing the existing settings surfaces
 * (business account, switch role, notifications, manage account, log out).
 * Agencies get one extra row to edit their supplier showcase. Intentionally
 * lean — no portfolio/skills (that's the artist profile).
 */

// Human-readable label for the organizer type stored on the Organizer doc.
const ORG_TYPE_LABEL: Record<string, string> = {
    individual: 'Individual',
    corporate: 'Company',
    agency: 'Agency',
    institution: 'Venue / college',
};

export default function ClientProfile() {
    const router = useRouter();
    const navClearance = (useMobileTabBarHeight() || 64) + 56;
    const user = useAuthStore((s) => s.user) as any;
    const userId = user?._id;
    const clearAuth = useAuthStore((s) => s.clearAuth);
    const { organizer, isAgency } = useOrganizer();

    const orgType = organizer?.organizerTypeCategory;
    const isBusiness = !!orgType && orgType !== 'individual';
    // Show the business/agency name when booking as a business; else the person's name.
    const name =
        isBusiness && organizer?.organizationName ? organizer.organizationName : user?.displayName || 'Client';
    const city = user?.cached?.primaryCity || user?.primaryCity;
    const initials = name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

    const orgTypeLabel = orgType ? ORG_TYPE_LABEL[orgType] || 'Individual' : 'Individual';
    // Subtitle reflects the actual type ("Agency"/"Company"/…) for businesses, "Client" otherwise.
    const subtypeLabel = isBusiness ? orgTypeLabel : 'Client';

    const logout = () => {
        clearAuth();
        router.replace('/(auth)/welcome' as any);
    };

    const SectionLabel = ({ label }: { label: string }) => (
        <Text
            style={{ fontFamily: 'Outfit-SemiBold' }}
            className="text-zinc-500 text-[11px] uppercase tracking-wider mb-2 mt-6 ml-1"
        >
            {label}
        </Text>
    );

    const Row = ({ icon: Icon, label, subtitle, onPress, danger, last }: any) => (
        <Pressable
            onPress={onPress}
            className={`flex-row items-center px-4 py-4 ${last ? '' : 'border-b border-white/[0.06]'}`}
        >
            <Icon size={19} color={danger ? '#F87171' : '#a1a1aa'} />
            <View className="flex-1 ml-3">
                <Text
                    style={{ fontFamily: 'Outfit-Regular' }}
                    className={`text-[14px] ${danger ? 'text-red-400' : 'text-zinc-200'}`}
                >
                    {label}
                </Text>
                {subtitle ? (
                    <Text style={{ fontFamily: 'Outfit-Regular' }} className="text-zinc-500 text-[12px] mt-0.5">
                        {subtitle}
                    </Text>
                ) : null}
            </View>
            {!danger && <ChevronRight size={17} color="#52525b" />}
        </Pressable>
    );

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView
                style={{ flex: 1, backgroundColor: '#09090b' }}
                contentContainerStyle={{ paddingTop: 64, paddingHorizontal: 20, paddingBottom: navClearance }}
                showsVerticalScrollIndicator={false}
            >
                {/* Identity header */}
                <View className="items-center mb-2">
                    {user?.profileImageUrl ? (
                        <Image source={{ uri: user.profileImageUrl }} className="w-[72px] h-[72px] rounded-full mb-3" />
                    ) : (
                        <View className="w-[72px] h-[72px] rounded-full bg-[#FF6B35]/15 items-center justify-center mb-3">
                            <Text style={{ fontFamily: 'Outfit-SemiBold' }} className="text-[#FF6B35] text-[24px]">{initials}</Text>
                        </View>
                    )}
                    <View className="flex-row items-center gap-1.5">
                        <Text style={{ fontFamily: 'DMSerifDisplay_400Regular' }} className="text-zinc-100 text-[20px]">{name}</Text>
                        <BadgeCheck size={16} color="#4ADE80" />
                    </View>
                    <Text style={{ fontFamily: 'Outfit-Regular' }} className="text-zinc-500 text-[12.5px] mt-1">
                        {subtypeLabel}{city ? ` · ${city}` : ''}
                    </Text>
                </View>

                {/* View my public profile */}
                <Pressable
                    onPress={() => userId && router.push(`/(app)/profile/${userId}` as any)}
                    disabled={!userId}
                    className="flex-row items-center justify-center gap-1.5 self-center mt-3 mb-2 px-4 py-2 rounded-full border border-white/10"
                >
                    <Text style={{ fontFamily: 'Outfit-Medium' }} className="text-zinc-300 text-[12.5px]">
                        View my public profile
                    </Text>
                    <ExternalLink size={13} color="#a1a1aa" />
                </Pressable>

                {/* Account */}
                <SectionLabel label="Account" />
                <View className="bg-white/[0.03] rounded-2xl overflow-hidden">
                    <Row
                        icon={Building}
                        label="Business account"
                        subtitle={orgTypeLabel}
                        onPress={() => router.push('/(app)/client/business' as any)}
                        last
                    />
                </View>

                {/* Agency — only for agency accounts */}
                {isAgency && (
                    <>
                        <SectionLabel label="Agency" />
                        <View className="bg-white/[0.03] rounded-2xl overflow-hidden">
                            <Row
                                icon={Store}
                                label="Edit agency profile"
                                subtitle="Logo, services, photos & more"
                                onPress={() => router.push('/(app)/client/agency-profile' as any)}
                                last
                            />
                        </View>
                    </>
                )}

                {/* On NETSA */}
                <SectionLabel label="On NETSA" />
                <View className="bg-white/[0.03] rounded-2xl overflow-hidden">
                    <Row
                        icon={Repeat}
                        label="Switch role"
                        onPress={() => router.push('/(app)/settings/role' as any)}
                    />
                    <Row
                        icon={Bell}
                        label="Notifications"
                        onPress={() => router.push('/(app)/settings/notifications' as any)}
                        last
                    />
                </View>

                {/* Account actions */}
                <SectionLabel label="Account" />
                <View className="bg-white/[0.03] rounded-2xl overflow-hidden">
                    <Row
                        icon={ShieldAlert}
                        label="Manage account"
                        onPress={() => router.push('/(app)/settings/danger' as any)}
                    />
                    <Row icon={LogOut} label="Log out" onPress={logout} danger last />
                </View>
            </ScrollView>
        </>
    );
}
