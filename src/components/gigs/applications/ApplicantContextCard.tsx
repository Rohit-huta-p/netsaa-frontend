import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import {
    Briefcase,
    ChevronDown,
    ChevronUp,
    Check,
    X,
    Star,
    ExternalLink,
    ArrowLeft,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface ApplicantContextCardProps {
    gigId: string;
    gigTitle: string;
    application: {
        _id: string;
        status: string;
        coverNote?: string;
        portfolioLinks?: string[];
        appliedAt?: string;
    };
    onUpdateStatus: (applicationId: string, status: string) => void;
    isUpdating?: boolean;
    onDismiss?: () => void;
}

export const ApplicantContextCard: React.FC<ApplicantContextCardProps> = ({
    gigId,
    gigTitle,
    application,
    onUpdateStatus,
    isUpdating = false,
    onDismiss,
}) => {
    const router = useRouter();
    const [showCoverNote, setShowCoverNote] = useState(false);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'hired':
                return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', label: 'Hired' };
            case 'shortlisted':
                return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', label: 'Shortlisted' };
            case 'rejected':
                return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', label: 'Rejected' };
            default:
                return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', label: 'Pending' };
        }
    };

    const statusColors = getStatusColor(application.status);

    const handleGoToGig = () => {
        router.push(`/gigs/${gigId}`);
    };

    return (
        <View className="mx-6 mb-6 p-5 rounded-3xl bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20">
            {/* Header */}
            <View className="flex-row justify-between items-start mb-4">
                <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 rounded-xl bg-blue-500/10 items-center justify-center mr-3">
                        <Briefcase size={20} color="#3B82F6" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-1">
                            APPLICATION FOR
                        </Text>
                        <TouchableOpacity onPress={handleGoToGig}>
                            <Text className="text-white font-bold text-base" numberOfLines={1}>
                                {gigTitle}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Status Badge */}
                <View className={`px-3 py-1.5 rounded-lg border ${statusColors.bg} ${statusColors.border}`}>
                    <Text className={`text-[10px] font-black uppercase tracking-widest ${statusColors.text}`}>
                        {statusColors.label}
                    </Text>
                </View>
            </View>

            {/* Applied Date */}
            {application.appliedAt && (
                <Text className="text-zinc-500 text-xs mb-4">
                    Applied on {new Date(application.appliedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                    })}
                </Text>
            )}

            {/* Cover Note Toggle */}
            {application.coverNote && (
                <>
                    <TouchableOpacity
                        onPress={() => setShowCoverNote(!showCoverNote)}
                        className="flex-row items-center py-3 px-4 rounded-xl bg-white/5 border border-white/10 mb-4"
                    >
                        <Text className="text-zinc-300 text-xs font-medium flex-1">
                            {showCoverNote ? 'Hide Cover Note' : 'View Cover Note'}
                        </Text>
                        {showCoverNote ? (
                            <ChevronUp size={14} color="#71717A" />
                        ) : (
                            <ChevronDown size={14} color="#71717A" />
                        )}
                    </TouchableOpacity>

                    {showCoverNote && (
                        <View className="p-4 rounded-2xl bg-black/30 border border-white/5 mb-4">
                            <Text className="text-zinc-300 text-sm leading-relaxed">
                                {application.coverNote}
                            </Text>
                        </View>
                    )}
                </>
            )}

            {/* Portfolio Links */}
            {application.portfolioLinks && application.portfolioLinks.length > 0 && (
                <View className="mb-4">
                    <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">
                        PORTFOLIO
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                        {application.portfolioLinks.map((link, idx) => (
                            <TouchableOpacity
                                key={idx}
                                className="flex-row items-center gap-2 px-3 py-2 bg-blue-500/10 rounded-lg border border-blue-500/20"
                            >
                                <ExternalLink size={12} color="#3B82F6" />
                                <Text className="text-xs text-blue-400 font-medium">Link {idx + 1}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {/* Action Buttons */}
            {(application.status === 'pending' || application.status === 'shortlisted') && (
                <View className="flex-row gap-3 pt-2 border-t border-white/5">
                    {/* Hire button - always show for pending/shortlisted */}
                    <TouchableOpacity
                        onPress={() => onUpdateStatus(application._id, 'hired')}
                        disabled={isUpdating}
                        className="flex-1 bg-emerald-500/10 border border-emerald-500/20 py-3 rounded-xl flex-row justify-center items-center"
                    >
                        {isUpdating ? (
                            <ActivityIndicator size="small" color="#10B981" />
                        ) : (
                            <>
                                <Check size={16} color="#10B981" />
                                <Text className="text-emerald-400 text-xs font-black ml-2 uppercase tracking-widest">
                                    Hire
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Shortlist button - only for pending */}
                    {application.status === 'pending' && (
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

                    {/* Reject button - always show for pending/shortlisted */}
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
                </View>
            )}
            {(application.status === 'hired' || application.status === 'rejected') && (
                <View className="pt-2 border-t border-white/5">
                    <TouchableOpacity
                        onPress={handleGoToGig}
                        className="flex-row items-center justify-center py-3 bg-white/5 border border-white/10 rounded-xl"
                    >
                        <ArrowLeft size={16} color="#A1A1AA" />
                        <Text className="text-zinc-400 text-xs font-bold ml-2">Back to Gig</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Dismiss button for after action */}
            {onDismiss && (
                <TouchableOpacity
                    onPress={onDismiss}
                    className="mt-3 items-center"
                >
                    <Text className="text-zinc-600 text-xs">Dismiss</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};
