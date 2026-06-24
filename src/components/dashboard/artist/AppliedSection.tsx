/**
 * AppliedSection — artist-home dashboard section for "My applications".
 *
 * RESPONSIBILITIES
 * ----------------
 * 1. Render 5 status filter chips (Pending / Shortlisted / Rejected /
 *    Accepted / Withdrawn) in the order defined by
 *    APPLICATION_STATUS_FILTERS. Default selected chip: "Pending".
 * 2. Fetch applications for the selected chip's backendStatus via
 *    useApplications(filter, 5). Chip toggles swap the React Query key so
 *    warm caches flip instantly.
 * 3. Render up to 5 application preview rows: gig title + hirer name +
 *    status label + applied-on date.
 * 4. Surface a "..." overflow menu with "Withdraw" ONLY on rows where the
 *    backend status is `applied` or `shortlisted` (withdraw is a no-op on
 *    terminal states).
 * 5. Invalidation: after a successful withdraw, invalidate the full
 *    applications namespace so every chip re-fetches (counts drift if we
 *    only invalidate the current filter).
 *
 * NO `/applications` ROUTE YET
 * ----------------------------
 * A dedicated "all applications" screen is out of scope for Plan 2
 * (verified with `ls app/(app)`: no applications/ folder). The "See all"
 * link points to `/gigs` so users have somewhere to go and can filter the
 * gigs screen's Applications tab separately. Swap to `/applications` when
 * that screen ships.
 *
 * PRESENTATION ONLY
 * -----------------
 * Styling matches Wave 2b.1 primitives: SectionCard chrome, row borders
 * #1F1F23, Outfit typography, purple #8B5CF6 for selected chip.
 */
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { MoreVertical } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import SectionCard from '../SectionCard';
import { useApplications } from '@/hooks/useApplications';
import gigService from '@/services/gigService';
import { queryKeys } from '@/constants/queryKeys';
import {
  APPLICATION_STATUS_FILTERS,
  getApplicationStatusLabel,
  type ApplicationStatusFilter,
} from '@/constants/applicationStatus';

interface ApplicationRow {
  _id?: string;
  id?: string;
  status?: string;
  createdAt?: string;
  appliedAt?: string;
  gig?: { _id?: string; title?: string };
  gigTitle?: string;
  hirer?: { name?: string };
  hirerName?: string;
  organizer?: { name?: string };
}

/** Defensive list unwrap — matches useApplications comment guidance. */
function unwrapApplications(data: any): ApplicationRow[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

/** Short month-day date e.g. "Apr 14". */
function formatAppliedDate(raw?: string): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const WITHDRAWABLE_STATUSES = new Set(['applied', 'shortlisted']);

export default function AppliedSection() {
  const [selectedFilter, setSelectedFilter] =
    useState<ApplicationStatusFilter>(APPLICATION_STATUS_FILTERS[0]);

  const {
    data: applicationsResp,
    isLoading,
    error,
    refetch,
  } = useApplications(selectedFilter.backendStatus, 5);

  const queryClient = useQueryClient();

  const applications = useMemo(
    () => unwrapApplications(applicationsResp),
    [applicationsResp]
  );

  const handleWithdraw = (application: ApplicationRow) => {
    const id = application._id ?? application.id;
    if (!id) return;
    Alert.alert(
      'Withdraw application',
      'Are you sure you want to withdraw this application? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            try {
              await gigService.withdrawApplication(id);
              // Invalidate all filter variants so every chip refreshes.
              queryClient.invalidateQueries({
                queryKey: queryKeys.artist.applications(),
              });
            } catch (err: any) {
              Alert.alert(
                'Could not withdraw',
                err?.response?.data?.message ??
                  err?.message ??
                  'Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  const openOverflow = (application: ApplicationRow) => {
    // Single-action menu for now; keep the affordance pattern so we can add
    // "View details" / "Message hirer" later without changing the card layout.
    Alert.alert('Application', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Withdraw',
        style: 'destructive',
        onPress: () => handleWithdraw(application),
      },
    ]);
  };

  // Note: we intentionally do NOT forward isEmpty to SectionCard. The chip
  // row must remain interactive even when the current chip returns zero
  // rows, so we render the empty-state message inline within children. We
  // still forward `isLoading` + `error` — those states correctly replace
  // the list area while keeping users informed.
  return (
    <SectionCard
      title="Applied"
      seeAllHref="/gigs"
      isLoading={isLoading}
      error={error as Error | null}
      onRetry={() => refetch()}
    >
      <View style={styles.contentWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          accessibilityLabel="Filter applications by status"
        >
          {APPLICATION_STATUS_FILTERS.map((f) => {
            const active = f.backendStatus === selectedFilter.backendStatus;
            return (
              <TouchableOpacity
                key={f.backendStatus}
                onPress={() => setSelectedFilter(f)}
                style={[styles.chip, active && styles.chipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${f.label} filter${active ? ', selected' : ''}`}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {applications.length === 0 ? (
          <View style={styles.emptyInline}>
            <Text style={styles.emptyText}>
              {`No ${selectedFilter.label} applications`}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {applications.map((app, idx) => {
              const id = app._id ?? app.id ?? `row-${idx}`;
              const title = app.gig?.title ?? app.gigTitle ?? 'Untitled gig';
              const hirer =
                app.hirer?.name ??
                app.hirerName ??
                app.organizer?.name ??
                'Creative Lead';
              const date = formatAppliedDate(app.createdAt ?? app.appliedAt);
              const label = getApplicationStatusLabel(app.status ?? '');
              const canWithdraw = WITHDRAWABLE_STATUSES.has(app.status ?? '');

              return (
                <View key={id} style={styles.row}>
                  <View style={styles.rowMain}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {title}
                    </Text>
                    <Text style={styles.rowMeta} numberOfLines={1}>
                      {hirer}
                      {date ? ` • ${date}` : ''}
                    </Text>
                  </View>
                  <View style={styles.rowRight}>
                    <Text style={styles.rowStatus}>{label}</Text>
                    {canWithdraw ? (
                      <TouchableOpacity
                        onPress={() => openOverflow(app)}
                        style={styles.overflowBtn}
                        accessibilityRole="button"
                        accessibilityLabel={`Application options for ${title}`}
                        testID={`applied-overflow-${id}`}
                      >
                        <MoreVertical size={16} color="#A1A1AA" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  contentWrap: {
    marginTop: -4,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#1F1F23',
    borderWidth: 1,
    borderColor: '#26262C',
  },
  chipActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  chipText: {
    fontFamily: 'Outfit-Medium',
    fontSize: 12,
    color: '#A1A1AA',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  list: {
    marginTop: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1F1F23',
  },
  rowMain: {
    flex: 1,
    paddingRight: 12,
  },
  rowTitle: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 14,
    color: '#F5F5F5',
  },
  rowMeta: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: '#71717A',
    marginTop: 2,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowStatus: {
    fontFamily: 'Outfit-Medium',
    fontSize: 12,
    color: '#D4D4D8',
  },
  overflowBtn: {
    padding: 6,
    marginLeft: 2,
  },
  emptyInline: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Outfit-Regular',
    fontSize: 14,
    color: '#71717A',
    textAlign: 'center',
  },
});
