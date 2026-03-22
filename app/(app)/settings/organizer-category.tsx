// app/(app)/settings/organizer-category.tsx
import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import AppScrollView from '@/components/AppScrollView';
import { useAuthStore } from '@/stores/authStore';
import authService from '@/services/authService';
import {
    User, BookOpen, Building2, Briefcase, MapPin, Sparkles, HelpCircle, PenLine, Check,
} from 'lucide-react-native';

/* ── Category data ── */
const ORG_CATEGORIES = [
    { id: 'individual', label: 'Individual', sub: 'Freelance organizer', icon: User },
    { id: 'academy', label: 'Academy / Studio', sub: 'Classes, workshops & instructors', icon: BookOpen },
    { id: 'registered_business', label: 'Registered Business', sub: 'Pvt Ltd / LLP / Proprietorship', icon: Building2 },
    { id: 'agency', label: 'Agency', sub: 'Talent or event agency', icon: Briefcase },
    { id: 'venue', label: 'Venue', sub: 'Hotels, clubs, halls', icon: MapPin },
    { id: 'brand', label: 'Brand', sub: 'Campaigns & branded events', icon: Sparkles },
    { id: 'corporate', label: 'Corporate', sub: 'Internal corporate events', icon: Building2 },
] as const;

type CategoryId = (typeof ORG_CATEGORIES)[number]['id'];

