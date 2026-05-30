import { searchPeopleV2Enabled } from '../flags';

describe('searchPeopleV2Enabled', () => {
  const originalEnv = process.env.EXPO_PUBLIC_SEARCH_PEOPLE_V2;

  afterEach(() => {
    process.env.EXPO_PUBLIC_SEARCH_PEOPLE_V2 = originalEnv;
  });

  it('returns false by default (no env set)', () => {
    delete process.env.EXPO_PUBLIC_SEARCH_PEOPLE_V2;
    expect(searchPeopleV2Enabled()).toBe(false);
  });

  it('returns true when env is "true"', () => {
    process.env.EXPO_PUBLIC_SEARCH_PEOPLE_V2 = 'true';
    expect(searchPeopleV2Enabled()).toBe(true);
  });

  it('returns false for any other value', () => {
    process.env.EXPO_PUBLIC_SEARCH_PEOPLE_V2 = '1';
    expect(searchPeopleV2Enabled()).toBe(false);
  });

  it('returns false when env is "false"', () => {
    process.env.EXPO_PUBLIC_SEARCH_PEOPLE_V2 = 'false';
    expect(searchPeopleV2Enabled()).toBe(false);
  });

  it('returns false when env is undefined', () => {
    process.env.EXPO_PUBLIC_SEARCH_PEOPLE_V2 = undefined;
    expect(searchPeopleV2Enabled()).toBe(false);
  });
});
