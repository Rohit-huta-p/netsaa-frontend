// netsa-mobile/src/components/ui/StyledTextInput.tsx
//
// NETSA Organizer-themed TextInput. Extracted from legacy GigForm.tsx:116-135
// during Plan 5 Wave 1 (Task 2) so GigFormV2 can reuse the exact same visual
// primitive. Zero behavior change vs the inline declaration — className
// preserved byte-for-byte, including the legacy double-space before `border`.

import React from 'react';
import { View, TextInput, Text } from 'react-native';
import { Typography, getLineHeight } from '@/constants/Typography';

const T = Typography;

// Cast TextInput to `any` locally so we can forward legacy web-style props
// like `type` that the RN Web runtime accepts but @types/react-native does
// not declare. Matches legacy GigForm behavior where the inline component
// was typed as `any` — preserving byte-identical render output.
const AnyTextInput = TextInput as unknown as React.ComponentType<any>;

export interface StyledTextInputProps {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  icon?: React.ComponentType<{ size?: number; color?: string }>;
  error?: string;
  type?: string;
  [key: string]: any; // pass-through for keyboardType, inputMode, etc.
}

export function StyledTextInput({
  value,
  onChangeText,
  placeholder,
  icon: Icon,
  error,
  type = 'text',
  ...props
}: StyledTextInputProps) {
  return (
    <View className="relative">
      {Icon && (
        <View className="absolute left-3 top-[50%] -translate-y-1/2 z-10">
          <Icon size={18} color="rgba(255, 255, 255, 0.4)" />
        </View>
      )}
      <AnyTextInput
        type={type}
        className={`w-full bg-zinc-900/50  border ${error ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 ${Icon ? 'pl-10' : 'pl-4'} pr-4 text-white placeholder-zinc-500 outline-none`}
        style={{ outlineStyle: 'none', fontSize: T.size.xs, lineHeight: getLineHeight('body') } as any}
        placeholder={placeholder}
        placeholderTextColor="rgba(255, 255, 255, 0.3)"
        value={value}
        onChangeText={onChangeText}
        {...props}
      />
      {error && (
        <Text style={{ color: '#ef4444', fontSize: T.size.xs, marginTop: 4, marginLeft: 4 }}>{error}</Text>
      )}
    </View>
  );
}

export default StyledTextInput;
