// src/features/contract-workspace/utils/formatSignatureMeta.ts
//
// Pure helper: turn a signature audit record into a one-line display string.

type SignatureInput = {
    signedAt?: string | Date;
    deviceInfo?: string;
    ipAddress?: string;
};

function shortDate(iso: string | Date): string {
    try {
        return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
        return '—';
    }
}

function shortDevice(deviceInfo?: string): string | null {
    if (!deviceInfo) return null;
    const ua = deviceInfo;
    if (/iPhone|iPad/i.test(ua)) return 'iPhone';
    if (/Android/i.test(ua)) return 'Android';
    if (/Mac OS X/i.test(ua)) return 'Mac';
    if (/Windows/i.test(ua)) return 'Windows';
    return null;
}

export function formatSignatureMeta(sig: SignatureInput | undefined | null): string {
    if (!sig?.signedAt) return 'Not signed yet';
    const parts: string[] = [shortDate(sig.signedAt)];
    const dev = shortDevice(sig.deviceInfo);
    if (dev) parts.push(dev);
    return parts.join(' · ');
}
