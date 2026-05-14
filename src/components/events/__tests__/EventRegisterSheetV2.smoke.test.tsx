import { render, fireEvent } from '@testing-library/react-native';
import EventRegisterSheetV2 from '../register/EventRegisterSheetV2';

const noop = () => {};

jest.mock('@/hooks/useEvents', () => ({
  useRegisterForEvent: () => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn().mockResolvedValue({ ok: true, visibility: 'private' }),
    isPending: false,
    isError: false,
  }),
}));

describe('EventRegisterSheetV2', () => {
  it('renders when open', () => {
    const { getByText } = render(
      <EventRegisterSheetV2 eventId="evt1" open onClose={noop} />
    );
    expect(getByText(/confirm registration/i)).toBeTruthy();
  });

  it('does NOT render when closed', () => {
    const { queryByText } = render(
      <EventRegisterSheetV2 eventId="evt1" open={false} onClose={noop} />
    );
    expect(queryByText(/confirm registration/i)).toBeNull();
  });

  it('defaults visibility to private', () => {
    const { getByTestId } = render(
      <EventRegisterSheetV2 eventId="evt1" open onClose={noop} />
    );
    expect(getByTestId('visibility-toggle').props.accessibilityState.checked).toBe(false);
  });
});
