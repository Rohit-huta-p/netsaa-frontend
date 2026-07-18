import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { SentRequestRow } from '../SentRequestRow';
import { Connection } from '@/types/connection';

const twoDaysAgo = new Date(Date.now() - 2 * 86400 * 1000).toISOString();

const makeItem = (): Connection => ({
    _id: 'c1',
    requesterId: { _id: 'me', displayName: 'Me', firstName: 'Me', email: '', role: 'artist', artistType: '' },
    recipientId: {
        _id: 'u2',
        displayName: 'Arjun Rao',
        firstName: 'Arjun',
        email: '',
        role: 'creative_lead',
        artistType: 'Theatre director',
    },
    status: 'pending',
    createdAt: twoDaysAgo,
});

const setup = (overrides: Partial<React.ComponentProps<typeof SentRequestRow>> = {}) => {
    const onWithdraw = jest.fn();
    const onPressUser = jest.fn();
    render(
        <SentRequestRow
            item={makeItem()}
            currentUserId="me"
            onWithdraw={onWithdraw}
            onPressUser={onPressUser}
            {...overrides}
        />
    );
    return { onWithdraw, onPressUser };
};

describe('SentRequestRow', () => {
    it('renders the other party, role, and a Pending pill', () => {
        setup();
        expect(screen.getByText('Arjun Rao')).toBeTruthy();
        expect(screen.getByText(/Theatre director/)).toBeTruthy();
        expect(screen.getByText('Pending')).toBeTruthy();
    });

    it('does NOT withdraw on first tap — it opens a confirm surfacing the 14-day cooldown', () => {
        const { onWithdraw } = setup();
        fireEvent.press(screen.getByTestId('sent-withdraw-c1'));

        expect(onWithdraw).not.toHaveBeenCalled();
        expect(screen.getByText('14 days')).toBeTruthy();
        expect(screen.getByTestId('sent-keep-c1')).toBeTruthy();
        expect(screen.getByTestId('sent-confirm-c1')).toBeTruthy();
        // Pending pill is hidden while confirming
        expect(screen.queryByText('Pending')).toBeNull();
    });

    it('Keep cancels the confirm and restores the row', () => {
        const { onWithdraw } = setup();
        fireEvent.press(screen.getByTestId('sent-withdraw-c1'));
        fireEvent.press(screen.getByTestId('sent-keep-c1'));

        expect(onWithdraw).not.toHaveBeenCalled();
        expect(screen.queryByTestId('sent-confirm-c1')).toBeNull();
        expect(screen.getByTestId('sent-withdraw-c1')).toBeTruthy();
        expect(screen.getByText('Pending')).toBeTruthy();
    });

    it('confirming withdraw calls onWithdraw with the connection id', () => {
        const { onWithdraw } = setup();
        fireEvent.press(screen.getByTestId('sent-withdraw-c1'));
        fireEvent.press(screen.getByTestId('sent-confirm-c1'));

        expect(onWithdraw).toHaveBeenCalledTimes(1);
        expect(onWithdraw).toHaveBeenCalledWith('c1');
    });
});
