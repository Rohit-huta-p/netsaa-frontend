// src/features/profile/components/edit/__tests__/ProfileEditModal.behavior.test.tsx

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';

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
    default: { updateProfile: jest.fn(), updateOrganizer: jest.fn() },
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

// authStore — Zustand-compatible default + named export.
jest.mock('@/stores/authStore', () => {
    const store = { user: { _id: 'u1' }, accessToken: 'tok', setAuth: jest.fn() };
    const useAuthStore: any = (selector?: (s: any) => any) =>
        selector ? selector(store) : store;
    useAuthStore.getState = () => store;
    return { __esModule: true, default: useAuthStore, useAuthStore };
});

jest.mock('@/stores/profileUiStore', () => {
    const state = { activeSheet: 'header', highlightMissing: [] as string[] };
    const useProfileUiStore: any = (selector?: (s: any) => any) =>
        selector ? selector(state) : state;
    useProfileUiStore.getState = () => state;
    return {
        __esModule: true,
        useProfileUiStore: Object.assign(useProfileUiStore, {
            // Hook returns shape callers spread:
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

describe('ProfileEditModal — Display Name is always editable', () => {
    it('renders the Display Name input regardless of any role flag', () => {
        const { getByPlaceholderText } = render(
            // Note: isOrganizer prop is removed by this task. Render without it.
            <ProfileEditModal profileData={baseProfile} />
        );
        expect(getByPlaceholderText('Your name')).toBeTruthy();
    });

    it('typing into Display Name updates the input value', () => {
        const { getByPlaceholderText } = render(<ProfileEditModal profileData={baseProfile} />);
        const input = getByPlaceholderText('Your name');
        fireEvent.changeText(input, 'New Name');
        expect(input.props.value).toBe('New Name');
    });
});

describe('ProfileEditModal — 8 tabs always visible', () => {
    it('renders all 8 tab labels including Org and Billing', () => {
        const { getByText } = render(<ProfileEditModal profileData={baseProfile} />);
        ['Basic', 'Bio', 'Skills', 'Experience', 'Media', 'Social', 'Org', 'Billing'].forEach(
            label => expect(getByText(label)).toBeTruthy()
        );
    });

    it('renders Org Name input under the Org tab (not Basic)', () => {
        const { getByText, queryByPlaceholderText, getByPlaceholderText } = render(
            <ProfileEditModal profileData={baseProfile} />
        );
        // Basic tab is active by default — Org Name should NOT be there.
        expect(queryByPlaceholderText('Organization name')).toBeNull();
        // Switch to Org tab.
        fireEvent.press(getByText('Org'));
        // Now Org Name should be present.
        expect(getByPlaceholderText('Organization name')).toBeTruthy();
    });

    it('renders an OPTIONAL badge near Org and Billing tabs', () => {
        const { getAllByText } = render(<ProfileEditModal profileData={baseProfile} />);
        expect(getAllByText('OPTIONAL').length).toBeGreaterThanOrEqual(2);
    });
});
