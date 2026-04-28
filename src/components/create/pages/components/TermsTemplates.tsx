// netsa-mobile/src/components/create/pages/components/TermsTemplates.tsx
//
// Quick-start chip row for Page 4's Terms & Conditions textarea. Hirer taps
// a chip; we hand the parent the corresponding template body so the parent
// fills the textarea. The hirer can then edit freely.
//
// Templates are intentionally generic (length-based, not niche-specific):
//   Basic    — short, casual gigs
//   Standard — balanced, multi-paragraph terms
//   Detailed — corporate / vendor-facing, with GST + force majeure
//   Blank    — clear the textarea (start from scratch)

import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type TermsTemplateKey = 'basic' | 'standard' | 'detailed' | 'blank';

export const TERMS_TEMPLATES: Record<Exclude<TermsTemplateKey, 'blank'>, string> = {
    basic: `1. The agreed amount will be paid as per the booking schedule.
2. Either party may cancel up to 48 hours before the event date. Cancellations within 48 hours forfeit any advance paid.
3. The artist will arrive at least 30 minutes before the scheduled performance time.
4. Sound, lighting, and stage equipment are the hirer's responsibility unless agreed otherwise in writing.`,

    standard: `1. The artist will perform for the agreed duration. Extensions are subject to additional fees, agreed in advance.
2. Advance of 30% confirms the booking; balance is due on the event day.
3. Cancellation by hirer:
   • Within 48 hours of event — 100% advance forfeited
   • 2–7 days before event — 50% advance forfeited
   • More than 7 days before event — full refund
4. Cancellation by artist — full refund of any advance.
5. Travel and accommodation for out-of-city engagements are the hirer's responsibility.
6. The hirer will provide a clean green-room with water, basic refreshments, and a place to change.
7. Natural disasters, government restrictions, or similar events allow both parties to reschedule without penalty.`,

    detailed: `1. The agreed fee is exclusive of GST. Applicable taxes will be added to the invoice.
2. Payment will be made via bank transfer or UPI within the agreed timeline, against a valid invoice.
3. Cancellation:
   • More than 14 days before event — no forfeit
   • 7–14 days before — 50% advance forfeited
   • Less than 7 days — 100% advance forfeited
4. The hirer will provide professional sound, lighting, and stage as per the artist's technical rider.
5. Travel, lodging, and meals for out-of-city engagements are the hirer's responsibility.
6. Recording, photography, or commercial use of the performance requires separate written consent from the artist.
7. Force majeure (natural disasters, government action, civil unrest, pandemics) allows either party to reschedule or cancel without penalty; advances are returned within 14 days.
8. This agreement is governed by the laws of India and subject to the jurisdiction of local courts.`,
};

export interface TermsTemplatesProps {
    /** Current textarea value — used to warn before overwriting. */
    currentValue: string;
    /** Called with the chosen template body. Parent owns the textarea state. */
    onSelect: (templateBody: string) => void;
}

const CHIP_LABELS: Array<{ key: TermsTemplateKey; label: string; description: string }> = [
    { key: 'basic', label: 'Basic', description: 'Short and simple — for casual / low-stakes gigs.' },
    { key: 'standard', label: 'Standard', description: 'Balanced — covers most events end-to-end.' },
    { key: 'detailed', label: 'Detailed', description: 'Corporate / vendor-facing — includes GST + force majeure.' },
    { key: 'blank', label: 'Blank', description: 'Start from scratch.' },
];

export function TermsTemplates({ currentValue, onSelect }: TermsTemplatesProps) {
    const handlePress = (key: TermsTemplateKey) => {
        const body = key === 'blank' ? '' : TERMS_TEMPLATES[key];
        const hasContent = currentValue.trim().length > 0;
        if (hasContent) {
            try {
                Alert.alert(
                    'Replace existing terms?',
                    'This template will overwrite what you\'ve typed.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Replace', style: 'destructive', onPress: () => onSelect(body) },
                    ]
                );
            } catch {
                // Test environments where Alert is mocked — proceed without prompt.
                onSelect(body);
            }
            return;
        }
        onSelect(body);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.helperText}>
                Pick a starting template, then edit freely.
            </Text>
            <View style={styles.chipRow}>
                {CHIP_LABELS.map((chip) => (
                    <TouchableOpacity
                        key={chip.key}
                        onPress={() => handlePress(chip.key)}
                        accessibilityRole="button"
                        accessibilityLabel={`Use ${chip.label} terms template`}
                        style={styles.chip}
                    >
                        <Text style={styles.chipLabel}>{chip.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { gap: 8, marginBottom: 8 },
    helperText: {
        color: '#71717A',
        fontSize: 12,
        fontFamily: 'Outfit-Regular',
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(255,107,53,0.30)',
        backgroundColor: 'rgba(255,107,53,0.06)',
    },
    chipLabel: {
        color: '#FF6B35',
        fontSize: 12,
        fontFamily: 'Outfit-SemiBold',
        letterSpacing: 0.3,
    },
});

export default TermsTemplates;
