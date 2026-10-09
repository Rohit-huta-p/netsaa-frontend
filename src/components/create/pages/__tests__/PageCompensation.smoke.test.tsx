// netsa-mobile/src/components/create/pages/__tests__/PageCompensation.smoke.test.tsx
//
// Smoke test for the v2 Compensation step (split out of Page2Commitment).
// Verifies the segmented structure control, the amount + negotiable line,
// the inline unit pill, and the headcount × amount estimated-total card.

import React from 'react';
import { render } from '@testing-library/react-native';
import PageCompensation from '../PageCompensation';
import { type Page2Value } from '../Page2Commitment';

const baseValue: Page2Value = {
  startDate: '',
  city: '',
  state: 'Maharashtra',
  compensationModel: 'fixed',
  compensationStructure: 'fixed',
  negotiable: false,
};

describe('PageCompensation', () => {
  it('renders the structure switch, amount line, negotiable, and unit pill', () => {
    const { getByText } = render(
      <PageCompensation value={baseValue} onChange={jest.fn()} artistTypes={['Dancer']} />
    );
    expect(getByText(/How's it paid/i)).toBeTruthy();
    expect(getByText('Fixed')).toBeTruthy();
    expect(getByText('Range')).toBeTruthy();
    expect(getByText('Decide later')).toBeTruthy();
    expect(getByText(/Amount/)).toBeTruthy();
    expect(getByText(/Negotiable/i)).toBeTruthy();
    // 'fixed' unit reads as "Per performer".
    expect(getByText('Per performer')).toBeTruthy();
  });

  it('shows the estimated total when amount + headcount are set', () => {
    const value: Page2Value = { ...baseValue, amount: '5000' };
    const { getByText } = render(
      <PageCompensation value={value} onChange={jest.fn()} artistTypes={['Dancer']} headcount={3} />
    );
    expect(getByText(/Estimated total/i)).toBeTruthy();
    // 3 × ₹5,000 = ₹15,000
    expect(getByText(/15,000/)).toBeTruthy();
  });

  it('hides the amount well and shows a note under "Decide later"', () => {
    const value: Page2Value = { ...baseValue, compensationStructure: 'tbd' };
    const { getByText, queryByText } = render(
      <PageCompensation value={value} onChange={jest.fn()} artistTypes={['Dancer']} />
    );
    expect(getByText(/agree the amount with the artist/i)).toBeTruthy();
    // No estimated total when there's no amount.
    expect(queryByText(/Estimated total/i)).toBeNull();
  });
});
