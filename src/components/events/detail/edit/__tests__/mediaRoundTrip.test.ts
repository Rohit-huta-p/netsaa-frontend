/**
 * Media round-trip must be LOSSLESS (the gap that made media its own PR).
 *
 * events-service stores media as ONE array and, on every PATCH that carries `media`, deletes
 * any item in the stored doc that the new media[] omits (diffRemovedEventMedia → S3/Mux
 * cleanup). So anything `eventToForm` → `buildEventPayload` → `buildMedia` silently drops is
 * DESTROYED the next time the host touches media — even an item they never touched.
 *
 * Two drop classes buildMedia creates: (1) a video whose `status` isn't 'ready' (buildMedia
 * keeps only `status === 'ready' && muxPlaybackId`) and (2) any 2nd+ `isHero` image. These
 * exercise hydrateForm's defensive re-derivation through the REAL GET → hydrate → payload →
 * diff chain, the same chain the save loop runs.
 */
import { hydrateForm } from '../useEventEdit';
import { buildEventPatch } from '../diffPayload';
import { buildEventPayload } from '@/components/events/composer/v4/composerForm';

const eventWith = (media: any[]) => ({
  _id: 'evt-1',
  title: 'Kathak Foundations',
  registrationMode: 'free_rsvp',
  spots: [{ _id: 'real-spot', name: 'General', capacity: 24 }],
  registration: { door: 'open', questions: [] },
  visibility: 'public',
  coverFit: 'whole',
  media,
});

describe('hydrateForm — lossless media rehydration', () => {
  it('a fully-populated event (cover + photos + ready reel) round-trips with zero loss', () => {
    const media = [
      { kind: 'photo', url: 'https://b.s3.x/cover.jpg', isHero: true, sortOrder: 0, _id: 'm0' },
      { kind: 'photo', url: 'https://b.s3.x/p1.jpg', isHero: false, sortOrder: 1, _id: 'm1' },
      { kind: 'photo', url: 'https://b.s3.x/p2.jpg', isHero: false, sortOrder: 2, _id: 'm2' },
      { kind: 'video', url: 'https://stream.mux.com/pid.m3u8', status: 'ready', muxPlaybackId: 'pid', uploadId: 'up', isHero: false, sortOrder: 3, _id: 'm3' },
    ];
    const form = hydrateForm(eventWith(media));
    const base = buildEventPayload(form);
    expect(base.media).toHaveLength(4);                       // nothing dropped at hydrate

    // host adds one photo → the PATCH must still carry every original item.
    form.photos = [...form.photos, { kind: 'photo', url: 'https://b.s3.x/p3.jpg' }];
    const { body } = buildEventPatch(base, buildEventPayload(form));
    const urls = (body.media as any[]).map((m) => m.url);
    expect(urls).toEqual(expect.arrayContaining([
      'https://b.s3.x/cover.jpg', 'https://b.s3.x/p1.jpg', 'https://b.s3.x/p2.jpg',
      'https://stream.mux.com/pid.m3u8', 'https://b.s3.x/p3.jpg',
    ]));
    expect(body.media).toHaveLength(5);
  });

  it('a legacy reel with NO status field is normalised to ready and survives an add-photo edit', () => {
    const media = [
      { kind: 'photo', url: 'https://b.s3.x/cover.jpg', isHero: true },
      { kind: 'video', url: 'https://stream.mux.com/pid.m3u8', muxPlaybackId: 'pid', uploadId: 'up' }, // no status
    ];
    const form = hydrateForm(eventWith(media));
    expect(form.videos[0].status).toBe('ready');             // muxPlaybackId ⇒ ready

    const base = buildEventPayload(form);
    form.photos = [...form.photos, { kind: 'photo', url: 'https://b.s3.x/new.jpg' }];
    const { body } = buildEventPatch(base, buildEventPayload(form));
    const urls = (body.media as any[]).map((m) => m.url);
    // Without the fix the reel is absent from the PATCH → the server would delete it.
    expect(urls).toContain('https://stream.mux.com/pid.m3u8');
    expect(urls).toContain('https://b.s3.x/new.jpg');
  });

  it('a stray 2nd hero image is demoted to a photo, never dropped (so it is never destroyed)', () => {
    const media = [
      { kind: 'photo', url: 'https://b.s3.x/cover.jpg', isHero: true },
      { kind: 'photo', url: 'https://b.s3.x/stray.jpg', isHero: true },  // bad data: a 2nd hero
      { kind: 'photo', url: 'https://b.s3.x/p1.jpg', isHero: false },
    ];
    const form = hydrateForm(eventWith(media));
    expect(form.cover?.url).toBe('https://b.s3.x/cover.jpg');
    expect((form.photos ?? []).map((p) => p.url).sort())
      .toEqual(['https://b.s3.x/p1.jpg', 'https://b.s3.x/stray.jpg']);

    const base = buildEventPayload(form);
    const urls = (base.media as any[]).map((m) => m.url);
    expect(urls).toContain('https://b.s3.x/stray.jpg');                 // survives
    expect((base.media as any[]).filter((m) => m.isHero)).toHaveLength(1); // deduped to one hero
  });

  it('no media diff fires on load for a media-rich event', () => {
    const media = [
      { kind: 'photo', url: 'https://b.s3.x/cover.jpg', isHero: true },
      { kind: 'video', url: 'https://stream.mux.com/pid.m3u8', status: 'ready', muxPlaybackId: 'pid', uploadId: 'up' },
    ];
    const form = hydrateForm(eventWith(media));
    const base = buildEventPayload(form);
    expect(buildEventPatch(base, buildEventPayload(form))).toEqual({ body: {}, advance: [] });
  });
});
