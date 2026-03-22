// src/components/common/ProfileCompletionModal.tsx
import React from "react";
import {
    View,
    Text,
    Modal,
    StyleSheet,
    Platform,
    ScrollView,
    TouchableOpacity,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { AlertTriangle, ShieldAlert, X, ChevronRight } from "lucide-react-native";
import { Button } from "../ui/Button";
import Svg, { Circle } from "react-native-svg";

interface ProfileCompletionModalProps {
    index?: boolean;
    visible: boolean;
    score: number;
    missing: string[];
    onClose: () => void;
    onGoToProfile: () => void;
    role?: 'artist' | 'organizer';
}

/* ── circular progress constants ── */
const RADIUS = 38;
const STROKE = 5;
const CIRC = 2 * Math.PI * RADIUS;
const SIZE = (RADIUS + STROKE) * 2;

const SMALL_RADIUS = 28;
const SMALL_STROKE = 4;
const SMALL_CIRC = 2 * Math.PI * SMALL_RADIUS;
const SMALL_SIZE = (SMALL_RADIUS + SMALL_STROKE) * 2;

const getAccent = (s: number) => {

    return "#FF6B35";
};

export const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({
    index = false,
    visible,
    score,
    missing,
    onClose,
    onGoToProfile,
    role = 'artist',
}) => {
    const isOrganizer = role === 'organizer';
    if (!visible) return null;

    const clamped = Math.min(100, Math.max(0, score));
    const accent = getAccent(clamped);
    const offset = CIRC - (CIRC * clamped) / 100;
    const smallOffset = SMALL_CIRC - (SMALL_CIRC * clamped) / 100;
    console.log("MISSING: ", missing);
    /* ═══════════════════════════════════════
       INDEX LAYOUT — bottom-left card with more height
       ═══════════════════════════════════════ */
    if (index) {
        return (
            <View
                className="absolute bottom-20 right-4 z-50 lg:w-[40%] w-[60%]"
                style={{
                    shadowColor: "#4b4b4bff",
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 20,
                    elevation: 16,
                }}
            >
                <View className="bg-[#111111] border border-white/10 rounded-2xl overflow-hidden">
                    {/* Top gradient accent */}
                    <LinearGradient
                        colors={[`${accent}15`, "transparent"]}
                        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 120 }}
                    />

                    {/* Close button */}
                    <View className="flex-row justify-end px-4 pt-3">
                        <TouchableOpacity
                            onPress={onClose}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <X size={16} color="#52525b" />
                        </TouchableOpacity>
                    </View>

                    <View className="px-5 pb-5 items-center">
                        {/* Score ring */}
                        <View style={{ width: SMALL_SIZE, height: SMALL_SIZE }} className="mb-3">
                            <Svg width={SMALL_SIZE} height={SMALL_SIZE}>
                                <Circle
                                    cx={SMALL_SIZE / 2}
                                    cy={SMALL_SIZE / 2}
                                    r={SMALL_RADIUS}
                                    stroke="rgba(255,255,255,0.06)"
                                    strokeWidth={SMALL_STROKE}
                                    fill="transparent"
                                />
                                <Circle
                                    cx={SMALL_SIZE / 2}
                                    cy={SMALL_SIZE / 2}
                                    r={SMALL_RADIUS}
                                    stroke={accent}
                                    strokeWidth={SMALL_STROKE}
                                    fill="transparent"
                                    strokeDasharray={`${SMALL_CIRC}`}
                                    strokeDashoffset={smallOffset}
                                    strokeLinecap="round"
                                    rotation="-90"
                                    origin={`${SMALL_SIZE / 2}, ${SMALL_SIZE / 2}`}
                                />
                            </Svg>
                            <View
                                className="absolute items-center justify-center"
                                style={{ width: SMALL_SIZE, height: SMALL_SIZE }}
                            >
                                <Text className="text-white font-black text-sm">{clamped}%</Text>
                            </View>
                        </View>

                        {/* Title */}
                        <Text className="text-white text-sm font-black tracking-tight text-center mb-1">
                            <span>Complete Your Profile</span>
                            <span className="block text-[10px] text-gray-400">
                                {isOrganizer ? 'to start posting gigs & events' : 'to increase your chances of getting hired'}
                            </span>
                        </Text>
                        <Text className="text-zinc-500 text-[11px] mb-4 text-center">
                            {missing.length} item{missing.length !== 1 ? "s" : ""} {isOrganizer ? 'needed to post gigs' : 'needed to apply for gigs'}
                        </Text>

                        {/* Missing items — vertical list */}
                        <ScrollView
                            style={{ maxHeight: 180 }}
                            showsVerticalScrollIndicator={false}
                            className="w-full mb-4"
                        >
                            <View className="gap-2">
                                {missing.map((item, idx) => (
                                    <View
                                        key={idx}
                                        className="flex-row items-center gap-2.5 bg-white/5 border border-white/[0.06] rounded-xl px-3 py-2.5"
                                    >
                                        <AlertTriangle size={12} color={accent} />
                                        <Text className="text-zinc-300 text-[10px] font-semibold flex-1">
                                            {item}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </ScrollView>

                        {/* CTA */}
                        <TouchableOpacity
                            onPress={onGoToProfile}
                            className="flex-row items-center justify-center bg-white rounded-xl py-3 w-full"
                            activeOpacity={0.85}
                        >
                            <Text className="text-black font-black text-xs uppercase tracking-widest mr-1">
                                Complete Profile
                            </Text>
                            <ChevronRight size={14} color="#000" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    /* ═══════════════════════════════════════
       DEFAULT LAYOUT — centered vertical modal (apply gate)
       ═══════════════════════════════════════ */
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-center items-center bg-black/80">
                {/* Blur backdrop (native only) */}
                {Platform.OS !== "web" && (
                    <BlurView
                        intensity={20}
                        tint="dark"
                        style={StyleSheet.absoluteFill}
                    />
                )}

                <View className="w-[90%] max-w-md bg-[#121212] rounded-[32px] overflow-hidden border border-white/10 shadow-2xl">
                    {/* Decorative gradient */}
                    <LinearGradient
                        colors={["rgba(255, 107, 53, 0.08)", "transparent"]}
                        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 200 }}
                    />

                    <View className="p-8 items-center">
                        {/* Icon header */}
                        <View className="mb-5 relative">
                            <View className="w-20 h-20 rounded-full bg-zinc-900 border border-white/10 items-center justify-center">
                                <LinearGradient
                                    colors={[accent, "#3B82F6"]}
                                    className="w-16 h-16 rounded-full items-center justify-center opacity-90"
                                >
                                    <ShieldAlert size={32} color="white" />
                                </LinearGradient>
                            </View>
                        </View>

                        {/* Title + subtitle */}
                        <Text className="text-white text-2xl font-black text-center mb-2 tracking-tight">
                            {isOrganizer ? 'Complete Your Profile to Post' : 'Complete Your Profile to Apply'}
                        </Text>
                        <Text className="text-zinc-400 text-center text-sm leading-6 px-2 font-medium mb-6">
                            {isOrganizer
                                ? 'Artists prefer working with verified organizers. Finish the missing sections below to start posting.'
                                : 'Organizers prefer complete profiles. Finish the missing sections below to unlock applications.'}
                        </Text>

                        {/* Score ring */}
                        <View className="mb-5" style={{ width: SIZE, height: SIZE }}>
                            <Svg width={SIZE} height={SIZE}>
                                <Circle
                                    cx={SIZE / 2}
                                    cy={SIZE / 2}
                                    r={RADIUS}
                                    stroke="rgba(255,255,255,0.06)"
                                    strokeWidth={STROKE}
                                    fill="transparent"
                                />
                                <Circle
                                    cx={SIZE / 2}
                                    cy={SIZE / 2}
                                    r={RADIUS}
                                    stroke={accent}
                                    strokeWidth={STROKE}
                                    fill="transparent"
                                    strokeDasharray={`${CIRC}`}
                                    strokeDashoffset={offset}
                                    strokeLinecap="round"
                                    rotation="-90"
                                    origin={`${SIZE / 2}, ${SIZE / 2}`}
                                />
                            </Svg>
                            <View
                                className="absolute items-center justify-center"
                                style={{ width: SIZE, height: SIZE }}
                            >
                                <Text className="text-white font-black text-xl">{clamped}%</Text>
                                <Text className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">
                                    Complete
                                </Text>
                            </View>
                        </View>

                        {/* Missing checklist */}
                        {missing.length > 0 && (
                            <ScrollView
                                className="w-full mb-6"
                                style={{ maxHeight: 160 }}
                                showsVerticalScrollIndicator={false}
                            >
                                <View className="gap-2">
                                    {missing.map((item, idx) => (
                                        <View
                                            key={idx}
                                            className="flex-row items-center gap-3 bg-white/5 rounded-2xl px-4 py-3 border border-white/5"
                                        >
                                            <AlertTriangle size={14} color={accent} />
                                            <Text className="text-zinc-300 text-sm font-medium flex-1">
                                                {item}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </ScrollView>
                        )}

                        {/* Actions */}
                        <View className="w-full gap-3">
                            <Button
                                variant="white"
                                size="lg"
                                label="Go to Profile"
                                onPress={onGoToProfile}
                                className="w-full rounded-2xl"
                                labelClassName="text-black font-black text-lg"
                            />
                            <Button
                                variant="ghost"
                                size="md"
                                label="I'll do it later"
                                onPress={onClose}
                                className="w-full"
                                labelClassName="text-zinc-500 text-sm font-bold uppercase tracking-widest"
                            />
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default ProfileCompletionModal;

