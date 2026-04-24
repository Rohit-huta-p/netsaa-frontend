// netsa-mobile/src/components/create/guardrails/GuardrailPanel.tsx
//
// Renders the aggregated issue list on Page 5. Groups by severity so
// hard blocks sit at top (visually prominent) and trust signals sit at
// the bottom (informational).

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react-native';
import type { GuardrailIssue } from './checks';

export interface GuardrailPanelProps {
  issues: GuardrailIssue[];
}

const SEVERITY_CONFIG = {
  hard: { color: '#EF4444', bg: '#3F1212', label: 'Required fixes', Icon: AlertCircle },
  soft: { color: '#F59E0B', bg: '#3A2A0E', label: 'Suggestions', Icon: AlertTriangle },
  trust: { color: '#A78BFA', bg: '#2A1E3F', label: 'Trust signals', Icon: Info },
} as const;

export default function GuardrailPanel({ issues }: GuardrailPanelProps) {
  if (issues.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer]} accessibilityLabel="No safety issues">
        <Text style={styles.emptyText}>All checks pass. Ready to publish.</Text>
      </View>
    );
  }

  // Group by severity
  const byGroup: Record<'hard' | 'soft' | 'trust', GuardrailIssue[]> = {
    hard: [],
    soft: [],
    trust: [],
  };
  for (const i of issues) byGroup[i.severity].push(i);

  return (
    <View style={styles.container} accessibilityLabel="Safety checks panel">
      {(['hard', 'soft', 'trust'] as const).map((sev) => {
        const group = byGroup[sev];
        if (group.length === 0) return null;
        const cfg = SEVERITY_CONFIG[sev];
        const { Icon } = cfg;
        return (
          <View key={sev} style={[styles.group, { backgroundColor: cfg.bg, borderColor: cfg.color }]}>
            <View style={styles.header}>
              <Icon size={16} color={cfg.color} />
              <Text style={[styles.label, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
            {group.map((issue) => (
              <Text key={issue.id} style={styles.message}>
                {issue.message}
              </Text>
            ))}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10, marginVertical: 12 },
  emptyContainer: { padding: 14, backgroundColor: '#0F1F0F', borderRadius: 12 },
  emptyText: { color: '#22C55E', fontFamily: 'Outfit-SemiBold', fontSize: 13, textAlign: 'center' },
  group: { borderRadius: 12, padding: 14, borderWidth: 1, gap: 6 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontFamily: 'Outfit-SemiBold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  message: { fontFamily: 'Outfit-Regular', fontSize: 13, color: '#E5E5E5', lineHeight: 19 },
});
