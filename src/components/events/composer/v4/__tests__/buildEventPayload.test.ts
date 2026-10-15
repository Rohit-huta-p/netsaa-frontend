import { buildEventPayload, initialFormV4, type ComposerFormV4 } from '../composerForm';

const START = new Date(Date.now() + 7 * 86400000);

const base = (over: Partial<ComposerFormV4> = {}): ComposerFormV4 => ({
  ...initialFormV4('workshop'),
  title: 'Kathak Foundations',
  about: 'A'.repeat(120),
  whoFor: ['Dancer'],
  startsAt: START.toISOString(),
  spots: [{ id: 's0', name: 'Seats', capacity: 24, price: 0 }],
  ...over,
});

describe('buildEventPayload', () => {
  it('free workshop: free RSVP, free spots, no offers/pricing/cancellation, open door', () => {
    const p = buildEventPayload(base());
    expect(p.registrationMode).toBe('free_rsvp');
    expect(p.spots[0].price).toBe(0);
    expect(p.offers).toEqual([]);
    expect(p.pricing).toBeUndefined();
    expect(p.cancellationPolicy).toBeUndefined();
    expect(p.registration.door).toBe('open');
    expect(p.requiresApproval).toBe(false);
    expect(p.capacity.total).toBe(24);
    expect(p.eligibleArtistTypes).toEqual(['Dancer']);
  });

  it('paid: pricing.amount is the lowest paid spot; flex refund derives a 24h window', () => {
    const p = buildEventPayload(base({
      paid: true,
      spots: [{ id: 's0', name: 'Seats', capacity: 24, price: 4500 }, { id: 's1', name: 'Observer', capacity: 6, price: 1500 }],
      offers: [{ id: 'o0', spotId: 's0', name: 'Early bird', price: 3900, audience: 'everyone', seatLimit: 10 }],
      refundPolicy: 'flex_24h',
    }));
    expect(p.registrationMode).toBe('paid_ticket');
    expect(p.pricing.amount).toBe(1500);                 // lowest paid spot
    expect(p.spots).toHaveLength(2);
    expect(p.offers[0].seatLimit).toBe(10);
    expect(p.cancellationPolicy.fullRefundUntil).toBe(new Date(START.getTime() - 86400000).toISOString());
    expect(p.capacity.total).toBe(30);
  });

  it('a free event drops any spot prices and offers', () => {
    const p = buildEventPayload(base({
      paid: false,
      spots: [{ id: 's0', name: 'Seats', capacity: 10, price: 4500 }],
      offers: [{ id: 'o0', name: 'x', price: 100, audience: 'everyone' }],
    }));
    expect(p.spots[0].price).toBe(0);
    expect(p.offers).toEqual([]);
  });

  it('door = apply sets requiresApproval; a typed-in type becomes other + label', () => {
    const p = buildEventPayload(base({ eventType: 'Photowalk', eventTypeLabel: 'Photowalk', door: 'apply' }));
    expect(p.eventType).toBe('other');
    expect(p.eventTypeLabel).toBe('Photowalk');
    expect(p.requiresApproval).toBe(true);
  });

  it('openToAll clears eligibleArtistTypes', () => {
    const p = buildEventPayload(base({ openToAll: true, whoFor: ['Dancer'] }));
    expect(p.openToAll).toBe(true);
    expect(p.eligibleArtistTypes).toEqual([]);
  });

  it('Choice keeps options; other question types drop them', () => {
    const p = buildEventPayload(base({
      questions: [
        { id: 'q0', label: 'Level?', type: 'choice', options: ['A', 'B'], required: true },
        { id: 'q1', label: 'Reel', type: 'link', options: ['should-drop'], required: false },
      ],
    }));
    expect(p.registration.questions[0].options).toEqual(['A', 'B']);
    expect(p.registration.questions[1].options).toBeUndefined();
  });

  it('lineup drops empty titles; included drops falsy; bring omitted when empty', () => {
    const p = buildEventPayload(base({
      lineup: [{ when: 'Day 1', title: 'Tatkar' }, { title: '   ' }],
      included: ['Certificate', ''],
      bring: { items: [] },
    }));
    expect(p.lineup).toHaveLength(1);
    expect(p.included).toEqual(['Certificate']);
    expect(p.bring).toBeUndefined();
  });

  it('custom refund is a structured window, not prose', () => {
    const until = new Date(START.getTime() - 3 * 86400000).toISOString();
    const p = buildEventPayload(base({ paid: true, spots: [{ id: 's0', name: 'Seats', capacity: 5, price: 1000 }], refundPolicy: 'custom', refundFullUntil: until, refundPartialPercent: 50, refundNote: 'Half back a week out' }));
    expect(p.cancellationPolicy.fullRefundUntil).toBe(until);
    expect(p.cancellationPolicy.partialRefundPercent).toBe(50);
  });

  it('online event maps the platform + reveal, in-person maps venue + hideAddress', () => {
    const online = buildEventPayload(base({ format: 'online', location: { onlinePlatform: 'Zoom', meetingLink: 'z', meetingLinkRevealAt: 'T-1h' } }));
    expect(online.location.kind).toBe('online');
    expect(online.location.meetingLinkRevealAt).toBe('T-1h');
    const inp = buildEventPayload(base({ format: 'in_person', location: { venueName: 'Studio', address: 'FC Rd', hideAddress: true } }));
    expect(inp.location.kind).toBe('in_person');
    expect(inp.location.hideAddress).toBe(true);
  });

  it('cover becomes the hero media item', () => {
    const p = buildEventPayload(base({ cover: { kind: 'photo', url: 'u' }, photos: [{ kind: 'photo', url: 'p1' }] }));
    expect(p.media[0].isHero).toBe(true);
    expect(p.media[1].isHero).toBe(false);
  });
});
