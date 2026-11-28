/**
 * HostOnlyZone render + interaction smoke test. Confirms the host-only zone mounts
 * (no crash), surfaces the P2 rows from the hydrated store, opens a focused sheet, and
 * that a sheet/inline commit routes through host.scheduleSave. The actual persistence is
 * covered by diffPayload/useEventEdit tests + the live read-back; this guards the wiring.
 *
 * CalendarModal is mocked out — its native date-picker deps aren't needed to test the zone.
 */
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';

jest.mock('@/components/ui/CalendarModal', () => ({ CalendarModal: () => null }));

import { useComposerStoreV4 } from '@/components/events/composer/v4/useComposerStoreV4';
import { eventToForm } from '@/components/events/composer/v4/composerForm';
import HostOnlyZone from '../HostOnlyZone';

const paidEvent = {
  _id: 'evt-1',
  title: 'Kathak Foundations',
  registrationMode: 'paid_ticket',
  spots: [{ _id: 'real-spot', name: 'General', capacity: 24, price: 4500 }],
  pricing: { amount: 4500 },
  eligibleArtistTypes: ['Dancer'],
  registration: { door: 'open', questions: [] },
  visibility: 'public',
  ageRestriction: 0,
} as any;

function hydrate(ev: any) {
  useComposerStoreV4.getState().hydrate(eventToForm(ev), ev._id);
}

const host = { scheduleSave: jest.fn(), saveDeadline: jest.fn() };

beforeEach(() => {
  host.scheduleSave.mockReset();
  host.saveDeadline.mockReset();
  useComposerStoreV4.getState().reset();
});

describe('HostOnlyZone', () => {
  it('renders the host-only rows from the hydrated store', () => {
    hydrate(paidEvent);
    render(<HostOnlyZone host={host as any} event={paidEvent} />);
    expect(screen.getByText('Only you see this')).toBeTruthy();
    expect(screen.getByText('Event type')).toBeTruthy();
    expect(screen.getByText('How people get in')).toBeTruthy();
    expect(screen.getByText('Registration deadline')).toBeTruthy();
    expect(screen.getByText('Who can see it')).toBeTruthy();
    // paid → the refund row shows
    expect(screen.getByText('Refund policy')).toBeTruthy();
  });

  it('hides the refund row for a free event', () => {
    hydrate({ ...paidEvent, registrationMode: 'free_rsvp', pricing: undefined, spots: [{ _id: 's', name: 'Seats', capacity: 20, price: 0 }] });
    render(<HostOnlyZone host={host as any} event={{ ...paidEvent, registrationMode: 'free_rsvp' }} />);
    expect(screen.queryByText('Refund policy')).toBeNull();
  });

  it('opens the event-type sheet and committing a preset calls scheduleSave', () => {
    hydrate(paidEvent);
    render(<HostOnlyZone host={host as any} event={paidEvent} />);
    fireEvent.press(screen.getByLabelText('Edit Event type'));
    // sheet is open — a preset option is now visible
    const option = screen.getByText('Masterclass');
    expect(option).toBeTruthy();
    fireEvent.press(option);
    expect(host.scheduleSave).toHaveBeenCalled();
    // the store reflects the pick
    expect(useComposerStoreV4.getState().form.eventType).toBe('masterclass');
  });

  it('changing the door inline commits via scheduleSave', () => {
    hydrate(paidEvent);
    render(<HostOnlyZone host={host as any} event={paidEvent} />);
    fireEvent.press(screen.getByText('Guest list'));
    expect(host.scheduleSave).toHaveBeenCalled();
    expect(useComposerStoreV4.getState().form.door).toBe('guest_list');
  });

  it('clearing the deadline calls saveDeadline(null)', () => {
    hydrate(paidEvent);
    render(<HostOnlyZone host={host as any} event={{ ...paidEvent, registrationDeadline: '2026-03-12T00:00:00.000Z' }} />);
    fireEvent.press(screen.getByLabelText('Remove deadline'));
    expect(host.saveDeadline).toHaveBeenCalledWith(null);
  });
});
