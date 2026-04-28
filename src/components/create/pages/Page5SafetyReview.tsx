// netsa-mobile/src/components/create/pages/Page5SafetyReview.tsx
//
// Page 5 of the GigForm v2 flow. Runs hard + soft + trust checks on the
// in-progress form state (memoized), passes the result list to
// GuardrailPanel, and shows an artist-side preview via GigDetails with
// the transformed payload. Publish is disabled while any hard issue is
// unresolved; draft save is always allowed.
//
// Phase 4D — adds a hirer-facing contract preview card between safety
// checks and the artist-side preview. Uses the Phase 4B-Lite primitives
// (`buildFromGig` + `useContractPdf`) so the hirer sees the same PDF
// artists will see at apply time.

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { FileText } from 'lucide-react-native';
import GuardrailPanel from '../guardrails/GuardrailPanel';
import {
  runHardChecks,
  runSoftChecks,
  runTrustSignals,
  type CheckableFormState,
} from '../guardrails/checks';
import { GigDetails } from '@/components/gigs/GigDetails';
import { useContractPdf } from '@/features/contract-pdf/hooks/useContractPdf';
import { buildFromGig } from '@/features/contract-pdf/utils/buildContractData';

export interface Page5Props {
  formState: CheckableFormState;
  previewGig: any; // transformed payload matching the Gig shape consumed by GigDetails
  isLoading: boolean;
  onDraft: () => void;
  onPublish: () => void;
  /**
   * Phase 4D — hirer's display name passed in from GigFormV2 (sourced from
   * authStore). Surfaced inside the generated contract PDF so the hirer
   * sees their own name on the parties block before publishing.
   */
  hirerName?: string;
}

