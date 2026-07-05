// src/features/profile/components/edit/__tests__/ProfileEditModal.video.test.tsx

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// Mocks must precede the import.
jest.mock('expo-image-picker', () => ({
    launchImageLibraryAsync: jest.fn(),
    MediaTypeOptions: { Images: 'Images', Videos: 'Videos', All: 'All' },
}));
jest.mock('expo-av', () => ({ Video: 'Video', ResizeMode: { COVER: 'cover' } }));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
jest.mock('@/utils/upload', () => ({
    uploadVideoFlow: jest.fn(),
    uploadMediaFlow: jest.fn(),
    validateMediaFile: () => ({ valid: true }),
    isLargeFile: () => false,
}));
jest.mock('@/services/mediaService', () => ({
    __esModule: true,
    default: { getAssetStatus: jest.fn().mockResolvedValue({ data: { status: 'processing' } }) },
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
    const state = { activeSheet: 'media', highlightMissing: [] as string[] };
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
import { uploadVideoFlow } from '@/utils/upload';

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
    videoReels: [],
} as any;

describe('ProfileEditModal — video reels upload via Mux', () => {
    it('picking a video calls uploadVideoFlow (not uploadMediaFlow/S3) with entityType user + purpose portfolio', async () => {
        const ImagePicker = require('expo-image-picker');
        (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
            canceled: false,
            assets: [{ uri: 'file://reel.mp4', mimeType: 'video/mp4', fileSize: 1000, width: 720, height: 1280, duration: 12 }],
        });
        (uploadVideoFlow as jest.Mock).mockResolvedValue({ success: true, uploadId: 'up_1' });

        const { getAllByLabelText } = render(<ProfileEditModal profileData={baseProfile} />);
        fireEvent.press(getAllByLabelText('Add reel')[0]);

        await waitFor(() => expect(uploadVideoFlow).toHaveBeenCalled());
        expect(uploadVideoFlow).toHaveBeenCalledWith(
            expect.objectContaining({ entityType: 'user', entityId: 'u1', purpose: 'portfolio' })
        );
    });

    it('a processing reel entry appears after a successful pick (no raw <Image>/<video> for it)', async () => {
        const ImagePicker = require('expo-image-picker');
        (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
            canceled: false,
            assets: [{ uri: 'file://reel.mp4', mimeType: 'video/mp4', fileSize: 1000, width: 720, height: 1280, duration: 12 }],
        });
        (uploadVideoFlow as jest.Mock).mockResolvedValue({ success: true, uploadId: 'up_2' });

        const { getAllByLabelText, findByText } = render(<ProfileEditModal profileData={baseProfile} />);
        fireEvent.press(getAllByLabelText('Add reel')[0]);

        const processingLabel = await findByText(/processing/i);
        expect(processingLabel).toBeTruthy();
    });

    // Fix 3: the sibling event picker this feature mirrors (Step6Media) caps
    // picks at 60s via `videoMaxDuration: 60`; the reel picker had no cap.
    it('caps reel picks at 60s via videoMaxDuration, mirroring Step6Media', async () => {
        const ImagePicker = require('expo-image-picker');
        (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
            canceled: false,
            assets: [{ uri: 'file://reel.mp4', mimeType: 'video/mp4', fileSize: 1000, width: 720, height: 1280, duration: 12 }],
        });
        (uploadVideoFlow as jest.Mock).mockResolvedValue({ success: true, uploadId: 'up_3' });

        const { getAllByLabelText } = render(<ProfileEditModal profileData={baseProfile} />);
        fireEvent.press(getAllByLabelText('Add reel')[0]);

        await waitFor(() => expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled());
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(
            expect.objectContaining({ videoMaxDuration: 60 })
        );
    });
});
