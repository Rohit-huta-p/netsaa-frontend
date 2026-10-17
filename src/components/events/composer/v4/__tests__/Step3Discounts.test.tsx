import React from 'react';
import { render } from '@testing-library/react-native';

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

describe('Step3 — discounts as toggle sections', () => {
  it('shows Early bird + Group rates toggles, no generic "Add a discount"; collapsed when off', () => {
    seedPaid();
    const { queryByText, queryByLabelText } = render(<Step3Spots />);
    expect(queryByLabelText('Early bird')).toBeTruthy();   // toggle switch
    expect(queryByLabelText('Group rates')).toBeTruthy();
    expect(queryByText('Add a discount')).toBeNull();      // removed — you toggle on instead
    expect(queryByText('Price each')).toBeNull();          // early bird off → no inputs
    expect(queryByText('Add a tier')).toBeNull();          // group off → no ladder
  });

  it('early bird on → price input; group on → a tier row + Add a tier', () => {
    seedPaid([
      { id: 'eb', name: 'Early bird', audience: 'everyone', price: 400, seatLimit: 20 },
      { id: 'g1', name: 'Group rate', audience: 'group', minSeats: 2, price: 450 },
    ]);
    const { queryByText } = render(<Step3Spots />);
    expect(queryByText('Price each')).toBeTruthy();  // early bird expanded
    expect(queryByText('+ people')).toBeTruthy();    // one group tier row
    expect(queryByText('Add a tier')).toBeTruthy();
  });

  it('no discounts UI on a free event', () => {
    const s = useComposerStoreV4.getState();
    s.reset('workshop');
    s.update('paid', false);
    const { queryByLabelText, queryByText } = render(<Step3Spots />);
    expect(queryByLabelText('Early bird')).toBeNull();
    expect(queryByText('Discounts')).toBeNull();
  });
});
