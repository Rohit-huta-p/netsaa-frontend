import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import YourStageArtist from '../YourStageArtist';

jest.mock('@/hooks/useUpcoming', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    data: [
      { type: 'gig', id: 'g1', title: 'Sangeet Sandhya — opening Kathak set', date: '2026-05-24T19:30:00+05:30', location: 'Pune' },
      { type: 'event', id: 'e1', title: 'Pune Dance Collective workshop', date: '2026-05-18T16:00:00+05:30', location: 'Sahyog Auditorium' },
    ],
    isLoading: false,
  })),
  useUpcoming: jest.fn(),
}));

jest.mock('@/hooks/useApplications', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    data: [
      { _id: 'a1', status: 'shortlisted', gig: { title: 'Choreographer · Bollywood ad shoot' } },
      { _id: 'a2', status: 'applied',     gig: { title: 'Kathak duet — corporate showcase' } },
      { _id: 'a3', status: 'offered',     gig: { title: 'Marathi feature film', payRupees: 35000 }, offerExpiresAt: '2026-05-22T10:00:00Z' },
    ],
    isLoading: false,
  })),
}));

// The component reads `savedItems` (type-tagged) + `historyItems` — mock those,
// not the older savedGigs/savedEvents/pastEvents keys the hook no longer exposes.
jest.mock('@/hooks/useSavedItems', () => ({
  __esModule: true,
  useSavedItems: jest.fn(() => ({
    savedItems: [
      { _id: 'sg1', type: 'GIG', title: 'Feature film · classical lead' },
      { _id: 'se1', type: 'EVENT', title: 'Birju Maharaj masterclass' },
    ],
    historyItems: [{ _id: 'pe1', title: 'Pune Diwali Mela · main stage' }],
  })),
}));

describe('YourStageArtist (smoke)', () => {
  it('renders the section title and primary toggle counts', () => {
    const { getByText } = render(<YourStageArtist />);
    expect(getByText("What you're in.")).toBeTruthy();
    expect(getByText(/GIGS · 5/)).toBeTruthy();   // 1 booked + 3 applied + 1 saved
    expect(getByText(/EVENTS · 3/)).toBeTruthy(); // 1 registered + 1 saved + 1 past
  });

  it('GIGS (default stage) shows Booked / Applied / Saved sub-tabs', () => {
    const { getByText } = render(<YourStageArtist />);
    expect(getByText('BOOKED')).toBeTruthy();
    expect(getByText('APPLIED')).toBeTruthy();
    expect(getByText('SAVED')).toBeTruthy();
  });

  it('switches to EVENTS and shows Registered / Saved / Past sub-tabs', () => {
    const { getByText } = render(<YourStageArtist />);
    fireEvent.press(getByText(/EVENTS · 3/));
    expect(getByText('REGISTERED')).toBeTruthy();
    expect(getByText('SAVED')).toBeTruthy();
    expect(getByText('PAST')).toBeTruthy();
  });

  it('APPLIED sub-tab surfaces the applications list', () => {
    const { getByText } = render(<YourStageArtist />);
    fireEvent.press(getByText('APPLIED'));
    expect(getByText(/Choreographer · Bollywood ad shoot/)).toBeTruthy();
  });

  it('APPLIED list shows state-machine pills, sublines, and the Accept CTA', () => {
    const { getByText, getAllByText } = render(<YourStageArtist />);
    fireEvent.press(getByText('APPLIED'));
    expect(getByText('SHORTLISTED')).toBeTruthy();
    expect(getByText('OFFERED')).toBeTruthy();
    // "APPLIED" now appears twice: the sub-tab label + the a2 status pill.
    expect(getAllByText('APPLIED').length).toBeGreaterThanOrEqual(2);
    expect(getByText(/waiting on offer/)).toBeTruthy();
    expect(getByText(/your decision/)).toBeTruthy();
    expect(getByText(/Accept/)).toBeTruthy();
  });
});
