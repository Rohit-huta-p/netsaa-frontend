import useNotificationsStore, {
  normalizeSocketNotification,
  type NotificationSocketPayload,
} from '../notificationsStore';

const payload: NotificationSocketPayload = {
  id: 'x1', type: 'gig', subtype: 'gig.application.hired',
  title: 'You got the gig', body: 'Congrats', data: { route: 'gig-details' },
  createdAt: new Date().toISOString(),
};

describe('normalizeSocketNotification', () => {
  test('maps the partial socket payload into a store Notification', () => {
    const n = normalizeSocketNotification(payload);
    expect(n._id).toBe('x1');          // id → _id
    expect(n.message).toBe('Congrats'); // body → message
    expect(n.body).toBe('Congrats');
    expect(n.isRead).toBe(false);
    expect(n.updatedAt).toBe(payload.createdAt);
    expect(n.subtype).toBe('gig.application.hired');
    expect(n.data?.route).toBe('gig-details');
  });

  test('tolerates a missing body', () => {
    const n = normalizeSocketNotification({ ...payload, body: undefined });
    expect(n.message).toBe('');
  });
});

describe('incrementUnread', () => {
  beforeEach(() => useNotificationsStore.setState({ notifications: [] }));

  test('prepends a new notification', () => {
    useNotificationsStore.getState().incrementUnread(normalizeSocketNotification(payload));
    const list = useNotificationsStore.getState().notifications;
    expect(list).toHaveLength(1);
    expect(list[0]._id).toBe('x1');
    // The bell/screen derive unread directly from the array (not the store getter).
    expect(list.filter((n) => !n.isRead)).toHaveLength(1);
  });

  test('dedupes by _id (double emit → single row)', () => {
    const n = normalizeSocketNotification(payload);
    const store = useNotificationsStore.getState();
    store.incrementUnread(n);
    store.incrementUnread(n);
    expect(useNotificationsStore.getState().notifications).toHaveLength(1);
  });
});
