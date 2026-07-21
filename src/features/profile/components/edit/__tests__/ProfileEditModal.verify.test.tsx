// src/features/profile/components/edit/__tests__/ProfileEditModal.verify.test.tsx

import React from 'react';
import { render } from '@testing-library/react-native';

// Mocks must precede the import.
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
jest.mock('@/services/authService', () => ({
    __esModule: true,
    default: {
        updateProfile: jest.fn(),
        updateOrganizer: jest.fn(),
        sendEmailCode: jest.fn(),
        verifyEmailCode: jest.fn(),
    },
}));
jest.mock('@/services/gigService', () => ({
    __esModule: true,
    default: { saveGig: jest.fn() },
}));
jest.mock('@/components/ui/AITextInput', () => ({
    AITextInput: ({ value, onChangeText, placeholder }: any) => {
        const { TextInput } = require('react-native');
        return <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} />;
    },
}));

// authStore — Zustand-compatible default + named export. User has NO
// emailVerifiedAt: exercises the "add a backup email" (unverified) path.
jest.mock('@/stores/authStore', () => {
    const store = {
        user: { _id: 'u1', phoneNumber: '+91 98765 43210' },
        accessToken: 'tok',
        setAuth: jest.fn(),
    };
    const useAuthStore: any = (selector?: (s: any) => any) =>
        selector ? selector(store) : store;
    useAuthStore.getState = () => store;
    return { __esModule: true, default: useAuthStore, useAuthStore };
});

// activeSheet: 'verify' opens the modal directly on the new leftmost tab.
jest.mock('@/stores/profileUiStore', () => {
    const state = { activeSheet: 'verify', highlightMissing: [] as string[] };
    const useProfileUiStore: any = (selector?: (s: any) => any) =>
        selector ? selector(state) : state;
    useProfileUiStore.getState = () => state;
    return {
        __esModule: true,
        useProfileUiStore: Object.assign(useProfileUiStore, {
            ...state,
            closeSheet: jest.fn(),
        }),
    };
});

import { ProfileEditModal } from '../../ProfileEditModal';

const baseProfile = {
    fullName: 'Existing Name',
    headline: '',
    location: '',
    age: '',
    gender: '',
    height: '',
    skinTone: '',
    skinToneHex: '',
    artistType: '',
    skills: [],
    bio: '',
    instagramHandle: '',
    experience: [],
    hasPhotos: false,
} as any;

describe('ProfileEditModal — Verify section (email add -> 6-digit code -> verified)', () => {
    it('shows the phone-secured (read-only) rung and a backup-email field', () => {
        const { getByText, getByPlaceholderText } = render(
            <ProfileEditModal profileData={baseProfile} />
        );
        expect(getByText('Secure your account')).toBeTruthy();
        expect(getByText(/Phone secured/i)).toBeTruthy();
        expect(getByPlaceholderText(/name@email/i)).toBeTruthy();
    });

    it('does not show a CTA on the read-only phone rung', () => {
        const { getByText, queryByText } = render(
            <ProfileEditModal profileData={baseProfile} />
        );
        expect(getByText('+91 98765 43210')).toBeTruthy();
        // No "KYC" / "Level" jargon anywhere in the section.
        expect(queryByText(/KYC/i)).toBeNull();
        expect(queryByText(/Level \d/i)).toBeNull();
    });
});