export default function Page5SafetyReview({
  formState,
  previewGig,
  isLoading,
  onDraft,
  onPublish,
  hirerName,
}: Page5Props) {
  const { issues, hardCount } = useMemo(() => {
    const all = [
      ...runHardChecks(formState),
      ...runSoftChecks(formState),
      ...runTrustSignals(formState),
    ];
    return { issues: all, hardCount: all.filter((i) => i.severity === 'hard').length };
  }, [formState]);

  const canPublish = hardCount === 0;

  const pdf = useContractPdf();

  // Phase 4D — derive contract preview values from the in-progress payload.
  const amount = previewGig?.compensation?.amount ?? 0;
  const isAdvance = previewGig?.paymentStructure === 'advance_balance';
  const cancellationWindow = previewGig?.cancellationPolicy ?? '48h';
  const forfeitPct = previewGig?.cancellationForfeitPct ?? 100;
  const clausesCount = (previewGig?.customClauses ?? []).length;
  const negotiable = !!previewGig?.compensation?.negotiable;

  const handleViewContractPdf = async () => {
    try {
      const data = buildFromGig(previewGig ?? {}, {
        hirerName: hirerName && hirerName.trim() ? hirerName : 'You (the hirer)',
        artistName: 'Artist (TBD at hire time)',
      });
      await pdf.generateAndShare(data);
    } catch (err: any) {
      Alert.alert('Could not generate contract', err?.message ?? 'Try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Safety checks</Text>
      <GuardrailPanel issues={issues} />

      {/* Phase 4D — Contract preview card. Sits between safety and the
          artist-side preview so the hirer reviews the contract artifact
          (the thing artists will sign) before tapping Publish. */}
      <Text style={styles.sectionLabel}>Contract preview</Text>
      <View style={styles.contractCard}>
        <View style={styles.contractHeader}>
          <FileText size={16} color="#FF6B35" />
          <Text style={styles.contractTitle}>What artists will sign</Text>
        </View>
        <Text style={styles.contractSubtitle}>
          When an artist applies, they see this same contract. Open the full PDF to review before publishing.
        </Text>

        <View style={styles.contractGrid}>
          <View style={styles.contractCell}>
            <Text style={styles.contractCellLabel}>Pay</Text>
            <Text style={styles.contractCellValue}>
              ₹{amount.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.contractCellSub}>
              {isAdvance ? '30/70 advance' : 'Full upfront'}
            </Text>
          </View>
          <View style={styles.contractCell}>
            <Text style={styles.contractCellLabel}>Cancellation</Text>
            <Text style={styles.contractCellValue}>{cancellationWindow}</Text>
            <Text style={styles.contractCellSub}>
              {forfeitPct}% forfeit if within
            </Text>
          </View>
          <View style={styles.contractCell}>
            <Text style={styles.contractCellLabel}>Clauses</Text>
            <Text style={styles.contractCellValue}>
              {clausesCount === 0 ? 'None' : `${clausesCount} added`}
            </Text>
          </View>
          <View style={styles.contractCell}>
            <Text style={styles.contractCellLabel}>Negotiable</Text>
            <Text style={styles.contractCellValue}>
              {negotiable ? 'Yes' : 'No'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleViewContractPdf}
          disabled={pdf.isGenerating}
          accessibilityRole="button"
          accessibilityLabel="View full contract as PDF"
          style={styles.contractPdfBtn}
        >
          {pdf.isGenerating ? (
            <ActivityIndicator size="small" color="#FF6B35" />
          ) : (
            <FileText size={14} color="#FF6B35" />
          )}
          <Text style={styles.contractPdfBtnText}>
            {pdf.isGenerating ? 'Generating…' : 'View full contract PDF'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionLabel}>Preview (artist side)</Text>
      <View style={styles.previewFrame}>
        <GigDetails gig={previewGig} />
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.draftBtn]}
          onPress={onDraft}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Save draft"
        >
          <Text style={styles.draftLabel}>Save draft</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.publishBtn, !canPublish && styles.publishBtnDisabled]}
          onPress={canPublish ? onPublish : undefined}
          disabled={!canPublish || isLoading}
          accessibilityRole="button"
          accessibilityLabel="Publish"
          accessibilityState={{ disabled: !canPublish || isLoading }}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.publishLabel}>Publish</Text>
          )}
        </TouchableOpacity>
      </View>
      {!canPublish && (
        <Text style={styles.blockText}>Resolve required fixes above before publishing.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  sectionLabel: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 12,
    color: '#A1A1AA',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  previewFrame: {
    backgroundColor: '#0A0A0E',
    borderRadius: 16,
    padding: 0,
    borderWidth: 1,
    borderColor: '#1F1F23',
    overflow: 'hidden',
    minHeight: 300,
  },
  // Phase 4D — Contract preview card. Mirrors the GigApplyModal Phase 4C
  // card (rounded dark surface, orange accent, dashed PDF button) so both
  // sides of the contract-first loop feel like the same artifact.
  contractCard: {
    backgroundColor: '#0F0F16',
    borderWidth: 1,
    borderColor: '#1F1F23',
    borderRadius: 16,
    padding: 16,
  },
  contractHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  contractTitle: {
    color: '#F3EFE8',
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 18,
    letterSpacing: -0.2,
  },
  contractSubtitle: {
    color: '#B8B1A6',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  contractGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  contractCell: {
    width: '50%',
    paddingVertical: 8,
  },
  contractCellLabel: {
    color: '#6B6878',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  contractCellValue: {
    color: '#F3EFE8',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  contractCellSub: {
    color: '#6B6878',
    fontSize: 11,
    marginTop: 2,
  },
  contractPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,107,53,0.40)',
    backgroundColor: 'rgba(255,107,53,0.06)',
  },
  contractPdfBtnText: {
    color: '#FF6B35',
    fontSize: 13,
    fontWeight: '700',
  },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftBtn: { backgroundColor: '#27272A' },
  draftLabel: { fontFamily: 'Outfit-SemiBold', fontSize: 14, color: '#FAFAFA' },
  publishBtn: { backgroundColor: '#FF6B35' },
  publishBtnDisabled: { backgroundColor: '#52525B', opacity: 0.6 },
  publishLabel: {
    fontFamily: 'Outfit-Black',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  blockText: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: '#F59E0B',
    textAlign: 'center',
    marginTop: -4,
  },
});
