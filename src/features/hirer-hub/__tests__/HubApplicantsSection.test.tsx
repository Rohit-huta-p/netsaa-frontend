import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { HubApplicantsSection } from '../components/HubApplicantsSection';

// Card D footer per stage: applied -> Pass · Shortlist, shortlisted -> Hire.
const apps = [
    { _id: '1', status: 'applied', appliedAt: '2026-10-20T10:00:00Z', artistSnapshot: { displayName: 'Meera D', primaryCity: 'Pune' } },
    { _id: '2', status: 'shortlisted', artistSnapshot: { displayName: 'Kavya P', primaryCity: 'Pune' } },
    { _id: '3', status: 'applied', artistSnapshot: { displayName: 'Vihaan N', primaryCity: 'Mumbai' } },
    { _id: '4', status: 'applied', artistSnapshot: { displayName: 'Asha R', primaryCity: 'Pune' } },
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

    it('applied card shows Pass + Shortlist; shortlisted card shows Hire', () => {
        const { getByLabelText } = render(<HubApplicantsSection applicants={apps} />);
        expect(getByLabelText('Pass Meera D')).toBeTruthy();
        expect(getByLabelText('Shortlist Meera D')).toBeTruthy();
        expect(getByLabelText('Hire Kavya P')).toBeTruthy();
    });

    it('Shortlist calls onShortlist with id', () => {
        const onShortlist = jest.fn();
        const { getByLabelText } = render(<HubApplicantsSection applicants={apps} onShortlist={onShortlist} />);
        fireEvent.press(getByLabelText('Shortlist Meera D'));
        expect(onShortlist).toHaveBeenCalledWith('1');
    });

    it('Hire on a shortlisted card calls onHire with id', () => {
        const onHire = jest.fn();
        const { getByLabelText } = render(<HubApplicantsSection applicants={apps} onHire={onHire} />);
        fireEvent.press(getByLabelText('Hire Kavya P'));
        expect(onHire).toHaveBeenCalledWith('2');
    });

    it('Pass is reversible: fires onPass, dims the card, and offers Undo (count drops)', () => {
        const onPass = jest.fn();
        const onUndoPass = jest.fn();
        const { getByLabelText, queryByLabelText, getByText } = render(
            <HubApplicantsSection applicants={apps} onPass={onPass} onUndoPass={onUndoPass} />
        );

        fireEvent.press(getByLabelText('Pass Meera D'));
        expect(onPass).toHaveBeenCalledWith('1');

        // Card stays on screen but swaps to the Undo affordance.
        expect(queryByLabelText('Pass Meera D')).toBeNull();
        expect(getByLabelText('Undo pass for Meera D')).toBeTruthy();
        // Pending count drops the passed applicant immediately (4 -> 3).
        expect(getByText(/3 pending/)).toBeTruthy();

        fireEvent.press(getByLabelText('Undo pass for Meera D'));
        expect(onUndoPass).toHaveBeenCalledWith('1');
        // Back to the active footer.
        expect(getByLabelText('Pass Meera D')).toBeTruthy();
    });
});
