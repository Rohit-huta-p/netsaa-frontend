import { act } from '@testing-library/react-native';
import { useModeStore } from '../modeStore';

describe('modeStore', () => {
  beforeEach(() => {
    // reset store between tests
    useModeStore.setState({
      mode: 'artist',
      modeExplicitlyChosen: false,
      hasBootstrappedMode: false,
      seenScreensWithTooltip: [],
    });
  });

  it('has initial state: mode=artist, hasBootstrappedMode=false, no seen screens', () => {
    const state = useModeStore.getState();
    expect(state.mode).toBe('artist');
    expect(state.hasBootstrappedMode).toBe(false);
    expect(state.seenScreensWithTooltip).toEqual([]);
  });

  it('setMode("hirer") updates mode', () => {
    act(() => {
      useModeStore.getState().setMode('hirer');
    });
    expect(useModeStore.getState().mode).toBe('hirer');
  });

  it('setMode pins modeExplicitlyChosen (explicit user choice)', () => {
    expect(useModeStore.getState().modeExplicitlyChosen).toBe(false);
    act(() => {
      useModeStore.getState().setMode('hirer');
    });
    expect(useModeStore.getState().mode).toBe('hirer');
    expect(useModeStore.getState().modeExplicitlyChosen).toBe(true);
  });

  it('setBootstrapped(true) flips the flag', () => {
    act(() => {
      useModeStore.getState().setBootstrapped(true);
    });
    expect(useModeStore.getState().hasBootstrappedMode).toBe(true);
  });

  it('markScreenSeen adds to set idempotently', () => {
    act(() => {
      useModeStore.getState().markScreenSeen('home-toggle');
      useModeStore.getState().markScreenSeen('home-toggle');
      useModeStore.getState().markScreenSeen('gigs-filters');
    });
    expect(useModeStore.getState().seenScreensWithTooltip).toEqual(['home-toggle', 'gigs-filters']);
  });

  it('hasSeenScreen returns correct boolean', () => {
    act(() => {
      useModeStore.getState().markScreenSeen('home-toggle');
    });
    expect(useModeStore.getState().hasSeenScreen('home-toggle')).toBe(true);
    expect(useModeStore.getState().hasSeenScreen('unknown')).toBe(false);
  });
});
