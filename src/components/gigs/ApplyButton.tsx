import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { CheckCircle2, ArrowRight } from 'lucide-react-native';

interface ApplyButtonProps {
    hasApplied: boolean;
    onApply: () => void;
    /** 'mobile' for full-width sticky footer style, 'desktop' for sidebar style */
    variant?: 'mobile' | 'desktop';
}

/**
 * Shared Apply / Applied button used in both desktop sidebar and mobile footer.
 */
export const ApplyButton: React.FC<ApplyButtonProps> = ({
    hasApplied,
    onApply,
    variant = 'desktop',
}) => {
    const isMobile = variant === 'mobile';

    return (
        <TouchableOpacity
            onPress={() => !hasApplied && onApply()}
            disabled={hasApplied}
            className={`${isMobile ? 'w-[80%] self-center py-4' : 'w-full py-3'} rounded-2xl items-center justify-center flex-row ${
                hasApplied
                    ? 'bg-zinc-800 border border-white/10'
                    : 'bg-white active:scale-95'
            }`}
        >
            {hasApplied ? (
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
