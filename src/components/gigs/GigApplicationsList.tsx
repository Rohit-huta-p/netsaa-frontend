import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useGigApplications, useUpdateApplicationStatus } from '../../hooks/useGigApplications';
import { Star, MoreHorizontal, ChevronDown, ChevronUp, Check, X, User } from 'lucide-react-native';

interface GigApplicationsListProps {
    gigId: string;
}

export const GigApplicationsList: React.FC<GigApplicationsListProps> = ({ gigId }) => {
    console.log('[GigApplicationsList] Rendering', { gigId });
    const { data: applications, isLoading, error } = useGigApplications(gigId);

    const updateMutation = useUpdateApplicationStatus();

    // State to track expanded application for cover note
    const [expandedAppId, setExpandedAppId] = useState<string | null>(null);


    if (isLoading) {
        return (
            <View className="py-10 justify-center items-center">
                <ActivityIndicator size="small" color="#A855F7" />
                <Text className="text-netsa-text-muted mt-2 font-inter text-xs">Loading applicants...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View className="py-10 justify-center items-center">
                <Text className="text-red-400 font-inter text-sm">Failed to load applications</Text>
            </View>
        );
    }

    if (!applications || applications.length === 0) {
        return (
            <View className="py-10 justify-center items-center bg-netsa-card rounded-2xl border border-white/10 mt-6">
                <User size={32} color="#4B5563" />
                <Text className="text-netsa-text-muted mt-3 font-inter">No applications yet</Text>
            </View>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'hired': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'shortlisted': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'rejected': return 'bg-red-500/20 text-red-500 border-red-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const handleUpdateStatus = (appId: string, status: string) => {
        updateMutation.mutate({ applicationId: appId, status });
    };

    const toggleExpand = (appId: string) => {
        setExpandedAppId(prev => prev === appId ? null : appId);
    };

    return (
        <View className="mt-6 space-y-4">
            {applications && applications.map((app: any) => {
                const isExpanded = expandedAppId === app._id;
                const statusStyle = getStatusColor(app.status);

                return (
                    <View key={app._id} className="bg-netsa-card rounded-2xl p-4 border border-white/10 shadow-sm">

                        {/* HEADER: Snapshot + Status */}
                        <View className="flex-row justify-between items-start">
                            <View className="flex-row items-center flex-1">
                                {/* Auto-generated Initials Avatar if no image */}
                                <View className="w-12 h-12 rounded-full overflow-hidden bg-white/5 border border-white/10 justify-center items-center mr-3">
                                    {app.artistSnapshot?.profileImageUrl ? (
                                        <Image
                                            source={{ uri: app.artistSnapshot.profileImageUrl }}
                                            className="w-full h-full"
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <Text className="text-white font-satoshi-bold text-lg">
                                            {app.artistSnapshot?.displayName?.charAt(0) || 'A'}
                                        </Text>
                                    )}
                                </View>

                                <View className="flex-1">
                                    <Text className="text-white font-satoshi-bold text-base">
                                        {app.artistSnapshot?.displayName || 'Unknown Artist'}
                                    </Text>
                                    <Text className="text-netsa-text-muted text-xs font-inter mb-1">
                                        {app.artistSnapshot?.artistType || 'Artist'}
                                        {app.artistSnapshot?.rating ? ` • ⭐ ${app.artistSnapshot.rating}` : ''}
                                    </Text>

                                    {/* STATUS BADGE */}
                                    <View className={`self-start px-2 py-0.5 rounded-md border ${statusStyle.split(' ')[0]} ${statusStyle.split(' ')[2]}`}>
                                        <Text className={`text-[10px] font-satoshi-bold uppercase ${statusStyle.split(' ')[1]}`}>
                                            {app.status}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <TouchableOpacity className="p-1">
                                <MoreHorizontal size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        {/* COVER NOTE TOGGLE */}
                        {app.coverNote && (
                            <TouchableOpacity onPress={() => toggleExpand(app._id)} className="mt-3 flex-row items-center">
                                <Text className="text-netsa-text-secondary text-xs font-inter mr-1">
                                    {isExpanded ? 'Hide Cover Note' : 'View Cover Note'}
                                </Text>
                                {isExpanded ? <ChevronUp size={12} color="#9CA3AF" /> : <ChevronDown size={12} color="#9CA3AF" />}
                            </TouchableOpacity>
                        )}

                        {isExpanded && app.coverNote && (
                            <View className="mt-2 bg-white/5 p-3 rounded-lg">
                                <Text className="text-netsa-text-secondary text-sm font-inter leading-relaxed">
                                    {app.coverNote}
                                </Text>
                            </View>
                        )}

                        {/* ACTIONS (Only for Active Applicants usually, but listing all for now) */}
                        <View className="flex-row gap-2 mt-4 pt-4 border-t border-white/10">
                            {app.status !== 'hired' && (
                                <TouchableOpacity
                                    onPress={() => handleUpdateStatus(app._id, 'hired')}
                                    className="flex-1 bg-green-500/10 border border-green-500/20 py-2 rounded-lg flex-row justify-center items-center"
                                >
                                    <Check size={14} color="#4ADE80" />
                                    <Text className="text-green-400 text-xs font-satoshi-bold ml-1">Hire</Text>
                                </TouchableOpacity>
                            )}

                            {app.status !== 'shortlisted' && app.status !== 'hired' && (
                                <TouchableOpacity
                                    onPress={() => handleUpdateStatus(app._id, 'shortlisted')}
                                    className="flex-1 bg-blue-500/10 border border-blue-500/20 py-2 rounded-lg justify-center items-center"
                                >
                                    <Text className="text-blue-400 text-xs font-satoshi-bold">Shortlist</Text>
                                </TouchableOpacity>
                            )}

                            {app.status !== 'rejected' && (
                                <TouchableOpacity
                                    onPress={() => handleUpdateStatus(app._id, 'rejected')}
                                    className="flex-1 bg-red-500/10 border border-red-500/20 py-2 rounded-lg flex-row justify-center items-center"
                                >
                                    <X size={14} color="#F87171" />
                                    <Text className="text-red-400 text-xs font-satoshi-bold ml-1">Reject</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                    </View>
                );
            })}
        </View>
    );
};
