// app/(app)/client/new-requirement.tsx
import { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, MapPin, Sparkles, Camera, ArrowRight, Lightbulb, Info } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { requirementService } from '@/services/requirementService';
import { useRequirementDraft } from '@/stores/requirementDraftStore';
import { DatePickerInput } from '@/components/ui/DatePickerInput';
import { useMobileTabBarHeight } from '@/components/MobileTabBar';

const OCCASIONS = ['Sangeet', 'Wedding', 'Haldi', 'Corporate event', 'College fest', 'Birthday', 'Garba night'];

const ANCHORS: Record<string, string> = {
    sangeet: 'Sangeet choreography usually starts ₹15,000 onwards',
    wedding: 'Wedding entertainment usually starts ₹25,000 onwards',
    corporate: 'Corporate acts usually start ₹30,000 onwards',
};

const PRESETS = [
    { key: 'under25', label: 'Under ₹25k', min: null as number | null, max: 25000 as number | null },
    { key: '25to75', label: '₹25k–75k', min: 25000 as number | null, max: 75000 as number | null },
    { key: '75plus', label: '₹75k+', min: 75000 as number | null, max: null as number | null },
    { key: 'custom', label: 'Custom', min: null as number | null, max: null as number | null },
    { key: 'unsure', label: 'Not sure yet', min: null as number | null, max: null as number | null },
] as const;

type PresetKey = (typeof PRESETS)[number]['key'];

const Chip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
    <Pressable
        onPress={onPress}
        className={`border rounded-full px-3.5 py-1.5 mr-2 mb-2 ${active ? 'border-[#FF6B35] bg-[#FF6B35]/10' : 'border-white/10'}`}
    >
        <Text
            style={{ fontFamily: active ? 'Outfit-SemiBold' : 'Outfit-Regular' }}
            className={`text-[12px] ${active ? 'text-[#FF6B35]' : 'text-zinc-400'}`}
        >
            {label}
        </Text>
    </Pressable>
);

