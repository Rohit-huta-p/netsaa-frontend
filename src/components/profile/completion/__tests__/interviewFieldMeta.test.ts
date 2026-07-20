// netsa-frontend/src/components/profile/completion/__tests__/interviewFieldMeta.test.ts
import { enrichMissing } from '../interviewFieldMeta';

describe('enrichMissing', () => {
  it('maps a display-name label to a text field on the header section', () => {
    const [f] = enrichMissing(['Display Name']);
    expect(f.id).toBe('displayName');
    expect(f.section).toBe('header');
    expect(f.inputType).toBe('text');
    expect(f.question).toMatch(/call you/i);
    expect(f.playbillSlot).toBe('name');
  });

  it('maps artist type to chips with art forms and the craft slot', () => {
    const [f] = enrichMissing(['Artist Type']);
    expect(f.id).toBe('artistType');
    expect(f.inputType).toBe('chips');
    expect(f.chips).toContain('Dancer');
    expect(f.playbillSlot).toBe('craft');
  });

  it('maps a char-counted bio label (e.g. "Bio (12/100 chars)")', () => {
    const [f] = enrichMissing(['Bio (12/100 chars)']);
    expect(f.id).toBe('bio');
    expect(f.section).toBe('about');
    expect(f.playbillSlot).toBe('quote');
    expect(f.chipLabel).toBe('Bio');
    expect(/\d|\(/.test(f.chipLabel)).toBe(false);
  });

  it('maps gallery + video reel to media fields', () => {
    const fields = enrichMissing(['Gallery Photos (0/2 min)', 'Video Reel (0/1 min)']);
    expect(fields.map((f) => f.id)).toEqual(['gallery', 'videoReel']);
    expect(fields.every((f) => f.inputType === 'media')).toBe(true);
    expect(fields.map((f) => f.chipLabel)).toEqual(['Gallery', 'Video reel']);
  });

  it('maps a profile-photo label (server may emit it) to the portrait media slot', () => {
    const [f] = enrichMissing(['Profile Photo']);
    expect(f.id).toBe('photo');
    expect(f.inputType).toBe('media');
    expect(f.playbillSlot).toBe('portrait');
  });

  it('drops labels it does not recognise (never invents a field)', () => {
    expect(enrichMissing(['Some Future Thing'])).toEqual([]);
  });

  it('marks artist type as mirror-relevant (a hirer-facing gap)', () => {
    expect(enrichMissing(['Artist Type'])[0].mirrorRelevant).toBe(true);
  });

  it('does not mark skills as mirror-relevant', () => {
    expect(enrichMissing(['At least 1 Skill'])[0].mirrorRelevant).toBe(false);
  });
});
