/**
 * The leave sheet only interrupts when the host actually changed something.
 * That gate is store.isDirty(), built on dirtyKey() — a content fingerprint
 * that ignores the volatile spot/offer/question ids regenerated every mount.
 */
import { useComposerStoreV4 } from '../useComposerStoreV4';
import { dirtyKey, initialFormV4 } from '../composerForm';

const store = () => useComposerStoreV4.getState();

describe('dirtyKey — id-agnostic content fingerprint', () => {
  it('ignores volatile spot ids (same content → same key)', () => {
    const a = initialFormV4('workshop');
    const b = { ...a, spots: a.spots.map((s) => ({ ...s, id: 'totally-different-id' })) };
    expect(dirtyKey(b)).toBe(dirtyKey(a));
  });

  it('reflects a real content change', () => {
    const a = initialFormV4('workshop');
    expect(dirtyKey({ ...a, title: 'Kathak' })).not.toBe(dirtyKey(a));
  });
});

describe('store.isDirty — the leave-sheet gate', () => {
  beforeEach(() => store().reset('workshop'));

  it('a fresh composer is not dirty (untouched → just exits, no sheet)', () => {
    expect(store().isDirty()).toBe(false);
  });

  it('typing a title makes it dirty', () => {
    store().update('title', 'Morning Kathak');
    expect(store().isDirty()).toBe(true);
  });

  it('reset re-syncs the baseline, so it is not dirty again', () => {
    store().update('title', 'x');
    expect(store().isDirty()).toBe(true);
    store().reset('workshop');
    expect(store().isDirty()).toBe(false);
  });

  it('add then remove a spot returns to not-dirty (content, not identity)', () => {
    store().addSpot({ name: 'VIP', capacity: 5, price: 0 });
    expect(store().isDirty()).toBe(true);
    const added = store().form.spots[store().form.spots.length - 1];
    store().removeSpot(added.id);
    expect(store().isDirty()).toBe(false);
  });

  it('hydrate baselines the loaded event — edit mode starts clean, edits turn dirty', () => {
    store().hydrate({ title: 'Loaded Event', about: 'A description' }, 'evt-1');
    expect(store().isDirty()).toBe(false);
    store().update('title', 'Loaded Event (edited)');
    expect(store().isDirty()).toBe(true);
  });
});
