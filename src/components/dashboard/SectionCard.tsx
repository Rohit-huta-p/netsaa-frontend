// netsa-mobile/src/components/dashboard/SectionCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

/**
 * Shared wrapper for every artist-home (and hirer-home) dashboard section.
 *
 * Handles 4 UI states uniformly so each section component stays small and
 * doesn't re-implement loading/empty/error chrome:
 *   1. loading  — 3 grey skeleton rows
 *   2. empty    — custom `emptyState` node OR fallback "Nothing here yet"
 *   3. error    — red accent + message + Retry CTA calling `onRetry`
 *   4. content  — renders `children`
 *
 * Precedence (first-match wins): error > loading > empty > content.
 *
 * Purely presentational — no data hooks, no React Query, no cross-cutting
 * concerns. Sections pass in their state flags.
 */

export interface SectionCardProps {
  title: string;
  subtitle?: string;
  /** Route href for optional right-aligned "See all" link in the header. */
  seeAllHref?: string;
  /** Defaults to "See all". */
  seeAllLabel?: string;
  isLoading?: boolean;
  isEmpty?: boolean;
  /** Custom empty content. Falls back to "Nothing here yet" when unset. */
  emptyState?: React.ReactNode;
  error?: Error | null;
  onRetry?: () => void;
  children?: React.ReactNode;
  accessibilityLabel?: string;
}

export default function SectionCard({
  title,
  subtitle,
  seeAllHref,
  seeAllLabel = 'See all',
  isLoading,
  isEmpty,
  emptyState,
  error,
  onRetry,
  children,
  accessibilityLabel,
}: SectionCardProps) {
  return (
    <View
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={accessibilityLabel ?? title}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {seeAllHref ? (
          <Link href={seeAllHref as any} asChild>
            <TouchableOpacity accessibilityRole="link" accessibilityLabel={seeAllLabel}>
              <Text style={styles.seeAll}>{seeAllLabel}</Text>
            </TouchableOpacity>
          </Link>
        ) : null}
      </View>

      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <View style={styles.body}>{renderBody({ isLoading, isEmpty, emptyState, error, onRetry, children })}</View>
    </View>
  );
}

function renderBody({
  isLoading,
  isEmpty,
  emptyState,
  error,
  onRetry,
  children,
}: Pick<SectionCardProps, 'isLoading' | 'isEmpty' | 'emptyState' | 'error' | 'onRetry' | 'children'>) {
  // 1. Error — highest precedence so a failed retry never looks like "empty"
  if (error) {
    return (
      <View style={styles.errorBox}>
        <Text style={styles.errorText}>
          Could not load. {error.message ? `(${error.message})` : ''}
        </Text>
        {onRetry ? (
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="Retry"
          >
            <Text style={styles.retryLabel}>Retry</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  // 2. Loading — 3 grey skeleton rows (no Reanimated; static View rectangles)
  if (isLoading) {
    return (
      <View style={styles.skeletonList} accessibilityLabel="Loading">
        <View style={styles.skeletonRow} />
        <View style={styles.skeletonRow} />
        <View style={styles.skeletonRow} />
      </View>
    );
  }

  // 3. Empty — custom node or default copy
  if (isEmpty) {
    if (emptyState !== undefined) return <>{emptyState}</>;
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>Nothing here yet</Text>
      </View>
    );
  }

  // 4. Content
  return <>{children}</>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0F0F12',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1F1F23',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    fontFamily: 'Outfit-SemiBold',
    fontSize: 18,
    color: '#F5F5F5',
  },
  seeAll: {
    fontFamily: 'Outfit-Regular',
    fontSize: 14,
    color: '#8B5CF6',
    marginLeft: 12,
  },
  subtitle: {
    marginTop: 4,
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    color: '#71717A',
  },
  body: {
    marginTop: 14,
  },
  skeletonList: {
    gap: 10,
  },
  skeletonRow: {
    height: 14,
    borderRadius: 6,
    backgroundColor: '#1F1F23',
    marginBottom: 10,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontFamily: 'Outfit-Regular',
    fontSize: 14,
    color: '#71717A',
  },
  errorBox: {
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
    paddingLeft: 12,
  },
  errorText: {
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    color: '#FCA5A5',
    marginBottom: 8,
  },
  retryBtn: {
    backgroundColor: '#1F1F23',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryLabel: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 13,
    color: '#F5F5F5',
  },
});
