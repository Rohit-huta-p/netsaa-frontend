// jest-setup.ts
import '@testing-library/jest-native/extend-expect';

// Reanimated (v4) — use the library's bundled Jest mock so components that
// animate (e.g. DateOfEventField) render in tests without the native runtime.
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Gesture Handler — its jestSetup stubs the native module so GestureDetector /
// Gesture.Pan render as no-op passthroughs in tests.
require('react-native-gesture-handler/jestSetup');

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
// (HeroGreetingArtistV2, DiscoverHirersStrip). Renders
// as a host component name so children pass through; avoids the
// out-of-scope module factory check that bites a require()-based mock.
jest.mock('expo-linear-gradient', () => ({
  __esModule: true,
  LinearGradient: 'LinearGradient',
}));

// Mock react-native-safe-area-context — the real `useSafeAreaInsets` throws
// "No safe area value available" unless a <SafeAreaProvider> wraps the tree,
// which the component-level profile suites don't set up. MediaViewer (opened
// from the showcase/reels viewer) calls it, so stub the full public surface:
// zero insets, and host-component stubs for Provider/View so children render.
// Provider/View/Listener are plain strings (host components) rather than
// `React.createElement` wrappers on purpose — nativewind's babel transform
// rewrites createElement/JSX and injects a `_ReactNativeCSSInterop` helper that
// babel-plugin-jest-hoist forbids inside a jest.mock factory.
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  const frame = { x: 0, y: 0, width: 390, height: 844 };
  const SafeAreaInsetsContext = React.createContext(insets);
  const SafeAreaFrameContext = React.createContext(frame);
  return {
    __esModule: true,
    SafeAreaProvider: 'SafeAreaProvider',
    SafeAreaView: 'SafeAreaView',
    SafeAreaListener: 'SafeAreaListener',
    SafeAreaInsetsContext,
    SafeAreaFrameContext,
    SafeAreaContext: SafeAreaInsetsContext, // deprecated alias
    SafeAreaConsumer: SafeAreaInsetsContext.Consumer,
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => frame,
    useSafeArea: () => insets, // deprecated alias
    withSafeAreaInsets: (Comp: any) => Comp,
    initialWindowMetrics: { insets, frame },
    initialWindowSafeAreaInsets: insets,
  };
});

// Mock expo-image-picker — native module, ships untranspiled ESM that jest's
// transformIgnorePatterns doesn't cover. ProfileInterviewSheet's inline media
// picker (profile completion / gig-apply gate flow) imports it, and that
// component is reachable unmocked from several suites (GigApplyModal.*,
// ProfilePlaybillCard). Default resolves "cancelled" so any transitive,
// non-picker-focused render is a safe no-op; tests exercising the real pick
// flow override launchImageLibraryAsync locally via their own jest.mock.
jest.mock('expo-image-picker', () => ({
  MediaTypeOptions: { Images: 'Images', Videos: 'Videos' },
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({ canceled: true })),
}));
