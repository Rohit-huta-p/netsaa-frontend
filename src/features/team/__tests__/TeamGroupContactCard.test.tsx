// netsa-mobile/src/features/team/__tests__/TeamGroupContactCard.test.tsx
//
// Locks the two states (no URL → editor / saved URL → display + actions),
// the Save round-trip, and the Edit toggle.
import React from 'react';
import { Alert, Linking } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockUpdateGig = jest.fn().mockResolvedValue({ data: { _id: 'g1' } });
jest.mock('@/hooks/useGigs', () => ({
    useUpdateGig: () => ({
        mutateAsync: (...args: any[]) => mockUpdateGig(...args),
        isPending: false,
    }),
}));
jest.spyOn(Alert, 'alert').mockImplementation(() => {});
const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);
jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);

import { TeamGroupContactCard } from '../components/TeamGroupContactCard';

beforeEach(() => {
    mockUpdateGig.mockClear();
    openURLSpy.mockClear();
    (Alert.alert as jest.Mock).mockClear();
});

describe('TeamGroupContactCard', () => {
    it('shows the editor when no URL is saved on the gig', () => {
        const { getByLabelText } = render(<TeamGroupContactCard gig={{ _id: 'g1' }} />);
        expect(getByLabelText('wa-invite-url-input')).toBeTruthy();
        expect(getByLabelText('wa-invite-save')).toBeTruthy();
    });

    it('saves a valid WhatsApp URL via useUpdateGig', async () => {
        const { getByLabelText } = render(<TeamGroupContactCard gig={{ _id: 'g1' }} />);
        const input = getByLabelText('wa-invite-url-input');
        fireEvent.changeText(input, 'https://chat.whatsapp.com/AbCdEf');
        fireEvent.press(getByLabelText('wa-invite-save'));

        await waitFor(() => {
            expect(mockUpdateGig).toHaveBeenCalledWith({
                id: 'g1',
                payload: { teamWhatsAppInviteUrl: 'https://chat.whatsapp.com/AbCdEf' },
            });
        });
    });

    it('rejects malformed URLs with an Alert (no save fired)', async () => {
        const { getByLabelText } = render(<TeamGroupContactCard gig={{ _id: 'g1' }} />);
        fireEvent.changeText(getByLabelText('wa-invite-url-input'), 'not-a-url');
        fireEvent.press(getByLabelText('wa-invite-save'));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Invalid URL', expect.any(String));
        });
        expect(mockUpdateGig).not.toHaveBeenCalled();
    });

    it('shows the saved URL + join + edit actions when a URL is set', () => {
        const { getByLabelText, getByText } = render(
            <TeamGroupContactCard
                gig={{ _id: 'g1', teamWhatsAppInviteUrl: 'https://chat.whatsapp.com/SavedXyz' }}
            />
        );
        expect(getByLabelText('wa-invite-saved-url').props.children).toBe('https://chat.whatsapp.com/SavedXyz');
        expect(getByText(/Open group chat/)).toBeTruthy();
        expect(getByLabelText('wa-invite-edit')).toBeTruthy();
    });

    it('Open group chat opens the saved URL via Linking', async () => {
        const { getByLabelText } = render(
            <TeamGroupContactCard
                gig={{ _id: 'g1', teamWhatsAppInviteUrl: 'https://chat.whatsapp.com/SavedXyz' }}
            />
        );
        fireEvent.press(getByLabelText('wa-invite-join'));

        await waitFor(() => {
            expect(openURLSpy).toHaveBeenCalledWith('https://chat.whatsapp.com/SavedXyz');
        });
    });

    it('Edit toggles back to the input + Cancel restores the saved value', () => {
        const { getByLabelText } = render(
            <TeamGroupContactCard
                gig={{ _id: 'g1', teamWhatsAppInviteUrl: 'https://chat.whatsapp.com/SavedXyz' }}
            />
        );
        fireEvent.press(getByLabelText('wa-invite-edit'));
        expect(getByLabelText('wa-invite-url-input').props.value).toBe('https://chat.whatsapp.com/SavedXyz');

        // Type something else, then cancel — should snap back to saved.
        fireEvent.changeText(getByLabelText('wa-invite-url-input'), 'https://example.com/changed');
        fireEvent.press(getByLabelText('wa-invite-cancel'));

        // After cancel we're back in display mode showing the original.
        expect(getByLabelText('wa-invite-saved-url').props.children).toBe('https://chat.whatsapp.com/SavedXyz');
    });
});
