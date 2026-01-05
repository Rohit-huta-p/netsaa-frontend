import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

interface ChipProps {
    label: string;
    selected: boolean;
    onClick: () => void;
}

export const Chip: React.FC<ChipProps> = ({ label, selected, onClick }) => (
    <TouchableOpacity
        onPress={onClick}
        className={`
      px-4 py-2 rounded-full border mr-2 mb-2
      ${selected
                ? 'bg-indigo-600 border-indigo-500 shadow-indigo-500/25'
                : 'bg-zinc-800 border-zinc-700'}
    `}
    >
        <Text
            className={`text-sm font-medium ${selected ? 'text-white' : 'text-zinc-400'}`}
        >
            {label}
        </Text>
    </TouchableOpacity>
);
