// netsa-mobile/src/features/team/__tests__/ContactActionSheet.test.tsx
//
// Locks the three contact channels (WhatsApp / Call / In-app message)
// and the phone-not-shared graceful path. Linking is mocked so
// canOpenURL / openURL calls don't touch native bindings.
import React from 'react';
import { Alert, Linking } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

jest.spyOn(Alert, 'alert').mockImplementation(() => {});
jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);

import { ContactActionSheet } from '../ContactActionSheet';

beforeEach(() => {
    (Alert.alert as jest.Mock).mockClear();
    openURLSpy.mockClear();
});

describe('ContactActionSheet', () => {
    const targetWithPhone = {
        artistId: 'a1',
        displayName: 'Priya Sharma',
        phoneNumber: '+919876543210',
        gigTitle: 'Sangeet Choreography',
    };
    const targetNoPhone = {
        artistId: 'a2',
        displayName: 'Meera Iyer',
        gigTitle: 'Wedding',
    };

    it('renders nothing when target is null', () => {
        const { toJSON } = render(
            <ContactActionSheet visible onClose={jest.fn()} target={null} />
        );
        expect(toJSON()).toBeNull();
    });

    it('WhatsApp tap opens wa.me with prefilled message when phone is present', async () => {
        const onClose = jest.fn();
        const { getByLabelText } = render(
            <ContactActionSheet visible onClose={onClose} target={targetWithPhone} />
        );

        fireEvent.press(getByLabelText('contact-whatsapp'));

        await waitFor(() => {
            expect(openURLSpy).toHaveBeenCalledTimes(1);
        });
        const url = openURLSpy.mock.calls[0][0] as string;
        expect(url).toContain('https://wa.me/919876543210');
        expect(url).toContain('Sangeet%20Choreography');
        expect(onClose).toHaveBeenCalled();
    });

    it('WhatsApp tap shows "phone not shared" Alert when phone missing', async () => {
        const { getByLabelText } = render(
            <ContactActionSheet visible onClose={jest.fn()} target={targetNoPhone} />
        );

        fireEvent.press(getByLabelText('contact-whatsapp'));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith(
                'Phone not shared',
                expect.stringContaining('Meera Iyer')
            );
        });
        expect(openURLSpy).not.toHaveBeenCalled();
    });

    it('Call tap opens tel: when phone is present', async () => {
        const { getByLabelText } = render(
            <ContactActionSheet visible onClose={jest.fn()} target={targetWithPhone} />
        );

        fireEvent.press(getByLabelText('contact-call'));

        await waitFor(() => {
            expect(openURLSpy).toHaveBeenCalledWith('tel:+919876543210');
        });
    });

    it('In-app message tap fires "Coming soon" Alert (route not yet built)', () => {
        const { getByLabelText } = render(
            <ContactActionSheet visible onClose={jest.fn()} target={targetWithPhone} />
        );

        fireEvent.press(getByLabelText('contact-in-app'));

        expect(Alert.alert).toHaveBeenCalledWith(
            'Coming soon',
            expect.stringContaining('In-app messaging')
        );
        expect(openURLSpy).not.toHaveBeenCalled();
    });
});
