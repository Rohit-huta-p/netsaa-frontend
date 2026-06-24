// netsa-mobile/src/components/create/guardrails/__tests__/GuardrailPanel.smoke.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import GuardrailPanel from '../GuardrailPanel';
import type { GuardrailIssue } from '../checks';

describe('GuardrailPanel', () => {
  it('renders empty state with no issues', () => {
    const { getByText } = render(<GuardrailPanel issues={[]} />);
    expect(getByText(/All checks pass/)).toBeTruthy();
  });

  it('groups issues by severity', () => {
    const issues: GuardrailIssue[] = [
      { id: 'MODEL_NUDITY_REQUIRED', severity: 'hard', message: 'Nudity required.' },
      { id: 'TBD_PAY', severity: 'soft', message: 'TBD pay discouraged.' },
      { id: 'LOW_PAY_TRANSPARENCY', severity: 'trust', message: 'Low pay transparency.' },
    ];
    const { getByText } = render(<GuardrailPanel issues={issues} />);
    expect(getByText('Required fixes')).toBeTruthy();
    expect(getByText('Suggestions')).toBeTruthy();
    expect(getByText('Trust signals')).toBeTruthy();
  });
});
