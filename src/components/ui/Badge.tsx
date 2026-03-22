import React from 'react';
import { View, Text } from 'react-native';

export interface BadgeProps {
    status: string;
    textClassName?: string;
    containerClassName?: string;
}

export const Badge: React.FC<BadgeProps> = ({
    status,
    textClassName = "text-[8px]",
    containerClassName = ""
}) => {
    const colors: Record<string, { bg: string; text: string }> = {
        Open: { bg: "rgba(16, 185, 129, 0.15)", text: "#10B981" },
        Published: { bg: "rgba(59, 130, 246, 0.15)", text: "#3B82F6" },
        Draft: { bg: "rgba(161, 161, 170, 0.15)", text: "#A1A1AA" },
        Closed: { bg: "rgba(239, 68, 68, 0.15)", text: "#EF4444" },
    };

    const style = colors[status] || colors.Draft;

    return (
        <View
            className={`px-3 py-1.5 rounded-full self-start ${containerClassName}`}
            style={{ backgroundColor: style.bg }}
        >
            <Text
                className={`${textClassName} font-bold uppercase tracking-wider`}
                style={{ color: style.text }}
            >
                {status}
            </Text>
        </View>
    );
};
