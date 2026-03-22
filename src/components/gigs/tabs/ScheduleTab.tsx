import React from 'react';
import { View, Text } from 'react-native';
import { DollarSign, Clock, Briefcase } from 'lucide-react-native';
import { MapLinkCard } from '@/components/location/MapLinkCard';
import { SectionCard } from '@/components/common/SectionCard';
import { DetailRow } from '@/components/common/DetailRow';

interface ScheduleTabProps {
    gig: any;
}

/**
 * Schedule & Pay tab — compensation, schedule & timing, location, and practice days.
 */
export const ScheduleTab: React.FC<ScheduleTabProps> = ({ gig }) => {
    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });

    const formattedAmount = gig.compensation?.amount
        ? `₹${gig.compensation.amount.toLocaleString()}`
        : gig.compensation?.minAmount
        ? `₹${gig.compensation.minAmount.toLocaleString()}${
              gig.compensation.maxAmount && gig.compensation.maxAmount !== gig.compensation.minAmount 
              ? ` - ₹${gig.compensation.maxAmount.toLocaleString()}` 
              : gig.compensation.maxAmount ? '' : '+'
          }`
        : gig.compensation?.model === 'unpaid' ? 'Unpaid' : 'To Be Discussed';

    return (
        <View className="space-y-6">
            {/* Compensation */}
            <SectionCard icon={DollarSign} iconColor="#10B981" label="COMPENSATION" labelColor="#10B981">
                <View className="space-y-4">
                    <DetailRow label="Payment Model" value={gig.compensation?.model || 'Fixed'} />
                    <DetailRow label="Amount" value={formattedAmount} valueClassName="text-2xl font-black text-white" />

                    {gig.compensation?.negotiable && (
                        <View className="bg-blue-500/10 px-4 py-3 rounded-xl border border-blue-500/20">
                            <Text className="text-blue-400 text-sm font-medium">
                                💬 Open to negotiation
                            </Text>
                        </View>
                    )}
                </View>
            </SectionCard>

            {/* Schedule */}
            <SectionCard icon={Clock} iconColor="#F59E0B" label="SCHEDULE & TIMING" labelColor="#F59E0B">
                <View className="space-y-4">
                    <DetailRow
                        label="Start Date"
                        value={gig.schedule?.startDate ? formatDate(gig.schedule.startDate) : 'TBD'}
                    />
                    {gig.schedule?.endDate && gig.schedule.endDate !== gig.schedule.startDate && (
                        <DetailRow label="End Date" value={formatDate(gig.schedule.endDate)} />
                    )}
                    {gig.schedule?.timeCommitment && (
                        <View className="py-3">
                            <Text className="text-sm text-zinc-400 mb-2">Time Commitment</Text>
                            <Text className="text-zinc-300 text-sm">{gig.schedule.timeCommitment}</Text>
                        </View>
                    )}
                </View>
            </SectionCard>

            {/* Location */}
            <SectionCard icon={Clock} iconColor="#F59E0B" label="Location" labelColor="#F59E0B">
                <View className="space-y-4">
                    <DetailRow label="City" value={gig.location?.city || 'TBD'} />
                    <DetailRow label="Venue Name" value={gig.location?.venueName || 'TBD'} />
                    <View className="mb-10 w-full">
                        <MapLinkCard
                            venueName={gig.location?.venueName}
                            address={gig.location?.address || ''}
                            city={gig.location?.city || ''}
                            state={gig.location?.state || ''}
                            country={gig.location?.country || ''}
                        />
                    </View>
                </View>
            </SectionCard>

            {/* Practice / Rehearsal Days */}
            {gig.schedule?.practiceDays && gig.schedule.practiceDays.count > 0 && (
                <SectionCard
                    icon={Briefcase}
                    iconColor="#F59E0B"
                    label="REHEARSALS / PRACTICE DAYS"
                    labelColor="#F59E0B"
                    cardClassName="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20"
                >
                    <View className="space-y-3">
                        <View className="flex-row justify-between items-center">
                            <Text className="text-sm text-zinc-400">Number of Days</Text>
                            <Text className="text-base font-black text-white">
                                {gig.schedule.practiceDays.count} days
                            </Text>
                        </View>
                        {gig.schedule.practiceDays.isPaid && (
                            <View className="bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20">
                                <Text className="text-emerald-400 text-sm font-medium">
                                    ✓ Paid rehearsals
                                </Text>
                            </View>
                        )}
                        {gig.schedule.practiceDays.notes && (
                            <View className="pt-2">
                                <Text className="text-zinc-300 text-sm italic">
                                    "{gig.schedule.practiceDays.notes}"
                                </Text>
                            </View>
                        )}
                    </View>
                </SectionCard>
            )}
        </View>
    );
};
