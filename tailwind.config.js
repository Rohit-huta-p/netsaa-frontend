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
                // NETSA Color Palette (matching final-landing.tsx)
                netsa: {
                    1: '#6D23B6',   // Deep purple
                    2: '#7B2CBF',   // Purple
                    3: '#9D4EDD',   // Medium purple
                    5: '#C77DFF',   // Light purple
                    8: '#E0AAFF',   // Very light purple/pink
                    10: '#EA698B',  // Coral/Pink accent
                },

                // Organizer Theme Colors (Orange/Amber)
                organizer: {
                    50: '#FFF8F4',
                    100: '#FFEDE4',
                    200: '#FFD4BF',
                    300: '#FFB27F',
                    400: '#FF9D55',
                    500: '#FF8C42',   // Secondary
                    600: '#FF6B35',   // Primary
                    700: '#E5572A',
                    800: '#CC4A23',
                    900: '#A63919',
                },

                // Background colors
                bg: {
                    black: '#000000',
                    dark: '#09090b',      // zinc-950
                    surface: '#18181b',   // zinc-900
                    card: '#27272a',      // zinc-800
                },

                // Card system (Phase 1: Gigs UI Enhancement)
                card: {
                    bg: 'rgba(18, 18, 18, 1)',
                    surface: 'rgba(18, 5, 23, 1)',
                    hover: 'rgba(24, 24, 24, 1)',
                },

                // Border colors
                border: {
                    subtle: 'rgba(255, 255, 255, 0.08)',
                    hover: 'rgba(255, 255, 255, 0.12)',
                },

                buttons: {
                    apply: '#045be7ff',
                },

                // Accent colors
                accent: {
                    urgent: '#FF6B35',
                    verified: '#10B981',
                    premium: '#8B5CF6',
                },
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
            // Box shadows with purple glow
            boxShadow: {
                'glow': '0 0 20px rgba(139, 92, 246, 0.15)',
                'glow-hover': '0 0 40px rgba(139, 92, 246, 0.25)',
                'glow-lg': '0 0 60px rgba(139, 92, 246, 0.3)',
                'glow-organizer': '0 0 20px rgba(255, 107, 53, 0.2)',
                'glow-organizer-hover': '0 0 40px rgba(255, 107, 53, 0.3)',
                'glow-organizer-lg': '0 0 60px rgba(255, 107, 53, 0.35)',
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
