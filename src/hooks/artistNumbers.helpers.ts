/**
 * Pure aggregation helpers for the artist-home "By the Numbers" grid.
 * Kept framework-free so they are trivially unit-testable; the hooks in
 * useArtistNumbers / useArtistEarnings / useDeliveredCount wrap them.
 */

/** Unwrap the various response shapes into an array (bare | {data} | {items}). */
export function safeArr(x: any): any[] {
  if (!x) return [];
  if (Array.isArray(x)) return x;
  if (Array.isArray(x.data)) return x.data;
  if (Array.isArray(x.items)) return x.items;
  return [];
}

const ACTIVE_APP_STATUSES = new Set(['applied', 'shortlisted', 'hired']);

/** Applications total + active. Handles the wrapped `{ meta, data: [...] }` shape. */
export function computeApplications(appsData: any): {
  applicationsTotal: number;
  applicationsActive: number;
} {
  const apps = safeArr(appsData);
  return {
    applicationsTotal: apps.length,
    applicationsActive: apps.filter((a: any) =>
      ACTIVE_APP_STATUSES.has(String(a?.status ?? '').toLowerCase()),
    ).length,
  };
}

/**
 * Delivered = completed contracts where I am the ARTIST. The endpoint returns
 * contracts where I'm hirer OR artist ($or), so we filter client-side by
 * artistId rather than trusting the server `total`.
 */
export function countDeliveredContracts(contractsData: any, myId: string): number {
  const contracts = safeArr(contractsData?.data?.contracts ?? contractsData?.contracts);
  return contracts.filter(
    (c: any) =>
      String(c?.artistId) === String(myId) &&
      String(c?.status ?? '').toLowerCase() === 'completed',
  ).length;
}

const RECEIVED_STATUSES = new Set(['paid', 'confirmed', 'completed']);
const PENDING_STATUSES = new Set(['created', 'recorded']);

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Aggregate the caller's earnings from the transactions envelope.
 * - earnedThisMonth: Σ artistReceived for received-status txns dated this (local) month.
 * - pendingPayouts:  count of created|recorded txns addressed to me.
 * - sparkline:       7 daily Σ artistReceived buckets, oldest→newest, for the last 7 days.
 * `now` is injected for deterministic tests. Month boundary is device-local
 * (IST on target devices).
 */
export function aggregateEarnings(
  txData: any,
  myId: string,
  now: Date,
): { earnedThisMonth: number; pendingPayouts: number; sparkline: number[] } {
  const txs = safeArr(txData?.data?.transactions ?? txData?.transactions ?? txData);
  const mine = txs.filter((t: any) => String(t?.toUserId) === String(myId));

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const keys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    keys.push(dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)));
  }
  const buckets: Record<string, number> = Object.fromEntries(keys.map((k) => [k, 0]));

  let earnedThisMonth = 0;
  let pendingPayouts = 0;

  for (const t of mine) {
    const status = String(t?.status ?? '').toLowerCase();
    const amt = Number(t?.artistReceived ?? 0) || 0;
    if (PENDING_STATUSES.has(status)) pendingPayouts += 1;
    if (!RECEIVED_STATUSES.has(status)) continue;
    const created = t?.createdAt ? new Date(t.createdAt) : null;
    if (!created || Number.isNaN(created.getTime())) continue;
    if (created >= monthStart) earnedThisMonth += amt;
    const k = dayKey(created);
    if (k in buckets) buckets[k] += amt;
  }

  return { earnedThisMonth, pendingPayouts, sparkline: keys.map((k) => buckets[k]) };
}
