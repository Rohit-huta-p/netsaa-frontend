import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';

interface LeaveEventModalProps {
    visible: boolean;
    onDismiss: () => void;
    onDiscard: () => void;
}

export const LeaveEventModal: React.FC<LeaveEventModalProps> = ({
    visible,
    onDismiss,
    onDiscard,
}) => {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onDismiss}
        >
            <View className="flex-1 bg-black/80 justify-center items-center px-6">
                <View className="bg-zinc-900 w-full max-w-sm rounded-2xl p-6 border border-zinc-800">
                    <Text className="text-xl font-bold text-white mb-2 text-center">
                        Leave Event Creation?
                    </Text>
                    <Text className="text-zinc-400 text-center mb-8 leading-relaxed">
                        You have unsaved changes. What would you like to do?
                    </Text>

                    <View className="gap-3">
                        <TouchableOpacity
                            onPress={onDiscard}
                            className="w-full py-3.5 bg-red-500/10 rounded-xl items-center border border-red-500/20 active:bg-red-500/20"
                        >
                            <Text className="text-red-400 font-semibold">Discard</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onDismiss}
                            className="w-full py-3 items-center mt-2"
                        >
                            <Text className="text-zinc-500 font-medium">Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};
