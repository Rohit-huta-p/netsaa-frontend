import { diffEventPayload, clearedValue } from '../diffPayload';
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
});
