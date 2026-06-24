import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Modal,
    useWindowDimensions,
} from 'react-native';
import { X } from 'lucide-react-native';
import { FilterState } from '@/types/filters';

interface FilterModalProps {
    visible: boolean;
    onClose: () => void;
    filters: FilterState;
    onApplyFilters: (filters: FilterState) => void;
    activeFilterCount: number;
}

/* ----------------------------- option data ----------------------------- */

const ARTIST_TYPES = [
    { value: 'singer', label: 'Singer' },
    { value: 'dancer', label: 'Dancer' },
    { value: 'musician', label: 'Musician' },
    { value: 'actor', label: 'Actor' },
    { value: 'model', label: 'Model' },
    { value: 'dj', label: 'DJ' },
    { value: 'comedian', label: 'Comedian' },
    { value: 'choreographer', label: 'Choreographer' },
];

const PAY_BANDS = [
    { value: 0, label: 'Any' },
    { value: 2000, label: '₹2k+' },
    { value: 5000, label: '₹5k+' },
    { value: 15000, label: '₹15k+' },
    { value: 50000, label: '₹50k+' },
];

const CITIES = [
    { value: 'any', label: 'Any' },
    { value: 'pune', label: 'Pune' },
    { value: 'mumbai', label: 'Mumbai' },
    { value: 'delhi', label: 'Delhi' },
    { value: 'bangalore', label: 'Bangalore' },
    { value: 'remote', label: 'Remote' },
];

// Year bands are mapped onto the backend's existing experienceLevel enum so the
// gig search query is unchanged — the UI reads as years, the data stays as
// beginner / intermediate / professional.
const EXPERIENCE_BANDS = [
    { value: 'beginner', label: '0–2 yrs' },
    { value: 'intermediate', label: '3–5 yrs' },
    { value: 'professional', label: '5+ yrs' },
];

const SORT_OPTIONS = [
    { value: 'relevance', label: 'Relevant' },
    { value: 'newest', label: 'Newest' },
    { value: 'compensation', label: 'Top pay' },
];

/* ----------------------------- primitives ----------------------------- */

const Chip = ({
    label,
    active,
    onPress,
}: {
    label: string;
    active: boolean;
    onPress: () => void;
}) => (
    <TouchableOpacity
        onPress={onPress}
        className={`rounded-full border px-4 py-2.5 ${active ? 'bg-white border-white' : 'bg-white/5 border-white/10'
            }`}
    >
        <Text className={`text-[13px] ${active ? 'text-black font-semibold' : 'text-zinc-300 font-medium'}`}>
            {label}
        </Text>
    </TouchableOpacity>
);

const Group = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <View className="mb-7">
        <Text className="text-zinc-500 text-[11px] font-semibold uppercase tracking-widest mb-3">
            {label}
        </Text>
        {children}
    </View>
);

