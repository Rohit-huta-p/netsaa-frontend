/**
 * useEventEdit — the auto-save loop. These drive the controller setters directly and
 * assert the save behaviour that only shows up against a backend (the UI harness could
 * only exercise the failing-save path). They cover the three success-path defects:
 *   · no save fires on hydrate (empty diff),
 *   · a refetch landing mid-edit does NOT swallow the pending edit (base is not reset),
 *   · a 4xx revert keeps the real spot _id (reverts from the form, not the payload),
 * plus a title edit sending just {title} and the unmount flush.
 */
import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@/services/eventService', () => ({
  __esModule: true,
  eventService: { update: jest.fn() },
}));

import { eventService } from '@/services/eventService';
import { useComposerStoreV4 } from '@/components/events/composer/v4/useComposerStoreV4';
import { useEventEdit } from '../useEventEdit';

const mockUpdate = eventService.update as jest.Mock;

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};

const baseEvent = () => ({
  _id: 'evt-1',
  title: 'Kathak Foundations',
  tagline: 'Rhythm',
  about: 'About text',
  registrationMode: 'paid_ticket',
  spots: [{ _id: 'real-spot-id', name: 'General', capacity: 24, price: 4500 }],
  pricing: { amount: 4500 },
  included: ['A'],
  lineup: [{ title: 'Day 1' }],
  visibility: 'public',
});

