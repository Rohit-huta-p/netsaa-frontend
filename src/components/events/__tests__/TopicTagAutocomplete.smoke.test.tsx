import { render, fireEvent, waitFor } from '@testing-library/react-native';
import TopicTagAutocomplete from '../composer/TopicTagAutocomplete';

jest.mock('@/hooks/useTopicTags', () => ({
  useTopicTagSuggestions: () => ({
    data: { tags: [
      { _id: 'workshop', displayName: 'Workshop', usageCount: 147 },
      { _id: 'audition', displayName: 'Audition', usageCount: 89 },
    ], count: 2 },
  }),
}));

jest.mock('@/services/eventService', () => ({
  eventService: { submitTag: jest.fn().mockResolvedValue({ created: true, normalizedId: 'masterclass', displayName: 'Masterclass' }) },
}));

describe('TopicTagAutocomplete (polished)', () => {
  it('renders suggestions on mount', () => {
    const { getByText } = render(<TopicTagAutocomplete selected={[]} onChange={() => {}} />);
    expect(getByText('Workshop')).toBeTruthy();
    expect(getByText('Audition')).toBeTruthy();
  });

  it('adds tag on suggestion tap', () => {
    const onChange = jest.fn();
    const { getByText } = render(<TopicTagAutocomplete selected={[]} onChange={onChange} />);
    fireEvent.press(getByText('Workshop'));
    expect(onChange).toHaveBeenCalledWith(['workshop']);
  });

  it('caps at max selections (3)', () => {
    const onChange = jest.fn();
    const { queryByText, getByPlaceholderText } = render(
      <TopicTagAutocomplete selected={['a', 'b', 'c']} onChange={onChange} />
    );
    expect(queryByText(/search or type/i)).toBeNull();
  });
});
