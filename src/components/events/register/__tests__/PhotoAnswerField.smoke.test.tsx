import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PhotoAnswerField from '../PhotoAnswerField';

// jest hoists these factories above the imports, so referenced vars must be
// `mock`-prefixed (babel-plugin-jest-hoist allowlist).
const mockUploadWithRetry = jest.fn();
const mockValidate = jest.fn(() => ({ valid: true }));
const mockRequestPerm = jest.fn(() => Promise.resolve({ granted: true }));
const mockLaunch = jest.fn();

jest.mock('expo-image', () => ({ Image: 'Image' }));

jest.mock('expo-image-picker', () => ({
  MediaTypeOptions: { Images: 'Images' },
  requestMediaLibraryPermissionsAsync: () => mockRequestPerm(),
  launchImageLibraryAsync: () => mockLaunch(),
}));

jest.mock('@/utils/upload', () => ({
  uploadWithRetry: (...args: any[]) => mockUploadWithRetry(...args),
  validateMediaFile: (...args: any[]) => mockValidate(...args),
}));

const ASSET = { uri: 'file:///tmp/pic.jpg', mimeType: 'image/jpeg', fileSize: 1024, width: 800, height: 600 };

beforeEach(() => {
  mockUploadWithRetry.mockReset();
  mockValidate.mockReset().mockReturnValue({ valid: true });
  mockRequestPerm.mockReset().mockResolvedValue({ granted: true });
  mockLaunch.mockReset().mockResolvedValue({ canceled: false, assets: [ASSET] });
});

describe('PhotoAnswerField', () => {
  it('empty state shows the Add photo affordance', () => {
    const { getByText } = render(
      <PhotoAnswerField value={undefined} onChange={jest.fn()} entityId="attendee123" />,
    );
    expect(getByText('Add photo')).toBeTruthy();
  });

  it('with a value shows a thumbnail with Replace / Remove, and Remove clears it', () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <PhotoAnswerField value="https://cdn.netsa/users/attendee123/gallery/x.jpg" onChange={onChange} entityId="attendee123" />,
    );
    expect(getByText('Replace')).toBeTruthy();
    fireEvent.press(getByText('Remove'));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('pick → upload presigns under the attendee\'s OWN user/gallery scope and returns the CDN url', async () => {
    mockUploadWithRetry.mockResolvedValue({ success: true, url: 'https://cdn.netsa/users/attendee123/gallery/new.jpg' });
    const onChange = jest.fn();
    const { getByText } = render(
      <PhotoAnswerField value={undefined} onChange={onChange} entityId="attendee123" />,
    );

    fireEvent.press(getByText('Add photo'));

    await waitFor(() => expect(mockUploadWithRetry).toHaveBeenCalledTimes(1));
    // The privacy-critical invariant: never the event owner's scope, never a
    // profile-display bucket (portfolio/avatar) — the attendee's own id, gallery.
    expect(mockUploadWithRetry).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: 'user', entityId: 'attendee123', purpose: 'gallery', asset: ASSET }),
    );
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith('https://cdn.netsa/users/attendee123/gallery/new.jpg'),
    );
  });

  it('surfaces an upload failure and does not report a value', async () => {
    mockUploadWithRetry.mockResolvedValue({ success: false, error: 'Upload failed. Please try again.' });
    const onChange = jest.fn();
    const { getByText, findByText } = render(
      <PhotoAnswerField value={undefined} onChange={onChange} entityId="attendee123" />,
    );

    fireEvent.press(getByText('Add photo'));

    expect(await findByText('Upload failed. Please try again.')).toBeTruthy();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('a rejected file (bad type/too large) never uploads', async () => {
    mockValidate.mockReturnValue({ valid: false, error: 'File too large. Maximum size: 10MB' });
    const onChange = jest.fn();
    const { getByText, findByText } = render(
      <PhotoAnswerField value={undefined} onChange={onChange} entityId="attendee123" />,
    );

    fireEvent.press(getByText('Add photo'));

    expect(await findByText(/File too large/)).toBeTruthy();
    expect(mockUploadWithRetry).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });
});
