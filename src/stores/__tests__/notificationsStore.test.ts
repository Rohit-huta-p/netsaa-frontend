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

  test('maps actor → actorId so the live card shows name + avatar', () => {
    const n = normalizeSocketNotification({
      ...payload,
      actor: { _id: 'u2', displayName: 'Rohit Hutagonna', profileImageUrl: 'http://img' },
    });
    expect(n.actorId).toEqual({ _id: 'u2', displayName: 'Rohit Hutagonna', profileImageUrl: 'http://img' });
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

  test('a re-sent connection request supersedes the old row + clears its stale status', () => {
    const req: NotificationSocketPayload = {
      id: 'n1', type: 'connection', subtype: 'connection.request',
      title: 'New connection request', body: 'wants to connect',
      data: { route: 'connections', params: { connectionId: 'c9' } },
      createdAt: new Date().toISOString(),
    };
    // Prior declined request for the same connection, plus its lingering flag.
    useNotificationsStore.setState({
      notifications: [normalizeSocketNotification(req)],
      respondedConnections: { c9: 'rejected' },
    });
    // New request arrives: same connectionId, new _id.
    useNotificationsStore.getState().incrementUnread(normalizeSocketNotification({ ...req, id: 'n2' }));
    const { notifications, respondedConnections } = useNotificationsStore.getState();
    expect(notifications).toHaveLength(1);          // one row, not a declined+new stack
    expect(notifications[0]._id).toBe('n2');         // the fresh pending one
    expect(respondedConnections.c9).toBeUndefined(); // stale 'rejected' cleared → shows pending
  });
});

describe('markConnectionResponded', () => {
  beforeEach(() => useNotificationsStore.setState({ respondedConnections: {} }));

  test('records the outcome and survives a notifications refresh', () => {
    useNotificationsStore.getState().markConnectionResponded('c1', 'accepted');
    expect(useNotificationsStore.getState().respondedConnections).toEqual({ c1: 'accepted' });

    // A later fetch replaces the list but must NOT clear responses — otherwise
    // the server re-sends the (still-pending-looking) request row and the card
    // wrongly re-offers Accept/Decline. This is the regression under test.
    useNotificationsStore.setState({ notifications: [] });
    expect(useNotificationsStore.getState().respondedConnections).toEqual({ c1: 'accepted' });
  });
});
