import { initialFormV4, buildEventPayload, eventToForm, type ComposerFormV4 } from '../composerForm';

/** A filled-in form that exercises the fields an edit must round-trip. */
function filledForm(): ComposerFormV4 {
  return {
    ...initialFormV4('workshop'),
    title: 'Kathak Foundations',
    whoFor: ['Dancer'],
    otherArtistTypes: ['Folk dancer'],
    openToAll: false,
    level: 'beginner',
    styles: ['kathak', 'classical'],
    languages: ['hi', 'en'],
    people: [{ displayName: 'Aditi', role: 'Led by', invited: false }],
    startsAt: '2026-11-14T13:00:00.000Z',
    endsAt: null,
    durationKind: 'h2',
    format: 'in_person',
    location: { venueName: 'Nrityangan', city: 'Pune', address: 'FC Road' },
    paid: true,
    spots: [
      { id: 'spot-0', name: 'Dancer', capacity: 20, price: 1500 },
      { id: 'spot-1', name: 'Observer', capacity: 10, price: 800 },
    ],
    offers: [{ id: 'offer-0', name: 'Early bird', price: 1200, audience: 'everyone', endsAt: null, seatLimit: 10, minSeats: null }],
    door: 'apply',
    questions: [{ id: 'q-0', label: 'Instagram', type: 'link', required: true }],
    ageRestriction: 16,
    about: 'A hands-on morning on tatkar and posture.',
    tagline: 'Rhythm, posture and the basics.',
    coverFit: 'whole',
    lineup: [{ when: '10:00', title: 'Warm-up', detail: 'Tatkar' }],
    bring: { items: ['Ghungroo'], note: 'Cotton clothes' },
    included: ['Certificate'],
    visibility: 'public',
  };
}

describe('eventToForm — edit round-trip (form → payload → eventToForm)', () => {
  // The POST body is close to the persisted event doc for the fields the composer
  // reads back, so round-tripping through it is a faithful proxy for a real edit.
  const payload = buildEventPayload(filledForm());
  const back = { ...initialFormV4('workshop'), ...eventToForm(payload) };

  it('preserves the identity + audience fields', () => {
    expect(back.title).toBe('Kathak Foundations');
    expect(back.whoFor).toEqual(['Dancer']);
    expect(back.otherArtistTypes).toEqual(['Folk dancer']);
    expect(back.level).toBe('beginner');
    expect(back.styles).toEqual(['kathak', 'classical']);
    expect(back.languages).toEqual(['hi', 'en']);
    expect(back.people[0]).toMatchObject({ displayName: 'Aditi', role: 'Led by' });
  });

  it('preserves when & where', () => {
    expect(back.startsAt).toBe('2026-11-14T13:00:00.000Z');
    expect(back.durationKind).toBe('h2');
    expect(back.format).toBe('in_person');
    expect(back.location.venueName).toBe('Nrityangan');
    expect(back.location.city).toBe('Pune');
  });

  it('preserves spots, paid flag and offers', () => {
    expect(back.paid).toBe(true);
    expect(back.spots.map((s) => [s.name, s.capacity, s.price])).toEqual([['Dancer', 20, 1500], ['Observer', 10, 800]]);
    expect(back.offers).toHaveLength(1);
    expect(back.offers[0]).toMatchObject({ name: 'Early bird', price: 1200, audience: 'everyone', seatLimit: 10 });
  });

  it('preserves registration, age limit and describe sections', () => {
    expect(back.door).toBe('apply');
    expect(back.questions[0]).toMatchObject({ label: 'Instagram', type: 'link', required: true });
    expect(back.ageRestriction).toBe(16);
    expect(back.about).toBe('A hands-on morning on tatkar and posture.');
    expect(back.lineup[0]).toMatchObject({ when: '10:00', title: 'Warm-up' });
    expect(back.bring.items).toEqual(['Ghungroo']);
    expect(back.included).toEqual(['Certificate']);
    expect(back.visibility).toBe('public');
  });

  it('a free event round-trips paid=false with a spot', () => {
    const free = buildEventPayload({ ...filledForm(), paid: false });
    const back2 = eventToForm(free);
    expect(back2.paid).toBe(false);
    expect(back2.spots!.length).toBeGreaterThan(0);
  });

  it('a typed-in (non-preset) type round-trips through eventTypeLabel', () => {
    const custom = buildEventPayload({ ...filledForm(), eventType: 'Sound bath', eventTypeLabel: 'Sound bath' });
    const back3 = eventToForm(custom);
    expect(back3.eventType).toBe('Sound bath');
    expect(back3.eventTypeLabel).toBe('Sound bath');
  });
});
