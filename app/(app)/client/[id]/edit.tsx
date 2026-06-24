/**
 * client/[id]/edit.tsx — Requirement edit screen
 *
 * If the requirement has no proposals (proposalCount === 0): all fields editable.
 * If it has proposals (proposalCount > 0): occasion / city / date / budget are LOCKED
 *   (greyed out with lock icon + amber banner); only description + photos editable.
 *
 * Save → requirementService.edit(id, patch)
 *   409 → surface server message inline
 *   success → invalidate queries + router.back()
 */
import { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Lock, MapPin, AlertTriangle } from 'lucide-react-native';
import { requirementService } from '@/services/requirementService';
import { DatePickerInput } from '@/components/ui/DatePickerInput';
import { useMobileTabBarHeight } from '@/components/MobileTabBar';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const OCCASIONS = ['Sangeet', 'Wedding', 'Haldi', 'Corporate event', 'College fest', 'Birthday', 'Garba night'];

const PRESETS = [
    { key: 'under25', label: 'Under ₹25k', min: null as number | null, max: 25000 as number | null },
    { key: '25to75', label: '₹25k–75k', min: 25000 as number | null, max: 75000 as number | null },
    { key: '75plus', label: '₹75k+', min: 75000 as number | null, max: null as number | null },
    { key: 'custom', label: 'Custom', min: null as number | null, max: null as number | null },
    { key: 'unsure', label: 'Not sure yet', min: null as number | null, max: null as number | null },
] as const;

type PresetKey = (typeof PRESETS)[number]['key'];

function formatBudget(min?: number | null, max?: number | null): string {
    if (!min && !max) return 'Not specified';
    if (min && max) return `₹${(min / 1000).toFixed(0)}k–${(max / 1000).toFixed(0)}k`;
    if (max) return `Up to ₹${(max / 1000).toFixed(0)}k`;
    if (min) return `₹${(min / 1000).toFixed(0)}k+`;
    return '';
}

// ─── Chip ────────────────────────────────────────────────────────────────────

function Chip({ label, active, onPress, disabled }: { label: string; active: boolean; onPress: () => void; disabled?: boolean }) {
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            style={{
                borderWidth: 1,
                borderColor: active ? '#FF6B35' : 'rgba(255,255,255,0.1)',
                backgroundColor: active ? 'rgba(255,107,53,0.10)' : 'transparent',
                borderRadius: 99,
                paddingHorizontal: 14,
                paddingVertical: 6,
                marginRight: 8,
                marginBottom: 8,
                opacity: disabled ? 0.5 : 1,
            }}
        >
            <Text style={{
                fontFamily: active ? 'Outfit-SemiBold' : 'Outfit-Regular',
                color: active ? '#FF6B35' : '#a1a1aa',
                fontSize: 12,
            }}>
                {label}
            </Text>
        </Pressable>
    );
}

// ─── Locked field display ─────────────────────────────────────────────────────

