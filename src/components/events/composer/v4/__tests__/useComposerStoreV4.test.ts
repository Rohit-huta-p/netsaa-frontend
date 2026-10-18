import { useComposerStoreV4 } from '../useComposerStoreV4';

const S = () => useComposerStoreV4.getState();
beforeEach(() => S().reset('workshop'));

describe('useComposerStoreV4', () => {
  it('reset seeds spots + default door from the preset', () => {
    S().reset('audition');
    expect(S().form.eventType).toBe('audition');
    expect(S().form.door).toBe('apply');          // audition default
    expect(S().form.spots).toHaveLength(1);        // one role row
  });

  it('step navigation clamps to 1..7', () => {
    S().back(); expect(S().step).toBe(1);
    for (let i = 0; i < 10; i++) S().next();
    expect(S().step).toBe(7);
  });

  it('spots cap at 8 and can be updated/removed', () => {
    for (let i = 0; i < 20; i++) S().addSpot();
    expect(S().form.spots.length).toBe(8);
    const id = S().form.spots[1].id;
    S().updateSpot(id, { name: 'Observer', price: 1500 });
    expect(S().form.spots[1].name).toBe('Observer');
    S().removeSpot(id);
    expect(S().form.spots.find((x) => x.id === id)).toBeUndefined();
  });

  it('removeSpot clears offers that pointed at the removed spot', () => {
    S().update('spots', [{ id: 's0', name: 'A', capacity: 10, price: 1000 }, { id: 's1', name: 'B', capacity: 5, price: 500 }]);
    S().update('offers', [{ id: 'o0', name: 'Early', price: 800, audience: 'everyone', spotId: 's1' }]);
    S().removeSpot('s1');
    expect(S().form.spots).toHaveLength(1);
    expect(S().form.offers[0].spotId).toBeUndefined();
  });

  it('offers cap at 6 (1 early-bird + up to 5 group tiers), questions cap at 3', () => {
    for (let i = 0; i < 12; i++) S().addOffer();
    for (let i = 0; i < 9; i++) S().addQuestion();
    expect(S().form.offers.length).toBe(6);
    expect(S().form.questions.length).toBe(3);
  });

  it('update sets an arbitrary field; payload() reflects it', () => {
    S().update('title', 'Kathak Foundations');
    S().update('about', 'A'.repeat(120));
    expect(S().payload().title).toBe('Kathak Foundations');
  });

  it('setEventType keeps the host spots/questions (no clobber)', () => {
    S().addSpot({ name: 'Custom' });
    const n = S().form.spots.length;
    S().setEventType('screening');
    expect(S().form.eventType).toBe('screening');
    expect(S().form.spots.length).toBe(n);        // preserved
  });

  it('hydrate loads a form and marks edit mode', () => {
    S().hydrate({ title: 'Edited' }, 'evt123');
    expect(S().form.title).toBe('Edited');
    expect(S().editMode).toBe(true);
    expect(S().editEventId).toBe('evt123');
  });
});
