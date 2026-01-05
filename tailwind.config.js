/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        // explicit app/source folders only — DO NOT use a broad "./**/*" that touches node_modules
        "./App.{js,jsx,ts,tsx}",
        "./app/**/*.{js,jsx,ts,tsx}",
        "./src/**/*.{js,jsx,ts,tsx}",
        "./components/**/*.{js,jsx,ts,tsx}",
        "./screens/**/*.{js,jsx,ts,tsx}",
        "./pages/**/*.{js,jsx,ts,tsx}", // if you use pages
    ],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                // NETSA Core Colors
                netsa: {
                    bg: '#2C2C32',       // Main Background
                    card: '#2B2B31',     // Card / Surface BG
                    navbar: '#1A1A1F',   // Navbar base
                    footer: '#1A1A1F',   // Footer base
                    text: {
                        primary: '#FFFFFF',
                        secondary: '#C9C9D1',
                        muted: '#9A9AA3',
                    },
                    accent: {
                        orange: '#FF7A2F',  // Highlights
                        purple: '#8B5CF6',  // Chips / Prices
                        red: '#E63B45',     // Badges / Likes
                    },
                },
                // Gradient Stops (for use with LinearGradient or utility classes)
                grad1: {
                    start: '#E63B45',
                    mid: '#FF4E8A',
                    end: '#FF7A2F',
                },
                grad2: {
                    start: '#3D79FB',
                    end: '#8B5CF6',
                },
            },
            fontFamily: {
                satoshi: ['Satoshi-Regular', 'sans-serif'],
                'satoshi-medium': ['Satoshi-Medium', 'sans-serif'],
                'satoshi-semibold': ['Satoshi-SemiBold', 'sans-serif'],
                'satoshi-bold': ['Satoshi-Bold', 'sans-serif'],
                'satoshi-black': ['Satoshi-Black', 'sans-serif'],
                inter: ['Inter-Regular', 'sans-serif'],
                'inter-medium': ['Inter-Medium', 'sans-serif'],
                sans: ['Inter-Regular', 'sans-serif'], // Default body font
            },
        },
    },
    plugins: [],
};
