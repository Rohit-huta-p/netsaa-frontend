// src/features/profile/components/edit/__tests__/ProfileEditModal.save.test.tsx

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

const mockUpdateProfile = jest.fn().mockResolvedValue({ _id: 'u1', displayName: 'Updated' });
const mockUpdateOrganizer = jest.fn().mockResolvedValue({ organizationName: 'OrgX' });

jest.mock('@/services/authService', () => ({
    __esModule: true,
    default: {
        updateProfile: (...args: any[]) => mockUpdateProfile(...args),
        updateOrganizer: (...args: any[]) => mockUpdateOrganizer(...args),
    },
}));
jest.mock('@/services/gigService', () => ({
    __esModule: true,
    default: { saveGig: jest.fn() },
}));
jest.mock('expo-image-picker', () => ({
    launchImageLibraryAsync: jest.fn(),
    MediaTypeOptions: { Images: 'Images', Videos: 'Videos' },
}));
jest.mock('expo-av', () => ({ Video: 'Video', ResizeMode: { COVER: 'cover' } }));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
jest.mock('@/utils/upload', () => ({
    uploadMediaFlow: jest.fn(),
    validateMediaFile: () => ({ valid: true }),
    isLargeFile: () => false,
}));
jest.mock('@/components/ui/AITextInput', () => ({
    AITextInput: ({ value, onChangeText, placeholder }: any) => {
        const { TextInput } = require('react-native');
        return <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} />;
    },
}));
jest.mock('@/stores/authStore', () => {
    const setAuth = jest.fn();
    const store = { user: { _id: 'u1' }, accessToken: 'tok', setAuth };
    const useAuthStore: any = (selector?: (s: any) => any) =>
        selector ? selector(store) : store;
    useAuthStore.getState = () => store;
    return { __esModule: true, default: useAuthStore, useAuthStore };
});
jest.mock('@/stores/profileUiStore', () => {
    const state = { activeSheet: 'header', highlightMissing: [] as string[], closeSheet: jest.fn() };
    const useProfileUiStore: any = (selector?: (s: any) => any) =>
        selector ? selector(state) : state;
    useProfileUiStore.getState = () => state;
    return { __esModule: true, useProfileUiStore: Object.assign(useProfileUiStore, state) };
});

import { ProfileEditModal } from '../../ProfileEditModal';

const profile = {
    fullName: '', headline: '', location: '', age: '', gender: '', height: '',
    skinTone: '', skinToneHex: '', artistType: '', skills: [], bio: '',
    instagramHandle: '', experience: [], hasPhotos: false,
} as any;

beforeEach(() => {
    mockUpdateProfile.mockClear();
    mockUpdateOrganizer.mockClear();
});

describe('ProfileEditModal — single Save fans out to two endpoints', () => {
    it('edits to Basic only call updateProfile (not updateOrganizer)', async () => {
        const { getByPlaceholderText, getByText } = render(
            <ProfileEditModal profileData={profile} />
        );
        fireEvent.changeText(getByPlaceholderText('Your name'), 'Aarav');
        fireEvent.press(getByText(/^Save changes$/));

        await waitFor(() => {
            expect(mockUpdateProfile).toHaveBeenCalledTimes(1);
        });
        expect(mockUpdateProfile.mock.calls[0][0]).toEqual(
            expect.objectContaining({ displayName: 'Aarav' })
        );
        expect(mockUpdateOrganizer).not.toHaveBeenCalled();
    });

    it('edits across Basic + Org call both endpoints in parallel', async () => {
        const { getByPlaceholderText, getByText } = render(
            <ProfileEditModal profileData={profile} />
        );
        fireEvent.changeText(getByPlaceholderText('Your name'), 'Aarav');
        fireEvent.press(getByText('Org'));
        fireEvent.changeText(getByPlaceholderText('Organization name'), 'Studio X');
        fireEvent.press(getByText(/^Save changes$/));

        await waitFor(() => {
            expect(mockUpdateProfile).toHaveBeenCalledTimes(1);
            expect(mockUpdateOrganizer).toHaveBeenCalledTimes(1);
        });
        expect(mockUpdateProfile.mock.calls[0][0]).toEqual(
            expect.objectContaining({ displayName: 'Aarav' })
        );
        expect(mockUpdateOrganizer.mock.calls[0][0]).toEqual(
            expect.objectContaining({ organizationName: 'Studio X' })
        );
    });
});
