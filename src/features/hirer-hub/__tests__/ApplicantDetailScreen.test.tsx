import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ApplicantDetailScreen } from '../components/ApplicantDetailScreen';

const base = {
    _id: 'app1',
    artistId: 'u1',
    status: 'applied',
    appliedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    coverNote: 'I would love to perform at your sangeet.',
    portfolioLinks: ['https://instagram.com/p/abc', 'https://example.com/reel'],
    artistSnapshot: { displayName: 'Meera Desai', artistType: 'Dancer', rating: 4.8, primaryCity: 'Pune', specialities: ['Kathak', 'Contemporary', 'Folk'] },
};

const handlers = () => ({
    onClose: jest.fn(), onReject: jest.fn(), onShortlist: jest.fn(),
    onHire: jest.fn(), onViewProfile: jest.fn(),
});

describe('ApplicantDetailScreen', () => {
    it('returns null when not visible', () => {
        const { toJSON } = render(<ApplicantDetailScreen visible={false} application={base} {...handlers()} />);
        expect(toJSON()).toBeNull();
    });

    it('renders identity, status tag, full skills, quote, named portfolio and gig-context rows', () => {
        const { getByText } = render(
            <ApplicantDetailScreen
                visible
                application={base}
                applyingForLabel="Sangeet night · 4 dancers"
                datesLabel="22, 27 Nov"
                payLabel="₹8,000 per performer"
                {...handlers()}
            />
        );
        expect(getByText('Meera Desai')).toBeTruthy();
        expect(getByText('Applied')).toBeTruthy();        // status tag
        expect(getByText(/APPLIED 2H AGO/)).toBeTruthy();  // applied-ago line
        expect(getByText('Kathak')).toBeTruthy();
        expect(getByText('Folk')).toBeTruthy();            // full skill list (not capped)
        expect(getByText(/I would love/)).toBeTruthy();
        // portfolio links carry a host-derived name, not "Link N"
        expect(getByText('Instagram ↗')).toBeTruthy();
        expect(getByText('Example ↗')).toBeTruthy();
        // gig-context rows
        expect(getByText('Sangeet night · 4 dancers')).toBeTruthy();
        expect(getByText('22, 27 Nov')).toBeTruthy();
        expect(getByText('₹8,000 per performer')).toBeTruthy();
    });

    it('applied → Reject · Message · Shortlist (no Hire, since applied→hired is invalid)', () => {
        const h = handlers();
        const onMessage = jest.fn();
        const { getByLabelText, queryByLabelText } = render(
            <ApplicantDetailScreen visible application={base} onMessage={onMessage} {...h} />
        );
        expect(getByLabelText('Reject')).toBeTruthy();
        expect(getByLabelText('Message')).toBeTruthy();
        expect(getByLabelText('Shortlist')).toBeTruthy();
        expect(queryByLabelText('Hire')).toBeNull();

        fireEvent.press(getByLabelText('Shortlist'));
        expect(h.onShortlist).toHaveBeenCalledWith('app1');
        fireEvent.press(getByLabelText('Reject'));
        expect(h.onReject).toHaveBeenCalledWith('app1');
        fireEvent.press(getByLabelText('Message'));
        expect(onMessage).toHaveBeenCalledWith('app1');
    });

    it('shortlisted → Hire is the primary action (no Shortlist)', () => {
        const h = handlers();
        const { getByLabelText, queryByLabelText } = render(
            <ApplicantDetailScreen visible application={{ ...base, status: 'shortlisted' }} {...h} />
        );
        expect(getByLabelText('Hire')).toBeTruthy();
        expect(queryByLabelText('Shortlist')).toBeNull();
        fireEvent.press(getByLabelText('Hire'));
        expect(h.onHire).toHaveBeenCalledWith('app1');
    });

    it('hired → Message · Remove (no Reject/Hire/Shortlist)', () => {
        const h = handlers();
        const onMessage = jest.fn();
        const onRemove = jest.fn();
        const { getByLabelText, queryByLabelText } = render(
            <ApplicantDetailScreen visible application={{ ...base, status: 'hired' }} onMessage={onMessage} onRemove={onRemove} {...h} />
        );
        expect(getByLabelText('Remove')).toBeTruthy();
        expect(queryByLabelText('Reject')).toBeNull();
        expect(queryByLabelText('Hire')).toBeNull();
        expect(queryByLabelText('Shortlist')).toBeNull();
        fireEvent.press(getByLabelText('Remove'));
        expect(onRemove).toHaveBeenCalledWith('app1');
    });

    it('View full profile fires onViewProfile with the artist id', () => {
        const h = handlers();
        const { getByLabelText } = render(<ApplicantDetailScreen visible application={base} {...h} />);
        fireEvent.press(getByLabelText('View full profile'));
        expect(h.onViewProfile).toHaveBeenCalledWith('u1');
    });
});
