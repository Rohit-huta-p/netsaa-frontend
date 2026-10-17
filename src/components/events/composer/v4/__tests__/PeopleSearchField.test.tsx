import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

const PEOPLE = [
  { _id: 'u1', firstName: 'Aditi', lastName: 'Rao', artistType: 'Dancer', city: 'Pune', profileImageUrl: 'http://img/a.jpg' },
];
jest.mock('@/hooks/useSearchQueries', () => ({
  useSearchPeople: () => ({ data: { results: PEOPLE }, isFetching: false }),
}));

import PeopleSearchFieldV4, { personFromResult, resultMeta } from '../PeopleSearchFieldV4';

describe('personFromResult', () => {
  it('builds name from first+last, id from _id, avatar from profileImageUrl', () => {
    expect(personFromResult(PEOPLE[0])).toEqual({ userId: 'u1', displayName: 'Aditi Rao', avatarUrl: 'http://img/a.jpg' });
  });
  it('falls back to id and displayName/title; no avatar → undefined', () => {
    expect(personFromResult({ id: 'x', displayName: 'Solo' })).toEqual({ userId: 'x', displayName: 'Solo', avatarUrl: undefined });
    expect(personFromResult({ id: 'y', title: 'Troupe' }).displayName).toBe('Troupe');
  });
  it('resultMeta joins artistType and city', () => {
    expect(resultMeta(PEOPLE[0])).toBe('Dancer · Pune');
    expect(resultMeta({ artistType: 'Actor' })).toBe('Actor');
  });
});

describe('PeopleSearchFieldV4', () => {
  const setup = () => {
    const onPick = jest.fn();
    const onAddPlain = jest.fn();
    const utils = render(
      <PeopleSearchFieldV4 roleLabel="Artist" existingUserIds={new Set()} onPick={onPick} onAddPlain={onAddPlain} />
    );
    return { ...utils, onPick, onAddPlain };
  };

  it('shows a NETSA result once the (debounced) query is active, and picks the mapped person', async () => {
    const { getByPlaceholderText, findByLabelText, onPick } = setup();
    fireEvent.changeText(getByPlaceholderText('Search NETSA or type a artist'), 'adi');
    const row = await findByLabelText('Add Aditi Rao from NETSA');  // waits out the 250ms debounce
    fireEvent.press(row);
    expect(onPick).toHaveBeenCalledWith({ userId: 'u1', displayName: 'Aditi Rao', avatarUrl: 'http://img/a.jpg' });
  });

  it('always offers "Add as a guest" for the typed text', () => {
    const { getByPlaceholderText, getByLabelText, onAddPlain } = setup();
    fireEvent.changeText(getByPlaceholderText('Search NETSA or type a artist'), 'Ravi Kumar');
    fireEvent.press(getByLabelText('Add Ravi Kumar as a guest'));
    expect(onAddPlain).toHaveBeenCalledWith('Ravi Kumar');
  });
});
