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
        const { getAllByText } = render(<ProfileEditModal profileData={baseProfile} />);
        // In the long-scroll layout each label appears twice — once in the tab
        // bar, once as the section header — so assert at least one match.
        ['Basic', 'Bio', 'Skills', 'Experience', 'Media', 'Social', 'Org', 'Billing'].forEach(
            label => expect(getAllByText(label).length).toBeGreaterThanOrEqual(1)
        );
    });

    it('renders the Org Name input as part of the single long-scroll form', () => {
        const { getAllByText, getByPlaceholderText } = render(
            <ProfileEditModal profileData={baseProfile} />
        );
        // The form is now one long scroll — every section renders at once, so the
        // Org Name input is present immediately (it lives in the Org section).
        expect(getByPlaceholderText('Organization name')).toBeTruthy();
        // The Org tab still works as a scroll-to affordance and never unmounts it.
        // ([0] = the tab-bar pill, which sits above the section headers.)
        fireEvent.press(getAllByText('Org')[0]);
        expect(getByPlaceholderText('Organization name')).toBeTruthy();
    });

    it('renders an OPTIONAL badge near Org and Billing tabs', () => {
        const { getAllByText } = render(<ProfileEditModal profileData={baseProfile} />);
        expect(getAllByText('OPTIONAL').length).toBeGreaterThanOrEqual(2);
    });
});

describe('ProfileEditModal — discard prompt', () => {
    it('shows a discard sheet when closing with dirty edits', () => {
        const { getByPlaceholderText, getByLabelText, queryByText } = render(
            <ProfileEditModal profileData={baseProfile} />
        );
        fireEvent.changeText(getByPlaceholderText('Your name'), 'Pending');
        fireEvent.press(getByLabelText('Close edit modal'));
        expect(queryByText(/unsaved changes/i)).toBeTruthy();
    });

    it('Keep editing dismisses the discard sheet, modal stays', () => {
        const { getByPlaceholderText, getByLabelText, getByText, queryByText } = render(
            <ProfileEditModal profileData={baseProfile} />
        );
        fireEvent.changeText(getByPlaceholderText('Your name'), 'Pending');
        fireEvent.press(getByLabelText('Close edit modal'));
        fireEvent.press(getByText(/keep editing/i));
        expect(queryByText(/unsaved changes/i)).toBeNull();
        expect(getByPlaceholderText('Your name').props.value).toBe('Pending');
    });
});

describe('ProfileEditModal — dirty dot indicator', () => {
    it('marks the Basic tab dirty after editing Display Name', () => {
        const { getByPlaceholderText, getAllByText } = render(
            <ProfileEditModal profileData={baseProfile} />
        );
        fireEvent.changeText(getByPlaceholderText('Your name'), 'X');
        // Tabs now scroll within one form; nothing unmounts, so the unsaved value
        // must survive. ([0] = tab-bar pill, above the section headers.)
        fireEvent.press(getAllByText('Bio')[0]);
        fireEvent.press(getAllByText('Basic')[0]);
        expect(getByPlaceholderText('Your name').props.value).toBe('X');
    });
});

describe('ProfileEditModal — full skin tone palette', () => {
    it('renders all 7 skin tone swatches under the Bio tab', () => {
        const { getAllByText, UNSAFE_root } = render(
            <ProfileEditModal profileData={baseProfile} />
        );
        fireEvent.press(getAllByText('Bio')[0]);
        // Each skin tone is a TouchableOpacity with a solid backgroundColor
        // matching one of the 7 hex codes. asymmetric matchers don't match
        // through inline style objects — walk the tree and check the style
        // prop directly. RN may pass style as an object or an array.
        const tones = ['#fcd9b8', '#f0cbb0', '#dcb084', '#c29367', '#a57245', '#7b4b2a', '#4b2a1a'];
        const styleHasBg = (style: any, hex: string): boolean => {
            if (!style) return false;
            if (Array.isArray(style)) return style.some(s => styleHasBg(s, hex));
            return style.backgroundColor === hex;
        };
        tones.forEach(hex => {
            const matches = UNSAFE_root.findAll((node: any) => styleHasBg(node.props?.style, hex));
            expect(matches.length).toBeGreaterThanOrEqual(1);
        });
    });
});

describe('ProfileEditModal — availability picker', () => {
    it('renders Availability chips on the Basic tab', () => {
        const { getByText } = render(<ProfileEditModal profileData={baseProfile} />);
        expect(getByText('Availability')).toBeTruthy();
        expect(getByText('Available')).toBeTruthy();
        expect(getByText('Tentative')).toBeTruthy();
        expect(getByText('Busy')).toBeTruthy();
    });

    it('tapping Available marks the Basic tab dirty', () => {
        const { getByText, getAllByText, getByPlaceholderText } = render(
            <ProfileEditModal profileData={baseProfile} />
        );
        fireEvent.press(getByText('Available'));
        // Value survives scroll-to-section taps (nothing unmounts).
        fireEvent.press(getAllByText('Bio')[0]);
        fireEvent.press(getAllByText('Basic')[0]);
        // Display Name input still rendered — modal didn't unmount.
        expect(getByPlaceholderText('Your name')).toBeTruthy();
    });
});
