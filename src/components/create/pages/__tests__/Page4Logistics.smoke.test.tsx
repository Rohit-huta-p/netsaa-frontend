// netsa-mobile/src/components/create/pages/__tests__/Page4Logistics.smoke.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import Page4Logistics from '../Page4Logistics';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }), Link: 'Link' }));

// gigService.rephraseText is awaited in handleRephrase; stub so handler
// is safe to wire up even though we don't exercise it in smoke tests.
jest.mock('@/services/gigService', () => ({
  __esModule: true,
  default: { rephraseText: jest.fn() },
  rephraseText: jest.fn(),
}));

// DatePickerInput transitively pulls in react-native-ui-datepicker (PNG).
jest.mock('@/components/ui/DatePickerInput', () => ({
  DatePickerInput: 'DatePickerInput',
}));

describe('Page4Logistics', () => {
  const initial = {
    mediaRequirements: {
      headshots: false,
      fullBody: false,
      videoReel: false,
      audioSample: false,
      notes: '',
    },
    description: '',
    termsAndConditions: '',
  };

  it('renders submission, description, T&C sections + 2 AI buttons', () => {
    const { getByText, getAllByText } = render(
      <Page4Logistics value={initial} onChange={jest.fn()} />
    );
    expect(getByText(/Submission requirements/i)).toBeTruthy();
    expect(getByText(/Description/)).toBeTruthy();
    // "Terms & conditions" label — at least 1 match
    expect(getAllByText(/Terms/i).length).toBeGreaterThanOrEqual(1);
    // At least 2 "Rephrase with AI" buttons (description + T&C)
    expect(getAllByText(/Rephrase with AI/i).length).toBeGreaterThanOrEqual(2);
  });
});
