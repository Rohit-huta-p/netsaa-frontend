import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ApplicantActionSheet } from '../components/ApplicantActionSheet';

const sample = {
    _id: 'app1',
    artistId: 'u1',
    status: 'applied',
    coverNote: 'I would love to perform.',
    portfolioLinks: ['https://example.com/reel'],
    proposedRate: 12000,
    matchScore: 92,
    artistSnapshot: { displayName: 'Meera Desai', artistType: 'Sangeet', rating: 4.8, primaryCity: 'Pune', specialities: ['Kathak', 'Contemporary', 'Folk'] },
};

describe('ApplicantActionSheet', () => {
    it('returns null when not visible', () => {
        const { toJSON } = render(
            <ApplicantActionSheet
                visible={false}
                application={sample}
                onClose={jest.fn()}
                onShortlist={jest.fn()}
                onReject={jest.fn()}
                onHire={jest.fn()}
                onViewProfile={jest.fn()}
            />
        );
        expect(toJSON()).toBeNull();
    });

    it('renders identity + skills + cover note + portfolio + actions', () => {
        const { getByText, getByLabelText } = render(
            <ApplicantActionSheet
                visible
                application={sample}
                onClose={jest.fn()}
                onShortlist={jest.fn()}
                onReject={jest.fn()}
                onHire={jest.fn()}
                onViewProfile={jest.fn()}
            />
        );
        expect(getByText('Meera Desai')).toBeTruthy();
        expect(getByText('92% match')).toBeTruthy();
        // specialities surface as skill chips
        expect(getByText('Kathak')).toBeTruthy();
        expect(getByText('Folk')).toBeTruthy();
        expect(getByText(/I would love/)).toBeTruthy();
        expect(getByText('Link 1')).toBeTruthy();
        expect(getByLabelText('Shortlist')).toBeTruthy();
        expect(getByLabelText('Reject')).toBeTruthy();
        expect(getByLabelText('Hire')).toBeTruthy();
        expect(getByLabelText('View profile')).toBeTruthy();
    });

    it('Message action only renders when onMessage is provided, and fires with id', () => {
        const onMessage = jest.fn();
        const { getByLabelText, queryByLabelText, rerender } = render(
            <ApplicantActionSheet
                visible
                application={sample}
                onClose={jest.fn()}
                onShortlist={jest.fn()}
                onReject={jest.fn()}
                onHire={jest.fn()}
                onViewProfile={jest.fn()}
            />
        );
        expect(queryByLabelText('Message')).toBeNull();

        rerender(
            <ApplicantActionSheet
                visible
                application={sample}
                onClose={jest.fn()}
                onShortlist={jest.fn()}
                onReject={jest.fn()}
                onHire={jest.fn()}
                onViewProfile={jest.fn()}
                onMessage={onMessage}
            />
        );
        fireEvent.press(getByLabelText('Message'));
        expect(onMessage).toHaveBeenCalledWith('app1');
    });

    it('Hire button fires onHire with applicationId', () => {
        const onHire = jest.fn();
        const { getByLabelText } = render(
            <ApplicantActionSheet
                visible
                application={sample}
                onClose={jest.fn()}
                onShortlist={jest.fn()}
                onReject={jest.fn()}
                onHire={onHire}
                onViewProfile={jest.fn()}
            />
        );
        fireEvent.press(getByLabelText('Hire'));
        expect(onHire).toHaveBeenCalledWith('app1');
    });

    it('Shortlist button hidden when status is already shortlisted', () => {
        const { queryByLabelText } = render(
            <ApplicantActionSheet
                visible
                application={{ ...sample, status: 'shortlisted' }}
                onClose={jest.fn()}
                onShortlist={jest.fn()}
                onReject={jest.fn()}
                onHire={jest.fn()}
                onViewProfile={jest.fn()}
            />
        );
        expect(queryByLabelText('Shortlist')).toBeNull();
    });
});
