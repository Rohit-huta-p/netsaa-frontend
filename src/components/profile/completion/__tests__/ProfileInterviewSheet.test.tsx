// netsa-frontend/src/components/profile/completion/__tests__/ProfileInterviewSheet.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileInterviewSheet from '../ProfileInterviewSheet';
import authService from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import type { InterviewField } from '../interviewFieldMeta';

jest.mock('@/services/authService', () => ({
  __esModule: true,
  default: { updateProfile: jest.fn() },
}));

const nameField: InterviewField = {
  id: 'displayName', label: 'Display Name', section: 'header',
  question: 'What should hirers call you?', inputType: 'text', playbillSlot: 'name',
};

describe('ProfileInterviewSheet', () => {
  beforeEach(() => {
    (authService.updateProfile as jest.Mock).mockReset();
    useAuthStore.setState({ user: { id: 'u1' } as any, accessToken: 'tok' } as any);
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
});
