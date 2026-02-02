
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
    Zap,
    SlidersHorizontal,
    BookOpen,
    Tag,
} from 'lucide-react-native';
import { EventFilterSection } from './EventFilterSection';
import { EventFilterState } from '@/types/eventFilters';
import { EVENT_FILTER_PRESETS, INITIAL_EVENT_FILTERS, countActiveEventFilters } from '@/lib/constants/eventFilters';

interface EventFilterModalProps {
    visible: boolean;
    onClose: () => void;
    filters: EventFilterState;
    onApplyFilters: (filters: EventFilterState | null) => void;
    activeFilterCount: number;
}

export const EventFilterModal: React.FC<EventFilterModalProps> = ({
    visible,
    onClose,
    filters,
    onApplyFilters,
    activeFilterCount,
}) => {
    const { width, height } = useWindowDimensions();
    const isDesktop = width >= 1024;
    const isTablet = width >= 768 && width < 1024;

    const [localFilters, setLocalFilters] = useState<EventFilterState>(filters);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        new Set(['eventType', 'location'])
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

    const handleApplyPreset = (preset: any) => {
        setLocalFilters({
            ...localFilters,
            advanced: {
                ...localFilters.advanced,
                ...preset.filters.advanced // Merge nested advanced objects
            }
        });
    };

    const handleClearAll = () => {
        onApplyFilters(null);
        onClose();
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
                                contentContainerStyle={{ gap: 8 }}
                            >
                                {Object.entries(EVENT_FILTER_PRESETS).map(([key, preset]) => (
                                    <TouchableOpacity
                                        key={key}
                                        onPress={() => handleApplyPreset(preset)}
                                        className="bg-zinc-900/50 border border-white/5 rounded-xl px-4 py-3 flex-row items-center gap-2"
                                    >
                                        <View className="w-6 h-6 rounded-full bg-white/5 items-center justify-center">
                                            {preset.icon === 'calendar' && <Calendar size={14} color="#3B82F6" />}
                                            {preset.icon === 'tag' && <Tag size={14} color="#10B981" />}
                                            {preset.icon === 'book-open' && <BookOpen size={14} color="#F59E0B" />}
                                        </View>
                                        <View>
                                            <Text className="text-white text-xs font-bold">
                                                {preset.name}
                                            </Text>
                                            <Text className="text-zinc-500 text-[10px] font-medium">
                                                {preset.description}
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

                            {/* Category - already covered by pills but allow selection here too? Yes. */}
                            <EventFilterSection
                                id="category"
                                title="Category & Genre"
                                icon={<Users size={18} color="#8B5CF6" />}
                                expanded={expandedSections.has('category')}
                                onToggle={() => toggleSection('category')}
                                filters={localFilters.advanced.category}
                                onUpdateFilters={(updates) =>
                                    setLocalFilters({
                                        ...localFilters,
                                        advanced: {
                                            ...localFilters.advanced,
                                            category: { ...localFilters.advanced.category, ...updates },
                                        },
                                    })
                                }
                            />

                            {/* Event Type */}
                            <EventFilterSection
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
                                            eventType: { ...localFilters.advanced.eventType, ...updates },
                                        },
                                    })
                                }
                            />

                            {/* Location */}
                            <EventFilterSection
                                id="location"
                                title="Location"
                                icon={<MapPin size={18} color="#3B82F6" />}
                                expanded={expandedSections.has('location')}
                                onToggle={() => toggleSection('location')}
                                filters={localFilters.advanced.location}
                                onUpdateFilters={(updates) =>
                                    setLocalFilters({
                                        ...localFilters,
                                        advanced: {
                                            ...localFilters.advanced,
                                            location: { ...localFilters.advanced.location, ...updates },
                                        },
                                    })
                                }
                            />

                            {/* Timing */}
                            <EventFilterSection
                                id="timing"
                                title="Timing"
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

                            {/* Pricing */}
                            <EventFilterSection
                                id="pricing"
                                title="Pricing"
                                icon={<IndianRupee size={18} color="#ef4444" />}
                                expanded={expandedSections.has('pricing')}
                                onToggle={() => toggleSection('pricing')}
                                filters={localFilters.advanced.pricing}
                                onUpdateFilters={(updates) =>
                                    setLocalFilters({
                                        ...localFilters,
                                        advanced: {
                                            ...localFilters.advanced,
                                            pricing: { ...localFilters.advanced.pricing, ...updates },
                                        },
                                    })
                                }
                            />

                            {/* Artist Types */}
                            <EventFilterSection
                                id="artistType"
                                title="Artist Types"
                                icon={<Users size={18} color="#10b981" />}
                                expanded={expandedSections.has('artistType')}
                                onToggle={() => toggleSection('artistType')}
                                filters={localFilters.advanced.artistType}
                                onUpdateFilters={(updates) =>
                                    setLocalFilters({
                                        ...localFilters,
                                        advanced: {
                                            ...localFilters.advanced,
                                            artistType: { ...localFilters.advanced.artistType, ...updates },
                                        },
                                    })
                                }
                            />

                            {/* Skill Level (mainly for workshops) */}
                            <EventFilterSection
                                id="skillLevel"
                                title="Skill Level"
                                icon={<TrendingUp size={18} color="#06b6d4" />}
                                expanded={expandedSections.has('skillLevel')}
                                onToggle={() => toggleSection('skillLevel')}
                                filters={localFilters.advanced.skillLevel}
                                onUpdateFilters={(updates) =>
                                    setLocalFilters({
                                        ...localFilters,
                                        advanced: {
                                            ...localFilters.advanced,
                                            skillLevel: { ...localFilters.advanced.skillLevel, ...updates },
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
