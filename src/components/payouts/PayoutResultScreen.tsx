import React from 'react';
import { View, Text, Pressable, Linking, StyleSheet } from 'react-native';
import { Check, X, Clock, CreditCard, Landmark, ChevronRight } from 'lucide-react-native';
import type { PayoutStatus, PayoutAccount } from '@/services/payoutService';

interface Props {
  status: PayoutStatus;
  rejectionReason?: string;
  account?: PayoutAccount | null;
  onPrimary: () => void;
  onRetry?: () => void;
}

const SURFACE = 'rgba(255,255,255,0.04)';
const HAIRLINE = 'rgba(255,255,255,0.1)';
const TEXT_0 = '#F3EFE8';
const TEXT_1 = '#A1A1AA';
const TEXT_2 = '#71717a';
const TEXT_3 = '#52525b';
const TEXT_4 = '#3f3f46';
const ORANGE = '#FF6B35';
const ORANGE_SOFT = 'rgba(255,107,53,0.16)';
const ORANGE_LINE = 'rgba(255,107,53,0.32)';
const ORANGE_INK = '#1A0D06';
const GREEN = '#22C55E';
const GREEN_SOFT = 'rgba(34,197,94,0.14)';
const BLUE = '#5B8DEF';
const BLUE_SOFT = 'rgba(91,141,239,0.14)';
const YELLOW = '#EAB308';
const YELLOW_SOFT = 'rgba(234,179,8,0.14)';
const RED = '#EF4444';
const RED_SOFT = 'rgba(239,68,68,0.14)';

