import React from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { CheckCircle, AlertCircle, Clock, XCircle, Landmark } from 'lucide-react-native';
import { usePayoutAccount } from '@/hooks/usePayoutAccount';
import type { PayoutStatus } from '@/services/payoutService';

interface Props {
  onSetup: () => void;
}

const SURFACE = 'rgba(255,255,255,0.04)';
const HAIRLINE = 'rgba(255,255,255,0.1)';
const TEXT_0 = '#F3EFE8';
const TEXT_2 = '#71717a';
const ORANGE = '#FF6B35';
const ORANGE_SOFT = 'rgba(255,107,53,0.16)';
const ORANGE_INK = '#1A0D06';
const GREEN = '#22C55E';
const AMBER = '#F59E0B';
const RED = '#EF4444';

function statusMeta(status: PayoutStatus): { icon: React.ReactNode; label: string; color: string; buttonText: string; description?: string } {
  switch (status) {
    case 'verified':
      return { icon: <CheckCircle size={16} color={GREEN} />, label: 'Verified', color: GREEN, buttonText: 'Manage' };
    case 'submitted':
    case 'pending_kyc':
      return { icon: <Clock size={16} color={AMBER} />, label: 'Verification in progress', color: AMBER, buttonText: 'Check status', description: "Razorpay is reviewing your details. We'll email you when it's done." };
    case 'rejected':
      return { icon: <XCircle size={16} color={RED} />, label: 'Verification failed', color: RED, buttonText: 'Try again', description: 'Your bank details could not be verified. Re-submit with the correct information.' };
    case 'suspended':
      return { icon: <AlertCircle size={16} color={RED} />, label: 'Account suspended', color: RED, buttonText: 'Contact support', description: 'Your payout account has been suspended. Please contact NETSA support.' };
    default:
      return { icon: null, label: 'Not set up', color: ORANGE, buttonText: 'Set up payouts' };
  }
}

export default function PayoutStatusCard({ onSetup }: Props) {
  const { data, isLoading, isError } = usePayoutAccount();

  if (isLoading) {
    return (
      <View style={[styles.card, { alignItems: 'center', gap: 12 }]}>
        <ActivityIndicator color={ORANGE} />
        <Text style={styles.dim}>Loading payout account…</Text>
      </View>
    );
  }

  const status: PayoutStatus = isError || !data ? 'not_started' : data.status;

  // not_started → the hero (P1)
  if (status === 'not_started') {
    return (
      <View style={styles.hero}>
        <View style={styles.heroIcon}><Landmark size={26} color={ORANGE} /></View>
        <Text style={styles.heroTitle}>No bank linked yet</Text>
        <Text style={styles.heroSub}>~3 minutes · Razorpay verifies live · works with any Indian bank</Text>
        <Pressable onPress={onSetup} style={styles.heroBtn} accessibilityRole="button" accessibilityLabel="Set up payouts">
          <Text style={styles.heroBtnText}>Set up payouts →</Text>
        </Pressable>
      </View>
    );
  }

  const meta = statusMeta(status);

  if (status === 'verified') {
    return (
      <View style={styles.card}>
        <View style={styles.pillRow}>{meta.icon}<Text style={[styles.pillText, { color: GREEN }]}>{meta.label}</Text></View>
        <Text style={styles.holder}>{data?.accountHolderName ?? 'Account holder'}</Text>
        <Text style={styles.bankLine}>{data?.bankName ? `${data.bankName} · ` : ''}****{data?.bankLast4 ?? ''}</Text>
        <View style={styles.divider} />
        <Pressable onPress={onSetup} hitSlop={8}><Text style={styles.manageLink}>{meta.buttonText} →</Text></Pressable>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.pillRow}>{meta.icon}<Text style={[styles.pillText, { color: meta.color }]}>{meta.label}</Text></View>
      {meta.description ? <Text style={styles.desc}>{meta.description}</Text> : null}
      <Pressable onPress={onSetup} style={styles.actionBtn} accessibilityRole="button" accessibilityLabel={meta.buttonText}>
        <Text style={styles.actionBtnText}>{meta.buttonText} →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: SURFACE, borderWidth: 1, borderColor: HAIRLINE, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 16, gap: 10 },
  dim: { fontFamily: 'Outfit-Regular', fontSize: 13, color: TEXT_2 },
  hero: { backgroundColor: SURFACE, borderWidth: 1, borderColor: HAIRLINE, borderRadius: 14, padding: 18, alignItems: 'center' },
  heroIcon: { width: 56, height: 56, borderRadius: 14, backgroundColor: ORANGE_SOFT, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  heroTitle: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 18, color: TEXT_0, marginBottom: 6 },
  heroSub: { fontFamily: 'Outfit-Regular', fontSize: 12.5, color: TEXT_2, textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  heroBtn: { alignSelf: 'stretch', height: 44, borderRadius: 10, backgroundColor: TEXT_0, alignItems: 'center', justifyContent: 'center' },
  heroBtnText: { fontFamily: 'Outfit-Bold', fontSize: 13.5, color: ORANGE_INK },
  pillRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pillText: { fontFamily: 'Outfit-SemiBold', fontSize: 13 },
  holder: { fontFamily: 'Outfit-SemiBold', fontSize: 15, color: TEXT_0 },
  bankLine: { fontFamily: 'SpaceMono-Regular', fontSize: 12.5, color: TEXT_2 },
  divider: { height: 1, backgroundColor: HAIRLINE },
  manageLink: { fontFamily: 'Outfit-Medium', fontSize: 13, color: TEXT_2 },
  desc: { fontFamily: 'Outfit-Regular', fontSize: 13, color: TEXT_2, lineHeight: 19 },
  actionBtn: { alignSelf: 'flex-start', backgroundColor: TEXT_0, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 11, marginTop: 2 },
  actionBtnText: { fontFamily: 'Outfit-Bold', fontSize: 13, color: ORANGE_INK },
});
