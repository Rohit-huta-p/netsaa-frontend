import React from 'react';
import { View, Text } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { SectionCard } from '@/components/common/SectionCard';

interface TermsTabProps {
    termsAndConditions: string;
}

/**
 * Terms & Conditions tab content.
 */
export const TermsTab: React.FC<TermsTabProps> = ({ termsAndConditions }) => (
    <View className="space-y-6">
        <SectionCard icon={ShieldCheck} iconColor="#A1A1AA" label="TERMS & CONDITIONS" labelColor="#A1A1AA">
            <Text className="text-zinc-300 text-sm leading-relaxed">
                {termsAndConditions}
            </Text>
        </SectionCard>
    </View>
);
