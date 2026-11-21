// src/features/hirer-hub/components/HubApplicantSearch.tsx
//
// Inline search well for the owner hub's applicant list (Applied / Shortlisted).
// A·Minimal field — magnifier · text · clear — matching the hub palette. Unlike
// the search-board SearchField it carries no back chevron: it lives INSIDE the
// pipeline, under the stage tabs, and searches the FULL stage list by name
// (reusing applicantFilters' `name` predicate), so it reaches applicants beyond
// the hub's 5-card preview rather than filtering only what's already shown.
//
// Controlled. The hub owns the query string and does the filtering; this is a
// dumb field. `onFocus` lets the hub scroll the field clear of the keyboard on
// native (the page is one continuous scroll).

import React, { useRef } from 'react';
import { View, TextInput, Pressable, Platform } from 'react-native';
import { Search, X } from 'lucide-react-native';

const COLORS = {
    text0: '#F3EFE8',
    text3: '#5C5A66',
    well: '#1C1C23',
    hair: 'rgba(243,239,232,0.07)',
    orange: '#FF6B35',
    clrBg: 'rgba(255,255,255,0.06)',
};

export function HubApplicantSearch({
    value,
    onChangeText,
    onClear,
    onFocus,
    placeholder = 'Search by name',
    marginHorizontal = 24,
    marginTop = 14,
    testID,
}: {
    value: string;
    onChangeText: (t: string) => void;
    onClear: () => void;
    onFocus?: () => void;
    placeholder?: string;
    marginHorizontal?: number;
    marginTop?: number;
    testID?: string;
}) {
    const ref = useRef<TextInput>(null);

    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                height: 44,
                marginHorizontal,
                marginTop,
                paddingHorizontal: 13,
                backgroundColor: COLORS.well,
                borderWidth: 1,
                borderColor: COLORS.hair,
                borderRadius: 12,
            }}>
            <Search size={17} color={COLORS.text3} strokeWidth={1.9} />
            <TextInput
                ref={ref}
                testID={testID}
                value={value}
                onChangeText={onChangeText}
                onFocus={onFocus}
                placeholder={placeholder}
                placeholderTextColor={COLORS.text3}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
                selectionColor={COLORS.orange}
                accessibilityLabel="Search applicants by name"
                style={[
                    { flex: 1, minWidth: 0, fontFamily: 'Outfit-Regular', fontSize: 14.5, color: COLORS.text0, padding: 0 },
                    // RN web: strip the focus outline so only the field border shows.
                    Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null,
                ]}
            />
            {value.length > 0 ? (
                <Pressable
                    onPress={onClear}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Clear search"
                    style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.clrBg, alignItems: 'center', justifyContent: 'center' }}>
                    <X size={12} color={COLORS.text3} strokeWidth={2.2} />
                </Pressable>
            ) : null}
        </View>
    );
}
