import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { FilterToggle } from './filters/FilterToggle';
import { FilterSlider } from './filters/FilterSlider';
import { FilterMultiSelect } from './filters/FilterMultiSelect';
import { FilterSelect } from './filters/FilterSelect';

interface FilterSectionProps {
    id: string;
    title: string;
    icon: React.ReactNode;
    badge?: string;
    expanded: boolean;
    onToggle: () => void;
    filters: any;
    onUpdateFilters: (updates: any) => void;
}

export const FilterSection: React.FC<FilterSectionProps> = ({
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
            case 'trust':
                return (
                    <View className="gap-4">
                        <FilterToggle
                            label="Verified Organizers Only"
                            description="Only show gigs from verified organizations"
                            value={filters.verifiedOrganizer || false}
                            onChange={(value) => onUpdateFilters({ verifiedOrganizer: value })}
                            badge="Recommended"
                        />
                        <FilterSlider
                            label="Minimum Organizer Rating"
                            min={0}
                            max={5}
                            step={0.5}
                            value={filters.minRating || 0}
                            onChange={(value) => onUpdateFilters({ minRating: value })}
                            formatLabel={(val) => val === 0 ? 'Any' : `${val}+`}
                        />
                        <FilterToggle
                            label="Payment Guaranteed (Escrow)"
                            description="Organizer has enabled payment protection"
                            value={filters.paymentGuaranteed || false}
                            onChange={(value) => onUpdateFilters({ paymentGuaranteed: value })}
                            badge="Premium"
                        />
                        <FilterToggle
                            label="Contract Provided"
                            description="Formal agreement included"
                            value={filters.contractRequired || false}
                            onChange={(value) => onUpdateFilters({ contractRequired: value })}
                        />
                    </View>
                );

            case 'compensation':
                return (
                    <View className="gap-4">
                        <FilterToggle
                            label="Exclude 'Exposure' Gigs"
                            description="Hide gigs offering less than ₹2,000"
                            value={filters.excludeUnpaid || false}
                            onChange={(value) => onUpdateFilters({ excludeUnpaid: value })}
                        // badge="Recommended"
                        />
                        <FilterSlider
                            label="Minimum Compensation"
                            min={0}
                            max={100000}
                            step={1000}
                            value={filters.minCompensation || 0}
                            onChange={(value) => onUpdateFilters({ minCompensation: value })}
                            formatLabel={(val) => val === 0 ? 'Any' : `₹${(val / 1000).toFixed(0)}k`}
                            presets={[
                                { label: 'Entry', value: 2000 },
                                { label: 'Mid', value: 5000 },
                                { label: 'Pro', value: 15000 },
                                { label: 'Premium', value: 50000 },
                            ]}
                        />
                        <FilterMultiSelect
                            label="Payment Model"
                            options={[
                                { value: 'fixed', label: 'Fixed Fee' },
                                { value: 'hourly', label: 'Hourly Rate' },
                                { value: 'per-day', label: 'Per Day' },
                            ]}
                            value={filters.compensationModel || []}
                            onChange={(value) => onUpdateFilters({ compensationModel: value })}
                        />
                        <FilterToggle
                            label="Rehearsal Days Paid"
                            description="Practice sessions are compensated"
                            value={filters.rehearsalPaid || false}
                            onChange={(value) => onUpdateFilters({ rehearsalPaid: value })}
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
                                { value: 'dancer', label: 'Dancer' },
                                { value: 'musician', label: 'Musician' },
                                { value: 'actor', label: 'Actor' },
                                { value: 'model', label: 'Model' },
                                { value: 'dj', label: 'DJ' },
                                { value: 'comedian', label: 'Comedian' },
                                { value: 'choreographer', label: 'Choreographer' },
                            ]}
                            value={filters.artistTypes || []}
                            onChange={(value) => onUpdateFilters({ artistTypes: value })}
                            gridColumns={2}
                        />

                        {/* Show genre filter if singer/musician selected */}
                        {(filters.artistTypes?.includes('singer') ||
                            filters.artistTypes?.includes('musician')) && (
                                <FilterMultiSelect
                                    label="Music Genre"
                                    options={[
                                        { value: 'classical', label: 'Classical' },
                                        { value: 'bollywood', label: 'Bollywood' },
                                        { value: 'rock', label: 'Rock' },
                                        { value: 'pop', label: 'Pop' },
                                        { value: 'jazz', label: 'Jazz' },
                                        { value: 'edm', label: 'EDM' },
                                        { value: 'folk', label: 'Folk' },
                                    ]}
                                    value={filters.musicGenre || []}
                                    onChange={(value) => onUpdateFilters({ musicGenre: value })}
                                />
                            )}

                        {/* Show dance style if dancer selected */}
                        {filters.artistTypes?.includes('dancer') && (
                            <FilterMultiSelect
                                label="Dance Style"
                                options={[
                                    { value: 'classical', label: 'Classical' },
                                    { value: 'contemporary', label: 'Contemporary' },
                                    { value: 'hip-hop', label: 'Hip Hop' },
                                    { value: 'bollywood', label: 'Bollywood' },
                                    { value: 'folk', label: 'Folk' },
                                ]}
                                value={filters.danceStyle || []}
                                onChange={(value) => onUpdateFilters({ danceStyle: value })}
                            />
                        )}
                    </View>
                );

            case 'experience':
                return (
                    <View className="gap-4">
                        <FilterMultiSelect
                            label="Experience Level"
                            options={[
                                { value: 'beginner', label: 'Beginner' },
                                { value: 'intermediate', label: 'Intermediate' },
                                { value: 'professional', label: 'Professional' },
                            ]}
                            value={filters.experienceLevel || []}
                            onChange={(value) => onUpdateFilters({ experienceLevel: value })}
                        />
                    </View>
                );

            case 'location':
                return (
                    <View className="gap-4">
                        <FilterSelect
                            label="City"
                            options={[
                                { value: 'any', label: 'Any City' },
                                { value: 'mumbai', label: 'Mumbai' },
                                { value: 'delhi', label: 'Delhi' },
                                { value: 'bangalore', label: 'Bangalore' },
                                { value: 'kolkata', label: 'Kolkata' },
                                { value: 'chennai', label: 'Chennai' },
                                { value: 'hyderabad', label: 'Hyderabad' },
                                { value: 'pune', label: 'Pune' },
                            ]}
                            value={filters.city || 'any'}
                            onChange={(value) => onUpdateFilters({ city: value })}
                        />
                        <FilterToggle
                            label="Remote/Virtual Only"
                            description="Online performances and recordings"
                            value={filters.remoteOnly || false}
                            onChange={(value) => onUpdateFilters({ remoteOnly: value })}
                        />
                        <FilterToggle
                            label="Travel Expenses Paid"
                            description="Transport and accommodation covered"
                            value={filters.travelExpensesPaid || false}
                            onChange={(value) => onUpdateFilters({ travelExpensesPaid: value })}
                        />
                    </View>
                );

            case 'timing':
                return (
                    <View className="gap-4">
                        <FilterSelect
                            label="Application Deadline"
                            options={[
                                { value: 'any', label: 'Any' },
                                { value: '3days', label: 'Within 3 days' },
                                { value: '7days', label: 'Within 1 week' },
                                { value: '14days', label: 'Within 2 weeks' },
                                { value: '30days', label: 'Within 1 month' },
                            ]}
                            value={filters.applicationDeadline || 'any'}
                            onChange={(value) => onUpdateFilters({ applicationDeadline: value })}
                        />
                        <FilterMultiSelect
                            label="Gig Type"
                            options={[
                                { value: 'one-time', label: 'One-time Event' },
                                { value: 'recurring', label: 'Recurring' },
                                { value: 'contract', label: 'Long-term Contract' },
                            ]}
                            value={filters.gigType || []}
                            onChange={(value) => onUpdateFilters({ gigType: value })}
                        />
                    </View>
                );

            case 'eventType':
                return (
                    <View className="gap-4">
                        <FilterMultiSelect
                            label="Event Category"
                            options={[
                                { value: 'wedding', label: 'Wedding' },
                                { value: 'corporate', label: 'Corporate' },
                                { value: 'concert', label: 'Concert/Show' },
                                { value: 'festival', label: 'Festival' },
                                { value: 'workshop', label: 'Workshop' },
                                { value: 'theater', label: 'Theater' },
                                { value: 'recording', label: 'Recording' },
                            ]}
                            value={filters.category || []}
                            onChange={(value) => onUpdateFilters({ category: value })}
                            gridColumns={2}
                        />
                    </View>
                );

            case 'requirements':
                return (
                    <View className="gap-4">
                        <FilterMultiSelect
                            label="Perks & Benefits"
                            options={[
                                { value: 'meals', label: 'Meals Provided' },
                                { value: 'equipment', label: 'Equipment Provided' },
                                { value: 'transport', label: 'Local Transport' },
                                { value: 'accommodation', label: 'Accommodation' },
                            ]}
                            value={filters.perks || []}
                            onChange={(value) => onUpdateFilters({ perks: value })}
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
