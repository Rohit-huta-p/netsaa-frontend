// netsa-mobile/src/components/create/pages/__tests__/Page5SafetyReview.smoke.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import Page5SafetyReview from '../Page5SafetyReview';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }), Link: 'Link' }));

// GigDetails pulls in TanStack Query + a large dependency graph. Stub
// the preview component so this smoke test focuses on the guardrail +
// publish-gate logic only.
jest.mock('@/components/gigs/GigDetails', () => ({
  GigDetails: 'GigDetails',
}));

describe('Page5SafetyReview', () => {
  it('enables publish when form state has no hard issues', () => {
    const { getByLabelText, queryByText } = render(
      <Page5SafetyReview
        formState={{ artistTypes: ['Singer'] }}
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
});
