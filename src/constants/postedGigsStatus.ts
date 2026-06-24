/**
 * Posted-gigs status mapping for the hirer-home dashboard (Plan 3).
 *
 * Backend `Gig.status` enum:
 *   draft | published | closed | expired
 *
 * UI chips collapse `expired` into `Closed` — the hirer-side UX treats
 * both as "not accepting applications", so splitting them would add a
 * fourth chip for zero user value. Keep the backend enum as-is and map
 * at display time.
 */

export interface PostedGigFilter {
  label: 'Draft' | 'Live' | 'Closed';
  backendStatus: 'draft' | 'published' | 'closed';
  color: string;
}

/**
 * Chip order for PostedGigsSection. Default active chip is the first
 * entry (Draft).
 */
export const POSTED_GIGS_FILTERS: readonly PostedGigFilter[] = [
  { label: 'Draft', backendStatus: 'draft', color: '#A1A1AA' },
  { label: 'Live', backendStatus: 'published', color: '#22C55E' },
  { label: 'Closed', backendStatus: 'closed', color: '#71717A' },
] as const;

const BACKEND_TO_LABEL: Record<string, PostedGigFilter['label']> = {
  draft: 'Draft',
  published: 'Live',
  closed: 'Closed',
  expired: 'Closed',
};

/**
 * Safe lookup: returns 'Unknown' for any unrecognized status so the UI
 * never crashes on unexpected backend data.
 */
export function getPostedGigStatusLabel(status: string): string {
  return BACKEND_TO_LABEL[status] ?? 'Unknown';
}
