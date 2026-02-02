
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronUp, Check, ShieldCheck, IndianRupee, Users, TrendingUp, MapPin, Clock, Calendar, Zap } from 'lucide-react-native';
import { FilterToggle } from '@/components/gigs/filters/FilterToggle';
import { FilterSlider } from '@/components/gigs/filters/FilterSlider';
import { FilterMultiSelect } from '@/components/gigs/filters/FilterMultiSelect';
import { FilterSelect } from '@/components/gigs/filters/FilterSelect';
import { EVENT_CATEGORIES } from '@/lib/constants/eventFilters';

interface EventFilterSectionProps {
    id: string;
    title: string;
    icon: React.ReactNode;
    badge?: string;
    expanded: boolean;
    onToggle: () => void;
    filters: any;
    onUpdateFilters: (updates: any) => void;
}

export const EventFilterSection: React.FC<EventFilterSectionProps> = ({
    id,
    title,
    icon,
    badge,
    expanded,
    onToggle,
    filters,
    onUpdateFilters,
}) => {
    const renderFilters = () => {
        switch (id) {
            case 'category':
                return (
                    <View className="gap-4">
                        <FilterMultiSelect
                            label="Event Category"
                            options={EVENT_CATEGORIES.map(cat => ({ value: cat, label: cat }))}
                            value={filters.categories || []}
                            onChange={(value) => onUpdateFilters({ categories: value })}
                            gridColumns={2}
                        />
                        <FilterMultiSelect
                            label="Genres"
                            options={[
                                { value: 'jazz', label: 'Jazz' },
                                { value: 'classical', label: 'Classical' },
                                { value: 'rock', label: 'Rock' },
                                { value: 'electronic', label: 'Electronic' },
                                { value: 'contemporary', label: 'Contemporary' },
                                { value: 'folk', label: 'Folk' },
                            ]}
                            value={filters.genres || []}
                            onChange={(value) => onUpdateFilters({ genres: value })}
                        />
                    </View>
                );

            case 'eventType':
                return (
                    <View className="gap-4">
                        <FilterMultiSelect
                            label="Event Format"
                            options={[
                                { value: 'Performance', label: 'Performance' },
                                { value: 'Workshop', label: 'Workshop' },
                                { value: 'Competition', label: 'Competition' },
                                { value: 'Meetup', label: 'Meetup' },
                                { value: 'Exhibition', label: 'Exhibition' },
                            ]}
                            value={filters.format || []}
                            onChange={(value) => onUpdateFilters({ format: value })}
                        />
                        <FilterSelect
                            label="Audience Size"
                            options={[
                                { value: 'any', label: 'Any' },
                                { value: 'small', label: 'Intimate (<50)' },
                                { value: 'medium', label: 'Medium (50-200)' },
                                { value: 'large', label: 'Large (200+)' },
                            ]}
                            value={filters.audienceSize || 'any'}
                            onChange={(value) => onUpdateFilters({ audienceSize: value })}
                        />
                    </View>
                );

            case 'pricing':
                return (
                    <View className="gap-4">
                        <FilterToggle
                            label="Free Events Only"
                            description="Show only free events"
                            value={filters.isFree || false}
                            onChange={(value) => onUpdateFilters({ isFree: value })}
                        />
                        {!filters.isFree && (
                            <FilterSlider
                                label="Price Range (Max)"
                                min={0}
                                max={10000}
                                step={100}
                                value={filters.maxPrice || 0}
                                onChange={(value) => onUpdateFilters({ maxPrice: value })}
                                formatLabel={(val) => val === 0 ? 'Any' : `₹${val}`}
                            />
                        )}
                    </View>
                );

            case 'location':
                return (
                    <View className="gap-4">
                        <FilterSelect
                            label="City"
                            options={[
                                { value: 'any', label: 'Any City' },
                                { value: 'Mumbai', label: 'Mumbai' },
                                { value: 'Delhi', label: 'Delhi' },
                                { value: 'Bangalore', label: 'Bangalore' },
                                { value: 'Kolkata', label: 'Kolkata' },
                                { value: 'Chennai', label: 'Chennai' },
                                { value: 'Hyderabad', label: 'Hyderabad' },
                                { value: 'Pune', label: 'Pune' },
                                { value: 'Goa', label: 'Goa' },
                            ]}
                            value={filters.city || 'any'}
                            onChange={(value) => onUpdateFilters({ city: value })}
                        />
                        <FilterToggle
                            label="Online / Virtual"
                            description="Events you can attend from home"
                            value={filters.isOnline || false}
                            onChange={(value) => onUpdateFilters({ isOnline: value })}
                        />
                        <FilterSelect
                            label="Distance"
                            options={[
                                { value: 'any', label: 'Any' },
                                { value: '10', label: 'Within 10 km' },
                                { value: '50', label: 'Within 50 km' },
                                { value: '100', label: 'Within 100 km' },
                            ]}
                            value={String(filters.distance || 'any')}
                            onChange={(value) => onUpdateFilters({ distance: value === 'any' ? 'any' : parseInt(value, 10) })}
                        />
                    </View>
                );

            case 'timing':
                return (
                    <View className="gap-4">
                        <FilterToggle
                            label="This Weekend Only"
                            description="Saturday & Sunday"
                            value={filters.weekendOnly || false}
                            onChange={(value) => onUpdateFilters({ weekendOnly: value })}
                        />
                        <FilterMultiSelect
                            label="Time of Day"
                            options={[
                                { value: 'morning', label: 'Morning' },
                                { value: 'afternoon', label: 'Afternoon' },
                                { value: 'evening', label: 'Evening' },
                                { value: 'night', label: 'Night' },
                            ]}
                            value={filters.timeOfDay || []}
                            onChange={(value) => onUpdateFilters({ timeOfDay: value })}
                        />
                    </View>
                );

            case 'artistType':
                return (
                    <View className="gap-4">
                        <FilterMultiSelect
                            label="Artist Type"
                            options={[
                                { value: 'singer', label: 'Singer' },
                                { value: 'band', label: 'Band' },
                                { value: 'dancer', label: 'Dancer' },
                                { value: 'comedian', label: 'Comedian' },
                                { value: 'theatre-group', label: 'Theatre Group' },
                            ]}
                            value={filters.types || []}
                            onChange={(value) => onUpdateFilters({ types: value })}
                        />
                    </View>
                );
            case 'skillLevel':
                return (
                    <View className="gap-4">
                        <FilterMultiSelect
                            label="Level"
                            options={[
                                { value: 'beginner', label: 'Beginner' },
                                { value: 'intermediate', label: 'Intermediate' },
                                { value: 'advanced', label: 'Advanced' },
                                { value: 'pro', label: 'Professional' },
                            ]}
                            value={filters.levels || []}
                            onChange={(value) => onUpdateFilters({ levels: value })}
                        />
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <View className="border border-white/5 rounded-2xl overflow-hidden bg-zinc-900/30">
            {/* Section Header */}
            <TouchableOpacity
                onPress={onToggle}
                className="flex-row items-center justify-between p-4"
            >
                <View className="flex-row items-center gap-3 flex-1">
                    <View className="w-9 h-9 rounded-full bg-white/5 items-center justify-center">
                        {icon}
                    </View>
                    <View className="flex-1">
                        <View className="flex-row items-center gap-2">
                            <Text className="text-white text-sm font-bold">{title}</Text>
                            {badge && (
                                <View className="bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                    <Text className="text-emerald-400 text-[10px] font-black uppercase">
                                        {badge}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                    {expanded ? (
                        <ChevronUp size={18} color="#71717A" />
                    ) : (
                        <ChevronDown size={18} color="#71717A" />
                    )}
                </View>
            </TouchableOpacity>

            {/* Section Content */}
            {expanded && (
                <View className="px-4 pb-4 border-t border-white/5">
                    <View className="pt-4">{renderFilters()}</View>
                </View>
            )}
        </View>
    );
};
