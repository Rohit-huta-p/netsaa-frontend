// src/components/notifications/NotificationFilterTabs.tsx
import React from 'react';
import { ScrollView, Pressable, View, Text, StyleSheet } from 'react-native';
import { N, FONT, CATEGORY_TABS, type NotifCategory } from '@/constants/notificationsTheme';

interface Props {
    active: NotifCategory;
    counts: Record<NotifCategory, number>;
    onChange: (cat: NotifCategory) => void;
}

/** Underline + badge category filter row (mockup `.filterbar/.utab/.ct`).
 *  Active = warm-cream label + 2px orange underline sitting on the bottom
 *  hairline; count chip = Space Mono, orange-soft when active. */
export const NotificationFilterTabs: React.FC<Props> = ({ active, counts, onChange }) => {
    return (
        <View style={s.bar}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.row}
            >
                {CATEGORY_TABS.map(({ key, label }) => {
                    const on = key === active;
                    return (
                        <Pressable
                            key={key}
                            onPress={() => onChange(key)}
                            accessibilityRole="tab"
                            accessibilityState={{ selected: on }}
                            accessibilityLabel={`${label}, ${counts[key]} notifications`}
                            style={[s.tab, on && s.tabOn]}
                        >
                            <Text style={[s.label, on && s.labelOn]}>{label}</Text>
                            <View style={[s.chip, on && s.chipOn]}>
                                <Text style={[s.chipText, on && s.chipTextOn]}>{counts[key]}</Text>
                            </View>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const s = StyleSheet.create({
    bar: { borderBottomWidth: 1, borderBottomColor: N.hairline },
    row: { flexDirection: 'row', gap: 20, paddingHorizontal: 20, paddingTop: 11 },
    tab: {
        flexDirection: 'row', alignItems: 'center', gap: 7,
        paddingTop: 4, paddingBottom: 11, marginBottom: -1,
        borderBottomWidth: 2, borderBottomColor: 'transparent',
    },
    tabOn: { borderBottomColor: N.orange },
    label: { fontFamily: FONT.semi, fontSize: 13, color: N.text2 },
    labelOn: { color: N.text0 },
    chip: {
        minWidth: 17, height: 16, paddingHorizontal: 5, borderRadius: 8,
        alignItems: 'center', justifyContent: 'center', backgroundColor: N.hairline2,
    },
    chipOn: { backgroundColor: N.orangeSoft },
    chipText: { fontFamily: FONT.monoBold, fontSize: 9.5, color: N.text1 },
    chipTextOn: { color: N.orange },
});

export default NotificationFilterTabs;