export default function PayoutResultScreen({ status, rejectionReason, account, onPrimary, onRetry }: Props) {
  // ── Verified (P9a) ─────────────────────────────────────────
  if (status === 'verified') {
    return (
      <View style={styles.screen}>
        <View style={styles.center}>
          <View style={[styles.ringOuter, { backgroundColor: GREEN_SOFT }]}>
            <View style={[styles.ringInner, { backgroundColor: GREEN }]}><Check size={40} color="#fff" strokeWidth={2.5} /></View>
          </View>
          <Text style={[styles.eyebrow, { color: GREEN }]}>Verified · instant</Text>
          <Text style={styles.title}>You're set.</Text>
          <Text style={styles.body}>
            {account?.bankLast4
              ? `Publish paid events now. Earnings land in your ${account.bankName ?? 'bank'} ****${account.bankLast4} · usually T+2.`
              : 'Publish paid events now. Earnings settle to your linked account · usually T+2.'}
          </Text>
        </View>

        {account ? (
          <View style={[styles.metaCard, { borderColor: GREEN }]}>
            <Meta k="Account holder" v={account.accountHolderName ?? '—'} />
            {account.bankLast4 ? <><View style={styles.divider} /><Meta k="Bank" v={`${account.bankName ? account.bankName + ' · ' : ''}****${account.bankLast4}`} /></> : null}
            {account.linkedAccountId ? <><View style={styles.divider} /><Meta k="Linked account ID" v={account.linkedAccountId} mono /></> : null}
          </View>
        ) : null}

        <Pressable onPress={onPrimary} style={styles.primaryBtn} accessibilityRole="button">
          <Text style={styles.primaryText}>Back to event → publish</Text>
        </Pressable>
        <Text style={styles.footNote}>Manage anytime in Settings → Payouts</Text>
      </View>
    );
  }

  // ── Pending (P9b) ──────────────────────────────────────────
  if (status === 'pending_kyc' || status === 'submitted') {
    return (
      <View style={styles.screen}>
        <View style={styles.center}>
          <View style={[styles.ringOuter, { backgroundColor: YELLOW_SOFT }]}>
            <View style={[styles.ringInner, { backgroundColor: YELLOW }]}><Clock size={38} color="#1a1106" strokeWidth={2.5} /></View>
          </View>
          <Text style={[styles.eyebrow, { color: YELLOW }]}>Pending · with Razorpay</Text>
          <Text style={styles.title}>Razorpay's checking.</Text>
          <Text style={styles.body}>We'll email you the moment it's done — usually within 24 hours. Keep designing your event meanwhile.</Text>
        </View>

        <View style={styles.metaCard}>
          <Text style={styles.doLabel}>What you can do now</Text>
          <DoRow ok text="Keep editing your event in the composer" />
          <DoRow ok text="Save as draft any time" />
          <DoRow text="Publish a paid event" />
        </View>

        <Pressable onPress={onPrimary} style={styles.primaryBtn} accessibilityRole="button">
          <Text style={styles.primaryText}>Back to event · save draft</Text>
        </Pressable>
        <Text style={styles.footNote}>We'll push + email when ready</Text>
      </View>
    );
  }

  // ── Rejected (P10) ─────────────────────────────────────────
  if (status === 'rejected') {
    return (
      <View style={styles.screen}>
        <View style={styles.alertCard}>
          <View style={styles.alertBadge}><X size={20} color="#fff" strokeWidth={2.5} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.alertEyebrow}>Razorpay rejected</Text>
            <Text style={styles.alertTitle}>{rejectionReason || "Couldn't verify your details."}</Text>
            <Text style={styles.alertBody}>Update the flagged step below and resubmit.</Text>
          </View>
        </View>

        <Text style={styles.section}>What to fix</Text>
        <Pressable onPress={onRetry} style={[styles.fixRow, { backgroundColor: ORANGE_SOFT, borderColor: ORANGE_LINE }]} accessibilityRole="button">
          <View style={[styles.fixAv, { backgroundColor: ORANGE_SOFT }]}><CreditCard size={17} color={ORANGE} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.fixTitle}>Step 3 · PAN</Text>
            <Text style={styles.fixSub}>Edit · use the exact name on your PAN card</Text>
          </View>
          <ChevronRight size={16} color={ORANGE} />
        </Pressable>
        <View style={styles.fixRow}>
          <View style={[styles.fixAv, { backgroundColor: BLUE_SOFT }]}><Landmark size={17} color={BLUE} /></View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.fixTitle, { color: TEXT_1 }]}>Step 4 · bank</Text>
            <Text style={styles.fixSub}>Looks fine · no change needed</Text>
          </View>
        </View>

        <View style={styles.infoNote}>
          <Text style={styles.infoText}>If you legally changed your name, contact Razorpay support before resubmitting.</Text>
        </View>

        <View style={styles.ctaRow}>
          <Pressable onPress={() => Linking.openURL('mailto:support@netsa.com')} style={styles.ghostBtn} accessibilityRole="button">
            <Text style={styles.ghostText}>Contact support</Text>
          </Pressable>
          <Pressable onPress={onRetry} style={styles.flexPrimary} accessibilityRole="button">
            <Text style={styles.primaryText}>Retry setup →</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Fallback (not_started / suspended) ─────────────────────
  return (
    <View style={styles.screen}>
      <View style={styles.center}>
        <View style={[styles.ringOuter, { backgroundColor: SURFACE }]}>
          <View style={[styles.ringInner, { backgroundColor: SURFACE, borderWidth: 1, borderColor: HAIRLINE }]}><Clock size={36} color={TEXT_2} strokeWidth={2} /></View>
        </View>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.body}>Please close and try again.</Text>
      </View>
      <Pressable onPress={onPrimary} style={[styles.primaryBtn, { backgroundColor: SURFACE, borderWidth: 1, borderColor: HAIRLINE }]}>
        <Text style={[styles.primaryText, { color: TEXT_2 }]}>Close</Text>
      </Pressable>
    </View>
  );
}

function Meta({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaK}>{k}</Text>
      <Text style={[styles.metaV, mono && { fontFamily: 'SpaceMono-Regular', fontSize: 11.5 }]} numberOfLines={1}>{v}</Text>
    </View>
  );
}

