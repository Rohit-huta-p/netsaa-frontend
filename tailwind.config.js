/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./App.{js,jsx,ts,tsx}",
        "./app/**/*.{js,jsx,ts,tsx}",
        "./src/**/*.{js,jsx,ts,tsx}",
        "./components/**/*.{js,jsx,ts,tsx}",
    ],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                // NETSA Color Palette (matching final-landing.tsx)
                netsa: {
                    1: '#6D23B6',   // Deep purple
                    2: '#7B2CBF',   // Purple
                    3: '#9D4EDD',   // Medium purple
                    5: '#C77DFF',   // Light purple
                    8: '#E0AAFF',   // Very light purple/pink
                    10: '#EA698B',  // Coral/Pink accent
                },

                // Background colors
                bg: {
                    black: '#000000',
                    dark: '#09090b',      // zinc-950
                    surface: '#18181b',   // zinc-900
                    card: '#27272a',      // zinc-800
                },
            },
            fontFamily: {
                // Outfit - Primary display/heading font
                outfit: ['Outfit-Regular', 'sans-serif'],
                'outfit-thin': ['Outfit-Thin', 'sans-serif'],
                'outfit-extralight': ['Outfit-ExtraLight', 'sans-serif'],
                'outfit-light': ['Outfit-Light', 'sans-serif'],
                'outfit-medium': ['Outfit-Medium', 'sans-serif'],
                'outfit-semibold': ['Outfit-SemiBold', 'sans-serif'],
                'outfit-bold': ['Outfit-Bold', 'sans-serif'],
                'outfit-extrabold': ['Outfit-ExtraBold', 'sans-serif'],
                'outfit-black': ['Outfit-Black', 'sans-serif'],

                // Source Sans 3 - Body font
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
