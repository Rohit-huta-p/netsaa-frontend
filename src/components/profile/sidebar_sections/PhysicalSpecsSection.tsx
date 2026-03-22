import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView } from "react-native";
import { Calendar, Ruler, User, Check, Edit2, ChevronDown, Search, X } from "lucide-react-native";
import { useProfileUiStore } from "@/stores/profileUiStore";
import { EditableInput, SectionActions, DEFINED_SKIN_TONES } from "./SharedSidebarComponents";

const HEIGHT_OPTIONS = Array.from({ length: 37 }, (_, i) => {
    const feet = Math.floor(i / 12) + 4;
    const inches = i % 12;
    return `${feet}'${inches}"`;
});

interface PhysicalSpecsSectionProps {
    isEditable: boolean;
    isOrganizer?: boolean;
    initialAge: string;
    initialHeight: string;
    initialSkinTone: string;
    initialSkinToneHex: string;
    onSave: (data: { age: string; height: string; skinTone: string; skinToneHex: string }) => Promise<void>;
}

export const PhysicalSpecsSection: React.FC<PhysicalSpecsSectionProps> = ({
    isEditable,
    isOrganizer,
    initialAge,
    initialHeight,
    initialSkinTone,
    initialSkinToneHex,
    onSave,
}) => {
    const { activeEditSection, setEditSection } = useProfileUiStore();
    const [age, setAge] = useState(initialAge || "");
    const [height, setHeight] = useState(initialHeight || "");
    const [skinTone, setSkinTone] = useState(initialSkinTone || "");
    const [skinToneHex, setSkinToneHex] = useState(initialSkinToneHex || "");

    // Height dropdown state
    const [showHeightDropdown, setShowHeightDropdown] = useState(false);
    const [heightSearch, setHeightSearch] = useState('');

    const filteredHeights = HEIGHT_OPTIONS.filter(h => h.includes(heightSearch));

    const isDirty = age !== (initialAge || "") || height !== (initialHeight || "") || skinTone !== (initialSkinTone || "");

    const handleCancel = () => {
        setAge(initialAge || "");
        setHeight(initialHeight || "");
        setSkinTone(initialSkinTone || "");
        setSkinToneHex(initialSkinToneHex || "");
        setShowHeightDropdown(false);
        setHeightSearch('');
        setEditSection(null);
    };

    const handleSave = async () => {
        await onSave({ age, height, skinTone, skinToneHex });
    };

    return (
        <View className="bg-zinc-900/60 rounded-2xl py-6 px-6 relative" style={{ zIndex: 10 }}>
            <Text className={`text-xs font-black uppercase tracking-[0.3em] mb-6 pl-4 border-l-2 text-white`}>Physical Specs</Text>
            {isEditable && (
                <TouchableOpacity
                    onPress={() => activeEditSection === 'basic' ? setEditSection(null) : setEditSection('basic')}
                    className={`absolute top-4 right-4 p-2 rounded-full border ${activeEditSection === 'basic' ? 'bg-pink-500/10 border-pink-500/20' : 'bg-white/5 border-transparent'}`}
                >
                    <Edit2 size={12} color={activeEditSection === 'basic' ? "#ea698b" : "#71717a"} />
                </TouchableOpacity>
            )}
            {activeEditSection === 'basic' && isEditable ? (
                <View className="space-y-4">
                    <View>
                        <Text className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Age</Text>
                        <EditableInput value={age} onChangeText={setAge} placeholder="Age" />
                    </View>

                    {/* Height Dropdown */}
                    <View style={{ zIndex: 20 }}>
                        <Text className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Height</Text>
                        <TouchableOpacity
                            onPress={() => {
                                setShowHeightDropdown(!showHeightDropdown);
                                setHeightSearch('');
                            }}
                            style={{
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.1)',
                                borderRadius: 12,
                                paddingHorizontal: 16,
                                paddingVertical: 12,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                height: 48,
                            }}
                        >
                            <Text style={{ color: height ? '#fff' : '#52525b', fontSize: 14 }}>
                                {height || "Select Height"}
                            </Text>
                            <ChevronDown size={16} color="#71717a" />
                        </TouchableOpacity>

                        {showHeightDropdown && (
                            <View
                                style={{
                                    position: 'absolute',
                                    top: 76,
                                    left: 0,
                                    right: 0,
                                    backgroundColor: '#27272a',
                                    borderWidth: 1,
                                    borderColor: 'rgba(255,255,255,0.1)',
                                    borderRadius: 12,
                                    maxHeight: 220,
                                    zIndex: 999,
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Search bar */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, paddingVertical: 10 }}>
                                    <Search size={14} color="#71717a" />
                                    <TextInput
                                        value={heightSearch}
                                        onChangeText={setHeightSearch}
                                        placeholder={"Search (e.g. 5'8\")"}
                                        placeholderTextColor="#52525b"
                                        style={{ flex: 1, color: '#fff', fontSize: 13, marginLeft: 8, outlineStyle: 'none' as any }}
                                        autoFocus
                                    />
                                    {heightSearch.length > 0 && (
                                        <TouchableOpacity onPress={() => setHeightSearch('')}>
                                            <X size={14} color="#71717a" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                                <ScrollView
                                    nestedScrollEnabled
                                    keyboardShouldPersistTaps="handled"
                                    showsVerticalScrollIndicator
                                    contentContainerStyle={{ paddingBottom: 8 }}
                                >
                                    {filteredHeights.length === 0 ? (
                                        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
                                            <Text style={{ color: '#52525b', fontSize: 13, fontStyle: 'italic' }}>No heights match</Text>
                                        </View>
                                    ) : filteredHeights.map(opt => (
                                        <TouchableOpacity
                                            key={opt}
                                            onPress={() => {
                                                setHeight(opt);
                                                setShowHeightDropdown(false);
                                                setHeightSearch('');
                                            }}
                                            style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' }}
                                        >
                                            <Text style={{ fontSize: 13, color: height === opt ? '#ea698b' : '#d4d4d8', fontWeight: height === opt ? '700' : '400' }}>
                                                {opt}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>

                    <View>
                        <Text className="text-zinc-500 text-[10px] uppercase font-bold mb-2">Skin Tone</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {DEFINED_SKIN_TONES.map((tone: { label: string; hex: string }) => {
                                const isSelected = skinTone === tone.label;
                                return (
                                    <TouchableOpacity
                                        key={tone.label}
                                        onPress={() => {
                                            setSkinTone(tone.label);
                                            setSkinToneHex(tone.hex);
                                        }}
                                        style={{
                                            width: 22,
                                            height: 22,
                                            borderRadius: 11,
                                            backgroundColor: tone.hex,
                                            borderWidth: 2,
                                            borderColor: isSelected ? '#ea698b' : 'transparent',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {isSelected && <Check size={16} color={tone.hex === "#fcd9b8" || tone.hex === "#f0cbb0" ? "#000" : "#fff"} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        {skinTone ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                                <View style={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: 6,
                                    backgroundColor: skinToneHex || '#52525b',
                                    borderWidth: 1,
                                    borderColor: 'rgba(255,255,255,0.15)',
                                }} />
                                <Text className="text-zinc-400 text-xs italic">{skinTone}</Text>
                                <Text className="text-zinc-400 text-xs italic">{skinToneHex}</Text>
                            </View>
                        ) : null}
                    </View>
                    <SectionActions
                        isDirty={isDirty}
                        isSaving={false}
                        onSave={handleSave}
                        onCancel={handleCancel}
                    />
                </View>
            ) : (
                <View className="gap-4 bg-zinc-900/30 p-5 rounded-xl border border-white/5">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2">
                            <Calendar size={14} color="#71717a" />
                            <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Age</Text>
                        </View>
                        <Text className="text-white text-xs font-black italic">{initialAge || "-"} Years</Text>
                    </View>
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2">
                            <Ruler size={14} color="#71717a" />
                            <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Height</Text>
                        </View>
                        <Text className="text-white text-xs font-black italic">{initialHeight || "-"}</Text>
                    </View>
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2">
                            <User size={14} color="#71717a" />
                            <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Skin Tone</Text>
                        </View>
                        <View className="flex-row items-center">
                            <Text className="text-white text-xs font-black italic">{initialSkinTone || "-"}</Text>
                            <View className={`text-white text-xs font-black italic bg-[${skinToneHex}] p-2 rounded-full`}>
                                <View style={{ width: 19, height: 12, borderRadius: 2, backgroundColor: skinToneHex || '#52525b', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }} />
                            </View>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
};


