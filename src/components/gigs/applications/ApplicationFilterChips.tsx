import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Search, X } from 'lucide-react-native';

export type ApplicationStatus = 'all' | 'pending' | 'shortlisted' | 'hired' | 'rejected';

interface FilterCounts {
    all: number;
    pending: number;
    shortlisted: number;
    hired: number;
    rejected: number;
}

interface ApplicationFilterChipsProps {
    activeFilter: ApplicationStatus;
    onFilterChange: (filter: ApplicationStatus) => void;
    counts: FilterCounts;
    searchQuery: string;
    onSearchChange: (query: string) => void;
}

const FILTERS: { key: ApplicationStatus; label: string; color: string }[] = [
    { key: 'all', label: 'All', color: 'white' },
    { key: 'pending', label: 'Pending', color: '#F59E0B' },
    { key: 'shortlisted', label: 'Shortlisted', color: '#3B82F6' },
    { key: 'hired', label: 'Hired', color: '#10B981' },
    { key: 'rejected', label: 'Rejected', color: '#EF4444' },
];

export const ApplicationFilterChips: React.FC<ApplicationFilterChipsProps> = ({
    activeFilter,
    onFilterChange,
    counts,
    searchQuery,
    onSearchChange,
}) => {
    return (
        <View className="mb-6">
            {/* Search Input */}
            <View className="flex-row items-center bg-zinc-900/50 border border-white/10 rounded-2xl px-4 py-3 mb-4">
                <Search size={18} color="#71717A" />
                <TextInput
                    value={searchQuery}
                    onChangeText={onSearchChange}
                    placeholder="Search applicants..."
                    placeholderTextColor="#52525B"
                    className="flex-1 ml-3 text-white text-sm"
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => onSearchChange('')}>
                        <X size={18} color="#71717A" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Filter Chips */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
            >
                {FILTERS.map((filter) => {
                    const isActive = activeFilter === filter.key;
                    const count = counts[filter.key];

                    return (
                        <TouchableOpacity
                            key={filter.key}
                            onPress={() => onFilterChange(filter.key)}
                            className={`px-4 py-2 rounded-xl flex-row items-center gap-2 border ${isActive
                                    ? 'bg-white/10 border-white/20'
                                    : 'bg-zinc-900/30 border-white/5'
                                }`}
                        >
                            {filter.key !== 'all' && (
                                <View
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: filter.color }}
                                />
                            )}
                            <Text
                                className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-white' : 'text-zinc-500'
                                    }`}
                            >
                                {filter.label}
                            </Text>
                            <View
                                className={`px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-zinc-800'
                                    }`}
                            >
                                <Text
                                    className={`text-[10px] font-black ${isActive ? 'text-white' : 'text-zinc-500'
                                        }`}
                                >
                                    {count}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};
