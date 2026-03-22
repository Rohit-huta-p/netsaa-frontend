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

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'hired':
                return { 
                    bg: 'bg-emerald-500/10', 
                    text: 'text-emerald-400', 
                    border: 'border-emerald-500/20',
                    dot: 'bg-emerald-400'
                };
            case 'shortlisted':
                return { 
                    bg: 'bg-blue-500/10', 
                    text: 'text-blue-400', 
                    border: 'border-blue-500/20',
                    dot: 'bg-blue-400'
                };
            case 'rejected':
                return { 
                    bg: 'bg-red-500/10', 
                    text: 'text-red-400', 
                    border: 'border-red-500/20',
                    dot: 'bg-red-400'
                };
            default:
                return { 
                    bg: 'bg-amber-500/10', 
                    text: 'text-amber-400', 
                    border: 'border-amber-500/20',
                    dot: 'bg-amber-400'
                };
        }
    };

    const statusStyle = getStatusStyles(application.status);

    const handleViewProfile = () => {
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
        <View className="p-5 rounded-[24px] bg-zinc-900/40 border border-white/5 mb-4 shadow-sm">
            {/* HEADER AREA */}
            <View className="flex-row justify-between items-start mb-5">
                <TouchableOpacity
                    onPress={handleViewProfile}
                    activeOpacity={0.7}
                    className="flex-row items-center flex-1"
                >
                    {/* Avatar with Ring */}
                    <View className="relative">
                        <View className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-800 border-[1.5px] border-white/10">
                            {application.artistSnapshot?.profileImageUrl ? (
                                <Image
                                    source={{ uri: application.artistSnapshot.profileImageUrl }}
                                    style={{ width: '100%', height: '100%' }}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View className="w-full h-full items-center justify-center bg-zinc-900">
                                    <Text className="text-zinc-500 font-black text-xl">
                                        {application.artistSnapshot?.displayName?.charAt(0) || 'A'}
                                    </Text>
                                </View>
                            )}
                        </View>
                        {/* Status Dot */}
                        <View className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0F0F10] ${statusStyle.dot}`} />
                    </View>

                    <View className="ml-4 flex-1">
                        <Text className="text-white font-black text-lg tracking-tight leading-6">
                            {application.artistSnapshot?.displayName || 'Anonymous'}
                        </Text>
                        <View className="flex-row items-center gap-2 mt-1">
                            <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                                {application.artistSnapshot?.artistType || 'Talent'}
                            </Text>
                            {application.artistSnapshot?.rating && (
                                <View className="flex-row items-center bg-zinc-800 px-1.5 py-0.5 rounded-md">
                                    <Star size={8} color="#EAB308" fill="#EAB308" />
                                    <Text className="text-yellow-500 text-[10px] font-black ml-1">
                                        {application.artistSnapshot.rating}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleViewProfile}
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 items-center justify-center"
                >
                    <Eye size={16} color="#FF6B35" />
                </TouchableOpacity>
            </View>

            {/* QUICK STATS & LINKS */}
            <View className="flex-row items-center justify-between mb-5 px-1">
                <View className="flex-row items-center gap-4">
                    <View>
                        <Text className="text-zinc-600 text-[8px] font-black uppercase tracking-widest mb-0.5">Applied</Text>
                        <Text className="text-zinc-300 text-xs font-bold">
                            {application.appliedAt ? new Date(application.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Today'}
                        </Text>
                    </View>
                    <View className="w-px h-6 bg-white/5" />
                    <View>
                        <Text className="text-zinc-600 text-[8px] font-black uppercase tracking-widest mb-0.5">Experience</Text>
                        <Text className="text-zinc-300 text-xs font-bold">
                            {application.artistSnapshot?.experience || 0} Years
                        </Text>
                    </View>
                </View>

                {/* Status Pill */}
                <View className={`px-2.5 py-1 rounded-full border ${statusStyle.bg} ${statusStyle.border}`}>
                    <Text className={`text-[9px] font-black uppercase tracking-widest ${statusStyle.text}`}>
                        {application.status}
                    </Text>
                </View>
            </View>

            {/* PORTFOLIO SNIPPET */}
            {application.portfolioLinks && application.portfolioLinks.length > 0 && (
                <View className="mb-5 bg-zinc-900/20 p-3 rounded-xl border border-white/5">
                    <Text className="text-zinc-500 text-[8px] font-black uppercase tracking-widest mb-2">Talent Showcase</Text>
                    <View className="flex-row flex-wrap gap-2">
                        {application.portfolioLinks.map((link: string, idx: number) => (
                            <TouchableOpacity
                                key={idx}
                                className="flex-row items-center gap-1.5 px-2 py-1 bg-[#FF6B35]/10 rounded-lg border border-[#FF6B35]/20"
                            >
                                <ExternalLink size={10} color="#FF6B35" />
                                <Text className="text-[10px] text-[#FF6B35] font-black">Link {idx + 1}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {/* COVER NOTE SECTION */}
            {application.coverNote && (
                <View className="mb-5">
                    <TouchableOpacity
                        onPress={onToggleExpand}
                        className="flex-row items-center justify-between py-2 border-b border-white/5"
                    >
                        <Text className="text-zinc-500 text-[8px] font-black uppercase tracking-widest">Personal Statement</Text>
                        {isExpanded ? <ChevronUp size={12} color="#52525B" /> : <ChevronDown size={12} color="#52525B" />}
                    </TouchableOpacity>

                    {isExpanded && (
                        <View className="mt-3">
                            <Text className="text-zinc-300 text-sm font-medium leading-relaxed italic">
                                "{application.coverNote}"
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {/* ACTION FOOTER */}
            <View className="flex-row gap-2 mt-2">
                {application.status !== 'hired' && (
                    <TouchableOpacity
                        onPress={() => onUpdateStatus(application._id, 'hired')}
                        disabled={isUpdating}
                        className="flex-[2] bg-emerald-500 rounded-2xl py-3.5 flex-row justify-center items-center shadow-lg shadow-emerald-500/20"
                    >
                        <Check size={16} color="#000" strokeWidth={3} />
                        <Text className="text-black text-xs font-black ml-2 uppercase tracking-widest">Hire Talent</Text>
                    </TouchableOpacity>
                )}

                {application.status !== 'shortlisted' && application.status !== 'hired' && (
                    <TouchableOpacity
                        onPress={() => onUpdateStatus(application._id, 'shortlisted')}
                        disabled={isUpdating}
                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-3.5 justify-center items-center"
                    >
                        <Text className="text-white text-xs font-black uppercase tracking-widest">Shortlist</Text>
                    </TouchableOpacity>
                )}

                {application.status !== 'rejected' && (
                    <TouchableOpacity
                        onPress={() => onUpdateStatus(application._id, 'rejected')}
                        disabled={isUpdating}
                        className={`w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-2xl items-center justify-center ${application.status === 'hired' ? 'flex-1 flex-row' : ''}`}
                    >
                        <X size={18} color="#EF4444" />
                        {application.status === 'hired' && (
                             <Text className="text-red-400 text-xs font-black ml-2 uppercase tracking-widest">Revoke</Text>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};
