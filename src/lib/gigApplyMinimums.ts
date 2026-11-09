// src/lib/gigApplyMinimums.ts
// 5-item client-side minimum check for the gig apply pre-gate.
// Intentionally lighter than meetsMinimumApplyGate (the full backend gate).

export type MinimumItemId = 'displayName' | 'city' | 'photo' | 'craft' | 'portfolio';

export interface MinimumItem {
    id: MinimumItemId;
    label: string;
    hint: string;
}

export const GIG_MINIMUM_ITEMS: MinimumItem[] = [
    { id: 'displayName', label: 'Display name', hint: 'What hirers call you' },
    { id: 'city', label: 'City', hint: 'Where you are based' },
    { id: 'photo', label: 'Profile photo', hint: 'Your face, well-lit' },
    { id: 'craft', label: 'Craft / skill', hint: 'At least one' },
    { id: 'portfolio', label: '2 portfolio photos', hint: 'Show your work' },
];

export function checkGigApplyMinimums(user: any): { passes: boolean; missing: MinimumItemId[] } {
    const missing: MinimumItemId[] = [];

    if (!user?.displayName?.trim()) missing.push('displayName');
    if (!user?.location?.trim()) missing.push('city');
    if (!user?.profileImageUrl?.trim()) missing.push('photo');

    const hasCraft =
        (Array.isArray(user?.skills) && user.skills.length > 0) ||
        (typeof user?.artistType === 'string' && user.artistType.trim().length > 0) ||
        (Array.isArray(user?.artistType) && user.artistType.length > 0);
    if (!hasCraft) missing.push('craft');

    const galleryCount =
        (user?.galleryUrls as string[] | undefined)?.filter(Boolean).length ?? 0;
    if (galleryCount < 2) missing.push('portfolio');

    return { passes: missing.length === 0, missing };
}
