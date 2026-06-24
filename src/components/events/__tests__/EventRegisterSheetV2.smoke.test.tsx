import { render, fireEvent } from '@testing-library/react-native';
import EventRegisterSheetV2 from '../register/EventRegisterSheetV2';

const noop = () => {};

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: jest.fn(() => Promise.resolve()),
    getQueriesData: jest.fn(() => []),
  }),
  // useMyRegistration calls useQuery — return a "not registered" shape so the
  // sheet renders the form, not the receipt fallback.
  useQuery: () => ({
    data: null,
    isLoading: false,
    isError: false,
  }),
  useMutation: () => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn().mockResolvedValue({ ok: true }),
    isPending: false,
    isError: false,
  }),
}));

jest.mock('@/hooks/useEvents', () => ({
  useRegisterForEvent: () => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn().mockResolvedValue({ ok: true, visibility: 'private' }),
    isPending: false,
    isError: false,
  }),
  useEvent: () => ({
    data: {
      _id: 'evt1',
      title: 'Smoke test event',
      registrationMode: 'free_rsvp',
      capacity: { total: 50, registeredCount: 0 },
      pricing: { amount: 0 },
    },
    isLoading: false,
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
