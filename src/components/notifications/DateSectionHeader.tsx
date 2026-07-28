// src/components/notifications/DateSectionHeader.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DateGroup } from '@/utils/dateGrouping';
import { N, FONT } from '@/constants/notificationsTheme';

interface DateSectionHeaderProps {
    date: DateGroup;
}

/** Mono uppercase overline — the group separator in the editorial inbox
 *  ("section labels ARE the separators"; no divider bar). */
export const DateSectionHeader: React.FC<DateSectionHeaderProps> = ({ date }) => {
    return (
        <View style={s.wrap}>
            <Text style={s.label}>{date.toUpperCase()}</Text>
        </View>
    );
};

const s = StyleSheet.create({
    wrap: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 4 },
    label: { fontFamily: FONT.monoBold, fontSize: 9.5, letterSpacing: 1.9, color: N.text3 },
});
