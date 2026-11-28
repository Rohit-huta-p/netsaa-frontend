/**
 * useEventEdit — the plumbing behind the event "Edit in Preview" surface (P0).
 *
 * Hydrates the shared v4 composer store once from the event, exposes a per-field
 * controller the detail components bind their inline inputs to, and auto-saves each
 * change: debounced, as a DIFF (not the full payload — see diffPayload.ts), single-
 * flight with a trailing coalesce, optimistic (the inputs are store-bound, so the host
 * sees edits instantly; nothing else on the edit page renders these fields). On a 4xx
 * the field reverts to its last-saved value; on a transient error the text is kept and
 * the caller can retry. On unmount the pending save is flushed before the store resets.
 *
 * Reuse (all pre-built): useComposerStoreV4 (hydrate/update/updateSpot/editEventId),
 * eventToForm + buildEventPayload (composerForm), eventService.update (PATCH).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useComposerStoreV4 } from '@/components/events/composer/v4/useComposerStoreV4';
import {
  eventToForm, buildEventPayload, type LineupItemV4, type ComposerFormV4, type MediaItemV4,
} from '@/components/events/composer/v4/composerForm';
import { eventService, type EventDoc } from '@/services/eventService';
import { eventKeys } from '@/hooks/useEvents';
import { buildEventPatch } from './diffPayload';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/** The commit handles the host-only zone + focused sheets (P2/P3) bind to. The
 *  sheets mutate the shared composer store directly (reusing the composer's own
 *  inputs), then call `scheduleSave` to run the same debounced diff save the inline
 *  fields use. `saveDeadline` is the one field with no composer-form home — it's a
 *  direct narrow PATCH, orthogonal to buildEventPayload. */
export interface HostEditController {
  /** After mutating the store, schedule the debounced diff save (idempotent). */
  scheduleSave: () => void;
  /** Registration deadline — a direct `{ registrationDeadline }` PATCH (not in the
   *  composer form). Optimistically updates the detail cache the host row reads. */
  saveDeadline: (iso: string | null) => void;
}

/** The values + commit callbacks the inline editors bind to. P1 fields only. */
export interface EventEditController {
  title: string;
  tagline: string;
  about: string;
  paid: boolean;
  price: number;
  /** Inline price editing is safe only for a single-ticket event. A tiered event
   *  (General/VIP) folds to one spot in the form, so a price PATCH would overwrite
   *  the tiers — those are edited via the P3 spots/discounts sheet instead. */
  priceEditable: boolean;
  included: string[];
  lineup: LineupItemV4[];
  setTitle: (v: string) => void;
  setTagline: (v: string) => void;
  setAbout: (v: string) => void;
  setPrice: (v: number) => void;
  setIncludedAt: (i: number, v: string) => void;
  addIncluded: () => void;
  removeIncludedAt: (i: number) => void;
  setLineupTitleAt: (i: number, v: string) => void;
  addLineup: () => void;
  removeLineupAt: (i: number) => void;
}

const DEBOUNCE_MS = 700;

/**
 * eventToForm + the fix-ups the edit surface needs on top of the composer's own mapper.
 * `eventToForm`'s refund heuristic only flags 'custom' when the stored policy carries a
 * partial-refund window, so a custom policy with JUST a note rehydrates as 'flex_24h' —
 * which shows the wrong policy AND lets a later date edit overwrite the host's note (a
 * paid flex_24h event re-derives cancellationPolicy from the start date). Treat any note
 * that isn't the canned flex/firm text as a custom policy.
 *
 * Also seed a multi-day `endsAt`: the event doc has no top-level endsAt (the end lives in
 * `schedule.endDate`), so `eventToForm` hydrates endsAt: null. Without this, the date-group
 * escort can't carry the end and a later date edit would collapse a multi-day event to
 * start + duration. Seed it only when schedule.endDate falls on a LATER day.
 *
 * ⚠️ Media must rehydrate LOSSLESSLY. `media` is one array, and events-service deletes any
 * stored item that a later PATCH's media[] omits (diffRemovedEventMedia → S3/Mux cleanup).
 * `buildEventPayload` → `buildMedia` only keeps a video with `status === 'ready'` and a single
 * `isHero` image, so `eventToForm`'s output would silently drop (a) a stored reel whose status
 * wasn't persisted as 'ready' and (b) any 2nd+ hero image — and the host's next unrelated media
 * edit would then DESTROY those untouched assets. Re-derive cover/photos/videos straight off
 * `event.media` so every stored item survives the round-trip: a reel with a muxPlaybackId is
 * treated as ready, and every image except the chosen cover becomes a photo (stray heroes incl.).
 */
