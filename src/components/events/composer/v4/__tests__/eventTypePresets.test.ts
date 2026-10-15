import { EVENT_TYPE_PRESETS, EVENT_TYPE_KEYS, presetFor } from '../eventTypePresets';

describe('eventTypePresets', () => {
  it('has a preset for every key, each self-consistent', () => {
    for (const k of EVENT_TYPE_KEYS) {
      const p = EVENT_TYPE_PRESETS[k];
      expect(p.key).toBe(k);
      expect(p.peopleRole).toBeTruthy();
      expect(p.startingSpots.length).toBeGreaterThanOrEqual(1);
      expect(['open', 'guest_list', 'apply']).toContain(p.defaultDoor);
    }
  });

  it('audition starts as "Apply with work" with a role, and adds roles', () => {
    const a = EVENT_TYPE_PRESETS.audition;
    expect(a.defaultDoor).toBe('apply');
    expect(a.addSpotLabel).toBe('Add a role');
    expect(a.startingSpots[0].free).toBe(true);
  });

  it('open mic starts with Perform (free) + Watch', () => {
    const names = EVENT_TYPE_PRESETS.open_mic.startingSpots.map((s) => s.name);
    expect(names).toEqual(['Perform', 'Watch']);
    expect(EVENT_TYPE_PRESETS.open_mic.startingSpots[0].free).toBe(true);
  });

  it('most types default to Open door', () => {
    expect(EVENT_TYPE_PRESETS.workshop.defaultDoor).toBe('open');
    expect(EVENT_TYPE_PRESETS.meetup.defaultDoor).toBe('open');
  });

  it('a typed-in / unknown type falls back to the "other" preset', () => {
    expect(presetFor('photowalk').key).toBe('other');
    expect(presetFor(undefined).key).toBe('other');
    expect(presetFor('workshop').key).toBe('workshop');
  });
});