const Segmented = ({
    options,
    value,
    onChange,
}: {
    options: { value: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
}) => (
    <View className="flex-row bg-white/5 rounded-xl p-1 gap-1">
        {options.map((opt) => {
            const active = value === opt.value;
            return (
                <TouchableOpacity
                    key={opt.value}
                    onPress={() => onChange(opt.value)}
                    className={`flex-1 items-center py-2.5 rounded-lg ${active ? 'bg-white' : ''}`}
                >
                    <Text className={`text-xs ${active ? 'text-black font-semibold' : 'text-zinc-400 font-medium'}`}>
                        {opt.label}
                    </Text>
                </TouchableOpacity>
            );
        })}
    </View>
);

/* ------------------------------- modal -------------------------------- */

export const FilterModal: React.FC<FilterModalProps> = ({
    visible,
    onClose,
    filters,
    onApplyFilters,
    activeFilterCount,
}) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;
    const isTablet = width >= 768 && width < 1024;

    const [localFilters, setLocalFilters] = useState<FilterState>(filters);

    // Resync local state with the applied filters each time the drawer opens.
    React.useEffect(() => {
        if (visible) setLocalFilters(filters);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    const adv = localFilters.advanced;

    const patch = (section: keyof FilterState['advanced'], updates: Record<string, any>) =>
        setLocalFilters((prev) => ({
            ...prev,
            advanced: {
                ...prev.advanced,
                [section]: { ...prev.advanced[section], ...updates },
            },
        }));

    const toggleInArray = (arr: string[] = [], v: string) =>
        arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

    const handleClearAll = () => {
        setLocalFilters({
            quick: null,
            advanced: {
                trust: {},
                compensation: {},
                artistType: {},
                experience: {},
                location: {},
                timing: {},
                eventType: {},
                requirements: {},
                sorting: { sortBy: 'relevance' },
            },
        });
    };

    const handleApply = () => {
        onApplyFilters(localFilters);
        onClose();
    };

    const modalWidth = isDesktop ? 480 : isTablet ? '60%' : '100%';

    // Current selections
    const selectedArtist = adv.artistType.artistTypes || [];
    const selectedPay = adv.compensation.minCompensation || 0;
    const selectedCity = adv.location.remoteOnly ? 'remote' : adv.location.city || 'any';
    const selectedExp = adv.experience.experienceLevel || [];
    const selectedSort = adv.sorting.sortBy || 'relevance';

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View className="flex-1 bg-black/60">
                {/* Backdrop */}
                <TouchableOpacity className="flex-1" activeOpacity={1} onPress={onClose} />

                {/* Filter Panel */}
                <View
                    className="bg-zinc-950 border-l border-white/10"
                    style={{ width: modalWidth, height: '100%', position: 'absolute', right: 0, top: 0 }}
                >
                    {/* Header */}
                    <View className="border-b border-white/5 px-6 pt-14 pb-5 flex-row items-start justify-between">
                        <View>
                            <Text className="text-white text-2xl font-bold tracking-tight">Filters</Text>
                            {activeFilterCount > 0 && (
                                <Text className="text-zinc-500 text-xs mt-1">{activeFilterCount} active</Text>
                            )}
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            className="w-9 h-9 rounded-full bg-white/5 items-center justify-center"
                        >
                            <X size={18} color="#a1a1aa" />
                        </TouchableOpacity>
                    </View>

                    {/* Body */}
                    <ScrollView
                        className="flex-1 px-6"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingTop: 24, paddingBottom: 40 }}
                    >
                        <Group label="Artist type">
                            <View className="flex-row flex-wrap gap-2">
                                {ARTIST_TYPES.map((o) => (
                                    <Chip
                                        key={o.value}
                                        label={o.label}
                                        active={selectedArtist.includes(o.value)}
                                        onPress={() =>
                                            patch('artistType', {
                                                artistTypes: toggleInArray(selectedArtist, o.value),
                                            })
                                        }
                                    />
                                ))}
                            </View>
                        </Group>

                        <Group label="Minimum pay">
                            <View className="flex-row flex-wrap gap-2">
                                {PAY_BANDS.map((o) => (
                                    <Chip
                                        key={o.value}
                                        label={o.label}
                                        active={selectedPay === o.value}
                                        onPress={() => patch('compensation', { minCompensation: o.value })}
                                    />
                                ))}
                            </View>
                        </Group>

                        <Group label="City">
                            <View className="flex-row flex-wrap gap-2">
                                {CITIES.map((o) => (
                                    <Chip
                                        key={o.value}
                                        label={o.label}
                                        active={selectedCity === o.value}
                                        onPress={() =>
                                            o.value === 'remote'
                                                ? patch('location', { city: 'any', remoteOnly: true })
                                                : patch('location', { city: o.value, remoteOnly: false })
                                        }
                                    />
                                ))}
                            </View>
                        </Group>

                        <Group label="Experience">
                            <View className="flex-row flex-wrap gap-2">
                                {EXPERIENCE_BANDS.map((o) => (
                                    <Chip
                                        key={o.value}
                                        label={o.label}
                                        active={selectedExp.includes(o.value)}
                                        onPress={() =>
                                            patch('experience', {
                                                experienceLevel: toggleInArray(selectedExp, o.value),
                                            })
                                        }
                                    />
                                ))}
                            </View>
                        </Group>

                        <Group label="Sort by">
                            <Segmented
                                options={SORT_OPTIONS}
                                value={selectedSort}
                                onChange={(v) => patch('sorting', { sortBy: v })}
                            />
                        </Group>
                    </ScrollView>

                    {/* Footer */}
                    <View className="border-t border-white/5 px-6 py-4 bg-zinc-950">
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={handleClearAll}
                                className="flex-1 h-14 rounded-2xl border border-white/10 items-center justify-center"
                            >
                                <Text className="text-zinc-400 font-semibold text-sm">Clear all</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleApply}
                                className="flex-[2] h-14 rounded-2xl bg-white items-center justify-center"
                            >
                                <Text className="text-black font-bold text-sm">Apply filters</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};
