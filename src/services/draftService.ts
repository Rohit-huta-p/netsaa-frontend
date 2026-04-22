/**
 * Client-local draft service for gig application drafts.
 *
 * Storage: AsyncStorage under `@netsa/drafts/applications/v1` (bumped keys
 * mean the client can evolve the shape without migrating old data — just
 * change the suffix).
 *
 * Per Plan 2 scope: server-side drafts collection is OUT (post-MVP). Drafts
 * are device-local only. If the user reinstalls or switches devices, drafts
 * are lost.
 *
 * Concurrency policy: last-write-wins. Two in-flight upserts for the same
 * draftId will resolve in arrival order; the second one overwrites the
 * first. Adequate for a single user on a single device.
 *
 * Corruption handling: if the stored JSON is unreadable, `list()` returns
 * [] and logs a console warning. We do NOT throw — preserving dashboard
 * render is more important than the drafts subsystem.
 *
 * ID generation note: expo-crypto is not installed in this repo
 * (see package.json). Using Math.random() + timestamp. That is fine for
 * single-device local identifiers — collisions are vanishingly unlikely
 * and the blast radius is one overwritten draft. When we add multi-device
 * sync (post-MVP), swap in `Crypto.randomUUID()` from expo-crypto.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const DRAFTS_STORAGE_KEY = '@netsa/drafts/applications/v1';

export interface ApplicationDraft {
  /** Stable local id generated at creation time. */
  draftId: string;
  /** Gig this draft targets. */
  gigId: string;
  /** Snapshot of gig title at save time (cheap display — avoids a lookup). */
  gigTitle?: string;
  /** Free-text pitch. */
  pitch?: string;
  /** Quoted rate in INR. */
  quotedRate?: number;
  /** Availability dates (ISO strings). */
  availability?: string[];
  /** ISO timestamp of last edit. */
  updatedAt: string;
}

/**
 * Generate a locally unique draft id.
 * Not a cryptographic UUID — this is a device-local identifier.
 */
export function generateDraftId(): string {
  const now = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `draft_${now}_${rand}`;
}

async function readAll(): Promise<ApplicationDraft[]> {
  try {
    const raw = await AsyncStorage.getItem(DRAFTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn(
        `[draftService] Stored drafts were not an array; resetting. got=${typeof parsed}`
      );
      return [];
    }
    return parsed as ApplicationDraft[];
  } catch (err) {
    console.warn('[draftService] Corrupted drafts JSON, returning []:', err);
    return [];
  }
}

async function writeAll(drafts: ApplicationDraft[]): Promise<void> {
  await AsyncStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
}

export const draftService = {
  /** List all drafts. Returns [] on empty or corrupted storage. */
  list(): Promise<ApplicationDraft[]> {
    return readAll();
  },

  /** Fetch one draft by id. Returns null if missing. */
  async get(draftId: string): Promise<ApplicationDraft | null> {
    const all = await readAll();
    return all.find((d) => d.draftId === draftId) ?? null;
  },

  /** Insert or replace a draft (matched by draftId). */
  async upsert(draft: ApplicationDraft): Promise<void> {
    const all = await readAll();
    const idx = all.findIndex((d) => d.draftId === draft.draftId);
    if (idx === -1) {
      all.push(draft);
    } else {
      all[idx] = draft;
    }
    await writeAll(all);
  },

  /** Remove a draft by id. No-op if missing. */
  async remove(draftId: string): Promise<void> {
    const all = await readAll();
    const next = all.filter((d) => d.draftId !== draftId);
    if (next.length !== all.length) {
      await writeAll(next);
    }
  },

  /** Wipe every draft. */
  async clear(): Promise<void> {
    await AsyncStorage.removeItem(DRAFTS_STORAGE_KEY);
  },
};
