import React from 'react';
import { TextInput, TextInputProps } from 'react-native';

interface TextAreaProps extends TextInputProps {
    rows?: number;
    error?: string | boolean;
}

export const TextArea: React.FC<TextAreaProps> = ({ rows = 4, style, error, ...props }) => {
    return (
        <TextInput
            multiline
            numberOfLines={rows}
            className={`w-full bg-zinc-900/50 border ${error ? 'border-red-500' : 'border-zinc-700'} rounded-xl py-3 px-4 text-zinc-100 focus:border-indigo-500`}
            placeholderTextColor="#52525b"
            textAlignVertical="top"
            style={[{ minHeight: rows * 24 }, style]}
            {...props}
        />
    );
};
