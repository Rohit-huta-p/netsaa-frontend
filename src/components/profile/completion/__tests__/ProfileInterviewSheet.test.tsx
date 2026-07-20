// netsa-frontend/src/components/profile/completion/__tests__/ProfileInterviewSheet.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileInterviewSheet from '../ProfileInterviewSheet';
import authService from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import * as ImagePicker from 'expo-image-picker';
import { uploadMediaFlow } from '@/utils/upload';
import type { InterviewField } from '../interviewFieldMeta';

jest.mock('@/services/authService', () => ({
  __esModule: true,
  default: { updateProfile: jest.fn() },
}));

jest.mock('expo-image-picker', () => ({
  MediaTypeOptions: { Images: 'Images', Videos: 'Videos' },
  launchImageLibraryAsync: jest.fn(),
}));
jest.mock('@/utils/upload', () => ({
  uploadMediaFlow: jest.fn(),
  validateMediaFile: () => ({ valid: true }),
}));

const nameField: InterviewField = {
  id: 'displayName', label: 'Display Name', section: 'header',
  question: 'What should hirers call you?', inputType: 'text', playbillSlot: 'name', chipLabel: 'Name',
  mirrorRelevant: false,
};

const videoField: InterviewField = {
  id: 'videoReel', label: 'Video reel', section: 'media',
  question: 'Add one short performance clip.', inputType: 'media', playbillSlot: 'none', chipLabel: 'Video reel',
  mirrorRelevant: true,
};

describe('ProfileInterviewSheet', () => {
  beforeEach(() => {
    (authService.updateProfile as jest.Mock).mockReset();
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockReset();
    (uploadMediaFlow as jest.Mock).mockReset();
    useAuthStore.setState({ user: { id: 'u1' } as any, accessToken: 'tok' } as any);
  });

  it('picks, uploads, and persists a media answer inline, then completes', async () => {
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://x.mp4', mimeType: 'video/mp4', fileSize: 1000 }],
    });
    (uploadMediaFlow as jest.Mock).mockResolvedValue({ success: true, url: 'https://cdn/x.mp4' });
    (authService.updateProfile as jest.Mock).mockResolvedValue({ videoUrls: ['https://cdn/x.mp4'] });
    useAuthStore.setState({ user: { id: 'u1', videoUrls: [] } as any, accessToken: 'tok' } as any);
    const onComplete = jest.fn();

    const { getByText } = render(
      <ProfileInterviewSheet visible fields={[videoField]} onClose={() => {}} onComplete={onComplete} />
    );

    fireEvent.press(getByText('Add your clip'));

    await waitFor(() => expect(uploadMediaFlow).toHaveBeenCalled());
    await waitFor(() => expect(authService.updateProfile).toHaveBeenCalledWith({ videoUrls: ['https://cdn/x.mp4'] }));
    await waitFor(() => expect(onComplete).toHaveBeenCalled());
  });

  it('saves a text answer via updateProfile and calls onComplete', async () => {
    (authService.updateProfile as jest.Mock).mockResolvedValue({ displayName: 'Rohit' });
    const onComplete = jest.fn();

    const { getByPlaceholderText, getByText } = render(
      <ProfileInterviewSheet visible fields={[nameField]} onClose={() => {}} onComplete={onComplete} />
    );

    fireEvent.changeText(getByPlaceholderText(/type your answer/i), 'Rohit');
    fireEvent.press(getByText(/save|next|done/i));

    await waitFor(() => expect(authService.updateProfile).toHaveBeenCalledWith({ displayName: 'Rohit' }));
    await waitFor(() => expect(onComplete).toHaveBeenCalledWith(['displayName']));
  });

  it('renders the field question', () => {
    const { getByText } = render(
      <ProfileInterviewSheet visible fields={[nameField]} onClose={() => {}} onComplete={() => {}} />
    );
    expect(getByText('What should hirers call you?')).toBeTruthy();
  });

  it('resets to the first field when reopened', async () => {
    (authService.updateProfile as jest.Mock).mockResolvedValue({ displayName: 'Rohit' });
    const f2: InterviewField[] = [
      { id: 'displayName', label: 'Display Name', section: 'header', question: 'What should hirers call you?', inputType: 'text', playbillSlot: 'name', chipLabel: 'Name', mirrorRelevant: false },
      { id: 'location', label: 'Location', section: 'header', question: 'Which city are you based in?', inputType: 'text', playbillSlot: 'none', chipLabel: 'City', mirrorRelevant: false },
    ] as any;
    const { getByText, getByPlaceholderText, rerender } = render(
      <ProfileInterviewSheet visible fields={f2} onClose={() => {}} onComplete={() => {}} />
    );

    // advance past field 0
    fireEvent.changeText(getByPlaceholderText(/type your answer/i), 'Rohit');
    fireEvent.press(getByText(/save|next/i));
    await waitFor(() => expect(getByText('Which city are you based in?')).toBeTruthy()); // now on field 1

    // close then reopen -> should be back on field 0
    rerender(<ProfileInterviewSheet visible={false} fields={f2} onClose={() => {}} onComplete={() => {}} />);
    rerender(<ProfileInterviewSheet visible fields={f2} onClose={() => {}} onComplete={() => {}} />);
    expect(getByText('What should hirers call you?')).toBeTruthy();
  });
});
