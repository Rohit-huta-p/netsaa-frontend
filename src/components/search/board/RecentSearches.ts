// src/components/search/board/RecentSearches.ts
//
// Tiny AsyncStorage helper for the idle state's "Recent" row. Case-insensitive
// dedupe, most-recent-first, capped. Every call is wrapped — AsyncStorage can
// reject (private mode, cleared storage) and recents are a convenience, never
// load-bearing, so failures degrade to an empty list.

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'netsa.search.recent';
const CAP = 8;

export async function getRecent(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string').slice(0, CAP) : [];
  } catch {
    return [];
  }
}

export async function addRecent(query: string): Promise<string[]> {
  const q = query.trim();
  if (!q) return getRecent();
  try {
    const current = await getRecent();
    const next = [q, ...current.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, CAP);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    return next;
  } catch {
    return getRecent();
  }
}

export async function removeRecent(query: string): Promise<string[]> {
  try {
    const current = await getRecent();
    const next = current.filter((x) => x.toLowerCase() !== query.trim().toLowerCase());
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    return next;
  } catch {
    return getRecent();
  }
}

export async function clearRecent(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    /* ignore — nothing load-bearing depends on recents */
  }
}
