import { diffEventPayload, clearedValue, buildEventPatch } from '../diffPayload';
import { initialFormV4, buildEventPayload, type ComposerFormV4 } from '@/components/events/composer/v4/composerForm';

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
});
