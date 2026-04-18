const themeColors = require("./src/constants/themeColors");

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./App.{js,jsx,ts,tsx}",
        "./app/**/*.{js,jsx,ts,tsx}",
        "./src/**/*.{js,jsx,ts,tsx}",
        "./components/**/*.{js,jsx,ts,tsx}",
    ],
    presets: [require("nativewind/preset")],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Flatten themeColors for Tailwind usage
                ...themeColors,
                // Shorthand brand colors for quick access
                'brand-pink': themeColors.netsa.pink,
                'brand-orange': themeColors.netsa.orange,
                'brand-gold': themeColors.netsa.gold,
                'brand-cyan': themeColors.accent.cyan,
                'brand-green': themeColors.accent.green,
            },
            // Spacing scale (8px grid)
            spacing: {
                'xs': '8px',
                'sm': '16px',
                'md': '24px',
                'lg': '32px',
                'xl': '48px',
                'xxl': '64px',
            },
            // Box shadows — Palette 18 glows
            boxShadow: {
                'glow': '0 0 20px rgba(249, 115, 22, 0.15)',
                'glow-hover': '0 0 40px rgba(249, 115, 22, 0.25)',
                'glow-lg': '0 0 60px rgba(249, 115, 22, 0.3)',
                'glow-pink': '0 0 20px rgba(236, 72, 153, 0.2)',
                'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.15)',
            },
            fontFamily: {
                // Outfit — Primary display/heading font
                outfit: ['Outfit-Regular', 'sans-serif'],
                'outfit-thin': ['Outfit-Thin', 'sans-serif'],
                'outfit-extralight': ['Outfit-ExtraLight', 'sans-serif'],
                'outfit-light': ['Outfit-Light', 'sans-serif'],
                'outfit-medium': ['Outfit-Medium', 'sans-serif'],
                'outfit-semibold': ['Outfit-SemiBold', 'sans-serif'],
                'outfit-bold': ['Outfit-Bold', 'sans-serif'],
                'outfit-extrabold': ['Outfit-ExtraBold', 'sans-serif'],
                'outfit-black': ['Outfit-Black', 'sans-serif'],

                // DM Serif Display — Serif headlines (landing page)
                'serif': ['DMSerifDisplay_400Regular', 'serif'],

                // Source Sans 3 — Body font
                'source-sans': ['SourceSans3-Regular', 'sans-serif'],
                'source-sans-medium': ['SourceSans3-Medium', 'sans-serif'],
                'source-sans-semibold': ['SourceSans3-SemiBold', 'sans-serif'],
                'source-sans-bold': ['SourceSans3-Bold', 'sans-serif'],

                // Default body font
                sans: ['SourceSans3-Regular', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
