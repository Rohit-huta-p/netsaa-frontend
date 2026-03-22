import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Phone, Mail } from 'lucide-react-native';

// @ts-ignore
const tailwindConfig = require("../../../tailwind.config");
const C = tailwindConfig.theme.extend.colors.auth;

export const ModeToggle = ({
    mode, onPhonePress, onEmailPress,
}: { mode: "phone" | "email"; onPhonePress: () => void; onEmailPress: () => void }) => (
    <View style={{
        flexDirection: "row", alignItems: "center",
        backgroundColor: C.w05, borderRadius: 14,
        padding: 4, marginBottom: 24,
        borderWidth: 1, borderColor: C.w08,
    }}>
        {[
            { key: "phone", label: "Phone", icon: Phone, onPress: onPhonePress },
            { key: "email", label: "Email", icon: Mail, onPress: onEmailPress },
        ].map(({ key, label, icon: Icon, onPress }) => {
            const active = mode === key;
            return (
                <TouchableOpacity
                    key={key}
                    onPress={onPress}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    style={{ flex: 1, borderRadius: 10, overflow: "hidden" }}
                >
                    <View style={{
                        flexDirection: "row", alignItems: "center",
                        justifyContent: "center", gap: 6,
                        paddingVertical: 9,
                        borderRadius: 10,
                        backgroundColor: active ? C.activeBg : "transparent",
                        borderWidth: active ? 1 : 0,
                        borderColor: active ? C.activeB : "transparent",
                    }}>
                        <Icon size={13} color={active ? C.accent : C.w40} strokeWidth={2} />
                        <Text style={{
                            fontSize: 13, fontWeight: "600",
                            color: active ? C.accent : C.w40,
                            letterSpacing: 0.1,
                        }}>{label}</Text>
                    </View>
                </TouchableOpacity>
            );
        })}
    </View>
);
