import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Modal,
    Platform,
    useWindowDimensions,
} from 'react-native';
import {
    X,
    ShieldCheck,
    IndianRupee,
    Users,
    TrendingUp,
    MapPin,
    Clock,
    Calendar,
    CheckCircle2,
    SlidersHorizontal,
    Zap,
} from 'lucide-react-native';
import { FilterSection } from './FilterSection';
import { FilterState, FilterPreset } from '@/types/filters';
import { FILTER_PRESETS } from '@/lib/constants/filters';

interface FilterModalProps {
    visible: boolean;
    onClose: () => void;
    filters: FilterState;
    onApplyFilters: (filters: FilterState) => void;
    activeFilterCount: number;
}

export const FilterModal: React.FC<FilterModalProps> = ({
    visible,
    onClose,
    filters,
    onApplyFilters,
    activeFilterCount,
}) => {
    const { width, height } = useWindowDimensions();
    const isDesktop = width >= 1024;
    const isTablet = width >= 768 && width < 1024;

    const [localFilters, setLocalFilters] = useState<FilterState>(filters);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        new Set(['trust', 'compensation'])
    );

    const toggleSection = (sectionId: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(sectionId)) {
            newExpanded.delete(sectionId);
        } else {
            newExpanded.add(sectionId);
        }
        setExpandedSections(newExpanded);
    };

    const handleApplyPreset = (preset: FilterPreset) => {
        setLocalFilters({ ...localFilters, ...preset.filters });
    };

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
    const modalHeight = '100%';

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/60">
                {/* Backdrop */}
                <TouchableOpacity
                    className="flex-1"
                    activeOpacity={1}
                    onPress={onClose}
                />

                {/* Filter Panel */}
                <View
                    className="bg-zinc-950 border-t border-white/10"
                    style={{
                        width: modalWidth,
                        height: modalHeight,
                        position: 'absolute',
                        right: 0,
                        top: 0,
                    }}
                >
                    {/* Header */}
                    <View className="border-b border-white/5 px-6 py-6">
                        <View className="flex-row items-center justify-between mb-4">
                            <View className="flex-row items-center gap-3">
                                <View className="w-10 h-10 rounded-full bg-white/5 items-center justify-center">
                                    <SlidersHorizontal size={20} color="#FFFFFF" />
                                </View>
                                <View>
                                    <Text className="text-white text-xl font-black tracking-tight">
                                        FILTERS
                                    </Text>
                                    {activeFilterCount > 0 && (
                                        <Text className="text-zinc-500 text-xs font-medium mt-0.5">
                                            {activeFilterCount} active
                                        </Text>
                                    )}
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={onClose}
                                className="w-10 h-10 rounded-full bg-white/5 items-center justify-center"
                            >
                                <X size={20} color="#71717A" />
                            </TouchableOpacity>
                        </View>

                        {/* Quick Presets */}
                        <View className="mt-4">
                            <Text className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-3">
                                QUICK PRESETS
                            </Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                className="flex-row "
                            >
                                {Object.entries(FILTER_PRESETS).map(([key, preset]) => (
                                    <TouchableOpacity
                                        key={key}
                                        onPress={() => handleApplyPreset(preset)}
                                        className="bg-zinc-900/50 border border-white/5 rounded-xl px-4 py-3 flex-row items-center gap-2"
                                    >
                                        <View className="w-6 h-6 rounded-full bg-white/5 items-center justify-center">
                                            {preset.icon === 'shield' && <ShieldCheck size={14} color="#10B981" />}
                                            {preset.icon === 'currency-rupee' && <IndianRupee size={14} color="#F59E0B" />}
                                            {preset.icon === 'heart' && <Zap size={14} color="#EC4899" />}
                                            {preset.icon === 'map-pin' && <MapPin size={14} color="#3B82F6" />}
                                            {preset.icon === 'wifi' && <MapPin size={14} color="#3B82F6" />}
                                        </View>
                                        <View>
                                            <Text className="text-white text-xs font-bold">
                                                {preset.name}
                                            </Text>
                                            <Text className="text-zinc-500 text-[10px] font-medium">
                                                {preset.description.split(' ').slice(0, 3).join(' ')}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>

                    {/* Filter Sections */}
                    <ScrollView
                        className="flex-1 px-6"
                        showsVerticalScrollIndicator={false}
                    >
                        <View className="py-6 gap-6">
                            {/* Trust & Safety */}
                            {/* <FilterSection
                                id="trust"
                                title="Trust & Safety"
                                icon={<ShieldCheck size={18} color="#10B981" />}
                                badge="Recommended"
                                expanded={expandedSections.has('trust')}
                                onToggle={() => toggleSection('trust')}
                                filters={localFilters.advanced.trust}
                                onUpdateFilters={(updates) =>
                                    setLocalFilters({
                                        ...localFilters,
                                        advanced: {
                                            ...localFilters.advanced,
                                            trust: { ...localFilters.advanced.trust, ...updates },
                                        },
                                    })
                                }
                            /> */}

                            {/* Compensation */}
                            <FilterSection
                                id="compensation"
                                title="Compensation"
                                icon={<IndianRupee size={18} color="#F59E0B" />}
                                expanded={expandedSections.has('compensation')}
                                onToggle={() => toggleSection('compensation')}
                                filters={localFilters.advanced.compensation}
                                onUpdateFilters={(updates) =>
                                    setLocalFilters({
                                        ...localFilters,
                                        advanced: {
                                            ...localFilters.advanced,
                                            compensation: {
                                                ...localFilters.advanced.compensation,
                                                ...updates,
                                            },
                                        },
                                    })
                                }
                            />

                            {/* Artist Type */}
                            <FilterSection
                                id="artistType"
                                title="Artist Type & Skills"
                                icon={<Users size={18} color="#8B5CF6" />}
                                expanded={expandedSections.has('artistType')}
                                onToggle={() => toggleSection('artistType')}
                                filters={localFilters.advanced.artistType}
                                onUpdateFilters={(updates) =>
                                    setLocalFilters({
                                        ...localFilters,
                                        advanced: {
                                            ...localFilters.advanced,
                                            artistType: {
                                                ...localFilters.advanced.artistType,
                                                ...updates,
                                            },
                                        },
                                    })
                                }
                            />

                            {/* Experience */}
                            <FilterSection
                                id="experience"
                                title="Experience Level"
                                icon={<TrendingUp size={18} color="#06B6D4" />}
                                expanded={expandedSections.has('experience')}
                                onToggle={() => toggleSection('experience')}
                                filters={localFilters.advanced.experience}
                                onUpdateFilters={(updates) =>
                                    setLocalFilters({
                                        ...localFilters,
                                        advanced: {
                                            ...localFilters.advanced,
                                            experience: {
                                                ...localFilters.advanced.experience,
                                                ...updates,
                                            },
                                        },
                                    })
                                }
                            />

                            {/* Location */}
                            <FilterSection
                                id="location"
                                title="Location & Travel"
                                icon={<MapPin size={18} color="#3B82F6" />}
                                expanded={expandedSections.has('location')}
                                onToggle={() => toggleSection('location')}
                                filters={localFilters.advanced.location}
                                onUpdateFilters={(updates) =>
                                    setLocalFilters({
                                        ...localFilters,
                                        advanced: {
                                            ...localFilters.advanced,
                                            location: {
                                                ...localFilters.advanced.location,
                                                ...updates,
                                            },
                                        },
                                    })
                                }
                            />

                            {/* Timing */}
                            <FilterSection
                                id="timing"
                                title="Timing & Duration"
                                icon={<Clock size={18} color="#F97316" />}
                                expanded={expandedSections.has('timing')}
                                onToggle={() => toggleSection('timing')}
                                filters={localFilters.advanced.timing}
                                onUpdateFilters={(updates) =>
                                    setLocalFilters({
                                        ...localFilters,
                                        advanced: {
                                            ...localFilters.advanced,
                                            timing: { ...localFilters.advanced.timing, ...updates },
                                        },
                                    })
                                }
                            />

                            {/* Event Type */}
                            <FilterSection
                                id="eventType"
                                title="Event Type"
                                icon={<Calendar size={18} color="#EC4899" />}
                                expanded={expandedSections.has('eventType')}
                                onToggle={() => toggleSection('eventType')}
                                filters={localFilters.advanced.eventType}
                                onUpdateFilters={(updates) =>
                                    setLocalFilters({
                                        ...localFilters,
                                        advanced: {
                                            ...localFilters.advanced,
                                            eventType: {
                                                ...localFilters.advanced.eventType,
                                                ...updates,
                                            },
                                        },
                                    })
                                }
                            />

                            {/* Requirements */}
                            <FilterSection
                                id="requirements"
                                title="Additional Requirements"
                                icon={<CheckCircle2 size={18} color="#14B8A6" />}
                                expanded={expandedSections.has('requirements')}
                                onToggle={() => toggleSection('requirements')}
                                filters={localFilters.advanced.requirements}
                                onUpdateFilters={(updates) =>
                                    setLocalFilters({
                                        ...localFilters,
                                        advanced: {
                                            ...localFilters.advanced,
                                            requirements: {
                                                ...localFilters.advanced.requirements,
                                                ...updates,
                                            },
                                        },
                                    })
                                }
                            />
                        </View>

                        {/* Bottom padding for mobile */}
                        <View className="h-32" />
                    </ScrollView>

                    {/* Footer Actions */}
                    <View className="border-t border-white/5 px-6 py-4 bg-zinc-950">
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={handleClearAll}
                                className="flex-1 h-14 rounded-2xl border border-white/10 items-center justify-center"
                            >
                                <Text className="text-zinc-400 font-bold text-sm uppercase tracking-wider">
                                    Clear All
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleApply}
                                className="flex-[2] h-14 rounded-2xl bg-white items-center justify-center"
                            >
                                <Text className="text-black font-black text-sm uppercase tracking-wider">
                                    Apply Filters
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};
