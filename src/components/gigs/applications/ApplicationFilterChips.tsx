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
        <View className="mb-8">
            {/* Search Input - Sleeker design */}
            <View className="flex-row items-center bg-white/5 border border-white/10 rounded-2xl px-5 py-4 mb-6 shadow-inner">
                <Search size={16} color="#52525B" strokeWidth={2.5} />
                <TextInput
                    value={searchQuery}
                    onChangeText={onSearchChange}
                    placeholder="Search applicant name or talent type..."
                    placeholderTextColor="#3F3F46"
                    className="flex-1 ml-4 text-white text-sm font-medium outline-none"
                    style={{ outlineStyle: 'none' } as any}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity 
                        onPress={() => onSearchChange('')}
                        className="bg-white/10 p-1.5 rounded-full"
                    >
                        <X size={12} color="#A1A1AA" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Filter Chips - Horizontal Scrolling with better indicators */}
            <View className="relative">
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 10, paddingRight: 20 }}
                >
                    {FILTERS.map((filter) => {
                        const isActive = activeFilter === filter.key;
                        const count = counts[filter.key];

                        return (
                            <TouchableOpacity
                                key={filter.key}
                                onPress={() => onFilterChange(filter.key)}
                                activeOpacity={0.7}
                                className={`px-5 py-3 rounded-2xl flex-row items-center gap-2.5 border transition-all duration-200 ${isActive
                                    ? 'bg-[#FF6B35] border-[#FF6B35] shadow-lg shadow-[#FF6B35]/20'
                                    : 'bg-zinc-900/40 border-white/5'
                                    }`}
                            >
                                {filter.key !== 'all' && (
                                    <View
                                        className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : ''}`}
                                        style={!isActive ? { backgroundColor: filter.color } : {}}
                                    />
                                )}
                                <Text
                                    className={`text-[10px] font-black uppercase tracking-[0.15em] ${isActive ? 'text-black' : 'text-zinc-500'
                                        }`}
                                >
                                    {filter.label}
                                </Text>
                                <View
                                    className={`px-2 py-0.5 rounded-lg ${isActive ? 'bg-black/10' : 'bg-zinc-800'
                                        }`}
                                >
                                    <Text
                                        className={`text-[9px] font-black ${isActive ? 'text-black' : 'text-zinc-400'
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
        </View>
    );
};
