export const inviteColors = {
    bg: '#0A0A0F',
    cardWarmBorder: 'rgba(255,107,53,0.20)',
    cardWarmBg: 'rgba(255,107,53,0.05)',
    cardNeutralBorder: 'rgba(255,255,255,0.07)',
    cardNeutralBg: 'rgba(255,255,255,0.02)',
    reqBoxBorder: 'rgba(255,255,255,0.07)',
    reqBoxBg: 'rgba(0,0,0,0.28)',
    orange: '#FF6B35',
    orangeLight: '#FF8E5E',
    onOrange: '#1A0D06',
    text: '#f4f4f5',
    muted: '#a1a1aa',
    dim: '#71717a',
    faint: '#52525b',
    error: '#f87171',
    pendingPillText: '#FBBF24',
    pendingPillBg: 'rgba(251,191,36,0.15)',
    acceptedText: '#22C55E',
    acceptedBg: 'rgba(34,197,94,0.14)',
    archiveText: '#71717a',
    archiveBg: 'rgba(255,255,255,0.06)',
    ghostBorder: 'rgba(255,255,255,0.13)',
    avatarTints: [
        { bg: 'rgba(255,107,53,0.16)', fg: '#FF8E5E' },
        { bg: 'rgba(139,92,246,0.16)', fg: '#A78BFA' },
    ],
} as const;

export const inviteFonts = {
    serif: 'DMSerifDisplay_400Regular',
    mono: 'SpaceMono-Regular',
    body: 'Outfit-Regular',
    medium: 'Outfit-Medium',
    semibold: 'Outfit-SemiBold',
} as const;

export const inviteRadii = { card: 14, reqBox: 10, button: 9, pill: 99 } as const;
