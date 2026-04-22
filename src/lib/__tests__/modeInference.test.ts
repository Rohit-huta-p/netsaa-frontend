import { inferModeFromUser, isValidMode, UserMode } from '../modeInference';

describe('isValidMode', () => {
  it('accepts "artist"', () => {
    expect(isValidMode('artist')).toBe(true);
  });
  it('accepts "hirer"', () => {
    expect(isValidMode('hirer')).toBe(true);
  });
  it('rejects null / undefined / garbage', () => {
    expect(isValidMode(null)).toBe(false);
    expect(isValidMode(undefined)).toBe(false);
    expect(isValidMode('artiste')).toBe(false);
    expect(isValidMode(0 as any)).toBe(false);
  });
});

describe('inferModeFromUser', () => {
  it('returns "hirer" if user has posted gigs but artist profile incomplete', () => {
    const user = {
      postedGigsCount: 3,
      contexts: { artist: { profileComplete: false }, hirer: { profileComplete: false } },
    };
    expect(inferModeFromUser(user as any)).toBe<UserMode>('hirer');
  });

  it('returns "artist" if user has complete artist profile and no gigs posted', () => {
    const user = {
      postedGigsCount: 0,
      contexts: { artist: { profileComplete: true }, hirer: { profileComplete: false } },
    };
    expect(inferModeFromUser(user as any)).toBe<UserMode>('artist');
  });

  it('returns "hirer" when both signals true AND hirer action is more recent', () => {
    const now = Date.now();
    const user = {
      postedGigsCount: 2,
      contexts: { artist: { profileComplete: true }, hirer: { profileComplete: false } },
      lastArtistActionAt: new Date(now - 10_000),
      lastHirerActionAt: new Date(now - 1_000),
    };
    expect(inferModeFromUser(user as any)).toBe<UserMode>('hirer');
  });

  it('returns "artist" when both signals true AND artist action is more recent (symmetric tie-break)', () => {
    const now = Date.now();
    const user = {
      postedGigsCount: 2,
      contexts: { artist: { profileComplete: true }, hirer: { profileComplete: false } },
      lastArtistActionAt: new Date(now - 1_000),
      lastHirerActionAt: new Date(now - 10_000),
    };
    expect(inferModeFromUser(user as any)).toBe<UserMode>('artist');
  });

  it('respects intent "hire_artists" when no other signal', () => {
    const user = { postedGigsCount: 0, contexts: { artist: { profileComplete: false }, hirer: { profileComplete: false } }, intent: ['hire_artists'] };
    expect(inferModeFromUser(user as any)).toBe<UserMode>('hirer');
  });

  it('respects intent "find_gigs" when no other signal', () => {
    const user = { postedGigsCount: 0, contexts: { artist: { profileComplete: false }, hirer: { profileComplete: false } }, intent: ['find_gigs'] };
    expect(inferModeFromUser(user as any)).toBe<UserMode>('artist');
  });

  it('falls back to "artist" for truly blank users (Layer 4)', () => {
    const user = { postedGigsCount: 0, contexts: { artist: { profileComplete: false }, hirer: { profileComplete: false } }, intent: [] };
    expect(inferModeFromUser(user as any)).toBe<UserMode>('artist');
  });

  it('falls back to "artist" when user is null / undefined', () => {
    expect(inferModeFromUser(null as any)).toBe<UserMode>('artist');
    expect(inferModeFromUser(undefined as any)).toBe<UserMode>('artist');
  });
});
