import { render, fireEvent } from '@testing-library/react-native';
import TopicTagAutocomplete from '../composer/TopicTagAutocomplete';

jest.mock('@/hooks/useTopicTags', () => ({
  useTopicTagSuggestions: () => ({
    data: { tags: [
      { _id: 'workshop', displayName: 'Workshop', usageCount: 147 },
      { _id: 'audition', displayName: 'Audition', usageCount: 89 },
    ], count: 2 },
  }),
}));

describe('TopicTagAutocomplete', () => {
  it('renders suggestions on mount', () => {
    const onChange = jest.fn();
    const { getByText } = render(<TopicTagAutocomplete selected={[]} onChange={onChange} />);
    expect(getByText('Workshop')).toBeTruthy();
    expect(getByText('Audition')).toBeTruthy();
  });

  it('adds tag on tap', () => {
    const onChange = jest.fn();
    const { getByText } = render(<TopicTagAutocomplete selected={[]} onChange={onChange} />);
    fireEvent.press(getByText('Workshop'));
    expect(onChange).toHaveBeenCalledWith(['workshop']);
  });
});