export default function OrganizerCategoryScreen() {
    const router = useRouter();
    const { user, setAuth, accessToken } = useAuthStore();

    // Guard: organizer only
    const isOrganizer = user?.role === 'organizer' || user?.roles?.includes('organizer');

    // Current values from user data
    const currentCategory = (user as any)?.organizerTypeCategory as CategoryId | undefined;
    const currentIsCustom = (user as any)?.isCustomCategory as boolean | undefined;
    const currentCustomLabel = (user as any)?.customCategoryLabel as string | undefined;

    // Local state
    const [selected, setSelected] = useState<CategoryId | null>(currentIsCustom ? null : (currentCategory ?? null));
    const [isCustom, setIsCustom] = useState(currentIsCustom ?? false);
    const [customLabel, setCustomLabel] = useState(currentCustomLabel ?? '');
    const [saving, setSaving] = useState(false);

    const hasChanged = isCustom
        ? (isCustom !== currentIsCustom || customLabel !== (currentCustomLabel ?? ''))
        : (selected !== currentCategory || isCustom !== currentIsCustom);

    const canSave = isCustom ? customLabel.trim().length > 0 : !!selected;

    const handleSelectCategory = (catId: CategoryId) => {
        setSelected(catId);
        setIsCustom(false);
        setCustomLabel('');
    };

    const handleSelectCustom = () => {
        setSelected(null);
        setIsCustom(true);
    };

    const handleSave = async () => {
        if (!canSave) return;
        setSaving(true);
        try {
            // Build PATCH payload for /api/organizers/me
            const payload: any = {};
            if (isCustom) {
                payload.organizerTypeCategory = 'individual'; // fallback enum
                payload.isCustomCategory = true;
                payload.customCategoryLabel = customLabel.trim();
            } else {
                payload.organizerTypeCategory = selected;
                payload.isCustomCategory = false;
                payload.customCategoryLabel = '';
            }

            // Call the organizer PATCH endpoint
            const { default: axios } = await import('axios');
            const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://netsaa-backend.onrender.com/api';
            const patchRes = await axios.patch(`${baseUrl}/organizers/me`, payload, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            // The PATCH response contains the updated Organizer document
            const updatedOrganizer = patchRes.data;

            // Refetch the User document (/auth/me) for complete user data
            const updatedUser = await authService.getMe();

            // Merge both: User doc + organizer-specific fields from PATCH response
            // /auth/me returns User doc only — organizer fields live on the Organizer doc
            // We overlay organizer fields so the UI reflects changes instantly
            if (user) {
                const mergedUser = {
                    ...user,
                    ...updatedUser,
                    // Organizer-specific fields from the PATCH response
                    organizerTypeCategory: updatedOrganizer.organizerTypeCategory,
                    isCustomCategory: updatedOrganizer.isCustomCategory,
                    customCategoryLabel: updatedOrganizer.customCategoryLabel,
                    organizationType: updatedOrganizer.organizationType,
                    organizationName: updatedOrganizer.organizationName,
                    organizationWebsite: updatedOrganizer.organizationWebsite,
                };
                setAuth({ user: mergedUser, accessToken: accessToken || '' });
            }

            Alert.alert('Updated', 'Organizer category updated successfully.');
            router.back();
        } catch (err: any) {
            console.error('Failed to update organizer category:', err?.response?.data || err.message);
            Alert.alert('Error', err?.response?.data?.msg || 'Failed to update category.');
        } finally {
            setSaving(false);
        }
    };

    if (!isOrganizer) {
        return (
            <>
                <Stack.Screen options={{ title: 'Organizer Category' }} />
                <View className="flex-1 bg-[#09090b] items-center justify-center px-6">
                    <Text className="text-zinc-400 text-center font-['Outfit-Medium']">
                        This setting is only available for organizers.
                    </Text>
                </View>
            </>
        );
    }

    return (
        <>
            <Stack.Screen options={{ title: 'Organizer Category' }} />
            <View className="flex-1 bg-[#09090b]">
                <AppScrollView>
                    {/* Header description */}
                    <View className="px-5 pt-6 pb-2">
                        <Text className="text-white text-[22px] font-['Outfit-Bold'] tracking-tight">
                            Organizer Category
                        </Text>
                        <Text className="text-zinc-500 text-[13px] font-['Outfit-Regular'] mt-1 leading-5">
                            Changing category may require additional verification.
                        </Text>
                    </View>

                    {/* Category cards */}
                    <View className="mt-4 px-4">
                        <Text className="text-zinc-500 text-[12px] font-['Outfit-SemiBold'] uppercase tracking-wider px-1 mb-3">
                            Select Category
                        </Text>
                        <View style={{ gap: 8 }}>
                            {ORG_CATEGORIES.map((cat) => {
                                const Icon = cat.icon;
                                const sel = !isCustom && selected === cat.id;
                                return (
                                    <TouchableOpacity
                                        key={cat.id}
                                        activeOpacity={0.7}
                                        onPress={() => handleSelectCategory(cat.id)}
                                        style={{
                                            flexDirection: 'row', alignItems: 'center', gap: 12,
                                            paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14,
                                            borderWidth: 1,
                                            borderColor: sel ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.06)',
                                            backgroundColor: sel ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.02)',
                                        }}
                                    >
                                        <View style={{
                                            width: 38, height: 38, borderRadius: 11,
                                            backgroundColor: sel ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.05)',
                                            alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <Icon size={17} color={sel ? '#a78bfa' : '#52525b'} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{
                                                fontSize: 15, fontWeight: '600',
                                                color: sel ? '#a78bfa' : '#d4d4d8',
                                            }}>{cat.label}</Text>
                                            <Text style={{
                                                fontSize: 12, color: sel ? '#71717a' : '#3f3f46',
                                                marginTop: 2,
                                            }}>{cat.sub}</Text>
                                        </View>
                                        {sel && (
                                            <View style={{
                                                width: 22, height: 22, borderRadius: 11,
                                                backgroundColor: 'rgba(139,92,246,0.2)',
                                                alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <Check size={13} color="#a78bfa" strokeWidth={3} />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}

                            {/* "None of the above?" custom option */}
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={handleSelectCustom}
                                style={{
                                    flexDirection: 'row', alignItems: 'center', gap: 12,
                                    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14,
                                    borderWidth: 1,
                                    borderColor: isCustom ? 'rgba(251,191,36,0.5)' : 'rgba(255,255,255,0.06)',
                                    backgroundColor: isCustom ? 'rgba(251,191,36,0.06)' : 'rgba(255,255,255,0.02)',
                                    borderStyle: 'dashed',
                                }}
                            >
                                <View style={{
                                    width: 38, height: 38, borderRadius: 11,
                                    backgroundColor: isCustom ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.05)',
                                    alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <HelpCircle size={17} color={isCustom ? '#FBBF24' : '#52525b'} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{
                                        fontSize: 15, fontWeight: '600',
                                        color: isCustom ? '#FBBF24' : '#d4d4d8',
                                    }}>None of the above?</Text>
                                    <Text style={{
                                        fontSize: 12, color: isCustom ? '#71717a' : '#3f3f46',
                                        marginTop: 2,
                                    }}>Add a custom category</Text>
                                </View>
                                {isCustom && (
                                    <View style={{
                                        width: 22, height: 22, borderRadius: 11,
                                        backgroundColor: 'rgba(251,191,36,0.2)',
                                        alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Check size={13} color="#FBBF24" strokeWidth={3} />
                                    </View>
                                )}
                            </TouchableOpacity>

                            {/* Custom category text input */}
                            {isCustom && (
                                <View style={{
                                    flexDirection: 'row', alignItems: 'center', gap: 10,
                                    borderWidth: 1, borderColor: 'rgba(251,191,36,0.25)',
                                    backgroundColor: 'rgba(251,191,36,0.04)',
                                    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
                                    marginTop: 4,
                                }}>
                                    <PenLine size={16} color="#FBBF24" />
                                    <TextInput
                                        value={customLabel}
                                        onChangeText={setCustomLabel}
                                        placeholder="e.g. Wedding Planner, Promoter..."
                                        placeholderTextColor="#52525b"
                                        style={{
                                            flex: 1, color: '#fff', fontSize: 15, fontWeight: '500',
                                            outlineStyle: 'none',
                                        } as any}
                                        autoCapitalize="words"
                                    />
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Helper text based on selection */}
                    <View className="px-5 mt-5">
                        {!isCustom && selected === 'individual' && (
                            <View style={{
                                backgroundColor: 'rgba(16,185,129,0.08)', borderRadius: 12,
                                borderWidth: 1, borderColor: 'rgba(16,185,129,0.15)',
                                paddingVertical: 12, paddingHorizontal: 16,
                            }}>
                                <Text style={{ color: '#6ee7b7', fontSize: 13, fontWeight: '500', lineHeight: 20 }}>
                                    You will operate as an individual organizer.
                                </Text>
                            </View>
                        )}
                        {!isCustom && selected && selected !== 'individual' && (
                            <View style={{
                                backgroundColor: 'rgba(251,191,36,0.06)', borderRadius: 12,
                                borderWidth: 1, borderColor: 'rgba(251,191,36,0.15)',
                                paddingVertical: 12, paddingHorizontal: 16,
                            }}>
                                <Text style={{ color: '#fcd34d', fontSize: 13, fontWeight: '500', lineHeight: 20 }}>
                                    Business verification may be required.
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Save Button */}
                    <View className="px-5 mt-8 mb-10">
                        <TouchableOpacity
                            onPress={handleSave}
                            activeOpacity={0.8}
                            disabled={!hasChanged || !canSave || saving}
                            style={{
                                height: 50, borderRadius: 14,
                                backgroundColor: (hasChanged && canSave && !saving) ? '#8B5CF6' : 'rgba(139,92,246,0.2)',
                                alignItems: 'center', justifyContent: 'center',
                                opacity: (hasChanged && canSave && !saving) ? 1 : 0.5,
                            }}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>
                                    Save Changes
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </AppScrollView>
            </View>
        </>
    );
}
