import React from 'react';
import { View, Text } from 'react-native';
import { AlertCircle, Camera, Film, Music } from 'lucide-react-native';
import { SectionCard } from '@/components/common/SectionCard';

interface ApplyTabProps {
    gig: any;
}

/** Helper to extract media requirement items */
function getMediaRequirements(gig: any) {
    const reqs: { icon: typeof Camera; label: string }[] = [];
    if (gig.mediaRequirements?.headshots) reqs.push({ icon: Camera, label: 'Headshots' });
    if (gig.mediaRequirements?.fullBody) reqs.push({ icon: Camera, label: 'Full Body Shots' });
    if (gig.mediaRequirements?.videoReel) reqs.push({ icon: Film, label: 'Video Reel' });
    if (gig.mediaRequirements?.audioSample) reqs.push({ icon: Music, label: 'Audio Sample' });
    return reqs;
}

/**
 * How to Apply tab — deadline, media requirements, and application limit.
 */
export const ApplyTab: React.FC<ApplyTabProps> = ({ gig }) => {
    const mediaReqs = getMediaRequirements(gig);
    const capacity = parseInt(gig.maxApplications || gig.capacity || '1');
    const registered = gig.stats?.hired || 0;

    return (
        <View className="space-y-6">
            {/* Application Deadline */}
            <View className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                <View className="flex-row items-center gap-3">
                    <AlertCircle size={20} color="#EF4444" />
                    <View className="flex-1">
                        <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 mb-1">
                            APPLICATION DEADLINE
                        </Text>
                        <Text className="text-white text-lg font-black">
                            {gig.applicationDeadline
                                ? new Date(gig.applicationDeadline).toLocaleDateString('en-IN', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric',
                                  })
                                : 'Until filled'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Media Requirements */}
            {mediaReqs.length > 0 && (
                <SectionCard icon={Camera} iconColor="#F472B6" label="REQUIRED MATERIALS" labelColor="#F472B6">
                    <Text className="text-zinc-400 text-sm mb-4">
                        Please submit the following with your application:
                    </Text>
                    <View className="space-y-3">
                        {mediaReqs.map((req, idx) => (
                            <View
                                key={idx}
                                className="flex-row items-center gap-3 p-4 rounded-xl bg-zinc-800/30 border border-white/5"
                            >
                                <View className="w-10 h-10 rounded-xl bg-pink-500/10 items-center justify-center">
                                    <req.icon size={18} color="#F472B6" />
                                </View>
                                <Text className="text-zinc-200 font-medium">{req.label}</Text>
                            </View>
                        ))}
                    </View>
                    {gig.mediaRequirements?.notes && (
                        <View className="mt-4 p-4 bg-zinc-800/50 rounded-xl">
                            <Text className="text-zinc-400 text-sm italic">
                                Note: {gig.mediaRequirements.notes}
                            </Text>
                        </View>
                    )}
                </SectionCard>
            )}

            {/* Application Limit */}
            {gig.maxApplications && (
                <View className="p-6 rounded-2xl bg-zinc-900/30 border border-white/5">
                    <View className="flex-row justify-between items-center">
                        <Text className="text-sm text-zinc-400">Applications Accepted</Text>
                        <Text className="text-base font-black text-white">
                            {registered} / {capacity}
                        </Text>
                    </View>
                    <View className="h-2 bg-zinc-800 rounded-full overflow-hidden mt-4">
                        <View
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                            style={{ width: `${(registered / capacity) * 100}%` }}
                        />
                    </View>
                </View>
            )}
        </View>
    );
};
