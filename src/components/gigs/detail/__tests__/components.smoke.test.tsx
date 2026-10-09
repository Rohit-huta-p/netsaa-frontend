// Mount-smoke for the A·Minimal leaf components now rendered live by
// GigDetails (header, tabs, producer panel, sticky apply). Catches runtime
// crashes that tsc + the DetailsTab/VM suites don't cover.

import React from 'react';
import { render } from '@testing-library/react-native';
import { buildGigDetailVM } from '../gigDetailVM';
import { GigHeaderBlock } from '../GigHeaderBlock';
import { GigTabs } from '../GigTabs';
import { ProducerPanel } from '../ProducerPanel';
import { StickyApply } from '../StickyApply';

const gig = {
  _id: 'g1',
  title: 'Contemporary fusion duo',
  organizerSnapshot: {
    displayName: 'Aditi Rao',
    organizationName: 'Rhythm House Events',
    rating: 4.9,
    gigsHosted: 41,
    avgReplyMinutes: 120,
    isVerified: true,
  },
  location: { city: 'Pune', state: 'MH' },
  artistTypes: ['Dancer'],
  headcount: 2,
  schedule: { startDate: '2026-05-12', endDate: '2026-05-13' },
  compensation: { amount: 18000, currency: 'INR', negotiable: true, model: 'fixed', perks: ['Travel'] },
  stats: { applications: 14 },
  applicationDeadline: new Date(Date.now() + 6 * 864e5).toISOString(),
  viewerContext: { saved: false },
};
const noop = () => {};

describe('gig-detail leaf components mount without crashing', () => {
  const vm = buildGigDetailVM(gig);

  it('GigHeaderBlock renders the gig title', () => {
    const { getByText } = render(
      <GigHeaderBlock vm={vm} onBack={noop} onShare={noop} onToggleSave={noop} saved={false} />
    );
    expect(getByText('Contemporary fusion duo')).toBeTruthy();
  });

  it('GigTabs renders Details / Producer / Discussion', () => {
    const { getByText } = render(<GigTabs value="details" onChange={noop} />);
    expect(getByText('Details')).toBeTruthy();
    expect(getByText('Producer')).toBeTruthy();
    expect(getByText('Discussion')).toBeTruthy();
  });

  it('ProducerPanel mounts', () => {
    expect(() => render(<ProducerPanel vm={vm} onViewProfile={noop} />)).not.toThrow();
  });

  it('StickyApply mounts in each state', () => {
    expect(() => {
      render(<StickyApply hasApplied={false} deadlinePassed={false} onApply={noop} bottomInset={16} />);
      render(<StickyApply hasApplied deadlinePassed={false} onApply={noop} bottomInset={16} />);
      render(<StickyApply hasApplied={false} deadlinePassed onApply={noop} bottomInset={16} />);
    }).not.toThrow();
  });
});
