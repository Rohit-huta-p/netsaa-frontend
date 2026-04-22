import AsyncStorage from '@react-native-async-storage/async-storage';
import { draftService, ApplicationDraft } from '../draftService';

const STORAGE_KEY = '@netsa/drafts/applications/v1';

// Build a valid draft fixture.
function makeDraft(overrides: Partial<ApplicationDraft> = {}): ApplicationDraft {
  return {
    draftId: overrides.draftId ?? 'draft-1',
    gigId: 'gig-xyz',
    gigTitle: 'Bharatanatyam for company launch',
    pitch: 'I have 10y classical experience',
    quotedRate: 12000,
    availability: ['2026-05-01'],
    updatedAt: new Date('2026-04-22T10:00:00Z').toISOString(),
    ...overrides,
  };
}

describe('draftService', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('returns [] when storage is empty', async () => {
      const result = await draftService.list();
      expect(result).toEqual([]);
    });

    it('returns [] and logs a warning when storage JSON is corrupted', async () => {
      await AsyncStorage.setItem(STORAGE_KEY, '{not valid json');
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await draftService.list();

      expect(result).toEqual([]);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('upsert', () => {
    it('inserts a new draft', async () => {
      const d = makeDraft({ draftId: 'd-new' });
      await draftService.upsert(d);

      const list = await draftService.list();
      expect(list).toHaveLength(1);
      expect(list[0].draftId).toBe('d-new');
    });

    it('replaces an existing draft with the same draftId', async () => {
      const d1 = makeDraft({ draftId: 'same', pitch: 'v1' });
      const d2 = makeDraft({ draftId: 'same', pitch: 'v2' });

      await draftService.upsert(d1);
      await draftService.upsert(d2);

      const list = await draftService.list();
      expect(list).toHaveLength(1);
      expect(list[0].pitch).toBe('v2');
    });
  });

  describe('get', () => {
    it('returns the draft when the id exists', async () => {
      const d = makeDraft({ draftId: 'to-find' });
      await draftService.upsert(d);

      const found = await draftService.get('to-find');
      expect(found).not.toBeNull();
      expect(found?.draftId).toBe('to-find');
    });

    it('returns null when the id is missing', async () => {
      const found = await draftService.get('nope');
      expect(found).toBeNull();
    });
  });

  describe('remove', () => {
    it('removes an existing draft', async () => {
      const d = makeDraft({ draftId: 'to-del' });
      await draftService.upsert(d);
      await draftService.remove('to-del');

      const list = await draftService.list();
      expect(list).toHaveLength(0);
    });

    it('is a no-op when the id does not exist', async () => {
      await expect(draftService.remove('nothing')).resolves.not.toThrow();
    });
  });

  describe('clear', () => {
    it('removes every draft', async () => {
      await draftService.upsert(makeDraft({ draftId: 'a' }));
      await draftService.upsert(makeDraft({ draftId: 'b' }));

      await draftService.clear();
      const list = await draftService.list();
      expect(list).toEqual([]);
    });
  });
});
