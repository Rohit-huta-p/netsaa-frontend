import React from 'react';
import { render } from '@testing-library/react-native';
import { DetailsTab } from '../DetailsTab';
import { buildGigDetailVM } from '../gigDetailVM';

const gig = {
  _id: 'g1',
  title: 'Contemporary fusion duo',
  organizerSnapshot: { displayName: 'Aditi Rao', rating: 4.9, isVerified: true },
  location: { city: 'Pune', state: 'MH' },
  artistTypes: ['Dancer'],
  headcount: 2,
  schedule: { startDate: '2026-05-12', endDate: '2026-05-13' },
  compensation: { amount: 18000, currency: 'INR', negotiable: true, model: 'fixed', perks: ['Travel', 'Meals'] },
  responsibilities: ['Perform a 6-minute duo'],
  requiredSkills: ['Contemporary'],
  description: 'Closing our Sangeet with a fusion piece.',
  termsAndConditions: '50% on booking.',
};

describe('DetailsTab', () => {
  it('renders the facts strip + all sections, with pay as a fact (no hero)', () => {
    const vm = buildGigDetailVM(gig);
    const { getByText, getAllByText, getAllByTestId } = render(<DetailsTab vm={vm} />);

    // facts strip — pay sits with When/Where/Slots
    expect(getByText('Pay')).toBeTruthy();
    expect(getByText('When')).toBeTruthy();
    expect(getByText('Where')).toBeTruthy();
    expect(getByText('Slots')).toBeTruthy();
    expect(getAllByText(/₹18,000/).length).toBeGreaterThan(0); // fact cell + Compensation line

    // sections
    expect(getByText('About this gig')).toBeTruthy();
    expect(getByText(/What you'll do/)).toBeTruthy();
    expect(getByText(/Who we're looking for/)).toBeTruthy();
    expect(getByText('Compensation')).toBeTruthy();
    expect(getByText(/Perks/)).toBeTruthy();
    expect(getByText('Travel')).toBeTruthy();
    expect(getByText('Terms')).toBeTruthy();

    // Locked "V1 Accent Tick": every section heading except "About this gig"
    // carries a leading tick (What you'll do · Who we're looking for ·
    // Compensation · Perks · Terms = 5); About stays tick-less.
    expect(getAllByTestId('section-tick')).toHaveLength(5);
  });
});
