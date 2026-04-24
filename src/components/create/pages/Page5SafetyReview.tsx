// netsa-mobile/src/components/create/pages/Page5SafetyReview.tsx
//
// Page 5 of the GigForm v2 flow. Runs hard + soft + trust checks on the
// in-progress form state (memoized), passes the result list to
// GuardrailPanel, and shows an artist-side preview via GigDetails with
// the transformed payload. Publish is disabled while any hard issue is
// unresolved; draft save is always allowed.

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import GuardrailPanel from '../guardrails/GuardrailPanel';
import {
  runHardChecks,
  runSoftChecks,
  runTrustSignals,
  type CheckableFormState,
} from '../guardrails/checks';
import { GigDetails } from '@/components/gigs/GigDetails';

export interface Page5Props {
  formState: CheckableFormState;
  previewGig: any; // transformed payload matching the Gig shape consumed by GigDetails
  isLoading: boolean;
  onDraft: () => void;
  onPublish: () => void;
}

export default function Page5SafetyReview({
  formState,
  previewGig,
  isLoading,
  onDraft,
  onPublish,
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

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Safety checks</Text>
      <GuardrailPanel issues={issues} />

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
