import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { HubApplicantsSection } from '../components/HubApplicantsSection';

const apps = [
    { _id: '1', status: 'applied', artistSnapshot: { displayName: 'Meera D' } },
    { _id: '2', status: 'shortlisted', artistSnapshot: { displayName: 'Kavya P' } },
    { _id: '3', status: 'applied', artistSnapshot: { displayName: 'Vihaan N' } },
    { _id: '4', status: 'applied', artistSnapshot: { displayName: 'Asha R' } },
];

describe('HubApplicantsSection', () => {
    it('renders preview rows + see-all link', () => {
        const { getByText } = render(<HubApplicantsSection applicants={apps} />);
        expect(getByText('Applicants')).toBeTruthy();
        expect(getByText('Meera D')).toBeTruthy();
        expect(getByText(/See all 4 →/)).toBeTruthy();
    });

    it('filter chip narrows the list', () => {
        const { getByText, queryByText } = render(<HubApplicantsSection applicants={apps} />);
        fireEvent.press(getByText(/Shortlisted · 1/));
        expect(getByText('Kavya P')).toBeTruthy();
        expect(queryByText('Meera D')).toBeNull();
    });

    it('Quick Hire button calls onQuickHire with id', () => {
        const onQuickHire = jest.fn();
        const { getAllByLabelText } = render(<HubApplicantsSection applicants={apps} onQuickHire={onQuickHire} />);
        // accessibilityLabel is `Hire ${displayName}`
        const hireButtons = getAllByLabelText(/^Hire /);
        fireEvent.press(hireButtons[0]);
        expect(onQuickHire).toHaveBeenCalledWith(expect.any(String));
    });
});
