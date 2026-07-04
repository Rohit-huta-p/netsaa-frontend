import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Step6Media from '../composer/steps/Step6Media';
import { useCreateEventStore } from '@/stores/createEventStore';
import * as ImagePicker from 'expo-image-picker';
import { uploadMediaFlow } from '@/utils/upload';

jest.mock('@/utils/upload', () => ({ uploadMediaFlow: jest.fn() }));
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { All: 'All' },
}));

const EVENT_ID = '60d5ec9af682fbd12a892c41'; // valid 24-hex ObjectId
const asset = { uri: 'file://x.jpg', type: 'image', width: 100, height: 100, mimeType: 'image/jpeg', fileSize: 1000 };

describe('Step6Media — presign entityId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCreateEventStore.getState().reset();
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({ canceled: false, assets: [asset] });
    (uploadMediaFlow as jest.Mock).mockResolvedValue({ success: true, url: 'https://cdn/x.jpg' });
  });

  it('edit mode: presigns against the real event id, never "temp"', async () => {
    useCreateEventStore.setState({ editMode: true, editEventId: EVENT_ID });
    const { getByLabelText } = render(<Step6Media onNext={jest.fn()} onBack={jest.fn()} />);

    fireEvent.press(getByLabelText('Add photo'));

    await waitFor(() => expect(uploadMediaFlow).toHaveBeenCalled());
    const arg = (uploadMediaFlow as jest.Mock).mock.calls[0][0];
    expect(arg.entityId).toBe(EVENT_ID);
    expect(arg.entityId).not.toBe('temp');
    expect(arg.entityType).toBe('event');
  });

  it('create mode (no persisted event): does not fire a doomed presign', async () => {
    // reset() leaves editMode=false, editEventId=null
    const { getByLabelText } = render(<Step6Media onNext={jest.fn()} onBack={jest.fn()} />);

    fireEvent.press(getByLabelText('Add photo'));

    await waitFor(() => expect(ImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled());
    expect(uploadMediaFlow).not.toHaveBeenCalled();
  });
});
