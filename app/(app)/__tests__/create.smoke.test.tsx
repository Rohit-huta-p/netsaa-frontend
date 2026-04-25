// Proves the feature flag actually gates which form renders at the
// parent route. Two mount cycles with the env var set differently.
//
// Why the unusual shape: we need fresh module state per test (so
// useFeatureFlags re-reads the env var at each module load) BUT we can't
// `jest.resetModules()` because that desyncs the React instance between the
// component and the renderer ("Cannot read null (reading 'useState')").
// `jest.isolateModules` fixes that by scoping a fresh graph to its
// callback — as long as the renderer and component are BOTH required
// inside the callback, they share one React.
//
// `@testing-library/react-native` registers beforeAll/afterAll hooks on
// first require, which is illegal inside tests. So we dodge RTL entirely
// and use `react-test-renderer` directly, required *inside* isolateModules.

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), replace: jest.fn(), canGoBack: () => false }),
  useLocalSearchParams: () => ({}),
  Link: 'Link',
}));
jest.mock('@/hooks/useStepBackGuard', () => ({
  useStepBackGuard: jest.fn(),
}));
// Native-only transitive imports in create.tsx — stub with plain strings so
// the test never loads the untransformed ESM bundles from node_modules.
jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
// EventForm has its own deep transitive tree (DatePicker → PNG assets jest
// can't parse). We're only asserting which gig-form module resolves, so a
// dumb stub is enough.
jest.mock('@/components/create/EventForm', () => ({
  EventForm: () => null,
}));

describe('app/(app)/create.tsx — feature flag gate', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('renders legacy GigForm when EXPO_PUBLIC_FEATURE_NEW_GIG_FORM is not "true"', () => {
    // Explicit empty-string assignment is more robust than `delete`. Some
    // env-loading chains (dotenv + metro) re-populate the var on module
    // re-require even after delete.
    process.env.EXPO_PUBLIC_FEATURE_NEW_GIG_FORM = '';

    jest.isolateModules(() => {
      const legacySpy = jest.fn(() => null);
      const v2Spy = jest.fn(() => null);
      jest.doMock('@/components/create/GigForm', () => ({
        GigForm: legacySpy,
      }));
      jest.doMock('@/components/create/GigFormV2', () => ({
        __esModule: true,
        default: v2Spy,
      }));
      const React = require('react');
      const TestRenderer = require('react-test-renderer');
      const Create = require('../create').default;
      TestRenderer.act(() => {
        TestRenderer.create(React.createElement(Create));
      });
      // Actual assertion: only the legacy form was rendered, not V2.
      expect(legacySpy).toHaveBeenCalled();
      expect(v2Spy).not.toHaveBeenCalled();
    });
  });

  it('renders GigFormV2 when EXPO_PUBLIC_FEATURE_NEW_GIG_FORM=true', () => {
    process.env.EXPO_PUBLIC_FEATURE_NEW_GIG_FORM = 'true';

    jest.isolateModules(() => {
      const legacySpy = jest.fn(() => null);
      const v2Spy = jest.fn(() => null);
      jest.doMock('@/components/create/GigForm', () => ({
        GigForm: legacySpy,
      }));
      jest.doMock('@/components/create/GigFormV2', () => ({
        __esModule: true,
        default: v2Spy,
      }));
      const React = require('react');
      const TestRenderer = require('react-test-renderer');
      const Create = require('../create').default;
      TestRenderer.act(() => {
        TestRenderer.create(React.createElement(Create));
      });
      // Actual assertion: only V2 was rendered, not legacy.
      expect(v2Spy).toHaveBeenCalled();
      expect(legacySpy).not.toHaveBeenCalled();
    });
  });
});
