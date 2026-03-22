// src/components/auth/SelectionCard.tsx
// Reusable selection cards for registration steps
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
const C = Colors.auth;

/* ═══════════════════════════════════════════ */
/*  LargeRoleCard — icon + title + subtitle   */
/* ═══════════════════════════════════════════ */

export interface LargeRoleCardProps {
    icon: React.ElementType;
    title: string;
    subtitle: string;
    selected: boolean;
    onPress: () => void;
}

export const LargeRoleCard = ({ icon: Icon, title, subtitle, selected, onPress }: LargeRoleCardProps) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{
        flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, borderRadius: 20,
        borderWidth: 1.5, borderColor: selected ? C.activeB : C.w08,
        backgroundColor: selected ? C.activeBg : C.w03,
    }}>
        <View style={{
            width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
            backgroundColor: selected ? C.primary : C.w06,
        }}>
            <Icon size={22} color={selected ? '#fff' : C.w30} />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: selected ? C.primary : C.w60 }}>{title}</Text>
            <Text style={{ fontSize: 13, color: selected ? C.w50 : C.w30, marginTop: 2 }}>{subtitle}</Text>
        </View>
        {selected && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: C.primary }} />}
    </TouchableOpacity>
);

/* ═══════════════════════════════════════════ */
/*  IntentCard — icon + label (grid item)     */
/* ═══════════════════════════════════════════ */

export interface IntentCardProps {
    icon: React.ElementType;
    label: string;
    selected: boolean;
    onPress: () => void;
}

export const IntentCard = ({ icon: Icon, label, selected, onPress }: IntentCardProps) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{
        width: '47%', padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center', gap: 10,
        borderColor: selected ? C.activeB : C.w08, backgroundColor: selected ? C.activeBg : C.w03,
    }}>
        <View style={{
            width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
            backgroundColor: selected ? C.primary : C.w06,
        }}>
            <Icon size={20} color={selected ? '#fff' : C.w30} />
        </View>
        <Text style={{ fontSize: 13, fontWeight: '600', color: selected ? C.primary : C.w40, textAlign: 'center' }}>
            {label}
        </Text>
    </TouchableOpacity>
);

/* ═══════════════════════════════════════════ */
/*  TypeChip — pill-shaped toggle             */
/* ═══════════════════════════════════════════ */

export interface TypeChipProps {
    label: string;
    selected: boolean;
    onPress: () => void;
}

export const TypeChip = ({ label, selected, onPress }: TypeChipProps) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{
        paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, borderWidth: 1,
        borderColor: selected ? C.activeB : C.w08, backgroundColor: selected ? C.activeBg : C.w03,
    }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: selected ? C.primary : C.w40 }}>{label}</Text>
    </TouchableOpacity>
);

/* ═══════════════════════════════════════════ */
/*  ExpCard — label + subtitle row            */
/* ═══════════════════════════════════════════ */

export interface ExpCardProps {
    label: string;
    sub: string;
    selected: boolean;
    onPress: () => void;
}

export const ExpCard = ({ label, sub, selected, onPress }: ExpCardProps) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 18, borderRadius: 16, borderWidth: 1,
        borderColor: selected ? C.activeB : C.w08, backgroundColor: selected ? C.activeBg : C.w03,
    }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: selected ? C.primary : C.w50 }}>{label}</Text>
        <Text style={{ fontSize: 12, color: C.w30 }}>{sub}</Text>
    </TouchableOpacity>
);