function LockedField({ label, value }: { label: string; value: string }) {
    return (
        <View style={{ marginBottom: 16 }}>
            <Text style={{
                fontFamily: 'Outfit-Regular',
                color: '#52525b',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 6,
            }}>
                {label}
            </Text>
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.02)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.06)',
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 13,
                opacity: 0.6,
            }}>
                <Text style={{
                    fontFamily: 'Outfit-Regular',
                    color: '#71717a',
                    fontSize: 14,
                    flex: 1,
                }}>
                    {value}
                </Text>
                <Lock size={14} color="#52525b" />
            </View>
        </View>
    );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function EditRequirementScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const navClearance = (useMobileTabBarHeight() || 64) + 56;
    const { id } = useLocalSearchParams<{ id: string }>();
    const reqId = Array.isArray(id) ? id[0] : id ?? '';

    const { data: req, isLoading: reqLoading } = useQuery({
        queryKey: ['client', 'requirement', reqId],
        queryFn: () => requirementService.detail(reqId),
        enabled: !!reqId,
    });

    // ── Local form state ─────────────────────────────────────────────────────
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [occasionText, setOccasionText] = useState('');
    const [city, setCity] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [budgetPreset, setBudgetPreset] = useState<PresetKey>('unsure');
    const [budgetMin, setBudgetMin] = useState('');
    const [budgetMax, setBudgetMax] = useState('');

    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    // Seed form from fetched requirement
    useEffect(() => {
        if (!req) return;
        setTitle(req.title ?? '');
        setDescription(req.description ?? '');
        setOccasionText(req.occasionText ?? '');
        setCity(req.city ?? '');
        setEventDate(req.eventDate ?? '');

        // Reverse-engineer budget preset
        const { budgetMin: bMin, budgetMax: bMax } = req;
        if (!bMin && !bMax) {
            setBudgetPreset('unsure');
        } else if (!bMin && bMax && bMax <= 25000) {
            setBudgetPreset('under25');
        } else if (bMin === 25000 && bMax === 75000) {
            setBudgetPreset('25to75');
        } else if (bMin === 75000 && !bMax) {
            setBudgetPreset('75plus');
        } else {
            setBudgetPreset('custom');
            setBudgetMin(bMin != null ? String(bMin) : '');
            setBudgetMax(bMax != null ? String(bMax) : '');
        }
    }, [req]);

    const hasProposals = (req?.proposalCount ?? 0) > 0;
    const locked = hasProposals;

    const descriptionValid = description.trim().length >= 20;
    const canSave = descriptionValid && !busy;

    const save = async () => {
        if (!canSave) return;
        setBusy(true);
        setError('');

        try {
            const patch: Record<string, any> = {
                description: description.trim(),
            };

            // title is always editable (before and after proposals)
            if (title.trim()) patch.title = title.trim();

            if (!locked) {
                // All fields editable
                if (occasionText.trim()) patch.occasionText = occasionText.trim();
                if (city.trim()) patch.city = city.trim();
                if (eventDate) patch.eventDate = eventDate;

                if (budgetPreset === 'custom') {
                    patch.budgetMin = budgetMin ? Number(budgetMin) : null;
                    patch.budgetMax = budgetMax ? Number(budgetMax) : null;
                } else {
                    const preset = PRESETS.find((p) => p.key === budgetPreset);
                    if (preset && preset.key !== 'unsure') {
                        patch.budgetMin = preset.min;
                        patch.budgetMax = preset.max;
                    }
                }
            }

            await requirementService.edit(reqId, patch);

            await queryClient.invalidateQueries({ queryKey: ['client', 'requirements'] });
            await queryClient.invalidateQueries({ queryKey: ['client', 'requirement', reqId] });

            router.back();
        } catch (e: any) {
            if (e?.response?.status === 409) {
                setError(
                    e?.response?.data?.meta?.message ??
                        'Budget, date and occasion are locked once proposals arrive.',
                );
            } else {
                setError(
                    e?.response?.data?.meta?.message ||
                        e?.response?.data?.message ||
                        'Could not save. Please try again.',
                );
            }
        } finally {
            setBusy(false);
        }
    };

    if (reqLoading || !req) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={{ flex: 1, backgroundColor: '#09090b', alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator color="#FF6B35" />
                </View>
            </>
        );
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView
                style={{ flex: 1, backgroundColor: '#09090b' }}
                contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: navClearance }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Back */}
                <Pressable onPress={() => router.back()} style={{ marginBottom: 20 }}>
                    <ChevronLeft size={22} color="#a1a1aa" />
                </Pressable>

                <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', color: '#f4f4f5', fontSize: 24, marginBottom: 4 }}>
                    Edit requirement
                </Text>
                <Text style={{ fontFamily: 'Outfit-Regular', color: '#71717a', fontSize: 13, marginBottom: 24 }}>
                    {req.title || req.occasionText || 'Your requirement'}
                </Text>

                {/* Locked banner */}
                {locked && (
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        backgroundColor: 'rgba(245,158,11,0.08)',
                        borderWidth: 1,
                        borderColor: 'rgba(245,158,11,0.25)',
                        borderRadius: 14,
                        padding: 14,
                        marginBottom: 24,
                        gap: 10,
                    }}>
                        <AlertTriangle size={16} color="#F59E0B" style={{ marginTop: 1 }} />
                        <Text style={{
                            fontFamily: 'Outfit-Regular',
                            color: '#F59E0B',
                            fontSize: 13,
                            lineHeight: 19,
                            flex: 1,
                        }}>
                            Core details are locked because proposals have been received. You can only edit the description.
                        </Text>
                    </View>
                )}

                {/* ── Title (always editable) ── */}
                <View style={{ marginBottom: 16 }}>
                    <Text style={{
                        fontFamily: 'Outfit-Regular',
                        color: '#a1a1aa',
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        marginBottom: 6,
                    }}>
                        Title
                    </Text>
                    <TextInput
                        value={title}
                        onChangeText={setTitle}
                        placeholder="e.g. Choreographer for my daughter's sangeet"
                        placeholderTextColor="#52525b"
                        maxLength={100}
                        style={{
                            fontFamily: 'Outfit-Regular',
                            backgroundColor: 'rgba(255,255,255,0.04)',
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderRadius: 12,
                            paddingHorizontal: 14,
                            paddingVertical: 12,
                            color: '#f4f4f5',
                            fontSize: 14,
                        }}
                    />
                </View>

                {/* ── Occasion ── */}
                {locked ? (
                    <LockedField label="Occasion" value={req.occasionText ?? '—'} />
                ) : (
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{
                            fontFamily: 'Outfit-Regular',
                            color: '#a1a1aa',
                            fontSize: 11,
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                            marginBottom: 6,
                        }}>
                            Occasion
                        </Text>
                        <TextInput
                            value={occasionText}
                            onChangeText={setOccasionText}
                            placeholder="e.g. Sangeet"
                            placeholderTextColor="#52525b"
                            style={{
                                fontFamily: 'Outfit-Regular',
                                backgroundColor: 'rgba(255,255,255,0.04)',
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.1)',
                                borderRadius: 12,
                                paddingHorizontal: 14,
                                paddingVertical: 12,
                                color: '#f4f4f5',
                                fontSize: 14,
                                marginBottom: 8,
                            }}
                        />
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {OCCASIONS.map((o) => (
                                <Chip
                                    key={o}
                                    label={o}
                                    active={occasionText === o}
                                    onPress={() => setOccasionText(o)}
                                />
                            ))}
                        </View>
                    </View>
                )}

                {/* ── City ── */}
                {locked ? (
                    <LockedField label="City" value={req.city ?? '—'} />
                ) : (
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{
                            fontFamily: 'Outfit-Regular',
                            color: '#a1a1aa',
                            fontSize: 11,
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                            marginBottom: 6,
                        }}>
                            City
                        </Text>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: 'rgba(255,255,255,0.04)',
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderRadius: 12,
                            paddingHorizontal: 14,
                        }}>
                            <MapPin size={14} color="#71717a" />
                            <TextInput
                                value={city}
                                onChangeText={setCity}
                                placeholder="Pune"
                                placeholderTextColor="#52525b"
                                style={{
                                    fontFamily: 'Outfit-Regular',
                                    flex: 1,
                                    paddingVertical: 12,
                                    color: '#f4f4f5',
                                    fontSize: 14,
                                    marginLeft: 8,
                                }}
                            />
                        </View>
                    </View>
                )}

                {/* ── Event date ── */}
                {locked ? (
                    <LockedField
                        label="Event date"
                        value={req.eventDate
                            ? new Date(req.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '—'}
                    />
                ) : (
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{
                            fontFamily: 'Outfit-Regular',
                            color: '#a1a1aa',
                            fontSize: 11,
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                            marginBottom: 6,
                        }}>
                            Event date
                        </Text>
                        <DatePickerInput
                            value={eventDate ? new Date(eventDate) : undefined}
                            onChange={(date: Date) => setEventDate(date.toISOString())}
                            placeholder="Select date"
                            minimumDate={new Date()}
                        />
                    </View>
                )}

                {/* ── Budget ── */}
                {locked ? (
                    <LockedField label="Budget" value={formatBudget(req.budgetMin, req.budgetMax)} />
                ) : (
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{
                            fontFamily: 'Outfit-Regular',
                            color: '#a1a1aa',
                            fontSize: 11,
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                            marginBottom: 6,
                        }}>
                            Budget
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 }}>
                            {PRESETS.map((p) => (
                                <Chip
                                    key={p.key}
                                    label={p.label}
                                    active={budgetPreset === p.key}
                                    onPress={() => setBudgetPreset(p.key as PresetKey)}
                                />
                            ))}
                        </View>
                        {budgetPreset === 'custom' && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                <TextInput
                                    value={budgetMin}
                                    onChangeText={(v) => setBudgetMin(v.replace(/[^0-9]/g, ''))}
                                    keyboardType="number-pad"
                                    placeholder="₹ 20,000"
                                    placeholderTextColor="#52525b"
                                    style={{
                                        fontFamily: 'Outfit-Regular',
                                        flex: 1,
                                        backgroundColor: 'rgba(255,255,255,0.04)',
                                        borderWidth: 1,
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        borderRadius: 12,
                                        paddingHorizontal: 14,
                                        paddingVertical: 12,
                                        color: '#f4f4f5',
                                        fontSize: 14,
                                    }}
                                />
                                <Text style={{ fontFamily: 'Outfit-Regular', color: '#71717a', marginHorizontal: 8 }}>
                                    to
                                </Text>
                                <TextInput
                                    value={budgetMax}
                                    onChangeText={(v) => setBudgetMax(v.replace(/[^0-9]/g, ''))}
                                    keyboardType="number-pad"
                                    placeholder="₹ 50,000"
                                    placeholderTextColor="#52525b"
                                    style={{
                                        fontFamily: 'Outfit-Regular',
                                        flex: 1,
                                        backgroundColor: 'rgba(255,255,255,0.04)',
                                        borderWidth: 1,
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        borderRadius: 12,
                                        paddingHorizontal: 14,
                                        paddingVertical: 12,
                                        color: '#f4f4f5',
                                        fontSize: 14,
                                    }}
                                />
                            </View>
                        )}
                    </View>
                )}

                {/* ── Description (always editable) ── */}
                <View style={{ marginBottom: 8 }}>
                    <Text style={{
                        fontFamily: 'Outfit-Regular',
                        color: '#a1a1aa',
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        marginBottom: 6,
                    }}>
                        What do you need?
                    </Text>
                    <TextInput
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={5}
                        textAlignVertical="top"
                        placeholder="Describe what you're looking for in more detail..."
                        placeholderTextColor="#52525b"
                        style={{
                            fontFamily: 'Outfit-Regular',
                            backgroundColor: 'rgba(255,255,255,0.04)',
                            borderWidth: 1,
                            borderColor: descriptionValid ? 'rgba(255,255,255,0.1)' : 'rgba(239,68,68,0.3)',
                            borderRadius: 12,
                            paddingHorizontal: 14,
                            paddingVertical: 12,
                            color: '#f4f4f5',
                            fontSize: 14,
                            minHeight: 120,
                        }}
                    />
                    {!descriptionValid && (
                        <Text style={{
                            fontFamily: 'Outfit-Regular',
                            color: '#71717a',
                            fontSize: 11,
                            marginTop: 4,
                        }}>
                            {20 - description.trim().length} more character{20 - description.trim().length !== 1 ? 's' : ''} needed
                        </Text>
                    )}
                </View>

                {/* Error */}
                {!!error && (
                    <Text style={{
                        fontFamily: 'Outfit-Regular',
                        color: '#ef4444',
                        fontSize: 13,
                        marginBottom: 14,
                        marginTop: 8,
                    }}>
                        {error}
                    </Text>
                )}

                {/* Save button */}
                <Pressable
                    onPress={save}
                    disabled={!canSave}
                    style={{
                        backgroundColor: canSave ? '#FF6B35' : 'rgba(255,255,255,0.08)',
                        borderRadius: 14,
                        paddingVertical: 16,
                        alignItems: 'center',
                        marginTop: 16,
                    }}
                >
                    {busy ? (
                        <ActivityIndicator color={canSave ? '#1A0D06' : '#71717a'} />
                    ) : (
                        <Text style={{
                            fontFamily: 'Outfit-SemiBold',
                            color: canSave ? '#1A0D06' : '#52525b',
                            fontSize: 15,
                        }}>
                            Save changes
                        </Text>
                    )}
                </Pressable>
            </ScrollView>
        </>
    );
}
