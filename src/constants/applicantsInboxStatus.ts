/**
 * Applicants-inbox status mapping for the hirer-home dashboard (Plan 3).
 *
 * Backend `GigApplication.status` enum:
 *   applied | shortlisted | rejected | hired | withdrawn
 *
 * The hirer-side Applicants Inbox shows only the three forward-flow
 * states a hirer cares about:
 *   applied     → New
 *   shortlisted → Shortlisted
 *   hired       → Hired
 *
 * Rejected and withdrawn applicants are filtered out at query time;
 * no chip is surfaced for them in the inbox.
 */

export interface ApplicantInboxFilter {
  label: 'New' | 'Shortlisted' | 'Hired';
  backendStatus: 'applied' | 'shortlisted' | 'hired';
  color: string;
}

/**
 * Chip order for ApplicantsInboxSection. Default active chip is the
 * first entry (New).
 */
export const APPLICANTS_INBOX_FILTERS: readonly ApplicantInboxFilter[] = [
  { label: 'New', backendStatus: 'applied', color: '#3B82F6' },
  { label: 'Shortlisted', backendStatus: 'shortlisted', color: '#F59E0B' },
  { label: 'Hired', backendStatus: 'hired', color: '#22C55E' },
] as const;

const BACKEND_TO_LABEL: Record<string, ApplicantInboxFilter['label']> = {
  applied: 'New',
  shortlisted: 'Shortlisted',
  hired: 'Hired',
};

/**
 * Safe lookup: returns 'Unknown' for any unrecognized status so the UI
 * never crashes on unexpected backend data.
 */
export function getApplicantStatusLabel(status: string): string {
  return BACKEND_TO_LABEL[status] ?? 'Unknown';
}
