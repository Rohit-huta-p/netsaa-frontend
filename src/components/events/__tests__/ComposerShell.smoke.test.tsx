import { render, fireEvent } from '@testing-library/react-native';
import ComposerShell from '../composer/ComposerShell';
import { useCreateEventStore } from '@/stores/createEventStore';

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn() }),
}));

describe('ComposerShell', () => {
  beforeEach(() => useCreateEventStore.getState().reset());

  it('renders step 1 by default with title "Topic + mode"', () => {
    const { getByText } = render(<ComposerShell />);
    expect(getByText('Topic + mode')).toBeTruthy();
    expect(getByText('Step 1 of 7')).toBeTruthy();
  });

  it('advances to step 2 when Continue tapped', () => {
    const { getByText, queryByText } = render(<ComposerShell />);
    fireEvent.press(getByText('Continue'));
    expect(queryByText('Step 2 of 7')).toBeTruthy();
  });
});
