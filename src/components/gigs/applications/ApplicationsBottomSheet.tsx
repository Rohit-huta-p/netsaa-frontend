import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { X, Users, ArrowUpDown, User as UserIcon } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ApplicantCard } from './ApplicantCard';
import { ApplicationFilterChips, ApplicationStatus } from './ApplicationFilterChips';
import { HireConfirmModal } from './HireConfirmModal';

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
    /**
     * Full gig object — required to build the contract terms when the
     * hirer confirms a hire. Threaded down through HireConfirmModal.
     */
    gig?: any;
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
    gig,
    isLoading = false,
}) => {
    const router = useRouter();

    // Filter and sort state
    const [activeFilter, setActiveFilter] = useState<ApplicationStatus>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('date');
    const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
    const [showSortDropdown, setShowSortDropdown] = useState(false);

    // Hire confirmation modal target — null when nobody is being hired.
    const [hireTarget, setHireTarget] = useState<Application | null>(null);
    const handleRequestHire = (app: Application) => setHireTarget(app);

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
                    colors={['#0F0F10', '#000000']}
                    style={styles.gradientBg}
                >
                    {/* Handle */}
                    <View className="w-full items-center pt-3 pb-2">
                        <View className="w-12 h-1 bg-zinc-800 rounded-full" />
                    </View>

                    {/* Header */}
                    <View className="flex-row justify-between items-center px-6 py-4 border-b border-white/5">
                        <View>
                            <View className="flex-row items-center gap-2 mb-1">
                                <Users size={16} color="#FF6B35" />
                                <Text className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">
                                    Gig Pulse
                                </Text>
                            </View>
                            <View className="flex-row items-center gap-3">
                                <Text className="text-white font-black text-2xl tracking-tighter">Applications</Text>
                                <div className="bg-[#FF6B35]/10 px-2.5 py-1 rounded-lg border border-[#FF6B35]/20">
                                    <Text className="text-[#FF6B35] text-xs font-black">{applications.length}</Text>
                                </div>
                            </View>
                        </View>
                        <TouchableOpacity 
                            onPress={onClose} 
                            className="w-10 h-10 bg-white/5 rounded-full items-center justify-center border border-white/10"
                        >
                            <X size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView 
                        style={styles.scrollContent} 
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 40 }}
                    >
                        {/* Summary Cards Grid */}
                        <View className="flex-row flex-wrap px-6 py-6 gap-3">
                            <View className="flex-1 min-w-[45%] bg-zinc-900/40 border border-white/5 rounded-2xl p-4">
                                <View className="flex-row justify-between items-start mb-1">
                                    <Text className="text-amber-400 font-black text-2xl">{counts.pending}</Text>
                                    <View className="w-6 h-6 rounded-md bg-amber-500/10 items-center justify-center">
                                        <ArrowUpDown size={12} color="#F59E0B" />
                                    </View>
                                </View>
                                <Text className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">Pending Review</Text>
                            </View>

                            <View className="flex-1 min-w-[45%] bg-zinc-900/40 border border-white/5 rounded-2xl p-4">
                                <View className="flex-row justify-between items-start mb-1">
                                    <Text className="text-blue-400 font-black text-2xl">{counts.shortlisted}</Text>
                                    <View className="w-6 h-6 rounded-md bg-blue-500/10 items-center justify-center">
                                        <Users size={12} color="#3B82F6" />
                                    </View>
                                </View>
                                <Text className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">Shortlisted</Text>
                            </View>

                            <View className="flex-1 min-w-[45%] bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                                <View className="flex-row justify-between items-start mb-1">
                                    <Text className="text-emerald-400 font-black text-2xl">{counts.hired}</Text>
                                    <View className="w-6 h-6 rounded-md bg-emerald-500/20 items-center justify-center">
                                        <Users size={12} color="#10B981" />
                                    </View>
                                </View>
                                <Text className="text-emerald-500/60 text-[9px] font-bold uppercase tracking-widest">Final Selection</Text>
                            </View>

                            <View className="flex-1 min-w-[45%] bg-zinc-900/40 border border-white/5 rounded-2xl p-4 opacity-60">
                                <View className="flex-row justify-between items-start mb-1">
                                    <Text className="text-zinc-400 font-black text-2xl">{counts.rejected}</Text>
                                    <View className="w-6 h-6 rounded-md bg-zinc-800 items-center justify-center">
                                        <X size={12} color="#71717A" />
                                    </View>
                                </View>
                                <Text className="text-zinc-600 text-[9px] font-bold uppercase tracking-widest">Rejected</Text>
                            </View>
                        </View>

                        {/* Search & Filters Section */}
                        <View className="px-6 space-y-4">
                            <ApplicationFilterChips
                                activeFilter={activeFilter}
                                onFilterChange={setActiveFilter}
                                counts={counts}
                                searchQuery={searchQuery}
                                onSearchChange={setSearchQuery}
                            />
                        </View>

                        {/* Sort & Count Header */}
                        <View className="flex-row justify-between items-center px-6 mb-4">
                            <View>
                                <Text className="text-white font-bold text-sm">
                                    {activeFilter === 'all' ? 'All Applicants' : `${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Applicants`}
                                </Text>
                                <Text className="text-zinc-500 text-[10px]">
                                    Showing {filteredApplications.length} results
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={() => setShowSortDropdown(!showSortDropdown)}
                                className="flex-row items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/10"
                            >
                                <ArrowUpDown size={12} color="#FF6B35" />
                                <Text className="text-zinc-300 text-xs font-semibold">
                                    {sortBy === 'date' ? 'Newest' : sortBy === 'rating' ? 'Top Rated' : 'A-Z'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Sort Dropdown Overlay-like menu */}
                        {showSortDropdown && (
                            <View className="mx-6 mb-6 bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
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
                                        className={`px-4 py-4 flex-row items-center justify-between border-b border-white/5 ${sortBy === option.key ? 'bg-[#FF6B35]/10' : ''}`}
                                    >
                                        <Text className={`text-xs ${sortBy === option.key ? 'text-[#FF6B35] font-black' : 'text-zinc-400 font-medium'}`}>
                                            {option.label}
                                        </Text>
                                        {sortBy === option.key && <View className="w-1.5 h-1.5 rounded-full bg-[#FF6B35]" />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* Loading State */}
                        {isLoading && (
                            <View className="py-20 items-center">
                                <ActivityIndicator size="small" color="#FF6B35" />
                                <Text className="text-zinc-600 mt-4 text-[10px] font-bold uppercase tracking-widest">Synchronizing Pulse...</Text>
                            </View>
                        )}

                        {/* Empty State */}
                        {!isLoading && filteredApplications.length === 0 && (
                            <View className="mx-6 py-16 items-center bg-zinc-900/20 rounded-3xl border border-dashed border-white/10">
                                <View className="w-16 h-16 rounded-full bg-zinc-800/50 items-center justify-center mb-4">
                                    <UserIcon size={24} color="#3F3F46" />
                                </View>
                                <Text className="text-white font-black text-lg">No matches found</Text>
                                <Text className="text-zinc-500 mt-1 text-xs text-center px-12">
                                    Try adjusting your pulse filters to see more talent.
                                </Text>
                            </View>
                        )}

                        {/* Applicant List */}
                        {!isLoading && filteredApplications.length > 0 && (
                            <View className="px-6">
                                {filteredApplications.map((app) => (
                                    <ApplicantCard
                                        key={app._id}
                                        application={app}
                                        gigId={gigId}
                                        isExpanded={expandedAppId === app._id}
                                        onToggleExpand={() => toggleExpand(app._id)}
                                        onUpdateStatus={onUpdateStatus}
                                        onRequestHire={handleRequestHire}
                                        isUpdating={false}
                                    />
                                ))}
                            </View>
                        )}
                    </ScrollView>
                </LinearGradient>
            </View>

            {/* Hire confirmation modal — sits on top of the bottom sheet so the
                organizer can review booking summary + pick payment method
                before the contract is created. PRD §8.3.2 Stage 2. */}
            <HireConfirmModal
                visible={!!hireTarget}
                gig={gig || { _id: gigId }}
                application={hireTarget}
                onClose={() => setHireTarget(null)}
            />
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
        backgroundColor: 'rgba(0,0,0,0.85)', // Darker backdrop for focus
    },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: '92%', // Slightly taller for more content
        borderTopLeftRadius: 40, // More rounded for premium feel
        borderTopRightRadius: 40,
        overflow: 'hidden',
    },
    gradientBg: {
        flex: 1,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderBottomWidth: 0,
    },
    scrollContent: {
        flex: 1,
    },
});

