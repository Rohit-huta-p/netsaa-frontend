import { useCreateEventStore } from '../createEventStore';

describe('createEventStore', () => {
  beforeEach(() => {
    useCreateEventStore.getState().reset();
  });

  it('starts at step 1 with empty form', () => {
    const s = useCreateEventStore.getState();
    expect(s.step).toBe(1);
    expect(s.form.title).toBe('');
    expect(s.form.topicTags).toEqual([]);
    expect(s.form.registrationMode).toBe('free_rsvp');
    expect(s.form.capacity.total).toBe(50);
  });

  it('advances step and marks complete', () => {
    const { setStep, markComplete } = useCreateEventStore.getState();
    setStep(2);
    markComplete(1);
    const s = useCreateEventStore.getState();
    expect(s.step).toBe(2);
    expect(s.completedSteps.has(1)).toBe(true);
  });

  it('updates form fields immutably', () => {
    const { update } = useCreateEventStore.getState();
    update('title', 'Open Audition — Tanjore Period Drama');
    update('topicTags', ['audition', 'theatre']);
    const s = useCreateEventStore.getState();
    expect(s.form.title).toBe('Open Audition — Tanjore Period Drama');
    expect(s.form.topicTags).toEqual(['audition', 'theatre']);
  });

  it('reset clears everything', () => {
    const { update, setStep, markComplete, reset } = useCreateEventStore.getState();
    update('title', 'X');
    setStep(3);
    markComplete(1);
    reset();
    const s = useCreateEventStore.getState();
    expect(s.step).toBe(1);
    expect(s.form.title).toBe('');
    expect(s.completedSteps.size).toBe(0);
  });
});
