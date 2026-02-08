import React from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput } from 'react-native';
import { X, MapPin } from 'lucide-react-native';

interface LocationPickerModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectLocation: (location: {
        latitude: number;
        longitude: number;
        address?: string;
        city?: string;
        state?: string;
        country?: string;
    }) => void;
    initialRegion?: any;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
    visible,
    onClose,
    onSelectLocation,
}) => {
    const [address, setAddress] = React.useState('');

    const handleManualSubmit = () => {
        // Mock location for manual entry
        onSelectLocation({
            latitude: 0,
            longitude: 0,
            address: address,
            city: address.split(',')[0] // Very naive city extraction
        });
        onClose();
    };

    return (
        <Modal visible={visible} animationType="fade" transparent={true}>
            <View className="flex-1 bg-black/80 items-center justify-center p-4">
                <View className="bg-zinc-900 w-full max-w-md p-6 rounded-2xl border border-white/10">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-white text-lg font-bold">Enter Location</Text>
                        <TouchableOpacity onPress={onClose} className="p-2 bg-zinc-800 rounded-full">
                            <X size={20} color="white" />
                        </TouchableOpacity>
                    </View>

                    <Text className="text-zinc-400 mb-4">
                        Map selection is currently optimized for mobile. Please enter your address manually.
                    </Text>

                    <View className="flex-row gap-2 mb-4">
                        <View className="flex-1 bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-3">
                            <TextInput
                                className="text-white"
                                placeholder="Enter address..."
                                placeholderTextColor="#71717a"
                                value={address}
                                onChangeText={setAddress}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={handleManualSubmit}
                        className="bg-[#FF6B35] py-3 rounded-xl items-center"
                    >
                        <Text className="text-white font-bold">Confirm Address</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};
