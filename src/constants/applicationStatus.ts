/**
 * Application status mapping for the artist-home dashboard.
 *
 * The backend `GigApplication.status` enum uses:
 *   applied | shortlisted | rejected | hired | withdrawn
 *
 * The UI shows user-friendly labels. Plan 2 decision: keep the backend enum
 * as-is (avoids a bulk data migration) and map at display time:
 *   applied → Pending
 *   hired   → Accepted
 *
 * Source: DOCS/04-design/NETSA_Dashboard_ModeToggle_Design_v1.md §4.1 — filter chip
 * order for AppliedSection.
 */

export type BackendApplicationStatus =
  | 'applied'
  | 'shortlisted'
  | 'rejected'
  | 'hired'
  | 'withdrawn';

export type ApplicationStatusLabel =
  | 'Pending'
  | 'Shortlisted'
  | 'Rejected'
  | 'Accepted'
  | 'Withdrawn'
  | 'Unknown';

const LABEL_MAP: Record<BackendApplicationStatus, ApplicationStatusLabel> = {
  applied: 'Pending',
  shortlisted: 'Shortlisted',
  rejected: 'Rejected',
  hired: 'Accepted',
  withdrawn: 'Withdrawn',
};

/**
 * Safe lookup: returns 'Unknown' for any unrecognized status so the UI
 * never crashes on unexpected backend data.
 */
export function getApplicationStatusLabel(
  status: BackendApplicationStatus | string
): ApplicationStatusLabel {
  return (
    (LABEL_MAP as Record<string, ApplicationStatusLabel>)[status] ?? 'Unknown'
  );
}

export interface ApplicationStatusFilter {
  label: ApplicationStatusLabel;
  backendStatus: BackendApplicationStatus;
}

/**
 * Chip order for AppliedSection, per spec §4.1.
 * Default active chip is the first entry (Pending).
 */
export const APPLICATION_STATUS_FILTERS: readonly ApplicationStatusFilter[] = [
  { label: 'Pending', backendStatus: 'applied' },
  { label: 'Shortlisted', backendStatus: 'shortlisted' },
  { label: 'Rejected', backendStatus: 'rejected' },
  { label: 'Accepted', backendStatus: 'hired' },
  { label: 'Withdrawn', backendStatus: 'withdrawn' },
] as const;
