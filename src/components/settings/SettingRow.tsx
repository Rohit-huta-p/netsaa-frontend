// src/components/settings/SettingRow.tsx
import React from 'react';
import { View, Text, Switch, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

/* ── Toggle Row ── */
type ToggleProps = {
    type: 'toggle';
    label: string;
    description?: string;
    value: boolean;
    onToggle: (value: boolean) => void;
    disabled?: boolean;
};

/* ── Select Row (shows current value + chevron) ── */
type SelectProps = {
    type: 'select';
    label: string;
    description?: string;
    value: string;
    onPress: () => void;
    disabled?: boolean;
};

/* ── Nav Row (chevron navigation to sub-screen) ── */
type NavProps = {
    type: 'nav';
    label: string;
    description?: string;
    icon?: React.ReactNode;
    onPress: () => void;
};

/* ── Danger Row (red-styled action) ── */
type DangerProps = {
    type: 'danger';
    label: string;
    description?: string;
    onPress: () => void;
};

export type SettingRowProps = ToggleProps | SelectProps | NavProps | DangerProps;

export default function SettingRow(props: SettingRowProps) {
    const { type, label, description } = props;

    /* ── Toggle ── */
    if (type === 'toggle') {
        return (
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/5">
                <View className="flex-1 mr-4">
                    <Text className="text-white text-[15px] font-['Outfit-Medium']">{label}</Text>
                    {description && (
                        <Text className="text-zinc-500 text-[13px] font-['SourceSans3-Regular'] mt-1">{description}</Text>
                    )}
                </View>
                <Switch
                    value={props.value}
                    onValueChange={props.onToggle}
                    disabled={props.disabled}
                    trackColor={{ false: '#3f3f46', true: '#7c3aed' }}
                    thumbColor={props.value ? '#ede9fe' : '#a1a1aa'}
                    ios_backgroundColor="#3f3f46"
                />
            </View>
        );
    }

    /* ── Select ── */
    if (type === 'select') {
        return (
            <Pressable
                onPress={props.onPress}
                disabled={props.disabled}
                className="flex-row items-center justify-between px-5 py-4 border-b border-white/5 active:bg-white/5"
            >
                <View className="flex-1 mr-4">
                    <Text className="text-white text-[15px] font-['Outfit-Medium']">{label}</Text>
                    {description && (
                        <Text className="text-zinc-500 text-[13px] font-['SourceSans3-Regular'] mt-1">{description}</Text>
                    )}
                </View>
                <View className="flex-row items-center">
                    <Text className="text-zinc-400 text-[14px] font-['SourceSans3-Regular'] mr-2">{props.value}</Text>
                    <ChevronRight size={18} color="#71717a" />
                </View>
            </Pressable>
        );
    }

    /* ── Nav ── */
    if (type === 'nav') {
        return (
            <Pressable
                onPress={props.onPress}
                className="flex-row items-center justify-between px-5 py-4 border-b border-white/5 active:bg-white/5"
            >
                <View className="flex-row items-center flex-1">
                    {props.icon && <View className="mr-3">{props.icon}</View>}
                    <View className="flex-1">
                        <Text className="text-white text-[15px] font-['Outfit-Medium']">{label}</Text>
                        {description && (
                            <Text className="text-zinc-500 text-[13px] font-['SourceSans3-Regular'] mt-1">{description}</Text>
                        )}
                    </View>
                </View>
                <ChevronRight size={18} color="#71717a" />
            </Pressable>
        );
    }

    /* ── Danger ── */
    return (
        <Pressable
            onPress={props.onPress}
            className="flex-row items-center justify-between px-5 py-4 border-b border-white/5 active:bg-red-500/10"
        >
            <View className="flex-1">
                <Text className="text-red-400 text-[15px] font-['Outfit-Medium']">{label}</Text>
                {description && (
                    <Text className="text-red-400/60 text-[13px] font-['SourceSans3-Regular'] mt-1">{description}</Text>
                )}
            </View>
            <ChevronRight size={18} color="#f87171" />
        </Pressable>
    );
}