export function hydrateForm(event: any) {
  const form = eventToForm(event);
  const cp = event?.cancellationPolicy;
  if (form.refundPolicy === 'flex_24h' && cp && typeof cp.notes === 'string' && cp.notes.trim()
    && !/full refund up to 24h/i.test(cp.notes) && !/no refund/i.test(cp.notes)) {
    form.refundPolicy = 'custom';
  }
  const start = form.startsAt ? new Date(form.startsAt) : null;
  const end = event?.schedule?.endDate ? new Date(event.schedule.endDate) : null;
  if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start && end.toDateString() !== start.toDateString()) {
    form.endsAt = end.toISOString();
  }

  const media: MediaItemV4[] = Array.isArray(event?.media) ? event.media : [];
  const imgs = media.filter((m) => m?.kind !== 'video');          // undefined kind = legacy photo
  const heroIdx = imgs.findIndex((m) => m?.isHero);
  form.cover = heroIdx >= 0 ? imgs[heroIdx] : null;
  form.photos = imgs.filter((_, i) => i !== heroIdx);             // every non-cover image survives
  form.videos = media
    .filter((m) => m?.kind === 'video')
    .map((v) => (v?.muxPlaybackId ? { ...v, status: 'ready' as const } : v)); // a persisted reel is ready

  return form;
}

