import { render } from '@testing-library/react-native';
import EventCapacityBar from '../detail/EventCapacityBar';

describe('EventCapacityBar', () => {
  it('renders slotsLeft when not full', () => {
    const { getByText } = render(<EventCapacityBar total={50} registeredCount={32} />);
    expect(getByText(/18 spots left/i)).toBeTruthy();
  });

  it('renders "Full" when capacity reached', () => {
    const { getByText } = render(<EventCapacityBar total={50} registeredCount={50} />);
    expect(getByText(/event full/i)).toBeTruthy();
  });

  it('shows urgent indicator at >= 90%', () => {
    const { getByTestId } = render(<EventCapacityBar total={10} registeredCount={9} />);
    expect(getByTestId('capacity-bar-fill').props.style).toMatchObject(
      expect.objectContaining({ backgroundColor: '#EF4444' })
    );
  });
});
