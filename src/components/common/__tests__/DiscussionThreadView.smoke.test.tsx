import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import DiscussionThreadView, { type ThreadComment } from '../DiscussionThreadView';

const base = {
  loading: false,
  currentUserId: 'u1',
  ownerId: 'prod1',
  inputText: '',
  sending: false,
  replyingTo: null,
  onChangeText: () => {},
  onSend: () => {},
  onStartReply: () => {},
  onCancelReply: () => {},
};

const comments: ThreadComment[] = [
  { _id: 'c1', text: 'Is the track shared?', authorId: 'a1', authorName: 'Neha K.', createdAt: '2026-05-10T10:00:00Z' },
  { _id: 'c2', text: 'Shared when shortlisted.', authorId: 'prod1', authorName: 'Aditi Rao', parentId: 'c1', createdAt: '2026-05-10T11:00:00Z' },
  { _id: 'c3', text: 'Just the mix?', authorId: 'a2', authorName: 'Rohan S.', parentId: 'c1', createdAt: '2026-05-10T12:00:00Z' },
  { _id: 'c4', text: 'Video audition ok?', authorId: 'a3', authorName: 'Meera T.', createdAt: '2026-05-10T13:00:00Z' },
];

describe('DiscussionThreadView', () => {
  it('groups replies under their root, badges the producer, and puts Reply on every comment', () => {
    const { getByText, getAllByText } = render(<DiscussionThreadView {...base} comments={comments} />);
    expect(getByText('Questions & answers')).toBeTruthy();
    expect(getByText('Is the track shared?')).toBeTruthy();
    expect(getByText('Shared when shortlisted.')).toBeTruthy(); // nested reply rendered
    expect(getByText('Producer')).toBeTruthy(); // owner's reply is badged
    expect(getByText('2 threads')).toBeTruthy(); // c1 + c4 are roots; c2/c3 are replies
    expect(getAllByText('Reply')).toHaveLength(4); // one per comment
  });

  it('fires onStartReply when Reply is tapped', () => {
    const onStartReply = jest.fn();
    const { getAllByText } = render(
      <DiscussionThreadView {...base} comments={comments} onStartReply={onStartReply} />
    );
    fireEvent.press(getAllByText('Reply')[0]);
    expect(onStartReply).toHaveBeenCalledTimes(1);
  });

  it('renders the empty state when there are no comments', () => {
    const { getByText, queryByText } = render(<DiscussionThreadView {...base} comments={[]} />);
    expect(getByText('No questions yet')).toBeTruthy();
    expect(queryByText('Reply')).toBeNull();
  });

  it('switches the composer to reply mode when replyingTo is set', () => {
    const { getByPlaceholderText } = render(
      <DiscussionThreadView {...base} comments={comments} replyingTo={{ rootId: 'c1', name: 'Neha K.' }} />
    );
    expect(getByPlaceholderText('Write a reply…')).toBeTruthy();
  });
});
