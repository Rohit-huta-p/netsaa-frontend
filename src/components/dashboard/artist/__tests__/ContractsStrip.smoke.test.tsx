import React from 'react';
import { render } from '@testing-library/react-native';

import ContractsStrip from '../ContractsStrip';

jest.mock('@/hooks/useContractsArtist', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import useContractsArtist from '@/hooks/useContractsArtist';

const mockContracts = useContractsArtist as jest.MockedFunction<any>;

function setContracts(contracts: any[]) {
  mockContracts.mockReturnValue({
    data: { data: { contracts } },
    isLoading: false,
    error: null,
  });
}

describe('ContractsStrip (smoke)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the three stats when contracts exist', () => {
    setContracts([
      { _id: 'c1', status: 'pending_artist_signature' },
      { _id: 'c2', status: 'pending_artist_signature' },
      { _id: 'c3', status: 'active' },
      { _id: 'c4', status: 'accepted' },
      { _id: 'c5', status: 'completed' },
      { _id: 'c6', status: 'declined' },
    ]);

    const { getByText, getByLabelText } = render(<ContractsStrip />);
    // Title visible
    expect(getByText('Contracts')).toBeTruthy();
    // Stat blocks get descriptive accessibility labels.
    expect(getByLabelText('2 Awaiting\nsignature')).toBeTruthy();
    expect(getByLabelText('3 Active')).toBeTruthy();
    expect(getByLabelText('6 Total')).toBeTruthy();
  });

  it('returns null when there are no contracts', () => {
    setContracts([]);

    const { queryByText } = render(<ContractsStrip />);
    expect(queryByText('Contracts')).toBeNull();
  });
});
