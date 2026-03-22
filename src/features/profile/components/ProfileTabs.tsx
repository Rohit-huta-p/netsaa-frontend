import React from 'react';
import { View } from 'react-native';

type Props = {
    children: React.ReactNode;
};

export const ProfileTabs: React.FC<Props> = ({ children }) => {
    // Future: Replace with a tabbed interface (About / Gigs / Events / Discussion)
    // For now, renders children directly for forward compatibility
    return <View className="flex-1 space-y-20">{children}</View>;
};
