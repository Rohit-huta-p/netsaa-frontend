// netsa-mobile/src/components/create/__tests__/GigFormV2.smoke.test.tsx
//
// Orchestrator happy-path smoke test. Mounts GigFormV2 with no gigId
// (create mode), verifies the Identity step dot is active, and the
// Page1Identity title input is visible.
//
// A full multi-page submit rehearsal is out of scope here — the
// individual pages have their own smoke tests, and the 6
// buildBackendPayload unit tests lock the submit transform. This test
// just proves the orchestrator mounts, page 1 renders, and the shared
// GigFormHandle shape isn't accidentally broken.

import React from 'react';
import { render } from '@testing-library/react-native';

// Hooks and services imported by the orchestrator + transitive page chain.
// All need to be mocked BEFORE importing GigFormV2 so the module graph
// doesn't drag in `expo-secure-store` (ESM) or PNG assets.
jest.mock('@/hooks/useGigs', () => ({
  useCreateGig: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useUpdateGig: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useGig: () => ({ data: null }),
}));

jest.mock('@ptomasroos/react-native-multi-slider', () => 'MultiSlider');
jest.mock('@/components/ui/DatePickerInput', () => ({ DatePickerInput: 'DatePickerInput' }));
jest.mock('@/components/gigs/GigDetails', () => ({ GigDetails: 'GigDetails' }));
jest.mock('@/services/gigService', () => ({
  __esModule: true,
  default: { rephraseText: jest.fn() },
}));

// Import AFTER mocks so the module graph resolves against the mocked hooks.
import GigFormV2 from '../GigFormV2';

describe('GigFormV2 (orchestrator smoke)', () => {
  it('mounts on Page 1 with the Identity step + title input visible', () => {
    const { getByPlaceholderText, getByLabelText } = render(
      <GigFormV2 onPublish={jest.fn()} onCancel={jest.fn()} />
    );

    // Identity step dot is rendered (accessibility label from step dots row).
    expect(getByLabelText(/Go to step 1: Identity/i)).toBeTruthy();
    // Page1Identity title input placeholder is present → page 1 actually
    // rendered inside the orchestrator's ScrollView.
    expect(getByPlaceholderText(/dancers for sangeet/i)).toBeTruthy();
  });
});
