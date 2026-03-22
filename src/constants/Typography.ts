// src/constants/Typography.ts
// Standardized typography for NETSA based on UX/Psychological reading comfort
// Best practices for mobile: 16px base, 1.4-1.6x line-height for readability.

export const Typography = {
    // Font Sizes (in px)
    size: {
        giant: 32,      // Hero titles, high impact
        h1: 28,         // Page titles
        h2: 24,         // Section headers
        h3: 20,         // Sub-section headers
        h4: 18,         // Prominent labels or small headers
        body: 16,       // Standard reading text (Base)
        secondary: 14,  // Meta info, smaller inputs, descriptions
        xs: 12,         // Errors, captions, tertiary info
        tiny: 10,       // Overline text, micro-labels
        xtiny: 8,
    },

    // Line Heights (multiplier or absolute)
    lineHeight: {
        tight: 1.2,
        standard: 1.4,
        relaxed: 1.6,
    },

    // Font Weights
    weight: {
        thin: '100',
        extralight: '200',
        light: '300',
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
    },
};

// Helper to calculate line height for absolute values
export const getLineHeight = (size: keyof typeof Typography.size, type: keyof typeof Typography.lineHeight = 'standard') => {
    return Math.round(Typography.size[size] * Typography.lineHeight[type]);
};
