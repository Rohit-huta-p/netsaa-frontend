import { inviteColors } from './inviteTheme';
import type { Invite } from '@/services/inviteService';

export type InviteTab = 'pending' | 'accepted' | 'archive';
type Role = 'artist' | 'creative_lead' | 'agency';

export function groupInvitesByTab(invites: Invite[]) {
    const pending: Invite[] = [];
    const accepted: Invite[] = [];
    const archive: Invite[] = [];
    for (const inv of invites) {
        if (inv.status === 'sent' || inv.status === 'viewed') pending.push(inv);
        else if (inv.status === 'accepted') accepted.push(inv);
        else if (inv.status === 'declined' || inv.status === 'withdrawn') archive.push(inv);
    }
    return { pending, accepted, archive };
}

export function roleLabel(role: Role): string {
    if (role === 'creative_lead') return 'Creative Lead';
    if (role === 'agency') return 'Agency';
    return 'Artist';
}

export function rolePlural(role: Role, n: number): string {
    const one = role === 'creative_lead' ? 'creative lead' : role === 'agency' ? 'agency' : 'artist';
    if (n === 1) return one;
    return role === 'agency' ? 'agencies' : `${one}s`;
}

function inr(n: number): string {
    if (n >= 100000) {
        const l = n / 100000;
        return `${Number.isInteger(l) ? l : Number(l.toFixed(1))}L`;
    }
    if (n >= 1000) return `${Math.round(n / 1000)}k`;
    return `${n}`;
}

export function formatBudget(min?: number | null, max?: number | null): string {
    const hasMin = typeof min === 'number';
    const hasMax = typeof max === 'number';
    if (hasMin && hasMax) {
        if (min === max) return `₹${inr(min as number)}`;
        return `₹${inr(min as number)}–${inr(max as number)}`;
    }
    if (hasMin) return `₹${inr(min as number)}+`;
    if (hasMax) return `Up to ₹${inr(max as number)}`;
    return '';
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function formatEventDate(iso?: string | null, now: Date = new Date()): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const base = `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
    return d.getUTCFullYear() === now.getUTCFullYear() ? base : `${base} ${d.getUTCFullYear()}`;
}

export function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function avatarTint(name: string) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return inviteColors.avatarTints[h % inviteColors.avatarTints.length];
}

export function statusBadge(status: Invite['status']): { label: string; fg: string; bg: string } {
    switch (status) {
        case 'sent':
        case 'viewed':    return { label: 'Pending',  fg: inviteColors.pendingPillText, bg: inviteColors.pendingPillBg };
        case 'accepted':  return { label: 'Accepted', fg: inviteColors.acceptedText,    bg: inviteColors.acceptedBg };
        case 'declined':  return { label: 'Declined', fg: inviteColors.archiveText,     bg: inviteColors.archiveBg };
        case 'withdrawn': return { label: 'Withdrawn',fg: inviteColors.archiveText,     bg: inviteColors.archiveBg };
        default:          return { label: status,     fg: inviteColors.archiveText,     bg: inviteColors.archiveBg };
    }
}

export function relativeDate(iso: string, now: number = Date.now()): string {
    const mins = Math.floor((now - new Date(iso).getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(iso).toLocaleDateString('en-IN');
}
