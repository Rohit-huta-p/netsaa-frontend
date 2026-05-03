import React from 'react';
import { View, Text } from 'react-native';
import { SectionHeading } from './SectionHeading';

interface AboutSectionProps {
    description?: string;
}

/**
 * Plan 5 v2 — inline "About the gig" section. Replaces the previous
 * About TAB (now removed from the tab nav). Renders gig.description
 * verbatim with mockup-matching prose styling. Auto-hides when empty.
 */
export const AboutSection: React.FC<AboutSectionProps> = ({ description }) => {
    if (!description || !description.trim()) return null;

    return (
        <View className="mb-7" testID="about-section">
            <SectionHeading>About the gig</SectionHeading>
            <Text className="text-[14.5px] leading-[24px] text-zinc-300 font-light">
                {description}
            </Text>
        </View>
    );
};
