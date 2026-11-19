/**
 * Application-deadline time handling.
 *
 * A gig's `applicationDeadline` is a CALENDAR DAY — the author picks a day, with
 * no meaningful time-of-day — so two rules apply:
 *
 *  • STORE it anchored to NOON UTC (`YYYY-MM-DDT12:00:00.000Z`) via
 *    {@link toCalendarInstant}, so the day survives date-formatting in every
 *    realistic viewer timezone (UTC-11…+11). A bare `new Date("2026-11-22")` is
 *    MIDNIGHT UTC, which renders as the 21st for viewers behind UTC and, compared
 *    against `now`, trips "deadline passed" at 05:30 IST on the 22nd. Noon UTC
 *    avoids both.
 *
 *  • ENFORCE it to the END of that day. On the client we close at the end of the
 *    day in the VIEWER's own local timezone (see {@link isDeadlineOpen}), so
 *    "deadline 22nd" lets each user apply through their own 22nd 23:59 — whatever
 *    their geography. The server can't know the viewer's tz, so it closes
 *    Anywhere-on-Earth (gigs-service `utils/deadline`) — the latest any local
 *    end-of-day can be — and so never rejects an application this gate allowed.
 */

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Turn a 'YYYY-MM-DD' calendar day into the instant to STORE (noon UTC). Anything
 * that already carries a time (ISO instant, Date) passes through unchanged.
 */
export function toCalendarInstant(day: string): Date;
export function toCalendarInstant(day?: string | null): Date | undefined;
export function toCalendarInstant(day?: string | null): Date | undefined {
  if (!day) return undefined;
  return DAY_RE.test(day) ? new Date(`${day}T12:00:00.000Z`) : new Date(day);
}

/** End of the deadline's calendar day in the VIEWER's local tz (ms), or NaN. */
function localEndOfDeadlineDay(deadline: string | Date): number {
  const d = new Date(deadline);
  if (Number.isNaN(d.getTime())) return NaN;
  // Local Y/M/D of the stored instant = the calendar day the author chose
  // (the noon-UTC anchor keeps this stable across UTC-11…+11).
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();
}

/** True while applications are still open for THIS viewer (no deadline ⇒ open). */
export function isDeadlineOpen(deadline?: string | Date | null): boolean {
  if (!deadline) return true;
  const end = localEndOfDeadlineDay(deadline);
  return Number.isNaN(end) ? true : Date.now() <= end;
}

/** Convenience inverse of {@link isDeadlineOpen}. */
export function isDeadlinePassed(deadline?: string | Date | null): boolean {
  return !!deadline && !isDeadlineOpen(deadline);
}

/**
 * Whole calendar days from today (local) to the deadline day: 0 = today,
 * 1 = tomorrow, negative = already past. null when there is no valid deadline.
 */
export function deadlineDaysLeft(deadline?: string | Date | null): number | null {
  if (!deadline) return null;
  const d = new Date(deadline);
  if (Number.isNaN(d.getTime())) return null;
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  const startDeadline = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((startDeadline.getTime() - startToday.getTime()) / 86_400_000);
}
