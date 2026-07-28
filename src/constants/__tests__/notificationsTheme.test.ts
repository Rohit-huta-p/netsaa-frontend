import {
  getNotifConfig, matchesCategory, filterByCategory, bucketCounts, formatStamp,
} from '../notificationsTheme';

const mk = (over: Partial<{ type: string; subtype: string }> = {}) =>
  ({ type: 'gig', subtype: 'gig.application.received', ...over } as any);

describe('getNotifConfig', () => {
  test('subtype wins over type, carries eyebrow', () => {
    const c = getNotifConfig(mk({ subtype: 'gig.application.hired' }));
    expect(c.semantic).toBe('green');
    expect(c.eyebrow).toBe('Hired');
  });
  test('unknown subtype falls back to type', () => {
    expect(getNotifConfig(mk({ subtype: 'gig.weird' })).semantic).toBe('orange');
  });
  test('unknown type + subtype falls back to muted bell', () => {
    expect(getNotifConfig(mk({ type: 'weird', subtype: 'weird.x' })).semantic).toBe('muted');
  });
  test('cancelled/failed are red, rejected is muted', () => {
    expect(getNotifConfig(mk({ type: 'event', subtype: 'event.cancelled' })).semantic).toBe('red');
    expect(getNotifConfig(mk({ type: 'payment', subtype: 'payment.failed' })).semantic).toBe('red');
    expect(getNotifConfig(mk({ type: 'gig', subtype: 'gig.application.rejected' })).semantic).toBe('muted');
  });
  test('profile.viewed is a purple social notification', () => {
    expect(getNotifConfig(mk({ type: 'profile', subtype: 'profile.viewed' })).semantic).toBe('purple');
  });
  test('polished subtypes resolve precisely (no type-level fallback)', () => {
    expect(getNotifConfig(mk({ type: 'contract', subtype: 'contract.cancelled' })).semantic).toBe('red');
    expect(getNotifConfig(mk({ type: 'payment', subtype: 'payment.refund.completed' })).semantic).toBe('green');
    const deadline = getNotifConfig(mk({ type: 'gig', subtype: 'gig.deadline.approaching' }));
    expect(deadline.semantic).toBe('amber');
    expect(deadline.eyebrow).toBe('Deadline');
  });
});

describe('categories', () => {
  test('contract + payment fold into gigs; message into network; system → All only', () => {
    expect(matchesCategory({ type: 'contract' } as any, 'gigs')).toBe(true);
    expect(matchesCategory({ type: 'payment' } as any, 'gigs')).toBe(true);
    expect(matchesCategory({ type: 'message' } as any, 'network')).toBe(true);
    expect(matchesCategory({ type: 'profile' } as any, 'network')).toBe(true); // profile views → Network
    expect(matchesCategory({ type: 'system' } as any, 'gigs')).toBe(false);
    expect(matchesCategory({ type: 'system' } as any, 'all')).toBe(true);
  });
  test('bucketCounts and filterByCategory agree', () => {
    const list = [
      mk(),
      mk({ type: 'event', subtype: 'event.reminder' }),
      mk({ type: 'message', subtype: 'message.new' }),
      mk({ type: 'system', subtype: 'system.alert' }),
    ];
    const c = bucketCounts(list);
    expect(c.all).toBe(4);
    expect(c.gigs).toBe(1);
    expect(c.events).toBe(1);
    expect(c.network).toBe(1);
    expect(filterByCategory(list, 'gigs')).toHaveLength(1);
    expect(filterByCategory(list, 'all')).toHaveLength(4);
  });
});

describe('formatStamp', () => {
  test('compacts minutes and hours', () => {
    const now = Date.now();
    expect(formatStamp(new Date(now - 30 * 1000).toISOString())).toBe('now');
    expect(formatStamp(new Date(now - 5 * 60000).toISOString())).toBe('5m');
    expect(formatStamp(new Date(now - 3 * 3600000).toISOString())).toBe('3h');
  });
});
