import React, { useState, useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { ChevronRight, ChevronDown, Check, Search, X } from 'lucide-react-native';

interface Option {
    label: string;
    value: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    icon?: React.ElementType;
    error?: string | boolean;
    placeholder?: string;
    label?: string;
    allowCustom?: boolean; // For "Other" functionality
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
    options,
    value,
    onChange,
    icon: Icon,
    error,
    placeholder = "Select...",
    label = "Select Option",
    allowCustom = false
}) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [customValue, setCustomValue] = useState('');
    const [isCustom, setIsCustom] = useState(false);

    // Filter options based on search
    const filteredOptions = useMemo(() => {
        return options.filter(opt =>
            opt.label.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [options, searchQuery]);

    // Handle initial custom state check
    React.useEffect(() => {
        const isKnownOption = options.some(opt => opt.value === value);
        if (value && !isKnownOption && allowCustom) {
            setIsCustom(true);
            setCustomValue(value);
        } else {
            setIsCustom(false);
        }
    }, [value, options, allowCustom]);

    const getDisplayLabel = () => {
        if (!value) return placeholder;
        const option = options.find(opt => opt.value === value);
        if (option) return option.label;
        return value; // Custom value
    };

    const handleSelectOption = (val: string) => {
        onChange(val);
        setModalVisible(false);
        setSearchQuery('');
        setIsCustom(false);
    };

    const handleCustomSubmit = () => {
        if (customValue.trim()) {
            onChange(customValue.trim());
            setModalVisible(false);
            setSearchQuery('');
        }
    };

    return (
        <View className="relative">
            {Icon && (
                <View className="absolute left-3 top-1/2 -translate-y-1/2 z-10 text-zinc-500">
                    <Icon size={18} color="#71717a" />
                </View>
            )}
            <TouchableOpacity
                onPress={() => setModalVisible(true)}
                className={`bg-zinc-900/50 border ${error ? 'border-red-500' : 'border-zinc-700'} rounded-xl py-3 pr-4 flex-row items-center justify-between ${Icon ? 'pl-10' : 'pl-4'}`}
            >
                <Text className={`${value ? 'text-zinc-100' : 'text-zinc-500'}`}>{getDisplayLabel()}</Text>
                <ChevronRight size={16} color="#71717a" className="rotate-90" />
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    className="flex-1 justify-end bg-black/80"
                >
                    <View className="bg-zinc-900 rounded-t-3xl p-6 h-[80%] w-full">
                        {/* Header */}
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-xl font-bold text-white">{label}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text className="text-indigo-400 font-medium">Close</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Search Bar */}
                        <View className="flex-row items-center bg-zinc-800 rounded-xl px-3 py-2.5 mb-4">
                            <Search size={18} color="#71717a" />
                            <TextInput
                                className="flex-1 ml-3 text-white text-base"
                                placeholder="Search..."
                                placeholderTextColor="#52525b"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoCorrect={false}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <X size={16} color="#71717a" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Custom Input Option if enabled and searching */}
                        {allowCustom && searchQuery.length > 0 && filteredOptions.length === 0 && (
                            <TouchableOpacity
                                className="flex-row items-center justify-between py-4 border-b border-zinc-800"
                                onPress={() => {
                                    onChange(searchQuery);
                                    setModalVisible(false);
                                    setSearchQuery('');
                                }}
                            >
                                <View>
                                    <Text className="text-base text-indigo-400 font-semibold">
                                        Use "{searchQuery}"
                                    </Text>
                                    <Text className="text-sm text-zinc-500">
                                        Select this as a custom value
                                    </Text>
                                </View>
                                <ChevronRight size={16} color="#71717a" />
                            </TouchableOpacity>
                        )}

                        <FlatList
                            data={filteredOptions}
                            keyExtractor={(item) => item.value}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    className={`flex-row items-center justify-between py-4 border-b border-zinc-800 ${item.value === value ? 'bg-zinc-800/50 -mx-6 px-6' : ''}`}
                                    onPress={() => handleSelectOption(item.value)}
                                >
                                    <Text className={`text-base ${item.value === value ? 'text-indigo-400 font-semibold' : 'text-zinc-300'}`}>
                                        {item.label}
                                    </Text>
                                    {item.value === value && <Check size={20} color="#818cf8" />}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                !allowCustom || searchQuery.length === 0 ? (
                                    <View className="py-8 items-center">
                                        <Text className="text-zinc-500">No options found</Text>
                                    </View>
                                ) : null
                            }
                            ListFooterComponent={
                                allowCustom ? (
                                    <TouchableOpacity
                                        className="mt-4 pt-4 border-t border-zinc-800 flex-row items-center"
                                        onPress={() => {
                                            setIsCustom(true);
                                            setSearchQuery(''); // Clear search to show custom input cleanly if we were searching
                                            // Ideally we might want to just select "Other" and prompt for input, 
                                            // but for now let's use the search query as the way to add custom if list is empty,
                                            // OR explicitly provide an "Other" button if the user wants to type something not in search.
                                            // Let's keep it simple: "Other" button triggers custom input mode.
                                        }}
                                    >
                                        <View className="bg-zinc-800 p-2 rounded-full mr-3">
                                            <Search size={16} color="#a1a1aa" />
                                        </View>
                                        <Text className="text-zinc-400">Can't find what you're looking for? Type it above or select to add custom.</Text>
                                    </TouchableOpacity>
                                ) : null
                            }
                        />
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
};
