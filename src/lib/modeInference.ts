export type UserMode = 'artist' | 'hirer';

export function isValidMode(v: unknown): v is UserMode {
  return v === 'artist' || v === 'hirer';
}

/**
 * Layer-3 behavioral inference. Spec §2.4.
 * Returns best-guess mode when client AsyncStorage and server `lastActiveMode` are both empty.
 */
interface InferenceInput {
  postedGigsCount?: number;
  contexts?: {
    artist?: { profileComplete?: boolean };
    hirer?: { profileComplete?: boolean };
  };
  lastArtistActionAt?: Date | string;
  lastHirerActionAt?: Date | string;
  intent?: string[];
}

export function inferModeFromUser(user: InferenceInput | null | undefined): UserMode {
  if (!user) return 'artist';

  const postedGigs = user.postedGigsCount ?? 0;
  const artistProfileComplete = user.contexts?.artist?.profileComplete ?? false;

  if (postedGigs > 0 && !artistProfileComplete) return 'hirer';
  if (artistProfileComplete && postedGigs === 0) return 'artist';

  if (postedGigs > 0 && artistProfileComplete) {
    const artistAt = user.lastArtistActionAt ? new Date(user.lastArtistActionAt).getTime() : 0;
    const hirerAt = user.lastHirerActionAt ? new Date(user.lastHirerActionAt).getTime() : 0;
    return artistAt > hirerAt ? 'artist' : 'hirer';
  }

  const intent = user.intent ?? [];
  if (intent.includes('hire_artists')) return 'hirer';
  if (intent.includes('find_gigs')) return 'artist';

  return 'artist';
}
