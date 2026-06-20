import {
    groupInvitesByTab, roleLabel, rolePlural, formatBudget,
    formatEventDate, initials, avatarTint, statusBadge, relativeDate,
} from '../inviteFormat';
import type { Invite } from '@/services/inviteService';

const mk = (status: Invite['status']): Invite => ({
    _id: status, fromClientId: 'c', fromSnapshot: { displayName: 'X' },
    toUserId: 'u', toRole: 'creative_lead', status, createdAt: '2026-06-20T00:00:00Z',
});

describe('groupInvitesByTab', () => {
    it('buckets statuses into pending / accepted / archive', () => {
        const g = groupInvitesByTab(['sent','viewed','accepted','declined','withdrawn'].map(s => mk(s as Invite['status'])));
        expect(g.pending.map(i => i.status)).toEqual(['sent','viewed']);
        expect(g.accepted.map(i => i.status)).toEqual(['accepted']);
        expect(g.archive.map(i => i.status)).toEqual(['declined','withdrawn']);
    });
});

describe('roleLabel / rolePlural', () => {
    it('labels roles', () => {
        expect(roleLabel('creative_lead')).toBe('Creative Lead');
        expect(roleLabel('artist')).toBe('Artist');
        expect(roleLabel('agency')).toBe('Agency');
    });
    it('pluralizes by count', () => {
        expect(rolePlural('creative_lead', 1)).toBe('creative lead');
        expect(rolePlural('creative_lead', 4)).toBe('creative leads');
        expect(rolePlural('artist', 2)).toBe('artists');
        expect(rolePlural('agency', 1)).toBe('agency');
        expect(rolePlural('agency', 3)).toBe('agencies');
    });
});

describe('formatBudget', () => {
    it('formats ranges, singles, open-ended, and empty', () => {
        expect(formatBudget(40000, 60000)).toBe('₹40k–60k');
        expect(formatBudget(50000, 50000)).toBe('₹50k');
        expect(formatBudget(150000, 250000)).toBe('₹1.5L–2.5L');
        expect(formatBudget(200000, 200000)).toBe('₹2L');
        expect(formatBudget(30000, null)).toBe('₹30k+');
        expect(formatBudget(null, 80000)).toBe('Up to ₹80k');
        expect(formatBudget(null, null)).toBe('');
    });
});

describe('formatEventDate', () => {
    const now = new Date('2026-06-20T00:00:00Z');
    it('drops the year when same as now, keeps it otherwise', () => {
        expect(formatEventDate('2026-07-12T00:00:00Z', now)).toBe('12 Jul');
        expect(formatEventDate('2027-01-05T00:00:00Z', now)).toBe('5 Jan 2027');
        expect(formatEventDate(null, now)).toBe('');
        expect(formatEventDate('not-a-date', now)).toBe('');
    });
});

describe('initials / avatarTint', () => {
    it('derives initials', () => {
        expect(initials('Aarav Kothari')).toBe('AK');
        expect(initials('Meera')).toBe('ME');
        expect(initials('   ')).toBe('?');
    });
    it('returns a stable tint for a name', () => {
        expect(avatarTint('Aarav')).toEqual(avatarTint('Aarav'));
    });
});

describe('statusBadge', () => {
    it('maps status to a label', () => {
        expect(statusBadge('sent').label).toBe('Pending');
        expect(statusBadge('viewed').label).toBe('Pending');
        expect(statusBadge('accepted').label).toBe('Accepted');
        expect(statusBadge('declined').label).toBe('Declined');
        expect(statusBadge('withdrawn').label).toBe('Withdrawn');
    });
});

describe('relativeDate', () => {
    it('renders coarse relative time', () => {
        const now = Date.parse('2026-06-20T12:00:00Z');
        expect(relativeDate('2026-06-20T11:58:00Z', now)).toBe('2m ago');
        expect(relativeDate('2026-06-20T09:00:00Z', now)).toBe('3h ago');
        expect(relativeDate('2026-06-18T12:00:00Z', now)).toBe('2d ago');
    });
});