/** Fire the debounce and flush the save's promise chain (then + finally). */
const flush = async () => {
  await act(async () => {
    jest.advanceTimersByTime(700);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
};

beforeEach(() => {
  mockUpdate.mockReset().mockResolvedValue({});
  useComposerStoreV4.getState().reset();
  jest.useFakeTimers();
});
afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('useEventEdit', () => {
  it('does not save on hydrate (empty diff)', async () => {
    renderHook(() => useEventEdit('evt-1', baseEvent() as any), { wrapper });
    await flush();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('a title edit sends only { title }', async () => {
    const { result } = renderHook(() => useEventEdit('evt-1', baseEvent() as any), { wrapper });
    act(() => result.current.controller.setTitle('New Title'));
    await flush();
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith('evt-1', { title: 'New Title' });
  });

  it('a refetch landing mid-edit does not swallow the pending edit', async () => {
    const { result, rerender } = renderHook<ReturnType<typeof useEventEdit>, { ev: any }>(
      ({ ev }) => useEventEdit('evt-1', ev as any),
      { wrapper, initialProps: { ev: baseEvent() } },
    );
    // edit tagline, but the debounce has NOT fired yet
    act(() => result.current.controller.setTagline('TG'));
    // a refetch lands — new `event` identity re-runs the hydrate effect
    act(() => rerender({ ev: { ...baseEvent() } }));
    // the pending tagline edit must still be sent (base was not reset by the refetch)
    await flush();
    expect(mockUpdate).toHaveBeenCalledWith('evt-1', { tagline: 'TG' });
  });

  it('stays "saved" after a successful save + refetch', async () => {
    const { result, rerender } = renderHook<ReturnType<typeof useEventEdit>, { ev: any }>(
      ({ ev }) => useEventEdit('evt-1', ev as any),
      { wrapper, initialProps: { ev: baseEvent() } },
    );
    act(() => result.current.controller.setAbout('changed'));
    await flush();
    expect(result.current.saveState).toBe('saved');
    act(() => rerender({ ev: { ...baseEvent(), about: 'changed' } })); // refetch
    expect(result.current.saveState).toBe('saved'); // not flipped back to idle
  });

  it('a 4xx reverts without corrupting the spot id', async () => {
    mockUpdate.mockReset().mockRejectedValueOnce({ response: { status: 400 } });
    const { result } = renderHook(() => useEventEdit('evt-1', baseEvent() as any), { wrapper });
    act(() => result.current.controller.setAbout('bad about'));
    await flush();
    expect(result.current.saveState).toBe('error');
    // reverted from the form snapshot → the real spot _id survives (not 'spot-0')
    expect(useComposerStoreV4.getState().form.spots[0].id).toBe('real-spot-id');
    expect(useComposerStoreV4.getState().form.about).toBe('About text'); // reverted
  });

  it('flushes a pending edit on unmount, then resets the store', async () => {
    const { result, unmount } = renderHook(() => useEventEdit('evt-1', baseEvent() as any), { wrapper });
    act(() => result.current.controller.setTitle('Flushed'));
    act(() => unmount()); // before the debounce fires
    expect(mockUpdate).toHaveBeenCalledWith('evt-1', { title: 'Flushed' });
    expect(useComposerStoreV4.getState().editEventId).toBeNull(); // reset ran after the flush
  });

  // ── host-only zone / focused sheets (P2) ──

  it('a host-zone sheet edit commits via host.scheduleSave (visibility → whitelist)', async () => {
    const { result } = renderHook(() => useEventEdit('evt-1', baseEvent() as any), { wrapper });
    act(() => {
      useComposerStoreV4.getState().update('visibility', 'unlisted');
      result.current.host.scheduleSave();
    });
    await flush();
    expect(mockUpdate).toHaveBeenCalledWith('evt-1', { visibility: 'unlisted' });
  });

  it('an event-type change is escorted so it routes to the composer path (eventType + openToAll)', async () => {
    const { result } = renderHook(() => useEventEdit('evt-1', baseEvent() as any), { wrapper });
    act(() => {
      useComposerStoreV4.getState().setEventType('masterclass');
      result.current.host.scheduleSave();
    });
    await flush();
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    const [, body] = mockUpdate.mock.calls[0];
    expect(body.eventType).toBe('masterclass');
    expect(body).toHaveProperty('openToAll'); // forces buildComposerUpdate (else eventType is dropped)
  });

  it('a details edit sends skillLevel + topicTags together, with no tags and no sentinel', async () => {
    const { result } = renderHook(() => useEventEdit('evt-1', baseEvent() as any), { wrapper });
    act(() => {
      const st = useComposerStoreV4.getState();
      st.update('levels', ['beginner']);
      st.update('styles', ['Kathak']);
      result.current.host.scheduleSave();
    });
    await flush();
    const [, body] = mockUpdate.mock.calls[0];
    expect(body).toHaveProperty('skillLevel', ['beginner']);
    expect(body).toHaveProperty('topicTags', ['Kathak']);
    expect(body).not.toHaveProperty('tags');       // the backend mirrors tags←topicTags
    expect(body).not.toHaveProperty('openToAll');  // skillLevel already routes to the composer path
  });

  it('saveDeadline sends a direct { registrationDeadline } PATCH (not through the diff loop)', async () => {
    const { result } = renderHook(() => useEventEdit('evt-1', baseEvent() as any), { wrapper });
    act(() => result.current.host.saveDeadline('2026-03-12T00:00:00.000Z'));
    await flush();
    expect(mockUpdate).toHaveBeenCalledWith('evt-1', { registrationDeadline: '2026-03-12T00:00:00.000Z' });
  });

  it('saveDeadline(null) clears the deadline', async () => {
    const { result } = renderHook(() => useEventEdit('evt-1', baseEvent() as any), { wrapper });
    act(() => result.current.host.saveDeadline(null));
    await flush();
    expect(mockUpdate).toHaveBeenCalledWith('evt-1', { registrationDeadline: null });
  });

  // ── guards: a transient invalid value must never be committed by a sheet-close / flush ──

  it('never PATCHes a 0 price for a paid event (transient clear + commit)', async () => {
    const { result } = renderHook(() => useEventEdit('evt-1', baseEvent() as any), { wrapper });
    act(() => {
      const st = useComposerStoreV4.getState();
      st.updateSpot(st.form.spots[0].id, { price: 0 }); // host clears the price box
      result.current.host.scheduleSave();                // a sheet close / any commit fires the save
    });
    await flush();
    const sentZeroPrice = mockUpdate.mock.calls.some(([, body]: any) => (body.spots || []).some((sp: any) => sp.price === 0));
    expect(sentZeroPrice).toBe(false);
  });

  it('never PATCHes a capacity below 1 (transient clear + commit)', async () => {
    const { result } = renderHook(() => useEventEdit('evt-1', baseEvent() as any), { wrapper });
    act(() => {
      const st = useComposerStoreV4.getState();
      st.updateSpot(st.form.spots[0].id, { capacity: 0 });
      result.current.host.scheduleSave();
    });
    await flush();
    const sentZeroCap = mockUpdate.mock.calls.some(([, body]: any) => (body.spots || []).some((sp: any) => (sp.capacity ?? 0) < 1));
    expect(sentZeroCap).toBe(false);
  });

  it('a custom refund note hydrates as Custom (not misread as Flexible)', () => {
    const ev = { ...baseEvent(), cancellationPolicy: { notes: 'Full refund up to 7 days before, then 50% after.' } };
    renderHook(() => useEventEdit('evt-1', ev as any), { wrapper });
    expect(useComposerStoreV4.getState().form.refundPolicy).toBe('custom');
    expect(useComposerStoreV4.getState().form.refundNote).toContain('7 days');
  });
});
