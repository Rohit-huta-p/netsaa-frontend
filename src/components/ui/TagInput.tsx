import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, TextInputProps } from 'react-native';
import { X } from 'lucide-react-native';

interface TagInputProps extends TextInputProps {
    value?: string; // Comma separated string
    onChangeTags: (tags: string) => void;
    placeholder?: string;
    error?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
    value = '',
    onChangeTags,
    placeholder,
    error,
    ...props
}) => {
    const [inputValue, setInputValue] = useState('');
    const tags = value.split(',').map(t => t.trim()).filter(Boolean);

    const handleAddTag = (text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        // Don't add if already exists
        if (tags.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
            setInputValue('');
            return;
        }

        const newTags = [...tags, trimmed];
        onChangeTags(newTags.join(', '));
        setInputValue('');
    };

    const handleRemoveTag = (indexToRemove: number) => {
        const newTags = tags.filter((_, index) => index !== indexToRemove);
        onChangeTags(newTags.join(', '));
    };

    const onChangeText = (text: string) => {
        if (text.endsWith(',') || text.endsWith(' ')) {
            // If user types a comma or space (optional, maybe just comma), add the tag
            // Let's stick to comma for explicit separation, or maybe space if clear. 
            // The prompt mentioned "Enter key or comma".
            const newTag = text.slice(0, -1);
            if (newTag.trim()) {
                handleAddTag(newTag);
            } else {
                setInputValue('');
            }
        } else {
            setInputValue(text);
        }
    };

    const onSubmitEditing = () => {
        handleAddTag(inputValue);
    };

    return (
        <View className="gap-3">
            <View className={`bg-zinc-900/50 border ${error ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 px-3 flex-row flex-wrap items-center gap-2 focus:border-[#FF6B35]`}>
                {tags.map((tag, index) => (
                    <TouchableOpacity
                        key={`${tag}-${index}`}
                        onPress={() => handleRemoveTag(index)}
                        className="bg-[#FF6B35]/20 border border-[#FF6B35]/30 rounded-full px-3 py-1 flex-row items-center gap-1"
                    >
                        <Text className="text-[#FF6B35] text-sm font-medium">{tag}</Text>
                        <X size={12} color="#FF6B35" />
                    </TouchableOpacity>
                ))}

                <TextInput
                    className="flex-1 min-w-[100px] text-white p-1 text-base placeholder-zinc-500"
                    placeholder={tags.length === 0 ? placeholder : ''}
                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    value={inputValue}
                    onChangeText={onChangeText}
                    onSubmitEditing={onSubmitEditing}
                    submitBehavior="submit"
                    returnKeyType="done"
                    {...props}
                />
            </View>
            {error && <Text className="text-red-500 text-xs ml-1">{error}</Text>}
        </View>
    );
};
