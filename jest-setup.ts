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

// Mock expo-secure-store — Plan 8 chip session added authStore→secureStorageAdapter
// transitive import path that ES-modules in node_modules. Jest can't transform it
// out of the box, so stub the surface area used by secureStorageAdapter.
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
  isAvailableAsync: jest.fn(() => Promise.resolve(false)),
}));

// Mock react-native-razorpay — Plan 8 native module, ESM-imported via
// razorpayCheckout.ts. Tests don't drive real payment flows; stub the surface.
jest.mock('react-native-razorpay', () => ({
  __esModule: true,
  default: {
    open: jest.fn(() => Promise.resolve({ razorpay_payment_id: 'mock_pay' })),
  },
}));

// Mock expo-linear-gradient — used in the new artist-home components
// (HeroGreetingArtistV2, FloatingInboxFab, DiscoverHirersStrip). Renders
// as a host component name so children pass through; avoids the
// out-of-scope module factory check that bites a require()-based mock.
jest.mock('expo-linear-gradient', () => ({
  __esModule: true,
  LinearGradient: 'LinearGradient',
}));
