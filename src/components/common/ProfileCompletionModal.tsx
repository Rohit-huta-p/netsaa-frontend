import React, { useEffect, useRef } from 'react';
import {
    View, Text, Modal, Pressable,
    StyleSheet, Animated, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Svg, { Circle } from 'react-native-svg';
import {
    X, ChevronRight, Camera, FileText, MapPin,
    Briefcase, Star, Image as ImageIcon, Phone, Mail,
    User, Sparkles,
} from 'lucide-react-native';
import { useProfileUiStore, SectionId } from '@/stores/profileUiStore';

/**
 * Profile Completion Modal — Palette 18 Redesign
 *
 * Two modes:
 * - Modal (default): centered overlay, used as apply/post gate
 * - Inline (index=true): floating card, persistent nudge on home screen
 *
 * Missing items are prioritized by impact and shown with relevant icons.
 * Animated progress ring with sunset gradient accent.
 */

interface ProfileCompletionModalProps {
    index?: boolean;
    visible: boolean;
    score: number;
    missing: string[];
    onClose: () => void;
    onGoToProfile: () => void;
    role?: 'artist' | 'organizer';
}

// Map missing item labels to icons for visual clarity
const ITEM_ICONS: Record<string, any> = {
    'profile photo': Camera,
    'photo': Camera,
    'avatar': Camera,
    'bio': FileText,
    'description': FileText,
    'about': FileText,
    'location': MapPin,
    'city': MapPin,
    'skills': Star,
    'skill': Star,
    'experience': Briefcase,
    'portfolio': ImageIcon,
    'gallery': ImageIcon,
    'media': ImageIcon,
    'phone': Phone,
    'email': Mail,
    'name': User,
    'artist type': Sparkles,
    'art form': Sparkles,
};

function getIconForItem(item: string) {
    const lower = item.toLowerCase();
    for (const [key, Icon] of Object.entries(ITEM_ICONS)) {
        if (lower.includes(key)) return Icon;
    }
    return Star; // fallback
}

// Map a missing-item label to the edit-modal SectionId it belongs to
const MISSING_TO_SECTION: [RegExp, SectionId][] = [
    [/display name/i, 'header'],
    [/location/i, 'header'],
    [/artist type/i, 'header'],
    [/headline/i, 'header'],
    [/skill/i, 'identity'],
    [/bio/i, 'about'],
    [/gallery|photo/i, 'media'],
    [/video|reel/i, 'media'],
    [/profile photo|avatar/i, 'media'],
    [/experience|performance/i, 'about'],
    [/phone/i, 'contact'],
    [/email/i, 'contact'],
    [/contact/i, 'contact'],
    [/organization/i, 'organization'],
];

function getFirstMissingSection(items: string[]): SectionId {
    for (const item of items) {
        for (const [pattern, section] of MISSING_TO_SECTION) {
            if (pattern.test(item)) return section;
        }
    }
    return 'header'; // fallback
}

// Progress ring component
const RING_SIZE = 80;
const RING_STROKE = 6;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRC = 2 * Math.PI * RING_RADIUS;

const SMALL_RING_SIZE = 56;
const SMALL_RING_STROKE = 5;
const SMALL_RING_RADIUS = (SMALL_RING_SIZE - SMALL_RING_STROKE) / 2;
const SMALL_RING_CIRC = 2 * Math.PI * SMALL_RING_RADIUS;

function ProgressRing({ score, size = 'large' }: { score: number; size?: 'large' | 'small' }) {
    const isSmall = size === 'small';
    const ringSize = isSmall ? SMALL_RING_SIZE : RING_SIZE;
    const ringStroke = isSmall ? SMALL_RING_STROKE : RING_STROKE;
    const ringRadius = isSmall ? SMALL_RING_RADIUS : RING_RADIUS;
    const ringCirc = isSmall ? SMALL_RING_CIRC : RING_CIRC;
    const offset = ringCirc - (ringCirc * Math.min(100, Math.max(0, score))) / 100;

    return (
        <View style={{ width: ringSize, height: ringSize }}>
            <Svg width={ringSize} height={ringSize}>
                {/* Track */}
                <Circle
                    cx={ringSize / 2} cy={ringSize / 2} r={ringRadius}
                    stroke="rgba(255,255,255,0.06)" strokeWidth={ringStroke} fill="transparent"
                />
                {/* Progress */}
                <Circle
                    cx={ringSize / 2} cy={ringSize / 2} r={ringRadius}
                    stroke="#F97316" strokeWidth={ringStroke} fill="transparent"
                    strokeDasharray={`${ringCirc}`} strokeDashoffset={offset}
                    strokeLinecap="round" rotation="-90"
                    origin={`${ringSize / 2}, ${ringSize / 2}`}
                />
            </Svg>
            <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={[s.ringScore, isSmall && { fontSize: 16 }]}>{score}%</Text>
            </View>
        </View>
    );
}

export const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({
    index = false, visible, score, missing, onClose, onGoToProfile, role = 'artist',
}) => {
    const slideAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const { openSheet, setHighlightMissing } = useProfileUiStore();

    // Navigate to profile AND auto-open the edit modal with missing highlights
    const handleGoToProfile = () => {
        const section = getFirstMissingSection(missing);
        setHighlightMissing(missing);
        onGoToProfile();
        // Delay openSheet so the profile page mounts first
        setTimeout(() => openSheet(section), 400);
    };

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(slideAnim, { toValue: 1, friction: 8, useNativeDriver: true }),
                Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            ]).start();
        } else {
            slideAnim.setValue(0);
            fadeAnim.setValue(0);
        }
    }, [visible]);

    if (!visible) return null;

    const clamped = Math.min(100, Math.max(0, score));
    const isLow = clamped < 40;
    const isMid = clamped >= 40 && clamped < 70;

    const headline = isLow
        ? "Let's get you started"
        : isMid
            ? "Almost there"
            : "Just a few more touches";

    const subtitle = role === 'organizer'
        ? 'Complete your profile so artists trust your gig posts.'
        : `${missing.length} item${missing.length !== 1 ? 's' : ''} left to unlock full access.`;

    /* ═══════ INLINE VARIANT (floating nudge card) ═══════ */
    if (index) {
        return (
            <Animated.View style={[s.inlineWrap, {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            }]}>
                <View style={s.inlineCard}>
                    <LinearGradient
                        colors={['rgba(249,115,22,0.08)', 'transparent']}
                        style={s.inlineGlow}
                    />

                    <Pressable onPress={onClose} style={s.inlineClose} hitSlop={12}>
                        <X size={14} color="#6B6878" />
                    </Pressable>

                    <View style={s.inlineBody}>
                        <ProgressRing score={clamped} size="small" />

                        <View style={{ flex: 1, marginLeft: 14 }}>
                            <Text style={s.inlineTitle}>{headline}</Text>
                            <Text style={s.inlineSub}>
                                {missing.length} item{missing.length !== 1 ? 's' : ''} left
                            </Text>
                        </View>

                        <Pressable onPress={handleGoToProfile} style={s.inlineCta}>
                            <LinearGradient
                                colors={['#EC4899', '#F97316']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={s.inlineCtaGradient}
                            >
                                <ChevronRight size={16} color="#fff" strokeWidth={2.5} />
                            </LinearGradient>
                        </Pressable>
                    </View>
                </View>
            </Animated.View>
        );
    }

    /* ═══════ MODAL VARIANT (centered gate) ═══════ */
    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <Animated.View style={[s.overlay, { opacity: fadeAnim }]}>
                {Platform.OS !== 'web' && (
                    <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
                )}

                <Animated.View style={[s.modal, {
                    transform: [{
                        scale: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }),
                    }],
                }]}>
                    {/* Top gradient */}
                    <LinearGradient
                        colors={['rgba(236,72,153,0.06)', 'rgba(249,115,22,0.04)', 'transparent']}
                        style={s.modalGlow}
                        pointerEvents="none"
                    />

                    {/* Close — rendered AFTER glow so it paints on top */}
                    <Pressable onPress={onClose} style={s.modalClose} hitSlop={16}>
                        <X size={20} color="#F0ECE6" />
                    </Pressable>

                    {/* Ring */}
                    <View style={s.ringWrap}>
                        <ProgressRing score={clamped} size="large" />
                    </View>

                    {/* Copy */}
                    <Text style={s.modalTitle}>{headline}</Text>
                    <Text style={s.modalSub}>{subtitle}</Text>

                    {/* Missing items — pills */}
                    {missing.length > 0 && (
                        <View style={s.pillsWrap}>
                            {missing.map((item, i) => {
                                const Icon = getIconForItem(item);
                                return (
                                    <View key={i} style={s.pill}>
                                        <Icon size={11} color="#F97316" strokeWidth={1.8} />
                                        <Text style={s.pillText}>{item}</Text>
                                        <Text style={s.pillBadge}>+{Math.round((100 - clamped) / missing.length)}%</Text>
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    {/* CTA */}
                    <View style={s.ctaWrap}>
                        <Pressable onPress={handleGoToProfile} style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
                            <LinearGradient
                                colors={['#EC4899', '#F97316']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={s.ctaPrimary}
                            >
                                <Text style={s.ctaPrimaryText}>Complete Profile</Text>
                                <ChevronRight size={18} color="#fff" strokeWidth={2.5} />
                            </LinearGradient>
                        </Pressable>

                        <Pressable onPress={onClose} style={s.ctaSkip}>
                            <Text style={s.ctaSkipText}>I'll do it later</Text>
                        </Pressable>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

export default ProfileCompletionModal;

const s = StyleSheet.create({
    // ── Ring ──
    ringScore: {
        fontFamily: 'Outfit-Black',
        fontSize: 20,
        color: '#F0ECE6',
    },

    // ── Inline variant ──
    inlineWrap: {
        position: 'absolute',
        bottom: 80,
        right: 16,
        left: 16,
        zIndex: 50,
    },
    inlineCard: {
        backgroundColor: '#121018',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
        elevation: 16,
        paddingTop: 26,
    },
    inlineGlow: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 80,
    },
    inlineClose: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 2,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.04)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    inlineBody: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingRight: 12,
    },
    inlineTitle: {
        fontFamily: 'Outfit-Bold',
        fontSize: 15,
        color: '#F0ECE6',
        marginBottom: 2,
    },
    inlineSub: {
        fontFamily: 'Outfit-Regular',
        fontSize: 12,
        color: '#6B6878',
    },
    inlineCta: {},
    inlineCtaGradient: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── Modal variant ──
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.75)',
    },
    modal: {
        width: '88%',
        maxWidth: 380,
        backgroundColor: '#121018',
        borderRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
        paddingTop: 32,
        paddingBottom: 24,
        paddingHorizontal: 24,
    },
    modalGlow: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 180,
    },
    modalClose: {
        position: 'absolute',
        top: 14,
        right: 14,
        zIndex: 50,
        elevation: 10,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    ringWrap: {
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontFamily: 'Outfit-Bold',
        fontSize: 22,
        color: '#F0ECE6',
        textAlign: 'center',
        marginBottom: 6,
    },
    modalSub: {
        fontFamily: 'Outfit-Regular',
        fontSize: 14,
        color: '#6B6878',
        textAlign: 'center',
        lineHeight: 21,
        marginBottom: 24,
    },

    // ── Missing items (pills) ──
    pillsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    pillText: {
        fontFamily: 'Outfit-Medium',
        fontSize: 11,
        color: '#F0ECE6',
    },
    pillBadge: {
        fontFamily: 'Outfit-Bold',
        fontSize: 9,
        color: '#34D399',
    },

    // ── CTAs ──
    ctaWrap: {
        gap: 10,
    },
    ctaPrimary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        borderRadius: 14,
    },
    ctaPrimaryText: {
        fontFamily: 'Outfit-Bold',
        fontSize: 16,
        color: '#fff',
    },
    ctaSkip: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    ctaSkipText: {
        fontFamily: 'Outfit-Medium',
        fontSize: 13,
        color: '#6B6878',
    },
});
