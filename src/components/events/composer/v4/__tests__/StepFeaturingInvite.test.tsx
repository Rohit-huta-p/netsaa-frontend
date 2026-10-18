import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn() }));
// StepFeaturing renders PeopleSearchFieldV4, which uses the search-service query hook.
jest.mock('@/hooks/useSearchQueries', () => ({ useSearchPeople: () => ({ data: { results: [] }, isFetching: false }) }));

import StepFeaturing from '../steps/StepFeaturing';
import { useComposerStoreV4 } from '../useComposerStoreV4';
import type { PersonV4 } from '../composerForm';

const seedPeople = (people: PersonV4[]) => {
  useComposerStoreV4.getState().reset('workshop');
  useComposerStoreV4.getState().update('people', people);
};

describe('StepFeaturing — people / invite affordance', () => {
  it('a plain name (not on NETSA, not yet invited) offers an Invite action, not an Invited pill', () => {
    seedPeople([{ displayName: 'Anjali Menon', role: 'Led by', invited: false }]);
    const { queryByLabelText, queryByText } = render(<StepFeaturing />);
    expect(queryByLabelText('Invite Anjali Menon')).toBeTruthy();
    expect(queryByText('Invited')).toBeNull();
  });

  it('once invited, the chip shows the Invited pill and drops the invite action', () => {
    seedPeople([{ displayName: 'Anjali Menon', role: 'Led by', invited: true }]);
    const { queryByLabelText, queryByText } = render(<StepFeaturing />);
    expect(queryByText('Invited')).toBeTruthy();
    expect(queryByLabelText('Invite Anjali Menon')).toBeNull();
  });

  it('a NETSA profile (has userId) gets no invite affordance at all', () => {
    seedPeople([{ userId: 'u1', displayName: 'Ravi', role: 'Led by', invited: false }]);
    const { queryByLabelText, queryByText } = render(<StepFeaturing />);
    expect(queryByLabelText('Invite Ravi')).toBeNull();
    expect(queryByText('Invited')).toBeNull();
  });
});
