import React from "react";
import { View, Text, TextInput, TextInputProps, TouchableOpacity, StyleProp, ViewStyle, TextStyle } from "react-native";
import { Pencil } from "lucide-react-native";

interface EditableFieldProps extends TextInputProps {
    isEditing: boolean;
    value: string;
    label?: string;
    textStyle?: string; // ClassName for text
    containerStyle?: string; // ClassName for container
    icon?: React.ReactNode;
    children?: React.ReactNode; // For custom read view if needed
}

export const EditableField: React.FC<EditableFieldProps> = ({
    isEditing,
    value,
    label,
    textStyle,
    containerStyle,
    icon,
    children,
    ...props
}) => {
    if (isEditing) {
        return (
            <View className={`w-full mb-4 ${containerStyle}`}>
                {label && <Text className="text-xs text-purple-600 font-semibold mb-1 ml-1">{label}</Text>}
                <View className="relative">
                    <TextInput
                        value={value}
                        className="w-full bg-white border border-purple-300 rounded-xl px-4 py-3 text-gray-900 pr-10 outline-none"
                        placeholderTextColor="#9CA3AF"
                        {...props}
                    />
                    <View className="absolute right-3 top-3.5">
                        <Pencil size={14} color="#A855F7" />
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View className={`w-full mb-1 ${containerStyle}`}>
            <View className="flex-row items-center">
                {icon && <View className="mr-2">{icon}</View>}
                {children ? (
                    children
                ) : (
                    <Text className={`text-gray-900 ${textStyle}`}>{value}</Text>
                )}
            </View>
        </View>
    );
};