function DoRow({ ok, text }: { ok?: boolean; text: string }) {
  return (
    <View style={styles.doRow}>
      {ok ? <Check size={14} color={GREEN} strokeWidth={2.5} /> : <X size={14} color={TEXT_4} strokeWidth={2.5} />}
      <Text style={[styles.doText, !ok && { color: TEXT_2, textDecorationLine: 'line-through' }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 },
  center: { alignItems: 'center', paddingHorizontal: 8 },
  ringOuter: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  ringInner: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontFamily: 'SpaceMono-Bold', fontSize: 10.5, letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: 8 },
  title: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 28, color: TEXT_0, textAlign: 'center', marginBottom: 8 },
  body: { fontFamily: 'Outfit-Regular', fontSize: 13.5, color: TEXT_2, textAlign: 'center', lineHeight: 20, maxWidth: 320 },
  metaCard: { backgroundColor: SURFACE, borderWidth: 1, borderColor: HAIRLINE, borderRadius: 14, padding: 16, marginTop: 18 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  metaK: { fontFamily: 'Outfit-Regular', fontSize: 12.5, color: TEXT_2 },
  metaV: { fontFamily: 'Outfit-Regular', fontSize: 12.5, color: TEXT_0, flexShrink: 1, textAlign: 'right' },
  divider: { height: 1, backgroundColor: HAIRLINE, marginVertical: 4 },
  doLabel: { fontFamily: 'SpaceMono-Bold', fontSize: 9.5, letterSpacing: 1.4, textTransform: 'uppercase', color: TEXT_3, marginBottom: 10 },
  doRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 6 },
  doText: { fontFamily: 'Outfit-Regular', fontSize: 12.5, color: TEXT_1 },
  primaryBtn: { height: 48, borderRadius: 11, backgroundColor: TEXT_0, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  primaryText: { fontFamily: 'Outfit-Bold', fontSize: 13.5, color: ORANGE_INK },
  footNote: { fontFamily: 'Outfit-Regular', fontSize: 11.5, color: TEXT_3, textAlign: 'center', marginTop: 12 },
  alertCard: { flexDirection: 'row', gap: 12, backgroundColor: RED_SOFT, borderWidth: 1, borderColor: 'rgba(239,68,68,0.32)', borderRadius: 14, padding: 16, marginTop: 4 },
  alertBadge: { width: 36, height: 36, borderRadius: 9, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' },
  alertEyebrow: { fontFamily: 'SpaceMono-Bold', fontSize: 9.5, letterSpacing: 1.3, textTransform: 'uppercase', color: RED, marginBottom: 6 },
  alertTitle: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 19, color: TEXT_0, lineHeight: 23, marginBottom: 6 },
  alertBody: { fontFamily: 'Outfit-Regular', fontSize: 12.5, color: TEXT_1, lineHeight: 17 },
  section: { fontFamily: 'SpaceMono-Bold', fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: TEXT_3, marginTop: 20, marginBottom: 8 },
  fixRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: HAIRLINE, backgroundColor: SURFACE, marginBottom: 8 },
  fixAv: { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  fixTitle: { fontFamily: 'Outfit-SemiBold', fontSize: 13, color: TEXT_0 },
  fixSub: { fontFamily: 'Outfit-Regular', fontSize: 11.5, color: TEXT_2, marginTop: 2 },
  infoNote: { backgroundColor: SURFACE, borderWidth: 1, borderColor: HAIRLINE, borderRadius: 10, padding: 13, marginTop: 8 },
  infoText: { fontFamily: 'Outfit-Regular', fontSize: 11.5, color: TEXT_2, lineHeight: 16 },
  ctaRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  ghostBtn: { flex: 1, height: 48, borderRadius: 11, borderWidth: 1, borderColor: HAIRLINE, alignItems: 'center', justifyContent: 'center' },
  ghostText: { fontFamily: 'Outfit-Medium', fontSize: 13, color: TEXT_1 },
  flexPrimary: { flex: 1, height: 48, borderRadius: 11, backgroundColor: TEXT_0, alignItems: 'center', justifyContent: 'center' },
});