export default function NewRequirement() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const draft = useRequirementDraft();
    const navClearance = (useMobileTabBarHeight() || 64) + 56;
    const [step, setStep] = useState<1 | 2>(1);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [show409, setShow409] = useState(false);

    const tag = useMemo(() => {
        const t = draft.occasionText.trim().toLowerCase();
        if (t.includes('sangeet')) return 'sangeet';
        if (t.includes('wedding') || t.includes('reception')) return 'wedding';
        if (t.includes('corporate') || t.includes('offsite')) return 'corporate';
        return null;
    }, [draft.occasionText]);

    const step1Valid =
        draft.title.trim().length >= 5 &&
        draft.occasionText.trim().length > 0 &&
        draft.city.trim().length > 0 &&
        draft.eventDate.length > 0;

    const step2Valid = draft.description.trim().length >= 20;

    const submit = async () => {
        if (!step2Valid) return;

        // Fix 3: client-side min > max guard
        if (draft.budgetPreset === 'custom' && draft.budgetMin && draft.budgetMax) {
            if (Number(draft.budgetMin) > Number(draft.budgetMax)) {
                setError('Minimum budget cannot exceed maximum');
                return;
            }
        }

        setBusy(true);
        setError('');
        setShow409(false);
        try {
            const isCustom = draft.budgetPreset === 'custom';
            const preset = PRESETS.find((p) => p.key === draft.budgetPreset);

            // Fix 1: eventDate is now stored as ISO via DatePickerInput — guard against bad string
            const parsedDate = new Date(draft.eventDate);
            const eventDateISO = !isNaN(parsedDate.getTime())
                ? parsedDate.toISOString()
                : (() => { throw new Error('invalid_date'); })();

            await requirementService.create({
                title: draft.title.trim(),
                occasionText: draft.occasionText.trim(),
                description: draft.description.trim(),
                city: draft.city.trim(),
                eventDate: eventDateISO,
                budgetMin: isCustom
                    ? (draft.budgetMin ? Number(draft.budgetMin) : null)
                    : preset?.min ?? null,
                budgetMax: isCustom
                    ? (draft.budgetMax ? Number(draft.budgetMax) : null)
                    : preset?.max ?? null,
                photos: [],
            });
            // Fix 2: invalidate the client requirements list so index.tsx refetches
            queryClient.invalidateQueries({ queryKey: ['client', 'requirements'] });
            draft.clear();
            router.replace('/(app)/client/posted' as any);
        } catch (e: any) {
            if ((e as any).message === 'invalid_date') {
                setError('Please select a valid event date');
                setBusy(false);
                return;
            }
            // Fix 4: 409 affordance
            if (e.response?.status === 409) {
                setShow409(true);
            }
            setError(
                e.response?.data?.meta?.message ||
                'Could not post. Your draft is saved — try again.',
            );
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView
                className="flex-1 bg-[#09090b]"
                contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: navClearance }}
                keyboardShouldPersistTaps="handled"
            >
                {/* Back + progress dots */}
                <View className="flex-row justify-between items-center mb-5">
                    <Pressable
                        onPress={() => (step === 2 ? setStep(1) : router.back())}
                        hitSlop={12}
                    >
                        <ChevronLeft size={22} color="#a1a1aa" />
                    </Pressable>
                    <View className="flex-row items-center gap-2">
                        <View className="h-[4px] w-7 rounded-full bg-[#FF6B35]" />
                        <View
                            className="h-[4px] w-7 rounded-full"
                            style={{ backgroundColor: step === 2 ? '#FF6B35' : 'rgba(255,255,255,0.08)' }}
                        />
                    </View>
                    <View className="w-[22px]" />
                </View>

                {step === 1 ? (
                    <>
                        {/* Conversational serif headline */}
                        <Text
                            style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 26, lineHeight: 30, color: '#f4f4f5' }}
                        >
                            Tell us about
                        </Text>
                        <Text
                            style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 26, lineHeight: 30, color: '#FF6B35', fontStyle: 'italic', marginBottom: 24 }}
                        >
                            your event.
                        </Text>

                        {/* Title */}
                        <Text
                            style={{ fontFamily: 'Outfit-Regular' }}
                            className="text-zinc-500 text-[10px] uppercase tracking-[0.12em] mb-1.5"
                        >
                            What do you need?
                        </Text>
                        <TextInput
                            value={draft.title}
                            onChangeText={(v) => draft.set({ title: v })}
                            placeholder="e.g. Choreographer for my daughter's sangeet (60 guests)"
                            placeholderTextColor="#52525b"
                            style={{ fontFamily: 'Outfit-Regular' }}
                            className="bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3.5 text-zinc-100 text-[14px] mb-5"
                            maxLength={100}
                        />

                        {/* Occasion */}
                        <Text
                            style={{ fontFamily: 'Outfit-Regular' }}
                            className="text-zinc-500 text-[10px] uppercase tracking-[0.12em] mb-1.5"
                        >
                            Occasion
                        </Text>
                        <TextInput
                            value={draft.occasionText}
                            onChangeText={(v) => draft.set({ occasionText: v })}
                            placeholder="Type your own, or tap a suggestion"
                            placeholderTextColor="#52525b"
                            style={{ fontFamily: 'Outfit-Regular' }}
                            className="bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3.5 text-zinc-100 text-[14px] mb-2.5"
                        />
                        <View className="flex-row flex-wrap mb-5">
                            {OCCASIONS.map((o) => (
                                <Chip
                                    key={o}
                                    label={o}
                                    active={draft.occasionText === o}
                                    onPress={() => draft.set({ occasionText: o })}
                                />
                            ))}
                        </View>

                        {/* City + Date side-by-side */}
                        <View className="flex-row gap-3 mb-5">
                            <View className="flex-1">
                                <Text
                                    style={{ fontFamily: 'Outfit-Regular' }}
                                    className="text-zinc-500 text-[10px] uppercase tracking-[0.12em] mb-1.5"
                                >
                                    City
                                </Text>
                                <View className="flex-row items-center bg-white/[0.04] border border-white/10 rounded-2xl px-4">
                                    <MapPin size={14} color="#71717a" />
                                    <TextInput
                                        value={draft.city}
                                        onChangeText={(v) => draft.set({ city: v })}
                                        placeholder="Pune"
                                        placeholderTextColor="#52525b"
                                        style={{ fontFamily: 'Outfit-Regular' }}
                                        className="flex-1 py-3.5 text-zinc-100 text-[14px] ml-2"
                                    />
                                </View>
                            </View>
                            <View className="flex-1">
                                <Text
                                    style={{ fontFamily: 'Outfit-Regular' }}
                                    className="text-zinc-500 text-[10px] uppercase tracking-[0.12em] mb-1.5"
                                >
                                    Event date
                                </Text>
                                <DatePickerInput
                                    value={draft.eventDate ? new Date(draft.eventDate) : undefined}
                                    onChange={(date: Date) => draft.set({ eventDate: date.toISOString() })}
                                    placeholder="Select date"
                                    minimumDate={new Date()}
                                />
                            </View>
                        </View>

                        {/* Price anchor hint */}
                        {tag && ANCHORS[tag] && (
                            <View
                                className="flex-row items-center rounded-xl px-3.5 py-2.5 mb-5"
                                style={{ backgroundColor: 'rgba(245,158,11,0.06)', borderWidth: 0.5, borderColor: 'rgba(245,158,11,0.15)' }}
                            >
                                <Lightbulb size={16} color="#F59E0B" />
                                <Text
                                    style={{ fontFamily: 'Outfit-Regular', color: 'rgba(245,158,11,0.8)' }}
                                    className="text-[12px] ml-2.5 flex-1 leading-[18px]"
                                >
                                    {ANCHORS[tag]}
                                </Text>
                            </View>
                        )}

                        {/* CTA with halo */}
                        <View>
                            <View
                                className="absolute -inset-1.5 rounded-2xl"
                                style={{ backgroundColor: step1Valid ? 'rgba(255,107,53,0.06)' : 'transparent' }}
                            />
                            <Pressable
                                onPress={() => step1Valid && setStep(2)}
                                className={`rounded-2xl py-4 flex-row items-center justify-center gap-2 ${step1Valid ? 'bg-[#FF6B35]' : 'bg-white/10'}`}
                            >
                                <Text
                                    style={{ fontFamily: 'Outfit-SemiBold' }}
                                    className={`text-[15px] ${step1Valid ? 'text-[#1A0D06]' : 'text-zinc-500'}`}
                                >
                                    Next
                                </Text>
                                {step1Valid && <ArrowRight size={16} color="#1A0D06" />}
                            </Pressable>
                        </View>
                    </>
                ) : (
                    <>
                        {/* Conversational serif headline */}
                        <Text
                            style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 26, lineHeight: 30, color: '#f4f4f5' }}
                        >
                            Almost there,
                        </Text>
                        <Text
                            style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 26, lineHeight: 30, color: '#FF6B35', fontStyle: 'italic', marginBottom: 24 }}
                        >
                            the details.
                        </Text>

                        {/* Budget */}
                        <Text
                            style={{ fontFamily: 'Outfit-Regular' }}
                            className="text-zinc-500 text-[10px] uppercase tracking-[0.12em] mb-1.5"
                        >
                            Budget (optional)
                        </Text>
                        <View className="flex-row flex-wrap mb-1">
                            {PRESETS.map((p) => (
                                <Chip
                                    key={p.key}
                                    label={p.label}
                                    active={draft.budgetPreset === p.key}
                                    onPress={() => draft.set({ budgetPreset: p.key as PresetKey })}
                                />
                            ))}
                        </View>
                        {tag && ANCHORS[tag] && (
                            <View
                                className="flex-row items-center rounded-xl px-3.5 py-2.5 mb-3"
                                style={{ backgroundColor: 'rgba(245,158,11,0.06)', borderWidth: 0.5, borderColor: 'rgba(245,158,11,0.15)' }}
                            >
                                <Info size={14} color="rgba(245,158,11,0.6)" />
                                <Text
                                    style={{ fontFamily: 'Outfit-Regular', color: 'rgba(245,158,11,0.6)' }}
                                    className="text-[11px] ml-2 flex-1 leading-[16px]"
                                >
                                    {ANCHORS[tag]}
                                </Text>
                            </View>
                        )}
                        {draft.budgetPreset === 'custom' && (
                            <View className="flex-row items-center mb-3">
                                <TextInput
                                    value={draft.budgetMin}
                                    onChangeText={(v) => draft.set({ budgetMin: v.replace(/[^0-9]/g, '') })}
                                    keyboardType="number-pad"
                                    placeholder="₹ 20,000"
                                    placeholderTextColor="#52525b"
                                    style={{ fontFamily: 'Outfit-Regular' }}
                                    className="flex-1 bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3.5 text-zinc-100"
                                />
                                <Text
                                    style={{ fontFamily: 'Outfit-Regular' }}
                                    className="text-zinc-500 mx-2 text-[12px]"
                                >
                                    to
                                </Text>
                                <TextInput
                                    value={draft.budgetMax}
                                    onChangeText={(v) => draft.set({ budgetMax: v.replace(/[^0-9]/g, '') })}
                                    keyboardType="number-pad"
                                    placeholder="₹ 50,000"
                                    placeholderTextColor="#52525b"
                                    style={{ fontFamily: 'Outfit-Regular' }}
                                    className="flex-1 bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3.5 text-zinc-100"
                                />
                            </View>
                        )}

                        {/* Description */}
                        <Text
                            style={{ fontFamily: 'Outfit-Regular' }}
                            className="text-zinc-500 text-[10px] uppercase tracking-[0.12em] mb-1.5 mt-3"
                        >
                            Describe what you need
                        </Text>
                        <TextInput
                            value={draft.description}
                            onChangeText={(v) => draft.set({ description: v })}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            placeholder="e.g. Choreographer to teach 5 family dances and perform at my daughter's sangeet. Around 60 guests."
                            placeholderTextColor="#52525b"
                            style={{ fontFamily: 'Outfit-Regular' }}
                            className="bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3.5 text-zinc-100 text-[14px] min-h-[96px] mb-2"
                        />
                        <Text
                            style={{ fontFamily: 'Outfit-Regular' }}
                            className="text-zinc-600 text-[11px] mb-2"
                        >
                            {draft.description.trim().length >= 20
                                ? ''
                                : `${20 - draft.description.trim().length} more characters needed`}
                        </Text>

                        {/* AI rephrase + photos row */}
                        <View className="flex-row gap-2 mb-5">
                            <Pressable className="flex-row items-center border border-[#8B5CF6]/40 rounded-full px-3.5 py-1.5">
                                <Sparkles size={13} color="#8B5CF6" />
                                <Text
                                    style={{ fontFamily: 'Outfit-Regular' }}
                                    className="text-[#8B5CF6] text-[11px] ml-1.5"
                                >
                                    Help me write
                                </Text>
                            </Pressable>
                            <View className="flex-row items-center border border-dashed border-white/12 rounded-full px-3.5 py-1.5">
                                <Camera size={13} color="#71717a" />
                                <Text
                                    style={{ fontFamily: 'Outfit-Regular' }}
                                    className="text-zinc-500 text-[11px] ml-1.5"
                                >
                                    Add photos
                                </Text>
                            </View>
                        </View>

                        {!!error && (
                            <Text
                                style={{ fontFamily: 'Outfit-Regular' }}
                                className="text-red-400 text-[12px] mb-2"
                            >
                                {error}
                            </Text>
                        )}
                        {show409 && (
                            <Pressable
                                onPress={() => router.replace('/(app)/client' as any)}
                                className="mb-3"
                            >
                                <Text
                                    style={{ fontFamily: 'Outfit-SemiBold' }}
                                    className="text-[#FF6B35] text-[12px] underline"
                                >
                                    View your existing requirement
                                </Text>
                            </Pressable>
                        )}

                        {/* CTA with halo */}
                        <View>
                            <View
                                className="absolute -inset-1.5 rounded-2xl"
                                style={{ backgroundColor: step2Valid ? 'rgba(255,107,53,0.06)' : 'transparent' }}
                            />
                            <Pressable
                                onPress={submit}
                                disabled={!step2Valid || busy}
                                className={`rounded-2xl py-4 flex-row items-center justify-center gap-2 ${step2Valid ? 'bg-[#FF6B35]' : 'bg-white/10'}`}
                            >
                                {busy ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Text
                                            style={{ fontFamily: 'Outfit-SemiBold' }}
                                            className={`text-[15px] ${step2Valid ? 'text-[#1A0D06]' : 'text-zinc-500'}`}
                                        >
                                            Post requirement
                                        </Text>
                                        {step2Valid && <ArrowRight size={16} color="#1A0D06" />}
                                    </>
                                )}
                            </Pressable>
                        </View>
                    </>
                )}
            </ScrollView>
        </>
    );
}
