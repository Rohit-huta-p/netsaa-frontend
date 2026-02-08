import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import {
    Star,
    ChevronDown,
    ChevronUp,
    Check,
    X,
    ExternalLink,
    User as UserIcon,
    Eye,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

export interface ApplicantCardProps {
    application: {
        _id: string;
        artistId: string;
        status: string;
        coverNote?: string;
        portfolioLinks?: string[];
        appliedAt?: string;
        artistSnapshot?: {
            displayName?: string;
            profileImageUrl?: string;
            artistType?: string;
            rating?: number;
            experience?: number;
        };
    };
    gigId: string;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onUpdateStatus: (applicationId: string, status: string) => void;
    isUpdating?: boolean;
}

export const ApplicantCard: React.FC<ApplicantCardProps> = ({
    application,
    gigId,
    isExpanded,
    onToggleExpand,
    onUpdateStatus,
    isUpdating = false,
}) => {
    const router = useRouter();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'hired':
                return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' };
            case 'shortlisted':
                return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' };
            case 'rejected':
                return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' };
            default:
                return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' };
        }
    };

    const statusColors = getStatusColor(application.status);

    const handleViewProfile = () => {
        // Navigate to profile with gig context
        router.push({
            pathname: `/profile/${application.artistId}`,
            params: {
                gigId: gigId,
                applicationId: application._id,
                fromGig: 'true',
            },
        });
    };

    return (
        <View className="p-6 rounded-3xl bg-zinc-900/30 border border-white/5 mb-4">
            {/* HEADER */}
            <View className="flex-row justify-between items-start mb-4">
                <TouchableOpacity
                    onPress={handleViewProfile}
                    activeOpacity={0.7}
                    className="flex-row items-center flex-1"
                >
                    {/* Avatar */}
                    <View className="w-14 h-14 rounded-2xl overflow-hidden bg-zinc-800 border-2 border-white/10 mr-4">
                        {application.artistSnapshot?.profileImageUrl ? (
                            <Image
                                source={{ uri: application.artistSnapshot.profileImageUrl }}
                                style={{ width: '100%', height: '100%' }}
                                resizeMode="cover"
                            />
                        ) : (
                            <View className="w-full h-full items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
                                <Text className="text-white font-black text-xl">
                                    {application.artistSnapshot?.displayName?.charAt(0) || 'A'}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View className="flex-1">
                        <Text className="text-white font-black text-lg tracking-tight mb-1">
                            {application.artistSnapshot?.displayName || 'Unknown Artist'}
                        </Text>
                        <Text className="text-zinc-400 text-xs mb-2">
                            {application.artistSnapshot?.artistType || 'Artist'}
                            {application.artistSnapshot?.rating && (
                                <Text className="text-yellow-500">
                                    {' '}• ⭐ {application.artistSnapshot.rating}
                                </Text>
                            )}
                        </Text>

                        {/* STATUS BADGE */}
                        <View
                            className={`self-start px-3 py-1 rounded-lg border ${statusColors.bg} ${statusColors.border}`}
                        >
                            <Text
                                className={`text-[10px] font-black uppercase tracking-widest ${statusColors.text}`}
                            >
                                {application.status}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* View Profile Button */}
                <TouchableOpacity
                    onPress={handleViewProfile}
                    className="p-3 rounded-xl bg-white/5 border border-white/10"
                >
                    <Eye size={18} color="#A1A1AA" />
                </TouchableOpacity>
            </View>

            {/* META INFO */}
            <View className="flex-row flex-wrap gap-4 mb-4 pb-4 border-b border-white/5">
                {application.appliedAt && (
                    <Text className="text-xs text-zinc-500">
                        Applied {new Date(application.appliedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                        })}
                    </Text>
                )}
                {application.artistSnapshot?.experience && (
                    <View className="flex-row items-center gap-1">
                        <Star size={12} color="#71717A" />
                        <Text className="text-xs text-zinc-500">
                            {application.artistSnapshot.experience} years exp
                        </Text>
                    </View>
                )}
            </View>

            {/* PORTFOLIO LINKS */}
            {application.portfolioLinks && application.portfolioLinks.length > 0 && (
                <View className="mb-4">
                    <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3">
                        PORTFOLIO
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                        {application.portfolioLinks.map((link: string, idx: number) => (
                            <TouchableOpacity
                                key={idx}
                                className="flex-row items-center gap-2 px-3 py-2 bg-blue-500/10 rounded-lg border border-blue-500/20"
                            >
                                <ExternalLink size={12} color="#3B82F6" />
                                <Text className="text-xs text-blue-400 font-medium">
                                    Link {idx + 1}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {/* COVER NOTE TOGGLE */}
            {application.coverNote && (
                <>
                    <TouchableOpacity
                        onPress={onToggleExpand}
                        className="flex-row items-center py-3 px-4 rounded-xl bg-zinc-800/50 mb-4"
                    >
                        <Text className="text-zinc-300 text-xs font-medium flex-1">
                            {isExpanded ? 'Hide Cover Note' : 'View Cover Note'}
                        </Text>
                        {isExpanded ? (
                            <ChevronUp size={14} color="#71717A" />
                        ) : (
                            <ChevronDown size={14} color="#71717A" />
                        )}
                    </TouchableOpacity>

                    {isExpanded && (
                        <View className="p-5 rounded-2xl bg-zinc-800/30 border border-white/5 mb-4">
                            <Text className="text-zinc-300 text-sm font-light leading-relaxed">
                                {application.coverNote}
                            </Text>
                        </View>
                    )}
                </>
            )}

            {/* ACTIONS */}
            <View className="flex-row gap-3">
                {application.status !== 'hired' && (
                    <TouchableOpacity
                        onPress={() => onUpdateStatus(application._id, 'hired')}
                        disabled={isUpdating}
                        className="flex-1 bg-emerald-500/10 border border-emerald-500/20 py-3 rounded-xl flex-row justify-center items-center"
                    >
                        <Check size={16} color="#10B981" />
                        <Text className="text-emerald-400 text-xs font-black ml-2 uppercase tracking-widest">
                            Hire
                        </Text>
                    </TouchableOpacity>
                )}

                {application.status !== 'shortlisted' && application.status !== 'hired' && (
                    <TouchableOpacity
                        onPress={() => onUpdateStatus(application._id, 'shortlisted')}
                        disabled={isUpdating}
                        className="flex-1 bg-blue-500/10 border border-blue-500/20 py-3 rounded-xl justify-center items-center"
                    >
                        <Text className="text-blue-400 text-xs font-black uppercase tracking-widest">
                            Shortlist
                        </Text>
                    </TouchableOpacity>
                )}

                {application.status !== 'rejected' && (
                    <TouchableOpacity
                        onPress={() => onUpdateStatus(application._id, 'rejected')}
                        disabled={isUpdating}
                        className="flex-1 bg-red-500/10 border border-red-500/20 py-3 rounded-xl flex-row justify-center items-center"
                    >
                        <X size={16} color="#EF4444" />
                        <Text className="text-red-400 text-xs font-black ml-2 uppercase tracking-widest">
                            Reject
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};
