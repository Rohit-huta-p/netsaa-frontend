/**
 * PaymentsStrip — hirer dashboard spend overview.
 *
 * PAYMENTS-DISABLED (Apr 29): off-platform Record/Confirm flow rolled
 * back from the UI until on-platform Razorpay ships. This card reverts
 * to its prior "coming soon" stub. The wired version (which read real
 * transactions via useUserTransactions) is preserved in git history —
 * see commit b22e7a4 for the populated implementation.
 *
 * Restore steps when reactivating: revert this file to the wired version
 * and ensure the offline.controller backend is still healthy.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SectionCard from '../SectionCard';

export default function PaymentsStrip() {
    return (
        <SectionCard title="Spend overview">
            <View style={styles.body} accessibilityLabel="Spend analytics coming soon">
                <Text style={styles.headline}>Spend analytics</Text>
                <Text style={styles.sub}>Totals + per-gig breakdown land with payment tooling</Text>
            </View>
        </SectionCard>
    );
}

const styles = StyleSheet.create({
    body: { paddingVertical: 16, alignItems: 'center' },
    headline: { fontFamily: 'Outfit-SemiBold', fontSize: 14, color: '#A1A1AA' },
    sub: { marginTop: 6, fontFamily: 'Outfit-Regular', fontSize: 13, color: '#71717A', textAlign: 'center' },
});
