// path: components/ui/Input.tsx
import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';

export interface InputProps<T extends FieldValues> extends TextInputProps {
    control: Control<T>;
    name: Path<T>;
    label: string;
    error?: string;
    containerClassName?: string;
    contentContainerClassName?: string;
    inputClassName?: string;
    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
    labelClassName?: string;
}

export function Input<T extends FieldValues>({
    control,
    name,
    label,
    error,
    labelClassName,
    containerClassName,
    contentContainerClassName,
    inputClassName,
    startIcon,
    endIcon,
    ...props
}: InputProps<T>) {
    return (
        <View className={`mb-4${containerClassName || ''}`}>
            {/* Label: slightly dimmed text for hierarchy */}
            <Text className="text-sm font-medium text-gray-300 mb-2 ml-1">
                {label}
            </Text>

            <Controller
                control={control}
                name={name}
                render={({ field: { onChange, onBlur, value } }) => (
                    <View
                        className={`
                            w-full flex-row items-center 
                            rounded-2xl border 
                            px-4 h-14
                            ${error
                                ? 'border-red-500 bg-red-500/10'
                                : 'border-white/10 bg-white/5 '
                            }
                            ${contentContainerClassName || ''}
                        `}
                    >
                        {startIcon && <View className="mr-3 opacity-80">{startIcon}</View>}

                        <TextInput
                            className={`flex-1 text-white text-base  outline-none  ${inputClassName || ''}`}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value as string}
                            placeholderTextColor="rgba(255, 255, 255, 0.3)"
                            selectionColor="#F472B6" // Pink cursor to match the vibe
                            {...props}
                        />

                        {endIcon && <View className="ml-3 opacity-80">{endIcon}</View>}
                    </View>
                )}
            />

            {error && (
                <Text className="text-red-400 text-xs mt-1.5 ml-1 font-medium">
                    {error}
                </Text>
            )}
        </View>
    );
}