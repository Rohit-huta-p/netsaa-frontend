import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { CreditCard, Landmark, ShieldCheck, Clock } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import AppScrollView from '@/components/AppScrollView';
import PayoutStatusCard from '@/components/payouts/PayoutStatusCard';
import PayoutSetupWizard from '@/components/payouts/PayoutSetupWizard';
import type { PayoutStatus } from '@/services/payoutService';

const SURFACE = 'rgba(255,255,255,0.04)';
const HAIRLINE = 'rgba(255,255,255,0.1)';
const TEXT_0 = '#F3EFE8';
const TEXT_1 = '#A1A1AA';
const TEXT_3 = '#52525b';
const ORANGE = '#FF6B35';

const NEED = [
  { Icon: CreditCard, color: '#5B8DEF', soft: 'rgba(91,141,239,0.14)', title: 'PAN card', sub: 'name must match your profile' },
  { Icon: Landmark, color: '#22C55E', soft: 'rgba(34,197,94,0.14)', title: 'Bank account + IFSC', sub: 'we verify with a penny drop · live' },
  { Icon: ShieldCheck, color: '#8B5CF6', soft: 'rgba(139,92,246,0.14)', title: 'GST number · optional', sub: "skip if you don't have one" },
  { Icon: Clock, color: '#EAB308', soft: 'rgba(234,179,8,0.14)', title: '~3 minutes', sub: '95% of accounts verify instantly' },
];

export default function PayoutsSettings() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleDone = (_status: PayoutStatus) => {
    setWizardOpen(false);
    queryClient.invalidateQueries({ queryKey: ['payoutAccount', 'me'] });
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Payouts' }} />

      <View style={{ flex: 1, backgroundColor: '#09090b' }}>
        <AppScrollView contentContainerStyle={{ padding: 20, paddingBottom: 64 }}>
          {/* Header */}
          <Text style={styles.eyebrow}>Settings · payouts</Text>
          <Text style={styles.title}>Where should we send your earnings?</Text>
          <Text style={styles.sub}>Link a bank once — it powers every paid event you host.</Text>

          {/* Status card (not_started → hero, else status) */}
          <View style={{ marginTop: 18 }}>
            <PayoutStatusCard onSetup={() => setWizardOpen(true)} />
          </View>

          {/* What you'll need */}
          <Text style={styles.section}>What you'll need</Text>
          <View style={styles.needList}>
            {NEED.map((n, i) => (
              <View key={n.title} style={[styles.row, i === 0 && { borderTopWidth: 0 }]}>
                <View style={[styles.av, { backgroundColor: n.soft }]}>
                  <n.Icon size={17} color={n.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{n.title}</Text>
                  <Text style={styles.rowSub}>{n.sub}</Text>
                </View>
              </View>
            ))}
          </View>
        </AppScrollView>
      </View>

      <PayoutSetupWizard visible={wizardOpen} onClose={() => setWizardOpen(false)} onDone={handleDone} />
    </>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontFamily: 'SpaceMono-Bold', fontSize: 10.5, letterSpacing: 1.4, textTransform: 'uppercase', color: TEXT_3, marginBottom: 10 },
  title: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 24, lineHeight: 27, letterSpacing: -0.3, color: TEXT_0, marginBottom: 6 },
  sub: { fontFamily: 'Outfit-Regular', fontSize: 13, lineHeight: 19, color: TEXT_1 },
  section: { fontFamily: 'SpaceMono-Bold', fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: TEXT_3, marginTop: 22, marginBottom: 4 },
  needList: { marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderTopWidth: 1, borderTopColor: 'rgba(243,239,232,0.06)' },
  av: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: 'Outfit-SemiBold', fontSize: 13.5, color: TEXT_0 },
  rowSub: { fontFamily: 'Outfit-Regular', fontSize: 11.5, color: TEXT_1, marginTop: 2 },
});
