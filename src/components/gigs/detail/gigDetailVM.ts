// src/components/gigs/detail/gigDetailVM.ts
//
// Pure gig → view-model mapper for the A·Minimal gig detail. All the display
// logic + empty-state rules live here (see NETSA_GigDetail_Redesign_Spec.md §4).
// Carries the audit fixes: slots from `headcount`, schedule range + specific
// dates, real verified gating, no take-home/fee math.

import dayjs from 'dayjs';

export interface Fact {
  k: string;
  v: string;
  sub?: string;
}
export interface LookingForRow {
  k: string;
  v: string;
  sub?: string;
}
export interface GigDetailVM {
  avatarUrl?: string | null;
  initials: string;
  title: string;
  producerLine: string;
  appliedCount: number;
  deadlineLabel: string | null; // "Closes in 6 days" | "Closed" | null
  saved: boolean;
  facets: string[];
  overflow: number;
  pay: { amount: string; unit: string; negotiable: boolean; tbd: boolean };
  facts: Fact[]; // Pay · When · Where · Slots
  about: string;
  responsibilities: string[];
  lookingFor: LookingForRow[];
  requiredSkills: string[];
  perks: string[];
  terms: string;
  producer: {
    displayName: string;
    initials: string;
    avatarUrl?: string | null;
    organizationName?: string;
    ratingLabel: string | null; // "4.9" | null
    gigsHosted: number | null;
    replyLabel: string | null; // "~2h" | "~45m" | null
    isVerified: boolean;
  };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function initialsOf(name?: string): string {
  if (!name) return 'G';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || 'G';
}

function money(n: number, currency = 'INR'): string {
  const sym = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : '';
  try {
    return `${sym}${Math.round(n).toLocaleString('en-IN')}`;
  } catch {
    return `${sym}${Math.round(n)}`;
  }
}

function payVM(comp: any): GigDetailVM['pay'] {
  const currency = comp?.currency ?? 'INR';
  const unitMap: Record<string, string> = { hourly: 'per hour', 'per-day': 'per day' };
  const unit = unitMap[comp?.model] ?? 'per performer';
  const negotiable = !!comp?.negotiable;
  if (comp?.amount != null) return { amount: money(comp.amount, currency), unit, negotiable, tbd: false };
  if (comp?.minAmount != null) {
    const max = comp.maxAmount != null ? comp.maxAmount : null;
    const amt = max ? `${money(comp.minAmount, currency)}–${money(max, currency).replace(/^[^\d]*/, '')}` : `From ${money(comp.minAmount, currency)}`;
    return { amount: amt, unit, negotiable, tbd: false };
  }
  return { amount: 'To be discussed', unit, negotiable, tbd: true };
}

function dstr(d: any) {
  const x = dayjs(d);
  return { wd: x.format('ddd'), dm: `${x.date()} ${MONTHS[x.month()]}`, y: x.year(), ok: x.isValid() };
}

function whenFact(schedule: any): Fact {
  if (!schedule) return { k: 'When', v: 'TBD' };
  // Specific dates (GigForm v2.2)
  if (schedule.dateMode === 'dates' && Array.isArray(schedule.dates) && schedule.dates.length) {
    const ds = schedule.dates.map((d: any) => dayjs(d)).sort((a: any, b: any) => a.valueOf() - b.valueOf());
    const n = ds.length;
    const head = ds.slice(0, 2).map((x: any) => `${x.date()} ${MONTHS[x.month()]}`).join(', ');
    return { k: 'When', v: `${n} dates`, sub: n > 2 ? `${head} +${n - 2}` : head };
  }
  const start = schedule.startDate ? dstr(schedule.startDate) : null;
  const end = schedule.endDate ? dstr(schedule.endDate) : null;
  if (!start?.ok) return { k: 'When', v: 'TBD' };
  const sameDay = !end?.ok || (dayjs(schedule.startDate).isSame(dayjs(schedule.endDate), 'day'));
  if (sameDay) return { k: 'When', v: start.wd, sub: `${start.dm}` };
  // Range
  return { k: 'When', v: `${start.wd}–${end!.wd}`, sub: `${start.dm}–${end!.dm}` };
}

function whereFact(location: any): Fact {
  if (!location) return { k: 'Where', v: 'TBD' };
  const primary = location.city || location.venueName || 'TBD';
  const subParts = [location.venueName && location.city ? location.venueName : null, location.state].filter(Boolean);
  return { k: 'Where', v: primary, sub: subParts.length ? subParts.join(' · ') : undefined };
}

function slotsFact(gig: any): Fact {
  // v2.2 — slots come from headcount (maxApplications kept only as a legacy fallback).
  const n = gig?.headcount ?? gig?.maxApplications;
  if (!n) return { k: 'Slots', v: 'Open' };
  const sub = n === 1 ? 'solo' : n === 2 ? 'a duo' : `${n} performers`;
  return { k: 'Slots', v: String(n), sub };
}

function deadlineLabel(deadline: any): string | null {
  if (!deadline) return null;
  const d = dayjs(deadline);
  if (!d.isValid()) return null;
  const now = dayjs();
  if (d.isBefore(now)) return 'Closed';
  const days = d.diff(now, 'day');
  if (days >= 1) return `Closes in ${days} day${days > 1 ? 's' : ''}`;
  const hours = Math.max(1, d.diff(now, 'hour'));
  return `Closes in ${hours}h`;
}

function experienceVM(gig: any): { v: string; sub?: string } {
  if (gig?.minExperienceYears != null && gig.minExperienceYears > 0) {
    return { v: `${gig.minExperienceYears}+ years`, sub: 'stage / event work' };
  }
  const map: Record<string, string> = { beginner: 'Beginner welcome', intermediate: 'Intermediate', professional: 'Professional' };
  const lvl = gig?.experienceLevel;
  return lvl ? { v: map[lvl] ?? lvl } : { v: 'Any level' };
}

function facetsVM(gig: any): { facets: string[]; overflow: number } {
  const discipline = gig?.artistTypes?.[0];
  const mode = gig?.location?.isRemote ? 'Remote' : 'On-site';
  const exp = gig?.minExperienceYears ? `${gig.minExperienceYears}+ yrs` : undefined;
  const occasion = gig?.eventFunction || gig?.tags?.[0];
  const facets = [discipline, mode, exp, occasion].filter(Boolean) as string[];
  const extraPool = [...(gig?.requiredSkills ?? []), ...(gig?.tags ?? [])];
  const overflow = Math.max(0, extraPool.length - 1); // rough; tune with real facet rules
  return { facets, overflow };
}

function producerVM(gig: any): GigDetailVM['producer'] {
  const snap = gig?.organizerSnapshot ?? {};
  const rating = typeof snap.rating === 'number' && snap.rating > 0 ? snap.rating.toFixed(1) : null;
  const mins = snap.avgReplyMinutes;
  let replyLabel: string | null = null;
  if (typeof mins === 'number' && mins > 0 && mins <= 24 * 60) {
    replyLabel = mins >= 60 ? `~${Math.round(mins / 60)}h` : `~${Math.round(mins)}m`;
  }
  return {
    displayName: snap.displayName || 'Organizer',
    initials: initialsOf(snap.displayName),
    avatarUrl: snap.profileImageUrl || null,
    organizationName: snap.organizationName,
    ratingLabel: rating,
    gigsHosted: typeof snap.gigsHosted === 'number' ? snap.gigsHosted : null,
    replyLabel,
    isVerified: !!snap.isVerified,
  };
}

function heightVM(h: any): string | undefined {
  if (!h) return undefined;
  const fmt = (r: any) => (r?.min || r?.max ? [r.min, r.max].filter(Boolean).join('–') + ' ft' : null);
  const parts = [h.male && `M ${fmt(h.male)}`, h.female && `F ${fmt(h.female)}`].filter(Boolean) as string[];
  return parts.length ? parts.join(' · ') : undefined;
}

export function buildGigDetailVM(gig: any): GigDetailVM {
  const loc = gig?.location ?? {};
  const snap = gig?.organizerSnapshot ?? {};
  const producerName = snap.displayName; // identity avatar initials (the person)
  const producerDisplay = snap.organizationName || snap.displayName; // identity line (the brand)
  const { facets, overflow } = facetsVM(gig);

  const lookingFor: LookingForRow[] = [];
  if (gig?.artistTypes?.length) {
    const genderMap: Record<string, string> = { male: 'Men', female: 'Women', other: 'Non-binary', any: 'Any gender' };
    const g = gig.genderPreference && gig.genderPreference !== 'any' ? genderMap[gig.genderPreference] : undefined;
    lookingFor.push({ k: 'Discipline', v: gig.artistTypes.join(', '), sub: g });
  }
  const exp = experienceVM(gig);
  if (exp.v) lookingFor.push({ k: 'Experience', v: exp.v, sub: exp.sub });
  const ageSub = gig?.ageRange && (gig.ageRange.min || gig.ageRange.max) ? `${[gig.ageRange.min, gig.ageRange.max].filter((x: any) => x != null).join('–')} yrs` : undefined;
  if (gig?.genderPreference || ageSub) {
    const genderMap: Record<string, string> = { male: 'Men', female: 'Women', other: 'Non-binary', any: 'Any gender' };
    const gender = genderMap[gig?.genderPreference ?? 'any'] ?? 'Any gender';
    lookingFor.push({ k: 'Open to', v: [gender, ageSub].filter(Boolean).join(' · ') });
  }
  const height = heightVM(gig?.heightRequirements);
  if (height) lookingFor.push({ k: 'Height', v: height });

  const pay = payVM(gig?.compensation);

  return {
    avatarUrl: gig?.organizerSnapshot?.profileImageUrl || null,
    initials: initialsOf(producerName),
    title: gig?.title ?? 'Untitled gig',
    producerLine: [producerDisplay, [loc.city, loc.state].filter(Boolean).join(', ')].filter(Boolean).join(' · '),
    appliedCount: gig?.stats?.applications ?? 0,
    deadlineLabel: deadlineLabel(gig?.applicationDeadline),
    saved: !!gig?.viewerContext?.saved,
    facets,
    overflow,
    pay,
    facts: [{ k: 'Pay', v: pay.tbd ? 'TBD' : pay.amount, sub: pay.tbd ? undefined : pay.unit }, whenFact(gig?.schedule), whereFact(loc), slotsFact(gig)],
    about: (gig?.description ?? '').trim(),
    responsibilities: (gig?.responsibilities ?? []).map((r: string) => r.trim()).filter(Boolean),
    lookingFor,
    requiredSkills: gig?.requiredSkills ?? [],
    perks: gig?.compensation?.perks ?? [],
    terms: (gig?.termsAndConditions ?? '').trim(),
    producer: producerVM(gig),
  };
}
