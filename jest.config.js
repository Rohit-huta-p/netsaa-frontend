// jest.config.js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
  transformIgnorePatterns: [
    // `expo(nent)?(-[\w-]+)?` matches `expo`/`exponent` and every `expo-*` sibling
    // (expo-image, expo-blur, expo-haptics, expo-modules-core, …). Several of these
    // ship untranspiled TS/ESM entry points (e.g. expo-image -> src/index.ts), so they
    // must be run through babel-jest rather than ignored.
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?(-[\\w-]+)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@react-native-async-storage/async-storage|lucide-react-native|nativewind|react-native-css-interop|react-native-reanimated|react-native-worklets|react-native-gesture-handler)/)',
  ],
  moduleNameMapper: {
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/.expo/'],
  // The git worktree under .claude/worktrees ships its own package.json named
  // "netsa-mobile" (same as this one), which triggers a jest-haste-map naming
  // collision warning. Exclude it from the module registry.
  modulePathIgnorePatterns: ['<rootDir>/.claude/worktrees/'],
};
