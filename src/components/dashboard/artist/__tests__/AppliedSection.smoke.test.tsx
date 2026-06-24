/**
 * AppliedSection smoke tests
 *
 * Jest-scoped mocks for useApplications + gigService let us drive the
 * component through:
 *   1. Default Pending chip + rendered applications.
 *   2. Chip switch → hook re-reads with the new filter arg.
 *   3. Overflow menu affordance appears only on withdrawable statuses.
 *
 * We stub the hook directly (not the service) to keep tests small; the
 * hook's contract is owned by Wave 2a and its own tests.
 */
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Hook mock must be hoisted before component import
const mockUseApplications = jest.fn();
jest.mock('@/hooks/useApplications', () => ({
  __esModule: true,
  useApplications: (...args: any[]) => mockUseApplications(...args),
  default: (...args: any[]) => mockUseApplications(...args),
}));

jest.mock('@/services/gigService', () => ({
  __esModule: true,
  default: {
    withdrawApplication: jest.fn().mockResolvedValue({}),
  },
}));

import AppliedSection from '../AppliedSection';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function wrap(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('AppliedSection (smoke)', () => {
  beforeEach(() => {
    mockUseApplications.mockReset();
  });

  it('renders default Pending chip with applications', () => {
    mockUseApplications.mockReturnValue({
      data: {
        data: [
          {
            _id: 'a1',
            status: 'applied',
            gig: { title: 'Kathak workshop assistant' },
            hirer: { name: 'Pune Arts Co.' },
            createdAt: '2026-04-20T09:00:00.000Z',
          },
        ],
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { getByText, getAllByText } = wrap(<AppliedSection />);

    // Default filter is Pending — label appears as the chip AND as the
    // per-row status (applied -> Pending via getApplicationStatusLabel).
    expect(getAllByText('Pending').length).toBeGreaterThanOrEqual(1);
    expect(getByText('Kathak workshop assistant')).toBeTruthy();
    expect(mockUseApplications).toHaveBeenCalledWith('applied', 5);
  });

  it('re-queries with the new filter arg when chip is switched', () => {
    // First call returns Pending data, second call returns Accepted data.
    mockUseApplications
      .mockReturnValueOnce({
        data: { data: [] },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })
      .mockReturnValue({
        data: {
          data: [
            {
              _id: 'a2',
              status: 'hired',
              gig: { title: 'Sangeet ensemble (Accepted)' },
              hirer: { name: 'Bride & Groom' },
              createdAt: '2026-04-10T00:00:00.000Z',
            },
          ],
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

    const { getByLabelText, getByText } = wrap(<AppliedSection />);

    // Tap the Accepted chip
    fireEvent.press(getByLabelText('Accepted filter'));

    // After re-render, the Accepted list row shows.
    expect(getByText('Sangeet ensemble (Accepted)')).toBeTruthy();

    // Hook must have been invoked with the new backend status.
    expect(mockUseApplications).toHaveBeenLastCalledWith('hired', 5);
  });

  it('shows overflow menu on withdrawable rows (applied/shortlisted)', () => {
    mockUseApplications.mockReturnValue({
      data: {
        data: [
          {
            _id: 'row-applied',
            status: 'applied',
            gig: { title: 'Live set' },
            hirer: { name: 'Club X' },
            createdAt: '2026-04-18',
          },
          {
            _id: 'row-shortlisted',
            status: 'shortlisted',
            gig: { title: 'Callback audition' },
            hirer: { name: 'Studio Y' },
            createdAt: '2026-04-17',
          },
        ],
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { getByTestId } = wrap(<AppliedSection />);

    // Both rows expose overflow affordance since both are withdrawable.
    expect(getByTestId('applied-overflow-row-applied')).toBeTruthy();
    expect(getByTestId('applied-overflow-row-shortlisted')).toBeTruthy();
  });
});
