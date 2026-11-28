import { diffEventPayload, clearedValue, buildEventPatch } from '../diffPayload';
import { initialFormV4, buildEventPayload, type ComposerFormV4, type MediaItemV4 } from '@/components/events/composer/v4/composerForm';

function paidForm(): ComposerFormV4 {
  return {
    ...initialFormV4('workshop'),
    title: 'Kathak Foundations',
    tagline: 'Rhythm, posture and the basics.',
    about: 'A hands-on morning on tatkar and posture.',
    paid: true,
    spots: [{ id: 'spot-0', name: 'General', capacity: 24, price: 4500 }],
    included: ['Three days of guided sessions', 'Ghungroos to borrow'],
    lineup: [{ title: 'Aarambh · the beginning' }, { title: 'Tatkar · footwork' }],
    visibility: 'public',
  };
}

describe('clearedValue', () => {
  it('matches the base type', () => {
    expect(clearedValue('old')).toBe('');
    expect(clearedValue(['a'])).toEqual([]);
    expect(clearedValue(42)).toBeNull();
    expect(clearedValue(undefined)).toBeNull();
  });
});

describe('diffEventPayload', () => {
  it('returns an empty patch when nothing changed (never-fire-on-load guard)', () => {
    const p = buildEventPayload(paidForm());
    expect(diffEventPayload(p, { ...p })).toEqual({});
  });

  it('sends only the changed scalar (title)', () => {
    const base = buildEventPayload(paidForm());
    const next = buildEventPayload({ ...paidForm(), title: 'Kathak Intensive' });
    expect(diffEventPayload(base, next)).toEqual({ title: 'Kathak Intensive' });
  });

  it('about and included each diff to a single key', () => {
    const base = buildEventPayload(paidForm());
    const next = buildEventPayload({
      ...paidForm(),
      about: 'Updated description.',
      included: ['Three days of guided sessions', 'Ghungroos to borrow', 'Chai & snacks'],
    });
    expect(diffEventPayload(base, next)).toEqual({
      about: 'Updated description.',
      included: ['Three days of guided sessions', 'Ghungroos to borrow', 'Chai & snacks'],
    });
  });

  it('a lineup title edit diffs to just the lineup key', () => {
    const base = buildEventPayload(paidForm());
    const edited = paidForm();
    edited.lineup = [{ title: 'Aarambh · renamed' }, { title: 'Tatkar · footwork' }];
    const patch = diffEventPayload(base, buildEventPayload(edited));
    expect(Object.keys(patch)).toEqual(['lineup']);
    expect(patch.lineup).toEqual([{ title: 'Aarambh · renamed' }, { title: 'Tatkar · footwork' }]);
  });

  it('a price change diffs to the spots + pricing keys only (no unrelated fields)', () => {
    const base = buildEventPayload(paidForm());
    const edited = paidForm();
    edited.spots = [{ id: 'spot-0', name: 'General', capacity: 24, price: 3800 }];
    const patch = diffEventPayload(base, buildEventPayload(edited));
    expect(Object.keys(patch).sort()).toEqual(['pricing', 'spots']);
    expect(patch.pricing.amount).toBe(3800);
  });

  it('a cleared optional (tagline → undefined) is sent as an empty string, not dropped', () => {
    const base = buildEventPayload(paidForm());            // tagline present
    const next = buildEventPayload({ ...paidForm(), tagline: '' }); // buildEventPayload → `|| undefined`
    const patch = diffEventPayload(base, next);
    expect(patch).toHaveProperty('tagline', '');
  });

  it('an emptied list is sent as [] so the clear persists', () => {
    const base = buildEventPayload(paidForm());
    const next = buildEventPayload({ ...paidForm(), included: [] });
    expect(diffEventPayload(base, next)).toEqual({ included: [] });
  });

  it('a newly set field is sent', () => {
    const base = buildEventPayload({ ...paidForm(), tagline: '' });
    const next = buildEventPayload({ ...paidForm(), tagline: 'A new line.' });
    expect(diffEventPayload(base, next)).toEqual({ tagline: 'A new line.' });
  });

  it('styles + levels in one window diff to { topicTags, skillLevel } — no tags (backend mirrors it)', () => {
    const base = buildEventPayload(paidForm());
    const next = buildEventPayload({ ...paidForm(), styles: ['Kathak'], levels: ['beginner'] });
    const patch = diffEventPayload(base, next);
    expect(Object.keys(patch).sort()).toEqual(['skillLevel', 'topicTags']);
    expect(patch.topicTags).toEqual(['Kathak']);
    expect(patch).not.toHaveProperty('tags');
  });
});

