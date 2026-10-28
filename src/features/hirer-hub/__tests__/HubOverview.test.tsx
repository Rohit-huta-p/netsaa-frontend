// src/features/hirer-hub/__tests__/HubOverview.test.tsx
//
// The owner hub overview (applicant-card-D.html screens 1–3): gig title +
// status pill, three stage tabs with per-stage bucket counts, the slot bar's
// barnote, and the body list header — all of which change with the active
// stage. Also the two interactions it owns: selecting a stage and toggling sort.

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { HubOverview } from '../components/HubOverview';

const baseProps = {
    title: 'Sangeet night',
    statusKey: 'published',
    metaLine: '4 Dancers · The Westin, Pune',
    counts: { applied: 9, shortlisted: 3, hired: 2 },
    slotsTotal: 4,
    onSelectStage: jest.fn(),
    onToggleSort: jest.fn(),
};

describe('HubOverview', () => {
    it('renders the gig header, the "Open" status pill and the stage tabs with counts', () => {
        const { getByText } = render(<HubOverview {...baseProps} activeStage="applied" />);
        expect(getByText('Sangeet night')).toBeTruthy();
        expect(getByText('4 Dancers · The Westin, Pune')).toBeTruthy();
        expect(getByText('Open')).toBeTruthy(); // published → "Open"
        expect(getByText('Applied')).toBeTruthy();
        expect(getByText('Shortlisted')).toBeTruthy();
        expect(getByText('Hired')).toBeTruthy();
        expect(getByText('9')).toBeTruthy();
        expect(getByText('3')).toBeTruthy();
        expect(getByText('2')).toBeTruthy();
    });

    it('Applied stage: barnote counts slots to hire; list header is "New applicants · N"', () => {
        const { getByText } = render(<HubOverview {...baseProps} activeStage="applied" />);
        expect(getByText('2 OF 4 SLOTS FILLED · 2 MORE TO HIRE')).toBeTruthy();
        expect(getByText('New applicants · 9')).toBeTruthy();
    });

    it('Shortlisted stage: barnote nudges to fill; list header is "Your picks · N"', () => {
        const { getByText } = render(<HubOverview {...baseProps} activeStage="shortlisted" />);
        expect(getByText('FILL 2 MORE FROM THESE 3')).toBeTruthy();
        expect(getByText('Your picks · 3')).toBeTruthy();
    });

    it('Hired stage: barnote shows open slots; header is "The cast · N of M" + open readout', () => {
        const { getByText } = render(<HubOverview {...baseProps} activeStage="hired" />);
        expect(getByText('2 OF 4 SLOTS FILLED · 2 OPEN')).toBeTruthy();
        expect(getByText('The cast · 2 of 4')).toBeTruthy();
        expect(getByText('2 Open')).toBeTruthy();
    });

    it('tapping a stage tab selects it; the sort toggle fires on Applied/Shortlisted', () => {
        const onSelectStage = jest.fn();
        const onToggleSort = jest.fn();
        const { getByLabelText } = render(
            <HubOverview {...baseProps} activeStage="applied" onSelectStage={onSelectStage} onToggleSort={onToggleSort} />
        );
        fireEvent.press(getByLabelText('Shortlisted stage'));
        expect(onSelectStage).toHaveBeenCalledWith('shortlisted');
        fireEvent.press(getByLabelText('Sort by rating'));
        expect(onToggleSort).toHaveBeenCalled();
    });
});
