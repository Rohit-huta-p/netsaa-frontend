import { computeTierProgress } from '../trustTiers';

describe('computeTierProgress', () => {
  describe('tier boundaries', () => {
    it('score 0 → new tier, 0% progress, 25 points to rising', () => {
      const r = computeTierProgress(0);
      expect(r.currentTier).toBe('new');
      expect(r.progressPct).toBe(0);
      expect(r.pointsToNext).toBe(25);
      expect(r.nextTier).toBe('rising');
    });

    it('score 24 → still new tier, high progress (~96%), 1 point to rising', () => {
      const r = computeTierProgress(24);
      expect(r.currentTier).toBe('new');
      // 24 / 25 = 96
      expect(Math.round(r.progressPct)).toBe(96);
      expect(r.pointsToNext).toBe(1);
      expect(r.nextTier).toBe('rising');
    });

    it('score 25 → rising tier, 0% progress within rising', () => {
      const r = computeTierProgress(25);
      expect(r.currentTier).toBe('rising');
      expect(r.progressPct).toBe(0);
      expect(r.nextTier).toBe('trusted');
    });

    it('score 49 → rising, very high progress (~96%)', () => {
      const r = computeTierProgress(49);
      expect(r.currentTier).toBe('rising');
      // (49 - 25) / (50 - 25) = 24/25 = 96
      expect(Math.round(r.progressPct)).toBe(96);
      expect(r.pointsToNext).toBe(1);
      expect(r.nextTier).toBe('trusted');
    });

    it('score 50 → trusted tier, 0% progress within trusted', () => {
      const r = computeTierProgress(50);
      expect(r.currentTier).toBe('trusted');
      expect(r.progressPct).toBe(0);
      expect(r.nextTier).toBe('verified');
    });

    it('score 79 → trusted, high progress (~96%)', () => {
      const r = computeTierProgress(79);
      expect(r.currentTier).toBe('trusted');
      // (79 - 50) / (80 - 50) = 29/30 ≈ 96.66
      expect(r.progressPct).toBeGreaterThan(95);
      expect(r.progressPct).toBeLessThan(100);
      expect(r.pointsToNext).toBe(1);
      expect(r.nextTier).toBe('verified');
    });

    it('score 80 → verified tier, 0% progress (top tier but at floor)', () => {
      const r = computeTierProgress(80);
      expect(r.currentTier).toBe('verified');
      expect(r.progressPct).toBe(0);
    });

    it('score 100 → verified, 100% progress, no next tier', () => {
      const r = computeTierProgress(100);
      expect(r.currentTier).toBe('verified');
      expect(r.progressPct).toBe(100);
      expect(r.pointsToNext).toBe(0);
      expect(r.nextTier).toBeNull();
    });
  });

  describe('clamping', () => {
    it('negative score clamps to 0 → new tier, 0% progress', () => {
      const r = computeTierProgress(-10);
      expect(r.currentTier).toBe('new');
      expect(r.progressPct).toBe(0);
      expect(r.currentScore).toBe(0);
    });

    it('score > 100 clamps to 100 → verified, 100% progress', () => {
      const r = computeTierProgress(150);
      expect(r.currentTier).toBe('verified');
      expect(r.progressPct).toBe(100);
      expect(r.currentScore).toBe(100);
    });
  });
});
