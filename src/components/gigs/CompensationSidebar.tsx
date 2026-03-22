import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { Zap, Lock, AlertCircle } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { ApplyButton } from './ApplyButton';
import useAuthStore from '@/stores/authStore';

interface CompensationSidebarProps {
    gig: any;
    hasApplied: boolean;
    onApply: () => void;
}

/**
 * Desktop-only compensation card with progress bar, apply button, deadline, and trust footer.
 * Hidden on mobile (md:flex).
 */
export const CompensationSidebar: React.FC<CompensationSidebarProps> = ({
    gig,
    hasApplied,
    onApply,
}) => {
    const { width } = useWindowDimensions();
    const isMobileWidth = width < 768;
    const user = useAuthStore((state) => state.user);
    const isOrganizer = user?._id === gig.organizerId._id;

    const capacity = parseInt(gig.maxApplications || gig.capacity || '1');
    const registered = gig.stats?.hired || 0;

    if (isOrganizer) return null;

    return (
        <View className="hidden bg-zinc-800/10 md:flex w-full md:w-80 lg:w-96 mx-auto lg:mx-0 pt-5">
            <BlurView
                intensity={20}
                tint="dark"
                className="rounded-[2.5rem] overflow-hidden mb-6 border border-white/10"
            >
                <View className="p-8 bg-zinc-800/10">
                    {/* Total Compensation Header */}
                    <View className="items-center mb-4">
                        <View className="flex-row items-center gap-2 mb-2">
                            <Zap size={14} color="#3B82F6" />
                            <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
                                TOTAL COMPENSATION
                            </Text>
                        </View>
                        <View className="items-center">
                            <View className="flex-row items-baseline">
                                {gig.compensation?.amount ? (
                                    <>
                                        <Text className="text-2xl font-black text-zinc-400 mr-1">₹</Text>
                                        <Text className="text-3xl font-black text-white bg-transparent px-2 py-1">
                                            {gig.compensation.amount.toLocaleString()}
                                        </Text>
                                    </>
                                ) : gig.compensation?.minAmount ? (
                                    <>
                                        <Text className="text-xl font-black text-zinc-400 mr-1">
                                            {gig.compensation.maxAmount && gig.compensation.maxAmount !== gig.compensation.minAmount ? '₹' : gig.compensation.maxAmount === gig.compensation.minAmount ? '₹' : 'Starts at ₹'}
                                        </Text>
                                        <Text className="text-2xl font-black text-white bg-transparent px-2 py-1">
                                            {gig.compensation.minAmount.toLocaleString()}
                                            {gig.compensation.maxAmount && gig.compensation.maxAmount !== gig.compensation.minAmount &&
                                                ` - ${gig.compensation.maxAmount.toLocaleString()}`}
                                        </Text>
                                    </>
                                ) : (
                                    <Text className="text-2xl font-black text-white bg-transparent px-2 py-1">
                                        To Be Discussed
                                    </Text>
                                )}
                            </View>
                            {gig.compensation?.perks && (
                                <Text className="text-zinc-400 text-xs mt-2 font-medium">
                                    {gig.compensation.perks.length === 0
                                        ? ''
                                        : `+ ${gig.compensation.perks.length} benefits`}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Progress */}
                    <View className="mb-8">
                        <View className="flex-row justify-between items-center mb-3">
                            <Text className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500">
                                ACCEPTED / SPOTS
                            </Text>
                            <Text className="text-[8px] font-black text-white">
                                {registered} / {capacity}
                            </Text>
                        </View>
                        <View className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <View
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                style={{ width: `${(registered / capacity) * 100}%` }}
                            />
                        </View>
                    </View>

                    {/* Apply Button (desktop only) */}
                    {!isMobileWidth && (
                        <View className="mb-6">
                            <ApplyButton hasApplied={hasApplied} onApply={onApply} variant="desktop" />
                        </View>
                    )}

                    {/* Deadline Alert */}
                    {gig.applicationDeadline && !isMobileWidth && (
                        <View className="w-fit self-center gap-3 px-3 py-1 bg-rose-500/10 rounded-2xl border border-rose-500/20 mb-4">
                            <View className="flex-row justify-center items-center gap-2">
                                <AlertCircle size={10} color="#EF4444" />
                                <Text className="text-[7px] font-bold uppercase tracking-widest text-zinc-400">
                                    DEADLINE:{' '}
                                    <Text className="text-white">
                                        {new Date(gig.applicationDeadline).toLocaleDateString('en-IN', {
                                            day: 'numeric',
                                            month: 'short',
                                        })}
                                    </Text>
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Trust Footer */}
                    <View className="space-y-3">
                        <View className="flex-row items-center gap-2 justify-center">
                            <Lock size={12} color="#71717A" />
                            <Text className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                                ENCRYPTED APPLICATION FLOW
                            </Text>
                        </View>
                        <Text className="text-center text-[9px] text-zinc-600 leading-relaxed">
                            BY APPLYING, YOU AGREE TO THE{'\n'}
                            <Text className="text-blue-400 underline">NETSA PERFORMANCE CHARTER</Text>
                        </Text>
                    </View>
                </View>
            </BlurView>
        </View>
    );
};
