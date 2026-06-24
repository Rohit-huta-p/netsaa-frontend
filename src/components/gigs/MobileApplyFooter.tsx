import React from 'react';
import { View, Text } from 'react-native';
import { AlertCircle, Clock } from 'lucide-react-native';
import { ApplyButton } from './ApplyButton';

interface MobileApplyFooterProps {
    hasApplied: boolean;
    onApply: () => void;
    applicationDeadline?: string;
    isDeadlinePassed?: boolean;
}

export const MobileApplyFooter: React.FC<MobileApplyFooterProps> = ({
    hasApplied,
    onApply,
    applicationDeadline,
    isDeadlinePassed = false,
}) => {
    if (!applicationDeadline) return null;

    return (
        <View className="absolute bottom-12 left-0 right-0 p-6 bg-black/95 backdrop-blur-xl border-t border-white/10 md:hidden">
            {/* Deadline Badge */}
            <View className={`w-fit self-center gap-3 px-3 py-1 rounded-2xl border mb-4 ${
                isDeadlinePassed
                    ? 'bg-zinc-800/50 border-zinc-700'
                    : 'bg-rose-500/10 border-rose-500/20'
            }`}>
                <View className="flex-row justify-center items-center gap-2">
                    {isDeadlinePassed ? (
                        <Clock size={10} color="#6B7280" />
                    ) : (
                        <AlertCircle size={10} color="#EF4444" />
                    )}
                    <Text className="text-[7px] font-bold uppercase tracking-widest text-zinc-400">
                        {isDeadlinePassed ? 'DEADLINE PASSED: ' : 'DEADLINE: '}
                        <Text className={isDeadlinePassed ? 'text-zinc-500' : 'text-white'}>
                            {new Date(applicationDeadline).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                            })}
                        </Text>
                    </Text>
                </View>
            </View>

            {/* Apply Button — blocked if deadline passed */}
            <View>
                <ApplyButton
                    hasApplied={hasApplied || isDeadlinePassed}
                    onApply={onApply}
                    variant="mobile"
                    deadlinePassed={isDeadlinePassed}
                />
            </View>
        </View>
    );
};
