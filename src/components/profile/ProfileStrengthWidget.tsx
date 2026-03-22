// src/components/profile/ProfileStrengthWidget.tsx
import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    ScrollView,
    Platform,
    UIManager,
    StyleSheet,
    Pressable,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import {
    ChevronRight,
    AlertCircle,
    CheckCircle2,
    X,
    User as UserIcon,
    Briefcase,
    FileText,
    Image as ImageIcon,
    Star,
    Shield,
    Crown,
    Lock,
} from "lucide-react-native";
import { router } from "expo-router";

if (
    Platform.OS === "android" &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* ───────── types ───────── */
interface ProfileStrengthWidgetProps {
    user: any;
}

/* ───────── section definitions ───────── */
interface Section {
    key: string;
    label: string;
    icon: any;
    color: string;
    weight: number;
    check: (user: any) => { filled: number; total: number; missing: string[] };
}

const SECTIONS: Section[] = [
    {
        key: "basic",
        label: "Basic Info",
        icon: UserIcon,
        color: "#3B82F6",
        weight: 20,
        check: (u) => {
            const missing: string[] = [];
            if (!u?.displayName) missing.push("Display Name");
            if (!u?.location) missing.push("Location");
            const total = 2;
            return { filled: total - missing.length, total, missing };
        },
    },
    {
        key: "identity",
        label: "Identity & Skills",
        icon: Briefcase,
        color: "#8B5CF6",
        weight: 20,
        check: (u) => {
            const missing: string[] = [];
            if (!u?.artistType || (Array.isArray(u.artistType) && u.artistType.length < 1) || u.artistType === "") missing.push("Artist Type");
            if (!u?.skills || u.skills.length < 1) missing.push("At least 1 Skill");
            const total = 2;
            return { filled: total - missing.length, total, missing };
        },
    },
    {
        key: "about",
        label: "About / Bio",
        icon: FileText,
        color: "#F59E0B",
        weight: 15,
        check: (u) => {
            const missing: string[] = [];
            const bioLen = u?.bio?.length || 0;
            if (bioLen < 100) missing.push(`Bio (${bioLen}/100 chars)`);
            const total = 1;
            return { filled: total - missing.length, total, missing };
        },
    },
    {
        key: "portfolio",
        label: "Showcase",
        icon: ImageIcon,
        color: "#EC4899",
        weight: 30,
        check: (u) => {
            const missing: string[] = [];
            const galleryCount = u?.galleryUrls?.filter(Boolean)?.length || 0;
            const videoCount = u?.videoUrls?.filter(Boolean)?.length || 0;
            if (galleryCount < 2) missing.push(`Gallery Photos (${galleryCount}/2 min)`);
            if (videoCount < 1) missing.push(`Video Reel (${videoCount}/1 min)`);
            const total = 2;
            return { filled: total - missing.length, total, missing };
        },
    },
    {
        key: "experience",
        label: "Experience",
        icon: Star,
        color: "#10B981",
        weight: 15,
        check: (u) => {
            const missing: string[] = [];
            const expCount = u?.experience?.length || 0;
            if (expCount < 1) missing.push("At least 1 past performance");
            const total = 1;
            return { filled: total - missing.length, total, missing };
        },
    },
];

/* ───────── tier config ───────── */
const TIERS = [
    {
        label: "Basic",
        icon: Shield,
        color: "#FF8C42",
        requirement: "Complete minimum profile",
        benefit: "Allowed to apply",
    },
    {
        label: "Professional",
        icon: Star,
        color: "#8B5CF6",
        requirement: "+ Experience + 3 videos",
        benefit: "Boost in search",
    },
    {
        label: "Verified",
        icon: CheckCircle2,
        color: "#3B82F6",
        requirement: "KYC approved",
        benefit: "Higher visibility",
    },
    {
        label: "Featured",
        icon: Crown,
        color: "#10B981",
        requirement: "Paid plan",
        benefit: "Top placement",
    },
];

/* ───────── compute helpers ───────── */
export const computeProfileSections = (user: any) => {
    return SECTIONS.map((s) => {
        const result = s.check(user);
        const sectionPct = result.total > 0 ? (result.filled / result.total) * 100 : 0;
        return { ...s, ...result, sectionPct };
    });
};

export const computeOverallScore = (user: any) => {
    const sections = computeProfileSections(user);
    return Math.round(
        sections.reduce((acc, s) => acc + (s.sectionPct / 100) * s.weight, 0)
    );
};

export const computeMissing = (user: any) => {
    const sections = computeProfileSections(user);
    return sections.flatMap((s) => s.missing);
};

/** Check if user meets minimum apply requirements */
export const meetsMinimumApplyGate = (user: any): { passes: boolean; missing: string[] } => {
    const missing: string[] = [];
    if (!user?.displayName) missing.push("Display Name");
    if (!user?.location) missing.push("Location");
    if (!user?.artistType || (Array.isArray(user.artistType) && user.artistType.length < 1) || user.artistType === "")
        missing.push("Artist Type");
    if (!user?.skills || user.skills.length < 1) missing.push("At least 1 Skill");
    if ((user?.galleryUrls?.filter(Boolean)?.length || 0) < 2) missing.push("At least 2 Gallery Photos");
    if ((user?.videoUrls?.filter(Boolean)?.length || 0) < 1) missing.push("At least 1 Video Reel");
    if ((user?.bio?.length || 0) < 100) missing.push("Bio (min 100 characters)");
    return { passes: missing.length === 0, missing };
};

/* ───────── organizer section definitions ───────── */
const ORGANIZER_SECTIONS: Section[] = [
    {
        key: "basic",
        label: "Basic Info",
        icon: UserIcon,
        color: "#3B82F6",
        weight: 25,
        check: (u) => {
            const missing: string[] = [];
            if (!u?.displayName) missing.push("Display Name");
            if (!u?.location) missing.push("Location");
            const total = 2;
            return { filled: total - missing.length, total, missing };
        },
    },
    {
        key: "organization",
        label: "Organization",
        icon: Briefcase,
        color: "#8B5CF6",
        weight: 25,
        check: (u) => {
            const missing: string[] = [];
            if (!u?.organizationName) missing.push("Organization Name");
            const total = 1;
            return { filled: total - missing.length, total, missing };
        },
    },
    {
        key: "contact",
        label: "Primary Contact",
        icon: Star,
        color: "#EC4899",
        weight: 25,
        check: (u) => {
            const missing: string[] = [];
            if (!u?.primaryContactName) missing.push("Contact Name");
            if (!u?.primaryContactPhone) missing.push("Contact Phone");
            if (!u?.primaryContactEmail) missing.push("Contact Email");
            const total = 3;
            return { filled: total - missing.length, total, missing };
        },
    },
    {
        key: "about",
        label: "About / Bio",
        icon: FileText,
        color: "#F59E0B",
        weight: 25,
        check: (u) => {
            const missing: string[] = [];
            const bioLen = u?.bio?.length || 0;
            if (bioLen < 50) missing.push(`Bio (${bioLen}/50 chars)`);
            const total = 1;
            return { filled: total - missing.length, total, missing };
        },
    },
];

/* ───────── organizer compute helpers ───────── */
export const computeOrganizerSections = (user: any) => {
    return ORGANIZER_SECTIONS.map((s) => {
        const result = s.check(user);
        const sectionPct = result.total > 0 ? (result.filled / result.total) * 100 : 0;
        return { ...s, ...result, sectionPct };
    });
};

export const computeOrganizerScore = (user: any) => {
    const sections = computeOrganizerSections(user);
    return Math.round(
        sections.reduce((acc, s) => acc + (s.sectionPct / 100) * s.weight, 0)
    );
};

export const computeOrganizerMissing = (user: any) => {
    const sections = computeOrganizerSections(user);
    return sections.flatMap((s) => s.missing);
};

/* ───────── FAB ring constants ───────── */
const FAB_RADIUS = 28;
const FAB_STROKE = 4;
const FAB_CIRC = 2 * Math.PI * FAB_RADIUS;
const FAB_SIZE = (FAB_RADIUS + FAB_STROKE) * 2;

/* ───────── level helper ───────── */
const getLevel = (score: number) => {
    if (score >= 90) return { label: "Featured Ready", color: "#10B981" };
    if (score >= 70) return { label: "Professional", color: "#8B5CF6" };
    if (score >= 40) return { label: "Rising", color: "#FF8C42" };
    return { label: "Beginner", color: "#FF6B35" };
};

/* ═══════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════ */
const ProfileStrengthWidget: React.FC<ProfileStrengthWidgetProps> = ({ user }) => {
    const [popupVisible, setPopupVisible] = useState(false);

    if (!user) return null;

    const overallScore = computeOverallScore(user);
    const sections = computeProfileSections(user);
    const { label: levelLabel, color: levelColor } = getLevel(overallScore);
    const allMissing = sections.flatMap((s) => s.missing);

    // Hide if profile is fully complete
    if (allMissing.length === 0) return null;

    const fabOffset = FAB_CIRC - (FAB_CIRC * Math.min(100, overallScore)) / 100;

    return (
        <View className="absolute bottom-20 right-4 z-50" style={{ maxWidth: 320 }}>
            {/* ─── POPUP ─── */}
            {popupVisible && (
                <View
                    className="mb-3 bg-[#141414] border border-white/10 rounded-2xl overflow-hidden"
                    style={{
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.5,
                        shadowRadius: 24,
                        elevation: 16,
                    }}
                >
                    {/* Popup Header */}
                    <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
                        <View className="flex-row items-center gap-2">
                            <AlertCircle size={14} color={levelColor} />
                            <Text className="text-white text-sm font-black tracking-tight">
                                Complete Your Profile
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setPopupVisible(false)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <X size={16} color="#71717a" />
                        </TouchableOpacity>
                    </View>

                    <Text className="text-zinc-500 text-[11px] px-4 mb-3">
                        Finish these to unlock gig applications
                    </Text>

                    {/* Section List */}
                    <ScrollView
                        style={{ maxHeight: 280 }}
                        showsVerticalScrollIndicator={false}
                        className="px-4"
                    >
                        <View className="gap-2 pb-3">
                            {sections.map((section) => {
                                const IconComp = section.icon;
                                const isComplete = section.sectionPct === 100;
                                return (
                                    <View
                                        key={section.key}
                                        className="flex-row items-center gap-3 py-2"
                                    >
                                        {/* Status icon */}
                                        <View
                                            className="w-7 h-7 rounded-lg items-center justify-center"
                                            style={{ backgroundColor: isComplete ? "rgba(16,185,129,0.12)" : `${section.color}15` }}
                                        >
                                            {isComplete ? (
                                                <CheckCircle2 size={14} color="#10B981" />
                                            ) : (
                                                <IconComp size={14} color={section.color} />
                                            )}
                                        </View>

                                        {/* Label + progress */}
                                        <View className="flex-1">
                                            <View className="flex-row items-center justify-between">
                                                <Text
                                                    className="text-xs font-bold"
                                                    style={{ color: isComplete ? "#10B981" : "#e4e4e7" }}
                                                >
                                                    {section.label}
                                                </Text>
                                                <Text
                                                    className="text-[10px] font-black"
                                                    style={{ color: isComplete ? "#10B981" : section.color }}
                                                >
                                                    {Math.round(section.sectionPct)}%
                                                </Text>
                                            </View>
                                            {/* Mini progress bar */}
                                            <View className="h-1 bg-white/[0.06] rounded-full mt-1 overflow-hidden">
                                                <View
                                                    className="h-full rounded-full"
                                                    style={{
                                                        width: `${section.sectionPct}%`,
                                                        backgroundColor: isComplete ? "#10B981" : section.color,
                                                    }}
                                                />
                                            </View>
                                            {/* Missing items */}
                                            {section.missing.length > 0 && (
                                                <View className="mt-1">
                                                    {section.missing.map((item, idx) => (
                                                        <Text key={idx} className="text-zinc-500 text-[10px]">
                                                            • {item}
                                                        </Text>
                                                    ))}
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>

                        {/* Tier Roadmap — compact */}
                        <View className="border-t border-white/[0.06] pt-3 pb-2 mt-1">
                            <Text className="text-[9px] font-black uppercase tracking-[0.15em] text-zinc-600 mb-2">
                                Artist Tiers
                            </Text>
                            {TIERS.map((tier, idx) => {
                                const TierIcon = tier.icon;
                                return (
                                    <View key={tier.label} className="flex-row items-center gap-2 mb-1.5">
                                        <TierIcon size={10} color={tier.color} />
                                        <Text className="text-[10px] font-bold" style={{ color: tier.color }}>
                                            {tier.label}
                                        </Text>
                                        <Text className="text-zinc-600 text-[10px]">
                                            — {tier.benefit}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </ScrollView>

                    {/* CTA */}
                    <TouchableOpacity
                        onPress={() => {
                            setPopupVisible(false);
                            router.push("/(app)/profile");
                        }}
                        className="mx-4 mb-4 mt-2 py-3 bg-white rounded-xl items-center"
                    >
                        <Text className="text-black font-black text-xs uppercase tracking-widest">
                            Complete Profile
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* ─── FAB ─── */}
            <TouchableOpacity
                onPress={() => setPopupVisible(!popupVisible)}
                activeOpacity={0.85}
                className="bg-zinc-900/95 border border-white/10 rounded-2xl px-3 py-3 self-end"
                style={{
                    shadowColor: levelColor,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.3,
                    shadowRadius: 16,
                    elevation: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                }}
            >
                {/* Mini ring */}
                <View style={{ width: FAB_SIZE, height: FAB_SIZE }}>
                    <Svg width={FAB_SIZE} height={FAB_SIZE}>
                        <Circle
                            cx={FAB_SIZE / 2}
                            cy={FAB_SIZE / 2}
                            r={FAB_RADIUS}
                            stroke="rgba(255,255,255,0.06)"
                            strokeWidth={FAB_STROKE}
                            fill="transparent"
                        />
                        <Circle
                            cx={FAB_SIZE / 2}
                            cy={FAB_SIZE / 2}
                            r={FAB_RADIUS}
                            stroke={levelColor}
                            strokeWidth={FAB_STROKE}
                            fill="transparent"
                            strokeDasharray={`${FAB_CIRC}`}
                            strokeDashoffset={fabOffset}
                            strokeLinecap="round"
                            rotation="-90"
                            origin={`${FAB_SIZE / 2}, ${FAB_SIZE / 2}`}
                        />
                    </Svg>
                    <View
                        className="absolute items-center justify-center"
                        style={{ width: FAB_SIZE, height: FAB_SIZE }}
                    >
                        <Text className="text-white font-black text-xs" style={{ lineHeight: 16 }}>
                            {overallScore}%
                        </Text>
                    </View>
                </View>

                {/* Label */}
                <View>
                    <Text className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">
                        Profile
                    </Text>
                    <Text
                        className="text-[11px] font-black italic uppercase tracking-tight"
                        style={{ color: levelColor }}
                    >
                        {levelLabel}
                    </Text>
                </View>
            </TouchableOpacity>
        </View>
    );
};

export default ProfileStrengthWidget;
