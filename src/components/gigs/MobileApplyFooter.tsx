import React from 'react';
import { View, Text } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { ApplyButton } from './ApplyButton';

interface MobileApplyFooterProps {
    hasApplied: boolean;
    onApply: () => void;
    applicationDeadline?: string;
}

/**
 * Sticky mobile bottom bar with deadline badge and apply button.
 * Only rendered on mobile viewports for non-organizer users.
 */
export const MobileApplyFooter: React.FC<MobileApplyFooterProps> = ({
    hasApplied,
    onApply,
    applicationDeadline,
}) => {
    if (!applicationDeadline) return null;

    return (
        <View className="absolute bottom-12 left-0 right-0 p-6 bg-black/95 backdrop-blur-xl border-t border-white/10 md:hidden">
            {/* Deadline Badge */}
            <View className="w-fit self-center gap-3 px-3 py-1 bg-rose-500/10 rounded-2xl border border-rose-500/20 mb-4">
                <View className="flex-row justify-center items-center gap-2">
                    <AlertCircle size={10} color="#EF4444" />
                    <Text className="text-[7px] font-bold uppercase tracking-widest text-zinc-400">
                        DEADLINE:{' '}
                        <Text className="text-white">
                            {new Date(applicationDeadline).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                            })}
                        </Text>
                    </Text>
                </View>
            </View>

            {/* Apply Button */}
            <View>
                <ApplyButton hasApplied={hasApplied} onApply={onApply} variant="mobile" />
            </View>
        </View>
    );
};
