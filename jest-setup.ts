// jest-setup.ts
import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage for tests
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Haptics — no-op in tests
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// Mock expo-router — includes `router` singleton + all hooks used across app.
// Code review flagged the initial narrow mock as insufficient for Tasks 13+
// where components import `useRouter`, `usePathname`, `router`, etc.
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  usePathname: () => '/',
  useLocalSearchParams: () => ({}),
  useFocusEffect: jest.fn(),
  useNavigation: () => ({ navigate: jest.fn() }),
  Stack: 'Stack',
  Link: 'Link',
  Slot: 'Slot',
  Tabs: 'Tabs',
}));