export function useEventEdit(id: string, event: EventDoc | undefined) {
  const qc = useQueryClient();
  const form = useComposerStoreV4((s) => s.form);
  const update = useComposerStoreV4((s) => s.update);
  const updateSpot = useComposerStoreV4((s) => s.updateSpot);
  const hydrate = useComposerStoreV4((s) => s.hydrate);

  const [saveState, setSaveState] = useState<SaveState>('idle');

  const baseRef = useRef<Record<string, any> | null>(null); // last-saved payload snapshot
  const baseFormRef = useRef<ComposerFormV4 | null>(null);  // last-saved FORM (4xx reverts from this — keeps spot _ids, unlike re-deriving from the payload)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);   // a PATCH is in flight
  const trailingRef = useRef(false); // an edit landed during an in-flight PATCH

  // Hydrate + seed the base ONCE — keyed on the store's editEventId (never a local
  // boolean), so a stray reset (e.g. fast refresh) re-hydrates instead of leaving a
  // blank form. A plain refetch gives `event` a new identity and re-runs this effect;
  // it must NOT reset the base or the "saved" state, or an edit made between a save and
  // its refetch would be absorbed into the base and never sent (and the bar would flip
  // "saved" → "idle").
  useEffect(() => {
    if (!event) return;
    const st = useComposerStoreV4.getState();
    if (st.editEventId !== id) {
      hydrate(hydrateForm(event), id);
      const form = useComposerStoreV4.getState().form;
      baseRef.current = buildEventPayload(form);
      baseFormRef.current = form;
      setSaveState('idle');
    } else if (baseRef.current === null) {
      // Store already hydrated for this id but the base was lost (hook remount) —
      // re-seed the base from what's there, without touching the save state.
      const form = st.form;
      baseRef.current = buildEventPayload(form);
      baseFormRef.current = form;
    }
  }, [event, id, hydrate]);

  const runSave = useCallback(() => {
    const st = useComposerStoreV4.getState();
    if (st.editEventId !== id || !baseRef.current) return;       // not our event — bail
    if (savingRef.current) { trailingRef.current = true; return; } // single-flight

    const sentForm = st.form;                                   // the form as of this send
    const next = buildEventPayload(sentForm);
    const { body, advance } = buildEventPatch(baseRef.current, next);
    if (advance.length === 0) {                                  // nothing to save
      setSaveState((s) => (s === 'saving' ? 'saved' : s));
      return;
    }

    savingRef.current = true;
    setSaveState('saving');
    eventService
      .update(id, body as any)
      .then(() => {
        // advance ONLY the keys we actually sent — a dropped blank title or an
        // injected routing sentinel must not be recorded as saved.
        for (const k of advance) baseRef.current![k] = next[k];
        baseFormRef.current = sentForm;                          // ...and the matching form
        setSaveState('saved');
        qc.invalidateQueries({ queryKey: eventKeys.detail(id) });
      })
      .catch((e: any) => {
        const status = e?.response?.status;
        if (status >= 400 && status < 500 && baseFormRef.current) {
          // permanent (validation) — a retry can't help; revert to the last-saved FORM
          // (not re-derived from the payload, which would lose spot _ids).
          hydrate(baseFormRef.current, id);
          setSaveState('error');
        } else {
          // transient (network/5xx) — keep the host's text, allow retry.
          setSaveState('error');
        }
      })
      .finally(() => {
        savingRef.current = false;
        if (trailingRef.current) { trailingRef.current = false; runSave(); }
      });
  }, [id, qc, hydrate]);

  const schedule = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(runSave, DEBOUNCE_MS);
  }, [runSave]);

  // Registration deadline is the one editable field with no composer-form home, so
  // it rides its own narrow PATCH ({ registrationDeadline }) instead of the diff loop
  // — orthogonal to buildEventPayload, so it never touches the base snapshot. The
  // detail cache is updated optimistically (the host row reads event.registrationDeadline)
  // and rolled back on failure.
  const saveDeadline = useCallback((iso: string | null) => {
    const key = eventKeys.detail(id);
    const prev = qc.getQueryData<EventDoc>(key);
    qc.setQueryData<EventDoc>(key, (old) => (old ? { ...old, registrationDeadline: iso ?? undefined } : old));
    setSaveState('saving');
    eventService
      .update(id, { registrationDeadline: iso } as any)
      .then(() => {
        setSaveState('saved');
        qc.invalidateQueries({ queryKey: key });
      })
      .catch(() => {
        if (prev !== undefined) qc.setQueryData(key, prev); // roll back the optimistic write
        setSaveState('error');
      });
  }, [id, qc]);

  // Unmount: flush the pending edit, cancel the timer, then reset the shared store so
  // a later composer-create starts clean. The flush reads the form BEFORE reset and
  // fires fire-and-forget (the hook is unmounting), bailing unless it's still our event.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      const st = useComposerStoreV4.getState();
      if (st.editEventId === id && baseRef.current) {
        const { body, advance } = buildEventPatch(baseRef.current, buildEventPayload(st.form));
        if (advance.length) {
          eventService.update(id, body as any)
            .then(() => qc.invalidateQueries({ queryKey: eventKeys.detail(id) }))
            .catch(() => {});
        }
      }
      useComposerStoreV4.getState().reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const spotId = form.spots[0]?.id;
  // Multi-ticket (tiered) events fold to one spot in the form, so inline price editing
  // would overwrite the tiers — read the ORIGINAL event's spot count, not the form's.
  const priceEditable = (event?.spots?.length ?? 0) <= 1;
  const controller = useMemo<EventEditController>(() => ({
    title: form.title,
    tagline: form.tagline ?? '',
    about: form.about,
    paid: form.paid,
    price: form.spots[0]?.price ?? 0,
    priceEditable,
    included: form.included,
    lineup: form.lineup,
    // Title is the event's name — never PATCH it empty (the backend rejects it, and
    // clearing-to-retype would otherwise trigger a 4xx revert mid-edit).
    setTitle: (v) => { update('title', v); if (v.trim()) schedule(); },
    setTagline: (v) => { update('tagline', v); schedule(); },
    setAbout: (v) => { update('about', v); schedule(); },
    setPrice: (v) => {
      const n = Math.max(0, Math.floor(v || 0));
      if (spotId) updateSpot(spotId, { price: n });
      if (n >= 1) schedule();            // don't PATCH a transient/invalid 0 for a paid event
    },
    setIncludedAt: (i, v) => { update('included', form.included.map((x, j) => (j === i ? v : x))); schedule(); },
    addIncluded: () => { update('included', [...form.included, '']); /* no save until it has text */ },
    removeIncludedAt: (i) => { update('included', form.included.filter((_, j) => j !== i)); schedule(); },
    setLineupTitleAt: (i, v) => { update('lineup', form.lineup.map((x, j) => (j === i ? { ...x, title: v } : x))); schedule(); },
    addLineup: () => { update('lineup', [...form.lineup, { title: '' }]); /* no save until it has a title */ },
    removeLineupAt: (i) => { update('lineup', form.lineup.filter((_, j) => j !== i)); schedule(); },
  }), [form, update, updateSpot, schedule, spotId, priceEditable]);

  // The host-only zone + focused sheets commit through this: they mutate the shared
  // composer store with the composer's own inputs, then `scheduleSave`.
  const host = useMemo<HostEditController>(() => ({
    scheduleSave: schedule,
    saveDeadline,
  }), [schedule, saveDeadline]);

  return { controller, host, saveState, retry: runSave };
}
