// app/(app)/settings/role.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Briefcase, Crown, Star, Check } from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import authService from '@/services/authService';
import type { MarketRole } from '@/types/index';

const ROLES: { id: MarketRole; label: string; icon: React.ComponentType<{ size: number; color: string }>; blurb: string }[] = [
    { id: 'client', label: 'Client', icon: Briefcase, blurb: 'Post work and get proposals from Creative Leads' },
    { id: 'creative_lead', label: 'Creative Lead', icon: Crown, blurb: 'Win client work, and hire artists to deliver it' },
    { id: 'artist', label: 'Artist', icon: Star, blurb: 'Find gigs from Creative Leads and get hired' },
];

export default function RoleSettings() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const currentRole = useAuthStore((s) => s.role);
    const setAuth = useAuthStore((s) => s.setAuth);
    const [selected, setSelected] = useState<MarketRole>(currentRole);
    const [saving, setSaving] = useState(false);

    const save = async () => {
        if (!selected || selected === currentRole) {
            router.back();
            return;
        }
        setSaving(true);
        try {
            const res = await authService.switchRole(selected);
            const { token, user } = res.data;
            // Fresh token carries the new role — gigs/search walls update immediately.
            setAuth({ user, accessToken: token });
            await queryClient.invalidateQueries();
            router.back();
        } catch (e: any) {
            Alert.alert('Switch failed', e.response?.data?.message || 'Try again later.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{ title: 'Switch Role' }} />
            <View className="flex-1 bg-[#09090b] px-4 pt-6">
                <Text className="text-zinc-400 text-[13px] font-['Outfit-Regular'] px-1 mb-4">
                    Your role decides which gigs you see and who sees yours. Switching is
                    reversible today — a cooling-off period will apply later.
                </Text>
                {ROLES.map((r) => {
                    const active = selected === r.id;
                    const Icon = r.icon;
                    return (
                        <Pressable
                            key={r.id}
                            onPress={() => setSelected(r.id)}
                            className={`flex-row items-center rounded-xl px-4 py-4 mb-3 border ${active ? 'bg-violet-500/15 border-violet-400/40' : 'bg-white/[0.03] border-transparent'}`}
                        >
                            <Icon size={20} color={active ? '#a78bfa' : '#71717a'} />
                            <View className="flex-1 ml-3">
                                <Text className={`text-[15px] font-['Outfit-SemiBold'] ${active ? 'text-violet-200' : 'text-zinc-200'}`}>
                                    {r.label}{currentRole === r.id ? '  ·  current' : ''}
                                </Text>
                                <Text className="text-zinc-500 text-[12px] font-['Outfit-Regular'] mt-0.5">{r.blurb}</Text>
                            </View>
                            {active && <Check size={18} color="#a78bfa" />}
                        </Pressable>
                    );
                })}
                <Pressable
                    onPress={save}
                    disabled={saving}
                    className="bg-violet-600 rounded-xl py-4 items-center mt-4"
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text className="text-white text-[15px] font-['Outfit-SemiBold']">
                            {selected === currentRole ? 'Done' : 'Switch role'}
                        </Text>
                    )}
                </Pressable>
            </View>
        </>
    );
}
