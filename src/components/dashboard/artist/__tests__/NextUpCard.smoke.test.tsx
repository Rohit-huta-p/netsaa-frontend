import React from 'react';
import { render } from '@testing-library/react-native';

import NextUpCard from '../NextUpCard';

// Mock the data hooks this component composes. Both hooks pass through
// useQuery so a plain `{ data }` object is enough for rendering.
jest.mock('@/hooks/useContractsArtist', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('@/hooks/useApplications', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import useContractsArtist from '@/hooks/useContractsArtist';
import useApplications from '@/hooks/useApplications';

const mockContracts = useContractsArtist as jest.MockedFunction<any>;
const mockApplications = useApplications as jest.MockedFunction<any>;

function setContracts(contracts: any[]) {
  mockContracts.mockReturnValue({
    data: { data: { contracts } },
    isLoading: false,
    error: null,
  });
}

function setApplications(applications: any[]) {
  mockApplications.mockReturnValue({
    data: { data: applications },
    isLoading: false,
    error: null,
  });
}

describe('NextUpCard (smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the "Sign contract" CTA when a pending contract exists', () => {
    setContracts([
      {
        _id: 'contract_1',
        status: 'pending_artist_signature',
        terms: { gigTitle: 'Jazz Night at Blue Note' },
        hirer: { displayName: 'Blue Note Pune' },
      },
    ]);
    setApplications([]);

    const { getByText } = render(<NextUpCard />);
    expect(getByText('Sign contract')).toBeTruthy();
    // Hirer name + gig title should both appear (in the subtitle row).
    expect(getByText(/Jazz Night at Blue Note/)).toBeTruthy();
    expect(getByText(/Blue Note Pune/)).toBeTruthy();
  });

  it('renders an upcoming hired gig when no contract is pending', () => {
    setContracts([]);
    const inTenDays = new Date(Date.now() + 10 * 86_400_000).toISOString();
    setApplications([
      {
        _id: 'app_1',
        status: 'hired',
        gigId: {
          _id: 'gig_1',
          title: 'Wedding reception',
          startDate: inTenDays,
        },
      },
    ]);

    const { getByText } = render(<NextUpCard />);
    expect(getByText(/Upcoming: Wedding reception/)).toBeTruthy();
    // 10-day horizon should display "10 days" (not "Today" / "Tomorrow").
    expect(getByText(/10 days/)).toBeTruthy();
  });

  it('returns null when both contracts and applications are empty', () => {
    setContracts([]);
    setApplications([]);

    const { queryByText } = render(<NextUpCard />);
    // The "Next up" header label is only present when a branch renders.
    expect(queryByText('Next up')).toBeNull();
    expect(queryByText(/Upcoming/)).toBeNull();
    expect(queryByText('Sign contract')).toBeNull();
  });

  it('prefers the contract branch when both data sources are populated', () => {
    setContracts([
      {
        _id: 'contract_1',
        status: 'pending_artist_signature',
        terms: { gigTitle: 'Contract gig' },
      },
    ]);
    const soon = new Date(Date.now() + 5 * 86_400_000).toISOString();
    setApplications([
      {
        _id: 'app_1',
        status: 'hired',
        gigId: { _id: 'gig_1', title: 'Hired gig', startDate: soon },
      },
    ]);

    const { getByText, queryByText } = render(<NextUpCard />);
    expect(getByText('Sign contract')).toBeTruthy();
    // Gig branch copy should not appear when contract branch wins.
    expect(queryByText(/Upcoming: Hired gig/)).toBeNull();
  });

  it('ignores hired applications whose start date is in the past', () => {
    setContracts([]);
    const yesterday = new Date(Date.now() - 86_400_000).toISOString();
    setApplications([
      {
        _id: 'app_1',
        status: 'hired',
        gigId: { _id: 'gig_1', title: 'Past gig', startDate: yesterday },
      },
    ]);

    const { queryByText } = render(<NextUpCard />);
    expect(queryByText(/Upcoming/)).toBeNull();
  });
});
