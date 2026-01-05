import React from 'react';
import { View, Text, Modal, TouchableOpacity, Pressable } from 'react-native';
import { AlertTriangle, AlertCircle } from 'lucide-react-native';

interface ConfirmationModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    visible,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    isDestructive = false
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable className="flex-1 bg-black/50 justify-center items-center px-6" onPress={onClose}>
                <Pressable className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl" onPress={(e) => e.stopPropagation()}>
                    <View className="items-center mb-4">
                        <View className={`w-12 h-12 rounded-full items-center justify-center mb-4 ${isDestructive ? 'bg-red-100' : 'bg-blue-100'}`}>
                            {isDestructive ? (
                                <AlertCircle size={24} color="#EF4444" />
                            ) : (
                                <AlertTriangle size={24} color="#3B82F6" />
                            )}
                        </View>
                        <Text className="text-xl font-bold text-gray-900 text-center mb-2">{title}</Text>
                        <Text className="text-center text-gray-500 leading-5">{message}</Text>
                    </View>

                    <View className="flex-row gap-3">
                        <TouchableOpacity
                            onPress={onClose}
                            className="flex-1 py-3 rounded-xl bg-gray-100 active:bg-gray-200"
                        >
                            <Text className="text-center font-semibold text-gray-700">{cancelText}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`flex-1 py-3 rounded-xl active:opacity-90 ${isDestructive ? 'bg-red-500' : 'bg-blue-600'}`}
                        >
                            <Text className="text-center font-semibold text-white">{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};
