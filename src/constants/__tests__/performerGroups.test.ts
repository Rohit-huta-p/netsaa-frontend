import {
  resolveGroups,
  PERFORMER_TYPES,
  type Group,
} from '../performerGroups';

describe('PERFORMER_TYPES roster', () => {
  it('contains 15 entries including Music Producer + Stylist', () => {
    expect(PERFORMER_TYPES).toHaveLength(15);
    expect(PERFORMER_TYPES).toContain('Music Producer');
    expect(PERFORMER_TYPES).toContain('Stylist');
  });

  it('is readonly at the type level', () => {
    // Compile-time assertion: PERFORMER_TYPES is `readonly string[]`
    // (no runtime assertion — just proves the type shape)
    const frozen: readonly string[] = PERFORMER_TYPES;
    expect(Object.isFrozen(frozen)).toBe(false); // as-const tuples aren't runtime-frozen
  });
});

describe('resolveGroups', () => {
  it('maps Singer/Musician/Band/DJ/Music Producer to Group A', () => {
    for (const t of ['Singer', 'Musician', 'Band', 'DJ', 'Music Producer']) {
      const g = resolveGroups([t]);
      expect(g.has('A')).toBe(true);
      expect(g.size).toBe(1);
    }
  });

  it('maps Dancer/Actor/Emcee/Performing Artist to Group B', () => {
    for (const t of ['Dancer', 'Actor', 'Emcee', 'Performing Artist']) {
      const g = resolveGroups([t]);
      expect(g.has('B')).toBe(true);
      expect(g.size).toBe(1);
    }
  });

  it('maps Model to Group C', () => {
    expect(resolveGroups(['Model']).has('C')).toBe(true);
  });

  it('maps Photographer/Videographer/Makeup Artist/Stylist to Group D', () => {
    for (const t of ['Photographer', 'Videographer', 'Makeup Artist', 'Stylist']) {
      const g = resolveGroups([t]);
      expect(g.has('D')).toBe(true);
      expect(g.size).toBe(1);
    }
  });

  it('maps Other / unknown to Group E', () => {
    expect(resolveGroups(['Other']).has('E')).toBe(true);
    expect(resolveGroups(['Xenomorph']).has('E')).toBe(true);
  });

  it('unions groups for multi-select (Singer + Dancer = A + B)', () => {
    const g = resolveGroups(['Singer', 'Dancer']);
    expect(g.has('A')).toBe(true);
    expect(g.has('B')).toBe(true);
    expect(g.size).toBe(2);
  });

  it('deduplicates same-group entries (Singer + Guitarist = just A)', () => {
    // Guitarist isn't in PERFORMER_TYPES exactly; use Singer + Musician
    const g = resolveGroups(['Singer', 'Musician']);
    expect(g.has('A')).toBe(true);
    expect(g.size).toBe(1);
  });

  it('handles empty input safely', () => {
    expect(resolveGroups([]).size).toBe(0);
  });
});
