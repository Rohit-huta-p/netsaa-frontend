import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { User as UserIcon, ArrowUpDown } from 'lucide-react-native';
import { useGigApplications, useUpdateApplicationStatus } from '@/hooks/useGigApplications';
import { ApplicantCard } from './ApplicantCard';
import { ApplicationFilterChips, ApplicationStatus } from './ApplicationFilterChips';

interface ApplicationsTabProps {
    gigId: string;
}

type SortOption = 'date' | 'rating' | 'name';

export const ApplicationsTab: React.FC<ApplicationsTabProps> = ({ gigId }) => {
    const { data: applications, isLoading, error } = useGigApplications(gigId);
    const updateMutation = useUpdateApplicationStatus();

    const [activeFilter, setActiveFilter] = useState<ApplicationStatus>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('date');
    const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
    const [showSortDropdown, setShowSortDropdown] = useState(false);

    // Calculate counts for filters
    const counts = useMemo(() => {
        if (!applications) {
            return { all: 0, pending: 0, shortlisted: 0, hired: 0, rejected: 0 };
        }
        return {
            all: applications.length,
            pending: applications.filter((a: any) => a.status === 'pending').length,
            shortlisted: applications.filter((a: any) => a.status === 'shortlisted').length,
            hired: applications.filter((a: any) => a.status === 'hired').length,
            rejected: applications.filter((a: any) => a.status === 'rejected').length,
        };
    }, [applications]);

    // Filter and sort applications
    const filteredApplications = useMemo(() => {
        if (!applications) return [];

        let filtered = [...applications];

        // Apply status filter
        if (activeFilter !== 'all') {
            filtered = filtered.filter((app: any) => app.status === activeFilter);
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter((app: any) =>
                app.artistSnapshot?.displayName?.toLowerCase().includes(query) ||
                app.artistSnapshot?.artistType?.toLowerCase().includes(query)
            );
        }

        // Apply sorting
        filtered.sort((a: any, b: any) => {
            switch (sortBy) {
                case 'date':
                    return new Date(b.appliedAt || 0).getTime() - new Date(a.appliedAt || 0).getTime();
                case 'rating':
                    return (b.artistSnapshot?.rating || 0) - (a.artistSnapshot?.rating || 0);
                case 'name':
                    return (a.artistSnapshot?.displayName || '').localeCompare(
                        b.artistSnapshot?.displayName || ''
                    );
                default:
                    return 0;
            }
        });

        return filtered;
    }, [applications, activeFilter, searchQuery, sortBy]);

    const handleUpdateStatus = (appId: string, status: string) => {
        updateMutation.mutate({ applicationId: appId, status });
    };

    const toggleExpand = (appId: string) => {
        setExpandedAppId((prev) => (prev === appId ? null : appId));
    };

    if (isLoading) {
        return (
            <View className="py-16 items-center">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="text-zinc-500 mt-4 text-sm">Loading applications...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View className="py-16 items-center bg-red-500/5 rounded-3xl border border-red-500/20">
                <Text className="text-red-400 font-medium">Failed to load applications</Text>
                <Text className="text-zinc-500 text-sm mt-2">Please try again later</Text>
            </View>
        );
    }

    return (
        <View className="space-y-4">
            {/* Filters and Search */}
            <ApplicationFilterChips
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                counts={counts}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />

            {/* Sort Dropdown */}
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-zinc-500 text-xs">
                    {filteredApplications.length} applicant{filteredApplications.length !== 1 ? 's' : ''}
                </Text>

                <TouchableOpacity
                    onPress={() => setShowSortDropdown(!showSortDropdown)}
                    className="flex-row items-center gap-2 px-3 py-2 bg-zinc-900/30 rounded-xl border border-white/5"
                >
                    <ArrowUpDown size={14} color="#71717A" />
                    <Text className="text-zinc-400 text-xs font-medium">
                        {sortBy === 'date' ? 'Newest First' : sortBy === 'rating' ? 'Highest Rated' : 'Name A-Z'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Sort Dropdown Menu */}
            {showSortDropdown && (
                <View className="absolute right-0 top-24 z-50 bg-zinc-900 rounded-xl border border-white/10 shadow-xl overflow-hidden">
                    {[
                        { key: 'date', label: 'Newest First' },
                        { key: 'rating', label: 'Highest Rated' },
                        { key: 'name', label: 'Name A-Z' },
                    ].map((option) => (
                        <TouchableOpacity
                            key={option.key}
                            onPress={() => {
                                setSortBy(option.key as SortOption);
                                setShowSortDropdown(false);
                            }}
                            className={`px-4 py-3 border-b border-white/5 ${sortBy === option.key ? 'bg-blue-500/10' : ''
                                }`}
                        >
                            <Text
                                className={`text-sm ${sortBy === option.key ? 'text-blue-400 font-bold' : 'text-zinc-400'
                                    }`}
                            >
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Empty State */}
            {filteredApplications.length === 0 ? (
                <View className="py-16 items-center bg-zinc-900/30 rounded-3xl border border-white/5">
                    <UserIcon size={48} color="#52525B" />
                    <Text className="text-zinc-400 mt-4 font-medium text-base">
                        {applications && applications.length > 0
                            ? 'No matching applicants'
                            : 'No applications yet'}
                    </Text>
                    <Text className="text-zinc-600 mt-2 text-sm text-center px-8">
                        {applications && applications.length > 0
                            ? 'Try adjusting your filters or search query'
                            : 'Applications will appear here when artists apply for this gig'}
                    </Text>
                </View>
            ) : (
                /* Applicant Cards */
                filteredApplications.map((app: any) => (
                    <ApplicantCard
                        key={app._id}
                        application={app}
                        gigId={gigId}
                        isExpanded={expandedAppId === app._id}
                        onToggleExpand={() => toggleExpand(app._id)}
                        onUpdateStatus={handleUpdateStatus}
                        isUpdating={updateMutation.isPending}
                    />
                ))
            )}
        </View>
    );
};
