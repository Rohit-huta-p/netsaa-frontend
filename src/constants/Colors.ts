import themeColors from './themeColors';

/**
 * Single source of truth for all application colors.
 * This TypeScript wrapper provides strong typing over the shared themeColors.js file.
 * Use this in your React Native files instead of redefining colors.
 */
export const Colors = themeColors;
