import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { X, Users, ArrowUpDown, User as UserIcon } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ApplicantCard } from './ApplicantCard';
import { ApplicationFilterChips, ApplicationStatus } from './ApplicationFilterChips';

interface Application {
    _id: string;
    artistId: string;
    status: string;
    coverNote?: string;
    portfolioLinks?: string[];
    artistSnapshot?: {
        displayName?: string;
        profileImageUrl?: string;
        artistType?: string;
        rating?: number;
    };
    appliedAt?: string;
}

interface ApplicationsBottomSheetProps {
    visible: boolean;
    onClose: () => void;
    applications: Application[];
    onViewAll: () => void;
    onUpdateStatus: (applicationId: string, status: string) => void;
    gigId: string;
    isLoading?: boolean;
}

type SortOption = 'date' | 'rating' | 'name';

export const ApplicationsBottomSheet: React.FC<ApplicationsBottomSheetProps> = ({
    visible,
    onClose,
    applications,
    onViewAll,
    onUpdateStatus,
    gigId,
    isLoading = false,
}) => {
    const router = useRouter();

    // Filter and sort state
    const [activeFilter, setActiveFilter] = useState<ApplicationStatus>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('date');
    const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
    const [showSortDropdown, setShowSortDropdown] = useState(false);

    // Calculate counts for filters
    const counts = useMemo(() => {
        return {
            all: applications.length,
            pending: applications.filter((a) => a.status === 'pending').length,
            shortlisted: applications.filter((a) => a.status === 'shortlisted').length,
            hired: applications.filter((a) => a.status === 'hired').length,
            rejected: applications.filter((a) => a.status === 'rejected').length,
        };
    }, [applications]);

    // Filter and sort applications
    const filteredApplications = useMemo(() => {
        let filtered = [...applications];

        // Apply status filter
        if (activeFilter !== 'all') {
            filtered = filtered.filter((app) => app.status === activeFilter);
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter((app) =>
                app.artistSnapshot?.displayName?.toLowerCase().includes(query) ||
                app.artistSnapshot?.artistType?.toLowerCase().includes(query)
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
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

    const toggleExpand = (appId: string) => {
        setExpandedAppId((prev) => (prev === appId ? null : appId));
    };

    if (!visible) {
        return null;
    }

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            {/* Backdrop */}
            <TouchableOpacity
                style={styles.backdrop}
                activeOpacity={1}
                onPress={onClose}
            >
                <View style={styles.backdropInner} />
            </TouchableOpacity>

            {/* Bottom Sheet Content */}
            <View style={styles.bottomSheet}>
                <LinearGradient
                    colors={['#27272A', '#18181B']}
                    style={styles.gradientBg}
                >
                    {/* Handle */}
                    <View className="w-full items-center pt-3 pb-4">
                        <View className="w-12 h-1.5 bg-zinc-600 rounded-full" />
                    </View>

                    {/* Header */}
                    <View className="flex-row justify-between items-center px-6 pb-4 border-b border-white/10">
                        <View className="flex-row items-center gap-3">
                            <Users size={22} color="#3B82F6" />
                            <Text className="text-white font-black text-lg">Applications</Text>
                            <View className="bg-blue-500/20 px-2 py-0.5 rounded-full">
                                <Text className="text-blue-400 text-xs font-bold">{applications.length}</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} className="p-2">
                            <X size={20} color="#71717A" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* Stats Row */}
                        <View className="flex-row px-6 py-4 gap-2">
                            <View className="flex-1 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 items-center">
                                <Text className="text-amber-400 font-black text-xl">{counts.pending}</Text>
                                <Text className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mt-0.5">
                                    Pending
                                </Text>
                            </View>
                            <View className="flex-1 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 items-center">
                                <Text className="text-blue-400 font-black text-xl">{counts.shortlisted}</Text>
                                <Text className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mt-0.5">
                                    Shortlisted
                                </Text>
                            </View>
                            <View className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 items-center">
                                <Text className="text-emerald-400 font-black text-xl">{counts.hired}</Text>
                                <Text className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mt-0.5">
                                    Hired
                                </Text>
                            </View>
                            <View className="flex-1 bg-red-500/10 border border-red-500/20 rounded-xl p-3 items-center">
                                <Text className="text-red-400 font-black text-xl">{counts.rejected}</Text>
                                <Text className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mt-0.5">
                                    Rejected
                                </Text>
                            </View>
                        </View>

                        {/* Filters and Search */}
                        <View className="px-6">
                            <ApplicationFilterChips
                                activeFilter={activeFilter}
                                onFilterChange={setActiveFilter}
                                counts={counts}
                                searchQuery={searchQuery}
                                onSearchChange={setSearchQuery}
                            />
                        </View>

                        {/* Sort Row */}
                        <View className="flex-row justify-between items-center px-6 py-3">
                            <Text className="text-zinc-500 text-xs">
                                {filteredApplications.length} applicant{filteredApplications.length !== 1 ? 's' : ''}
                            </Text>

                            <TouchableOpacity
                                onPress={() => setShowSortDropdown(!showSortDropdown)}
                                className="flex-row items-center gap-2 px-3 py-2 bg-zinc-900/50 rounded-xl border border-white/5"
                            >
                                <ArrowUpDown size={14} color="#71717A" />
                                <Text className="text-zinc-400 text-xs font-medium">
                                    {sortBy === 'date' ? 'Newest' : sortBy === 'rating' ? 'Top Rated' : 'A-Z'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Sort Dropdown */}
                        {showSortDropdown && (
                            <View className="mx-6 mb-3 bg-zinc-800 rounded-xl border border-white/10 overflow-hidden">
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
                                        className={`px-4 py-3 border-b border-white/5 ${sortBy === option.key ? 'bg-blue-500/10' : ''}`}
                                    >
                                        <Text className={`text-sm ${sortBy === option.key ? 'text-blue-400 font-bold' : 'text-zinc-400'}`}>
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* Loading State */}
                        {isLoading && (
                            <View className="py-12 items-center">
                                <ActivityIndicator size="large" color="#3B82F6" />
                                <Text className="text-zinc-500 mt-4 text-sm">Loading applications...</Text>
                            </View>
                        )}

                        {/* Empty State */}
                        {!isLoading && filteredApplications.length === 0 && (
                            <View className="mx-6 py-12 items-center bg-zinc-900/30 rounded-2xl border border-white/5">
                                <UserIcon size={40} color="#52525B" />
                                <Text className="text-zinc-400 mt-4 font-medium">
                                    {applications.length > 0 ? 'No matching applicants' : 'No applications yet'}
                                </Text>
                                <Text className="text-zinc-600 mt-2 text-sm text-center px-6">
                                    {applications.length > 0
                                        ? 'Try adjusting your filters'
                                        : 'Applications will appear here'}
                                </Text>
                            </View>
                        )}

                        {/* Applicant Cards */}
                        {!isLoading && filteredApplications.length > 0 && (
                            <View className="px-6 pb-8">
                                {filteredApplications.map((app) => (
                                    <View key={app._id} className="mb-3">
                                        <ApplicantCard
                                            application={app}
                                            gigId={gigId}
                                            isExpanded={expandedAppId === app._id}
                                            onToggleExpand={() => toggleExpand(app._id)}
                                            onUpdateStatus={onUpdateStatus}
                                            isUpdating={false}
                                        />
                                    </View>
                                ))}
                            </View>
                        )}
                    </ScrollView>
                </LinearGradient>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    backdropInner: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: '85%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
    gradientBg: {
        flex: 1,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderBottomWidth: 0,
    },
    scrollContent: {
        flex: 1,
    },
});

