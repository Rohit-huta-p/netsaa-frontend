import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('@/components/ui/CalendarModal', () => ({ CalendarModal: () => null }));

import Step3Spots from '../steps/Step3Spots';
import { useComposerStoreV4 } from '../useComposerStoreV4';

const seedPaid = (offers?: any[]) => {
  const s = useComposerStoreV4.getState();
  s.reset('workshop');
  s.update('paid', true);
  const id = useComposerStoreV4.getState().form.spots[0].id;
  s.updateSpot(id, { price: 500, capacity: 30 });
  if (offers) s.update('offers', offers);
};

describe('Step3 — Discounts list + separate Group rates', () => {
  it('offers an "Add a discount" button and a Group rates toggle; nothing expanded by default', () => {
    seedPaid();
    const { queryByText, queryByLabelText } = render(<Step3Spots />);
    expect(queryByText('Add a discount')).toBeTruthy();   // the add button for multiple discounts (#1)
    expect(queryByLabelText('Group rates')).toBeTruthy(); // separate section with its own toggle (#3)
    expect(queryByText('Price each')).toBeNull();         // no discount cards yet
    expect(queryByText('Add a tier')).toBeNull();         // group rates off
  });

  it('a seeded discount is a collapsed accordion — summary shows, fields appear only when expanded (#1 + #2)', () => {
    seedPaid([{ id: 'd1', name: 'Early bird', audience: 'everyone', price: 400, endsAt: null, seatLimit: 20 }]);
    const { getByText, queryByText } = render(<Step3Spots />);
    // collapsed: the name is visible, the editable fields are hidden
    expect(getByText('Early bird')).toBeTruthy();
    expect(queryByText('Price each')).toBeNull();
    expect(queryByText('First N tickets (optional)')).toBeNull();
    // expand → the fields (price, deadline #2, first-N) appear
    fireEvent.press(getByText('Early bird'));
    expect(queryByText('Price each')).toBeTruthy();
    expect(queryByText('Ends on')).toBeTruthy();
    expect(queryByText('No deadline')).toBeTruthy();
    expect(queryByText('First N tickets (optional)')).toBeTruthy();
    // collapse again → fields hidden
    fireEvent.press(getByText('Early bird'));
    expect(queryByText('Price each')).toBeNull();
  });

  it('pressing "Add a discount" creates a card already expanded for editing', () => {
    seedPaid();
    const { getByText, queryByText } = render(<Step3Spots />);
    expect(queryByText('Price each')).toBeNull();
    fireEvent.press(getByText('Add a discount'));
    expect(queryByText('Price each')).toBeTruthy(); // the new accordion auto-opens
  });

  it('group rates on → a tier row + Add a tier, independent of the discount list', () => {
    seedPaid([{ id: 'g1', name: 'Group rate', audience: 'group', minSeats: 2, price: 450 }]);
    const { queryByText } = render(<Step3Spots />);
    expect(queryByText('+ people')).toBeTruthy();
    expect(queryByText('Add a tier')).toBeTruthy();
  });

  it('no discounts / group UI on a free event', () => {
    const s = useComposerStoreV4.getState();
    s.reset('workshop');
    s.update('paid', false);
    const { queryByText, queryByLabelText } = render(<Step3Spots />);
    expect(queryByText('Add a discount')).toBeNull();
    expect(queryByLabelText('Group rates')).toBeNull();
  });
});
