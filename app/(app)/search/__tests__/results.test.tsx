// app/(app)/search/__tests__/results.test.tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import ResultsPage from '../results';
import React from 'react';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ q: 'kathak', tab: 'people' }),
  useRouter: () => ({ push: mockPush, back: mockBack, setParams: jest.fn() }),
}));

jest.mock('@/hooks/useSearchQueries', () => ({
  useSearchPeople: () => ({ data: { results: [{ _id: 'p1', firstName: 'Priya', lastName: 'S' }], total: 42 }, isLoading: false }),
  useSearchGigs:   () => ({ data: { results: [], total: 7 }, isLoading: false }),
  useSearchEvents: () => ({ data: { results: [], total: 3 }, isLoading: false }),
}));

describe('ResultsPage', () => {
  it('renders query echo + tab strip with counts', () => {
    render(<ResultsPage />);
    expect(screen.getByText(/Results for/)).toBeTruthy();
    expect(screen.getByText(/People/)).toBeTruthy();
    expect(screen.getByText(/42/)).toBeTruthy();
    expect(screen.getByText(/Gigs/)).toBeTruthy();
    expect(screen.getByText(/7/)).toBeTruthy();
  });

  it('renders People rows when tab is people', () => {
    render(<ResultsPage />);
    expect(screen.getByText(/Priya/)).toBeTruthy();
  });

  it('back arrow calls router.back', () => {
    render(<ResultsPage />);
    fireEvent.press(screen.getByTestId('results-back'));
    expect(mockBack).toHaveBeenCalled();
  });
});