describe('buildEventPatch', () => {
  it('no change → empty body, nothing to advance', () => {
    const p = buildEventPayload(paidForm());
    expect(buildEventPatch(p, { ...p })).toEqual({ body: {}, advance: [] });
  });

  it('a whitelist-safe key travels alone, un-escorted (tagline)', () => {
    const base = buildEventPayload(paidForm());
    const next = buildEventPayload({ ...paidForm(), tagline: 'New line' });
    const { body, advance } = buildEventPatch(base, next);
    expect(body).toEqual({ tagline: 'New line' });
    expect(advance).toEqual(['tagline']);
  });

  it('eventType alone (preset→preset) is escorted by an idempotent openToAll so it routes to the composer path', () => {
    const base = buildEventPayload({ ...paidForm(), eventType: 'workshop' });
    const next = buildEventPayload({ ...paidForm(), eventType: 'masterclass' });
    const { body, advance } = buildEventPatch(base, next);
    expect(body.eventType).toBe('masterclass');
    expect(body).toHaveProperty('openToAll', next.openToAll); // sentinel, current value
    expect(advance).toEqual(['eventType']);                   // sentinel is NOT advanced
  });

  it('topicTags alone is escorted too (so the backend mirrors `tags`)', () => {
    const base = buildEventPayload(paidForm());
    const next = buildEventPayload({ ...paidForm(), styles: ['Kathak', 'Jazz'] });
    const { body, advance } = buildEventPatch(base, next);
    expect(body.topicTags).toEqual(['Kathak', 'Jazz']);
    expect(body).toHaveProperty('openToAll');
    expect(advance).toEqual(['topicTags']);
  });

  it('a diff that already carries a composer key is NOT escorted', () => {
    const base = buildEventPayload(paidForm());
    const next = buildEventPayload({ ...paidForm(), styles: ['Kathak'], levels: ['beginner'] });
    const { body, advance } = buildEventPatch(base, next);
    expect(advance.sort()).toEqual(['skillLevel', 'topicTags']);
    expect(body).not.toHaveProperty('openToAll'); // skillLevel already routes it
  });

  it('a blank/whitespace title is dropped from the body (never 4xx-reverts a sibling edit)', () => {
    const base = buildEventPayload(paidForm());
    const next = buildEventPayload({ ...paidForm(), title: '   ', about: 'New about' });
    const { body, advance } = buildEventPatch(base, next);
    expect(body).not.toHaveProperty('title');
    expect(body).toHaveProperty('about', 'New about');
    expect(advance).toEqual(['about']);
  });

  it('a start-date change escorts the whole date group (so the server recomputes schedule)', () => {
    const dated = (): ComposerFormV4 => ({ ...paidForm(), startsAt: '2026-06-01T10:00:00.000Z', endsAt: '2026-06-03T10:00:00.000Z', durationKind: 'h2', timeTbd: false });
    const base = buildEventPayload(dated());
    const next = buildEventPayload({ ...dated(), startsAt: '2026-06-02T10:00:00.000Z' }); // only start changed
    const { body } = buildEventPatch(base, next);
    expect(body).toHaveProperty('startsAt', '2026-06-02T10:00:00.000Z');
    expect(body).toHaveProperty('endsAt', '2026-06-03T10:00:00.000Z'); // escorted though unchanged → end not collapsed
    expect(body).toHaveProperty('durationKind', 'h2');
    expect(body).toHaveProperty('timeTbd', false);
  });

  it('a non-date change never pulls in the date group', () => {
    const dated = (): ComposerFormV4 => ({ ...paidForm(), startsAt: '2026-06-01T10:00:00.000Z', durationKind: 'h2' });
    const base = buildEventPayload(dated());
    const next = buildEventPayload({ ...dated(), about: 'changed' });
    const { body } = buildEventPatch(base, next);
    expect(Object.keys(body)).toEqual(['about']);
  });
});

/* ─────────────────────────── media & cover ───────────────────────────
 * `media` is a backend WHITELIST key (writes + fires the S3/Mux cleanup diff); `coverFit`
 * is a COMPOSER key. Confirmed vs events-service: `{media}` alone routes to the whitelist
 * path (writes media, cleanup fires on `'media' in update`); `{coverFit}` self-routes to
 * the composer path; `{media, coverFit}` routes to the composer path, which writes BOTH
 * (buildComposerUpdate lines 334 + 342). So the existing buildEventPatch routing is already
 * correct for media/cover — these lock it in, plus the delete-safety invariants. */
