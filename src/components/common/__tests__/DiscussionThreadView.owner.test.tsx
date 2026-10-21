import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import DiscussionThreadView, {
  type ThreadComment,
  type ApplicantsByUserId,
} from '../DiscussionThreadView';

// q1 (a1) — unanswered question from an applicant
// q2 (a2) — question that the owner (prod1) answered via r2
// q3 (out1) — unanswered question from someone NOT in the pipeline
const comments: ThreadComment[] = [
  { _id: 'q1', text: 'Is the mix shared?', authorId: 'a1', authorName: 'Neha K.', createdAt: '2026-05-10T10:00:00Z' },
  { _id: 'q2', text: 'Any update on dates?', authorId: 'a2', authorName: 'Rohan S.', createdAt: '2026-05-10T11:00:00Z' },
  { _id: 'r2', text: 'Yes — 22 Nov.', authorId: 'prod1', authorName: 'Aditi Rao', parentId: 'q2', createdAt: '2026-05-10T11:30:00Z' },
  { _id: 'q3', text: 'Video audition ok?', authorId: 'out1', authorName: 'Meera T.', createdAt: '2026-05-10T12:00:00Z' },
];

const applicants: ApplicantsByUserId = {
  a1: { applicationId: 'app1', status: 'applied' },
  a2: { applicationId: 'app2', status: 'shortlisted' },
};

const base = {
  comments,
  loading: false,
  ownerId: 'prod1',
  inputText: '',
  sending: false,
  replyingTo: null,
  onChangeText: () => {},
  onSend: () => {},
  onStartReply: () => {},
  onCancelReply: () => {},
};

describe('DiscussionThreadView — owner (producer) view', () => {
  it('badges the waiting count, nudges, and tags each unanswered thread', () => {
    const { getByText, getAllByText } = render(
      <DiscussionThreadView {...base} currentUserId="prod1" applicantsByUserId={applicants} />
    );
    // q1 + q3 are unanswered (q2 has an owner reply) → 2 waiting
    expect(getByText('2 waiting')).toBeTruthy();
    expect(getByText('2 questions are waiting for your reply.')).toBeTruthy();
    expect(getAllByText('Awaiting reply')).toHaveLength(2);
    // the chronological count stays, alongside the new badge
    expect(getByText('3 threads')).toBeTruthy();
  });

  it('shows an Applied/Shortlisted chip on pipeline askers and taps through to their card', () => {
    const onOpenApplicant = jest.fn();
    const { getByText, queryByText, getByLabelText } = render(
      <DiscussionThreadView
        {...base}
        currentUserId="prod1"
        applicantsByUserId={applicants}
        onOpenApplicant={onOpenApplicant}
      />
    );
    expect(getByText('Applied')).toBeTruthy(); // a1
    expect(getByText('Shortlisted')).toBeTruthy(); // a2
    expect(getByText('Producer')).toBeTruthy(); // owner reply still badged, no chip
    fireEvent.press(getByLabelText('Applied applicant — open their card'));
    expect(onOpenApplicant).toHaveBeenCalledWith('app1');
    expect(queryByText('Producer applicant — open their card')).toBeNull();
  });

  it('shows no chip for a commenter who is not in the pipeline', () => {
    // out1 (Meera T.) asked q3 but is not in `applicants`
    const { queryByLabelText } = render(
      <DiscussionThreadView {...base} currentUserId="prod1" applicantsByUserId={applicants} />
    );
    // the only chips are Applied (a1) + Shortlisted (a2); none for out1
    expect(queryByLabelText('Applied applicant — open their card')).toBeTruthy();
    expect(queryByLabelText(/Hired applicant/)).toBeNull();
  });
});

describe('DiscussionThreadView — non-owner (artist) view is unchanged', () => {
  it('shows no waiting badge, nudge, or awaiting tags', () => {
    // artist-side gig page: viewer != owner, no applicants map passed
    const { queryByText } = render(
      <DiscussionThreadView {...base} currentUserId="someArtist" />
    );
    expect(queryByText('2 waiting')).toBeNull();
    expect(queryByText('Awaiting reply')).toBeNull();
    expect(queryByText(/waiting for your reply/)).toBeNull();
    // the plain thread count is still there
    expect(queryByText('3 threads')).toBeTruthy();
  });
});
