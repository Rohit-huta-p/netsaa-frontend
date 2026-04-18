import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { CheckCircle2, ArrowRight, Clock } from 'lucide-react-native';

interface ApplyButtonProps {
    hasApplied: boolean;
    onApply: () => void;
    variant?: 'mobile' | 'desktop';
    deadlinePassed?: boolean;
}

export const ApplyButton: React.FC<ApplyButtonProps> = ({
    hasApplied,
    onApply,
    variant = 'desktop',
    deadlinePassed = false,
}) => {
    const isMobile = variant === 'mobile';
    const isDisabled = hasApplied || deadlinePassed;

    return (
        <TouchableOpacity
            onPress={() => !isDisabled && onApply()}
            disabled={isDisabled}
            className={`${isMobile ? 'w-[80%] self-center py-4' : 'w-full py-3'} rounded-2xl items-center justify-center flex-row ${
                deadlinePassed
                    ? 'bg-zinc-900 border border-zinc-700'
                    : hasApplied
                        ? 'bg-zinc-800 border border-white/10'
                        : 'bg-white active:scale-95'
            }`}
        >
            {deadlinePassed ? (
                <>
                    <Clock size={18} color="#6B7280" style={{ marginRight: 8 }} />
                    <Text
                        className={`text-zinc-500 ${isMobile ? 'text-md' : 'text-lg'} font-black ${
                            isMobile ? 'uppercase tracking-widest' : ''
                        }`}
                    >
                        Closed
                    </Text>
                </>
            ) : hasApplied ? (
                <>
                    <CheckCircle2 size={20} color="#10B981" style={{ marginRight: 8 }} />
                    <Text
                        className={`text-zinc-400 ${isMobile ? 'text-md' : 'text-lg'} font-black ${
                            isMobile ? 'uppercase tracking-widest' : ''
                        }`}
                    >
                        Applied
                    </Text>
                </>
            ) : (
                <>
                    <Text
                        className={`text-black ${isMobile ? 'text-md' : 'text-lg'} font-black ${
                            isMobile ? 'uppercase tracking-widest' : ''
                        }`}
                    >
                        Apply Now
                    </Text>
                    {!isMobile && (
                        <ArrowRight size={20} color="#000000" style={{ marginLeft: 8 }} />
                    )}
                </>
            )}
        </TouchableOpacity>
    );
};
