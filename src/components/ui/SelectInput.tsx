import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, Platform } from 'react-native';
import { ChevronRight, ChevronDown, Check } from 'lucide-react-native';

interface Option {
    label: string;
    value: string;
}

interface SelectInputProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    icon?: React.ElementType;
}

export const SelectInput: React.FC<SelectInputProps> = ({ options, value, onChange, icon: Icon }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const selectedLabel = options.find(opt => opt.value === value)?.label || "Select...";

    return (
        <View className="relative">
            {Icon && (
                <View className="absolute left-3 top-1/2 -translate-y-1/2 z-10 text-zinc-500">
                    <Icon size={18} color="#71717a" />
                </View>
            )}
            <TouchableOpacity
                onPress={() => setModalVisible(true)}
                className={`bg-zinc-900/50 border border-zinc-700 rounded-xl py-3 pr-4 flex-row items-center justify-between ${Icon ? 'pl-10' : 'pl-4'}`}
            >
                <Text className="text-zinc-100">{selectedLabel}</Text>
                <ChevronRight size={16} color="#71717a" className="rotate-90" />
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-zinc-900 rounded-t-3xl p-6 min-h-[40%]">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-white">Select Option</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text className="text-indigo-400 font-medium">Close</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={options}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    className={`flex-row items-center justify-between py-4 border-b border-zinc-800 ${item.value === value ? 'bg-zinc-800/50 -mx-6 px-6' : ''}`}
                                    onPress={() => {
                                        onChange(item.value);
                                        setModalVisible(false);
                                    }}
                                >
                                    <Text className={`text-base ${item.value === value ? 'text-indigo-400 font-semibold' : 'text-zinc-300'}`}>
                                        {item.label}
                                    </Text>
                                    {item.value === value && <Check size={20} color="#818cf8" />}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
};
