import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Step6Media from '../composer/steps/Step6Media';
import { useCreateEventStore } from '@/stores/createEventStore';
import * as ImagePicker from 'expo-image-picker';
import { uploadVideoFlow } from '@/utils/upload';

jest.mock('@/utils/upload', () => ({ uploadVideoFlow: jest.fn(), uploadMediaFlow: jest.fn() }));
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn(), MediaTypeOptions: { All: 'All' } }));
jest.mock('@/services/mediaService', () => ({ __esModule: true, default: { getAssetStatus: jest.fn().mockResolvedValue({ data: { status: 'processing' } }) } }));

const EVENT_ID = '60d5ec9af682fbd12a892c41';

it('video pick → uploadVideoFlow + a processing entry (no S3, no <Image> on a video url)', async () => {
  useCreateEventStore.getState().reset();
  useCreateEventStore.setState({ editMode: true, editEventId: EVENT_ID });
  (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({ canceled: false, assets: [{ uri: 'file://v.mp4', type: 'video', mimeType: 'video/mp4', width: 720, height: 1280, duration: 12 }] });
  (uploadVideoFlow as jest.Mock).mockResolvedValue({ success: true, uploadId: 'up_1' });

  const { getByLabelText } = render(<Step6Media onNext={jest.fn()} onBack={jest.fn()} />);
  fireEvent.press(getByLabelText('Add photo'));

  await waitFor(() => expect(uploadVideoFlow).toHaveBeenCalled());
  const media = useCreateEventStore.getState().form.media;
  expect(media[0]).toEqual(expect.objectContaining({ kind: 'video', status: 'processing', uploadId: 'up_1' }));
});
