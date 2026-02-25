// src/components/profile/sheets/ExperienceBottomSheet.tsx
import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, Plus, Trash2, GripVertical } from "lucide-react-native";
import { ExperienceEntry } from "@/types/index";
import { useProfileUiStore } from "@/stores/profileUiStore";
import { useAuthStore } from "@/stores/authStore";
import authService from "@/services/authService";

interface ExperienceBottomSheetProps {
    visible: boolean;
    onClose: () => void;
    experience: ExperienceEntry[];
}

const InputField = ({ label, value, onChangeText, placeholder }: {
    label: string; value: string; onChangeText: (t: string) => void; placeholder: string;
}) => (
    <View>
        <Text className="text-zinc-500 mb-2 font-bold uppercase tracking-widest text-[10px]">{label}</Text>
        <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#3f3f46"
            style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                padding: 16,
                color: '#fff',
                fontSize: 14,
                fontWeight: '500',
            }}
        />
    </View>
);

export const ExperienceBottomSheet: React.FC<ExperienceBottomSheetProps> = ({
    visible,
    onClose,
    experience: initialExperience,
}) => {
    const [entries, setEntries] = useState<ExperienceEntry[]>(initialExperience);
    const [newEntry, setNewEntry] = useState<ExperienceEntry>({ title: '', role: '', venue: '', date: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { setSaving, setSectionError, clearSectionDraft } = useProfileUiStore();

    const addEntry = () => {
        if (!newEntry.title.trim()) return;
        setEntries(prev => [...prev, { ...newEntry }]);
        setNewEntry({ title: '', role: '', venue: '', date: '' });
    };

    const removeEntry = (index: number) => {
        setEntries(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaving('experience');
        setError(null);
        try {
            const payload = { experience: entries };
            const updatedUser = await authService.updateProfile(payload);
            const user = useAuthStore.getState().user;
            if (user) {
                useAuthStore.getState().setAuth({
                    user: { ...user, ...updatedUser },
                    accessToken: useAuthStore.getState().accessToken || '',
                });
            }
            clearSectionDraft('experience');
            onClose();
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Failed to save experience';
            setError(msg);
            setSectionError('experience', msg);
        } finally {
            setIsSaving(false);
            setSaving(null);
        }
    };

    const handleCancel = () => {
        setEntries(initialExperience);
        setNewEntry({ title: '', role: '', venue: '', date: '' });
        setError(null);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View className="flex-1 bg-black">
                <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : undefined}
                        className="flex-1"
                    >
                        {/* Header */}
                        <View className="px-6 py-5 border-b border-white/10 flex-row items-center justify-between">
                            <View>
                                <Text className="text-white font-black text-xl uppercase italic tracking-tight">Experience</Text>
                                <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Add your performances</Text>
                            </View>
                            <TouchableOpacity onPress={handleCancel} className="p-2">
                                <X size={22} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="flex-1 px-6 py-6" contentContainerStyle={{ paddingBottom: 120 }}>
                            {/* Existing Entries */}
                            {entries.map((exp, i) => (
                                <View key={i} className="flex-row items-center justify-between p-5 bg-white/5 border border-white/10 rounded-xl mb-3">
                                    <View className="flex-row items-center gap-3 flex-1">
                                        <GripVertical size={16} color="#3f3f46" />
                                        <View className="flex-1">
                                            <Text className="text-white font-bold text-sm uppercase tracking-wide">
                                                {typeof exp === 'string' ? exp : exp.title}
                                            </Text>
                                            {typeof exp !== 'string' && (
                                                <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                                                    {[exp.role, exp.venue, exp.date].filter(Boolean).join(' • ')}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                    <TouchableOpacity onPress={() => removeEntry(i)} className="p-2">
                                        <Trash2 size={16} color="#71717a" />
                                    </TouchableOpacity>
                                </View>
                            ))}

                            {/* Add New Entry */}
                            <View className="p-5 bg-white/5 border border-dashed border-white/20 rounded-xl space-y-4 mt-4">
                                <Text className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-1">New Performance</Text>

                                <InputField
                                    label="Event / Show Title"
                                    value={newEntry.title}
                                    onChangeText={(t) => setNewEntry({ ...newEntry, title: t })}
                                    placeholder="e.g. SUMMER JAM 2025"
                                />
                                <View className="flex-row gap-3">
                                    <View className="flex-1">
                                        <InputField
                                            label="Role"
                                            value={newEntry.role || ''}
                                            onChangeText={(t) => setNewEntry({ ...newEntry, role: t })}
                                            placeholder="e.g. HEADLINER"
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <InputField
                                            label="Date"
                                            value={newEntry.date || ''}
                                            onChangeText={(t) => setNewEntry({ ...newEntry, date: t })}
                                            placeholder="e.g. JAN 2025"
                                        />
                                    </View>
                                </View>
                                <InputField
                                    label="Venue / Location"
                                    value={newEntry.venue || ''}
                                    onChangeText={(t) => setNewEntry({ ...newEntry, venue: t })}
                                    placeholder="e.g. THE GRAND ARENA"
                                />
                                <TouchableOpacity
                                    onPress={addEntry}
                                    disabled={!newEntry.title.trim()}
                                    className={`p-4 rounded-xl items-center justify-center border border-white/10 flex-row gap-2
                                        ${!newEntry.title.trim() ? 'opacity-40' : 'bg-white/10 active:bg-white/20'}`}
                                >
                                    <Plus size={16} color="#fff" />
                                    <Text className="text-white font-bold uppercase tracking-widest text-xs">Add to List</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>

                        {/* Error */}
                        {error && (
                            <View className="mx-6 mb-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <Text className="text-red-400 text-xs font-bold">{error}</Text>
                            </View>
                        )}

                        {/* Save / Cancel */}
                        <View className="px-6 py-5 border-t border-white/10 bg-black flex-row gap-3">
                            <TouchableOpacity
                                onPress={handleCancel}
                                className="flex-1 py-4 border border-white/10 rounded-xl items-center justify-center"
                            >
                                <Text className="text-white font-bold uppercase tracking-widest text-xs">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSave}
                                disabled={isSaving}
                                className="flex-1 py-4 bg-white rounded-xl items-center justify-center"
                            >
                                {isSaving ? (
                                    <ActivityIndicator size="small" color="#000" />
                                ) : (
                                    <Text className="text-black font-black uppercase tracking-tighter text-sm italic">Save</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </View>
        </Modal>
    );
};

export default ExperienceBottomSheet;
