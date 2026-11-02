import { render } from '@testing-library/react-native';
import EventRegisterSheetV2 from '../register/EventRegisterSheetV2';

const noop = () => {};

// useEvent is configurable per test so we can drive different door policies.
const mockUseEvent = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: jest.fn(() => Promise.resolve()),
    getQueriesData: jest.fn(() => []),
  }),
  // useMyRegistration → "not registered" so the sheet renders the form.
  useQuery: () => ({ data: null, isLoading: false, isError: false }),
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
    mutateAsync: jest.fn().mockResolvedValue({ status: 'pending', requiresApproval: true }),
    isPending: false,
    isError: false,
  }),
  useEvent: (...args: unknown[]) => mockUseEvent(...args),
}));

const baseEvent = {
  _id: 'evt1',
  title: 'Doors test event',
  registrationMode: 'free_rsvp',
  capacity: { total: 50, registeredCount: 0 },
  pricing: { amount: 0 },
};

const withDoor = (door: string, extra: Record<string, unknown> = {}) => ({
  data: { ...baseEvent, registration: { door }, ...extra },
  isLoading: false,
  isError: false,
});

describe('EventRegisterSheetV2 door variants', () => {
  it('open door: confirm CTA + attendee stepper (baseline)', () => {
    mockUseEvent.mockReturnValue(withDoor('open'));
    const { getByText } = render(<EventRegisterSheetV2 eventId="evt1" open onClose={noop} />);
    expect(getByText(/confirm registration/i)).toBeTruthy();
    expect(getByText(/how many attending/i)).toBeTruthy();
  });

  it('guest_list: "Request to join" CTA, no attendee stepper', () => {
    mockUseEvent.mockReturnValue(withDoor('guest_list'));
    const { getByText, queryByText } = render(<EventRegisterSheetV2 eventId="evt1" open onClose={noop} />);
    expect(getByText('Request to join')).toBeTruthy();
    expect(queryByText(/how many attending/i)).toBeNull();
  });

  it('apply: "Apply" CTA + application link field', () => {
    mockUseEvent.mockReturnValue(withDoor('apply'));
    const { getByText, getByPlaceholderText } = render(<EventRegisterSheetV2 eventId="evt1" open onClose={noop} />);
    expect(getByText('Apply')).toBeTruthy();
    expect(getByPlaceholderText(/Link to your work/i)).toBeTruthy();
  });

  it('paid apply: shows the pay-after-approval note (not an upfront price)', () => {
    mockUseEvent.mockReturnValue(
      withDoor('apply', {
        registrationMode: 'paid_ticket',
        pricing: { amount: 500 },
        spots: [{ _id: 's1', name: 'General', price: 500 }],
      }),
    );
    const { getByText } = render(<EventRegisterSheetV2 eventId="evt1" open onClose={noop} />);
    expect(getByText(/Pay after approval/i)).toBeTruthy();
  });

  it('renders host custom questions (choice options as chips)', () => {
    mockUseEvent.mockReturnValue(
      withDoor('open', {
        registration: {
          door: 'open',
          questions: [{ _id: 'q1', label: 'Your experience level?', type: 'choice', options: ['Beginner', 'Pro'], required: true }],
        },
      }),
    );
    const { getByText } = render(<EventRegisterSheetV2 eventId="evt1" open onClose={noop} />);
    // Label renders with a required marker appended ("… *"), so match loosely.
    expect(getByText(/Your experience level/)).toBeTruthy();
    expect(getByText('Beginner')).toBeTruthy();
    expect(getByText('Pro')).toBeTruthy();
  });
});
