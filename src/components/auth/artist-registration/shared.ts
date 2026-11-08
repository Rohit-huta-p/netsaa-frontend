// Shared design tokens + styles for all artist-registration step components.
// A·Minimal palette — matches the rest of the app.

import { StyleSheet } from 'react-native';

export const C = {
    bg:      '#121216',
    surface: '#1A1A20',
    surface2:'#22222A',
    orange:  '#FF6B35',
    orangeDim:'rgba(255,107,53,0.12)',
    orangeBorder:'rgba(255,107,53,0.35)',
    t1:      '#F2F0EB',
    t2:      '#B0ACAA',
    t3:      '#706C6A',
    t4:      '#4A4648',
    border:  'rgba(255,255,255,0.07)',
    border2: 'rgba(255,255,255,0.12)',
    errorBg: 'rgba(239,68,68,0.08)',
    errorBorder: 'rgba(239,68,68,0.25)',
    minorBg: 'rgba(245,158,11,0.08)',
    minorBorder: 'rgba(245,158,11,0.28)',
    gold:    '#F59E0B',
};

export const FONT = {
    serif:    'DMSerifDisplay_400Regular',
    body:     'Outfit-Regular',
    bodyMed:  'Outfit-Medium',
    bodySemi: 'Outfit-SemiBold',
    bodyBold: 'Outfit-Bold',
    mono:     'SpaceMono-Regular',
};

export const s = StyleSheet.create({
    eyebrow: {
        fontFamily: FONT.mono,
        fontSize: 9,
        color: C.orange,
        letterSpacing: 2,
        marginBottom: 10,
    },
    headline: {
        fontFamily: FONT.serif,
        fontSize: 34,
        lineHeight: 40,
        color: C.t1,
        letterSpacing: -0.5,
        marginBottom: 10,
    },
    subhead: {
        fontFamily: FONT.body,
        fontSize: 14,
        color: C.t3,
        lineHeight: 20,
    },
    fineprint: {
        fontFamily: FONT.body,
        fontSize: 11,
        color: C.t4,
        lineHeight: 16,
        marginTop: 14,
    },
    sectionLabel: {
        fontFamily: FONT.mono,
        fontSize: 9,
        color: C.t3,
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginTop: 24,
        marginBottom: 10,
    },
});
