// netsa-mobile/src/components/create/pages/__tests__/Page5SafetyReview.smoke.test.tsx
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import Page5SafetyReview from '../Page5SafetyReview';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }), Link: 'Link' }));

// GigDetails pulls in TanStack Query + a large dependency graph. Stub
// the preview component so this smoke test focuses on the guardrail +
// publish-gate logic only.
jest.mock('@/components/gigs/GigDetails', () => ({
  GigDetails: 'GigDetails',
}));

// Phase 4D — mock expo-print/expo-sharing so the Contract preview card's
// "View full contract PDF" button can fire without native bindings.
const mockPrint = jest.fn().mockResolvedValue({ uri: 'file:///tmp/preview.pdf' });
const mockShare = jest.fn().mockResolvedValue(undefined);
jest.mock('expo-print', () => ({
  printToFileAsync: (...args: unknown[]) => mockPrint(...args),
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: (...args: unknown[]) => mockShare(...args),
}));

beforeEach(() => {
  mockPrint.mockClear();
  mockShare.mockClear();
});

describe('Page5SafetyReview', () => {
  it('enables publish when form state has no hard issues', () => {
    const { getByLabelText, queryByText } = render(
      <Page5SafetyReview
        formState={{
          // All 4 MISSING_* required fields populated so the post-review
          // P1-3 HARD checks don't fire in the "clean" case.
          title: 'Test gig',
          artistTypes: ['Singer'],
          eventFunction: 'Sangeet',
          description: 'A simple test description.',
        }}
        previewGig={{}}
        isLoading={false}
        onDraft={jest.fn()}
        onPublish={jest.fn()}
      />
    );
    const publish = getByLabelText('Publish');
    // Accessible state reports disabled: undefined-or-false when enabled.
    expect(publish.props.accessibilityState?.disabled).toBeFalsy();
    expect(queryByText(/Resolve required fixes/i)).toBeNull();
  });

  it('disables publish when Model gig is missing required fields', () => {
    const { getByLabelText, getByText } = render(
      <Page5SafetyReview
        formState={{ artistTypes: ['Model'] }}
        previewGig={{}}
        isLoading={false}
        onDraft={jest.fn()}
        onPublish={jest.fn()}
      />
    );
    const publish = getByLabelText('Publish');
    expect(publish.props.accessibilityState?.disabled).toBe(true);
    expect(getByText(/Resolve required fixes/i)).toBeTruthy();
  });

  // CONTRACTS-DISABLED: Phase 4D contract preview is hidden until the
  // contract artifact is restored. Tests skipped (not deleted) so they
  // re-activate cleanly when gating reverts.
  describe.skip('Phase 4D — contract preview', () => {
    const previewGig = {
      title: 'Sangeet Choreography',
      compensation: { amount: 50000, negotiable: true },
      paymentStructure: 'advance_balance',
      cancellationPolicy: '48h',
      cancellationForfeitPct: 75,
      customClauses: ['Arrive 1h early', 'Bring own jewelry'],
      schedule: { startDate: new Date('2027-03-15').toISOString() },
      location: { city: 'Pune' },
      description: 'Lead 6 dancers',
    };

    it('renders the Contract preview card with summary grid + PDF button', () => {
      const { getByText, getByLabelText } = render(
        <Page5SafetyReview
          formState={{
            title: 'Sangeet Choreography',
            artistTypes: ['Dancer'],
            eventFunction: 'Sangeet',
            description: 'Lead 6 dancers',
          }}
          previewGig={previewGig}
          hirerName="Sharma Wedding"
          isLoading={false}
          onDraft={jest.fn()}
          onPublish={jest.fn()}
        />
      );

      expect(getByText(/Contract preview/i)).toBeTruthy();
      // 4-cell grid values: Pay (₹50,000), Cancellation (48h · 75%), Clauses (2 added), Negotiable (Yes)
      expect(getByText(/30\/70 advance/i)).toBeTruthy();
      expect(getByText(/2 added/i)).toBeTruthy();
      // PDF download affordance
      expect(getByLabelText(/View full contract as PDF/i)).toBeTruthy();
    });

    it('triggers PDF generation when "View full contract PDF" is tapped', async () => {
      const { getByLabelText } = render(
        <Page5SafetyReview
          formState={{
            title: 'Sangeet Choreography',
            artistTypes: ['Dancer'],
            eventFunction: 'Sangeet',
            description: 'Lead 6 dancers',
          }}
          previewGig={previewGig}
          hirerName="Sharma Wedding"
          isLoading={false}
          onDraft={jest.fn()}
          onPublish={jest.fn()}
        />
      );

      fireEvent.press(getByLabelText(/View full contract as PDF/i));

      await waitFor(() => expect(mockPrint).toHaveBeenCalledTimes(1));
      // The PDF HTML must include the gig title and the hirer name.
      const html = mockPrint.mock.calls[0][0]?.html as string;
      expect(html).toContain('Sangeet Choreography');
      expect(html).toContain('Sharma Wedding');
      expect(html).toContain('Arrive 1h early');
      // expo-sharing should be invoked once the PDF is written.
      await waitFor(() => expect(mockShare).toHaveBeenCalledTimes(1));
    });
  });
});
