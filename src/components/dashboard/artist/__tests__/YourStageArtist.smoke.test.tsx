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

jest.mock('@/hooks/useSavedItems', () => ({
  __esModule: true,
  useSavedItems: jest.fn(() => ({
    savedGigs: [{ _id: 'sg1', title: 'Feature film · classical lead' }],
    savedEvents: [{ _id: 'se1', title: 'Birju Maharaj masterclass' }],
    pastEvents: [{ _id: 'pe1', title: 'Pune Diwali Mela · main stage' }],
  })),
}));

describe('YourStageArtist (smoke)', () => {
  it('renders the section title and primary toggle', () => {
    const { getByText } = render(<YourStageArtist />);
    expect(getByText("What you're in.")).toBeTruthy();
    expect(getByText(/GIGS · 5/)).toBeTruthy(); // 1 upcoming + 3 active + 1 saved
    expect(getByText(/EVENTS · 3/)).toBeTruthy(); // 1 upcoming + 1 saved + 1 past
  });

  it('switches to EVENTS panel and shows sub-tabs', () => {
    const { getByText } = render(<YourStageArtist />);
    fireEvent.press(getByText(/EVENTS · 3/));
    expect(getByText('UPCOMING')).toBeTruthy();
    expect(getByText('SAVED')).toBeTruthy();
    expect(getByText('PAST')).toBeTruthy();
  });

  it('switches sub-tab within GIGS', () => {
    const { getByText } = render(<YourStageArtist />);
    fireEvent.press(getByText('ACTIVE'));
    expect(getByText(/Choreographer · Bollywood ad shoot/)).toBeTruthy();
  });

  it('Active list shows state-machine words: SHORTLISTED / APPLIED / OFFERED', () => {
    const { getByText } = render(<YourStageArtist />);
    fireEvent.press(getByText('ACTIVE'));
    expect(getByText('SHORTLISTED')).toBeTruthy();
    expect(getByText('APPLIED')).toBeTruthy();
    expect(getByText('OFFERED')).toBeTruthy();
  });

  it('Active list shows state-machine sublines per row', () => {
    const { getByText } = render(<YourStageArtist />);
    fireEvent.press(getByText('ACTIVE'));
    expect(getByText(/waiting on offer/)).toBeTruthy();
    expect(getByText(/waiting on review/)).toBeTruthy();
    expect(getByText(/your decision/)).toBeTruthy();
  });

  it('Offered state surfaces Accept CTA chip', () => {
    const { getByText } = render(<YourStageArtist />);
    fireEvent.press(getByText('ACTIVE'));
    expect(getByText(/Accept/)).toBeTruthy();
  });
});
