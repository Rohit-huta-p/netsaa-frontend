/**
 * DraftsSection smoke tests — mocks useDrafts for both the populated and
 * empty paths.
 */
import React from 'react';
import { render } from '@testing-library/react-native';

const mockUseDrafts = jest.fn();
jest.mock('@/hooks/useDrafts', () => ({
  __esModule: true,
  useDrafts: (...args: any[]) => mockUseDrafts(...args),
  default: (...args: any[]) => mockUseDrafts(...args),
}));

import DraftsSection from '../DraftsSection';

describe('DraftsSection (smoke)', () => {
  beforeEach(() => {
    mockUseDrafts.mockReset();
  });

  it('renders the top 3 drafts sorted by updatedAt desc', () => {
    const drafts = [
      {
        draftId: 'd1',
        gigId: 'g1',
        gigTitle: 'Oldest draft',
        updatedAt: '2026-03-01T10:00:00.000Z',
      },
      {
        draftId: 'd2',
        gigId: 'g2',
        gigTitle: 'Middle draft',
        updatedAt: '2026-04-01T10:00:00.000Z',
      },
      {
        draftId: 'd3',
        gigId: 'g3',
        gigTitle: 'Most recent draft',
        updatedAt: '2026-04-21T10:00:00.000Z',
      },
      {
        draftId: 'd4',
        gigId: 'g4',
        gigTitle: 'Overflow draft',
        updatedAt: '2026-01-01T10:00:00.000Z',
      },
    ];
    mockUseDrafts.mockReturnValue({
      drafts,
      isLoading: false,
      refresh: jest.fn(),
      remove: jest.fn(),
    });

    const { getByText, queryByText } = render(<DraftsSection />);

    // Top 3 (most-recent first) render; overflow does not.
    expect(getByText('Most recent draft')).toBeTruthy();
    expect(getByText('Middle draft')).toBeTruthy();
    expect(getByText('Oldest draft')).toBeTruthy();
    expect(queryByText('Overflow draft')).toBeNull();

    // Overflow count label shown
    expect(getByText(/\+1 more draft/i)).toBeTruthy();
  });

  it('shows encouraging empty state when no drafts exist', () => {
    mockUseDrafts.mockReturnValue({
      drafts: [],
      isLoading: false,
      refresh: jest.fn(),
      remove: jest.fn(),
    });

    const { getByText } = render(<DraftsSection />);

    expect(getByText('No drafts yet')).toBeTruthy();
    expect(
      getByText(/Start applying to a gig and save progress anytime/i)
    ).toBeTruthy();
  });
});