const COVER = (url = 'https://netsa-media-dev-1.s3.x/cover.jpg'): MediaItemV4 =>
  ({ kind: 'photo', url, thumbnailUrl: url, isHero: true, sortOrder: 0 });
const PHOTO = (n: string): MediaItemV4 =>
  ({ kind: 'photo', url: `https://netsa-media-dev-1.s3.x/${n}.jpg`, thumbnailUrl: `https://netsa-media-dev-1.s3.x/${n}.jpg` });
const READY_VIDEO = (pid = 'pid-1'): MediaItemV4 =>
  ({ kind: 'video', url: `https://stream.mux.com/${pid}.m3u8`, status: 'ready', muxPlaybackId: pid, uploadId: `up-${pid}`, thumbnailUrl: `https://image.mux.com/${pid}/thumbnail.jpg` });

function mediaForm(): ComposerFormV4 {
  return { ...paidForm(), cover: COVER(), photos: [PHOTO('a'), PHOTO('b')], videos: [READY_VIDEO()] };
}

describe('buildEventPatch — media & cover', () => {
  it('no media diff fires on load (base built from the same media-rich form)', () => {
    const p = buildEventPayload(mediaForm());
    expect(buildEventPatch(p, { ...p })).toEqual({ body: {}, advance: [] });
  });

  it('a cover swap travels as {media} alone — whitelist path, NO openToAll escort', () => {
    const base = buildEventPayload(mediaForm());
    const next = buildEventPayload({ ...mediaForm(), cover: COVER('https://netsa-media-dev-1.s3.x/cover2.jpg') });
    const { body, advance } = buildEventPatch(base, next);
    expect(Object.keys(body)).toEqual(['media']);
    expect(advance).toEqual(['media']);
    expect(body).not.toHaveProperty('openToAll');  // media is whitelisted + not a composer key
    expect(body.media[0].url).toBe('https://netsa-media-dev-1.s3.x/cover2.jpg');
    expect(body.media[0].isHero).toBe(true);
  });

  it('a coverFit flip travels as {coverFit} alone — self-routes to the composer path', () => {
    const base = buildEventPayload(mediaForm());            // coverFit: 'whole'
    const next = buildEventPayload({ ...mediaForm(), coverFit: 'fill' });
    const { body, advance } = buildEventPatch(base, next);
    expect(Object.keys(body)).toEqual(['coverFit']);
    expect(advance).toEqual(['coverFit']);
    expect(body).not.toHaveProperty('openToAll');  // coverFit IS a composer key → routes itself
    expect(body.coverFit).toBe('fill');
  });

  it('cover + coverFit in one window → both keys, composer path writes both, no sentinel', () => {
    const base = buildEventPayload(mediaForm());
    const next = buildEventPayload({ ...mediaForm(), coverFit: 'fill', photos: [PHOTO('a'), PHOTO('b'), PHOTO('c')] });
    const { body, advance } = buildEventPatch(base, next);
    expect(Object.keys(body).sort()).toEqual(['coverFit', 'media']);
    expect(advance.sort()).toEqual(['coverFit', 'media']);
    expect(body).not.toHaveProperty('openToAll');  // coverFit routes the pair to buildComposerUpdate
    expect(body.media).toHaveLength(5);            // cover + 3 photos + 1 video
  });

  it('removing a saved photo sends the shorter media[] (so the server cleans exactly that one)', () => {
    const base = buildEventPayload(mediaForm());            // cover + a + b + video
    const next = buildEventPayload({ ...mediaForm(), photos: [PHOTO('a')] }); // b removed
    const { body, advance } = buildEventPatch(base, next);
    expect(advance).toEqual(['media']);
    const urls = (body.media as any[]).map((m) => m.url);
    expect(urls).toContain('https://netsa-media-dev-1.s3.x/a.jpg');
    expect(urls).not.toContain('https://netsa-media-dev-1.s3.x/b.jpg'); // server-confirmed removal
  });

  it('a still-processing reel never reaches the payload → no premature save/cleanup', () => {
    const base = buildEventPayload(mediaForm());
    const next = buildEventPayload({
      ...mediaForm(),
      videos: [READY_VIDEO(), { kind: 'video', url: '', status: 'processing', uploadId: 'up-x' }],
    });
    expect(buildEventPatch(base, next)).toEqual({ body: {}, advance: [] });
  });

  it('add-then-remove before save nets to the base media → nothing sent, no asset destroyed', () => {
    const base = buildEventPayload(mediaForm());
    // host added a photo then removed it: live media is back to the base set.
    const next = buildEventPayload(mediaForm());
    expect(buildEventPatch(base, next)).toEqual({ body: {}, advance: [] });
  });
});
