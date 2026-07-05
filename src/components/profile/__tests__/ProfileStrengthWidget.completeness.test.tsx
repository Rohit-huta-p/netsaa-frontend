// src/components/profile/__tests__/ProfileStrengthWidget.completeness.test.tsx
//
// Focused coverage for a Fix-2 regression: computeOverallScore /
// meetsMinimumApplyGate checked the retired `videoUrls` array to decide if
// the "Video Reel" Showcase requirement was met. The new Mux write path
// populates `videoReels` and never touches `videoUrls`, so an artist with 3
// ready reels and an empty `videoUrls` was falsely told the video reel was
// missing (losing 15% of the 30% Showcase weight, and failing the apply gate).

import {
    computeOverallScore,
    computeProfileSections,
    meetsMinimumApplyGate,
} from '../ProfileStrengthWidget';

const READY_REEL = { muxPlaybackId: 'mux_1', status: 'ready' as const, thumbnailUrl: 'https://image.mux.com/mux_1/thumbnail.jpg' };
const PROCESSING_REEL = { muxPlaybackId: 'mux_2', status: 'processing' as const };

// A user complete everywhere except the video-reel requirement, isolating
// the Showcase section's video-count sub-check.
const baseCompleteUser = {
    displayName: 'Kiran Shah',
    location: 'Pune',
    artistType: 'Dancer',
    skills: ['Kathak'],
    bio: 'x'.repeat(100),
    galleryUrls: ['https://img.example/1.jpg', 'https://img.example/2.jpg'],
    experience: [{ role: 'Lead', date: '2024' }],
    videoUrls: [], // retired field — must NOT be read for reel completeness
};

describe('ProfileStrengthWidget — video-reel completeness reads videoReels, not retired videoUrls', () => {
    it('computeProfileSections: a ready videoReel satisfies the Showcase video requirement even with empty videoUrls', () => {
        const sections = computeProfileSections({ ...baseCompleteUser, videoReels: [READY_REEL] });
        const portfolio = sections.find((s) => s.key === 'portfolio')!;

        expect(portfolio.missing).not.toContain(expect.stringMatching(/Video Reel/i));
        expect(portfolio.sectionPct).toBe(100); // 2 gallery photos + 1 ready reel = fully complete
    });

    it('computeOverallScore: reaches 100 with ready videoReels and empty videoUrls (not stuck missing 15%)', () => {
        const score = computeOverallScore({ ...baseCompleteUser, videoReels: [READY_REEL] });
        expect(score).toBe(100);
    });

    it('a processing (not-yet-ready) reel does NOT count toward completeness', () => {
        const sections = computeProfileSections({ ...baseCompleteUser, videoReels: [PROCESSING_REEL] });
        const portfolio = sections.find((s) => s.key === 'portfolio')!;
        expect(portfolio.missing.some((m) => /Video Reel/i.test(m))).toBe(true);
    });

    it('meetsMinimumApplyGate: passes the video-reel requirement via a ready videoReel with empty videoUrls', () => {
        const { passes, missing } = meetsMinimumApplyGate({ ...baseCompleteUser, videoReels: [READY_REEL] });
        expect(missing).not.toContain('At least 1 Video Reel');
        expect(passes).toBe(true);
    });

    it('does not regress the gallery-photo requirement (still reads galleryUrls, untouched)', () => {
        const sections = computeProfileSections({ ...baseCompleteUser, galleryUrls: [], videoReels: [READY_REEL] });
        const portfolio = sections.find((s) => s.key === 'portfolio')!;
        expect(portfolio.missing.some((m) => /Gallery Photos/i.test(m))).toBe(true);
    });
});
