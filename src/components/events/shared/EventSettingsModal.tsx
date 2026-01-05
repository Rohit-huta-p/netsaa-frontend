import React from 'react';
import { View, Text, Modal, TouchableOpacity, Pressable } from 'react-native';
import { Trash2, Edit2, EyeOff, Eye, X } from 'lucide-react-native';
import { IEvent } from '@/types/event';

interface EventSettingsModalProps {
    visible: boolean;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onToggleStatus: () => void;
    event: IEvent;
}

export const EventSettingsModal: React.FC<EventSettingsModalProps> = ({
    visible,
    onClose,
    onEdit,
    onDelete,
    onToggleStatus,
    event
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable className="flex-1 bg-black/50 justify-center items-center px-4" onPress={onClose}>
                <Pressable className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-xl" onPress={(e) => e.stopPropagation()}>
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-lg font-bold text-gray-900">Event Settings</Text>
                        <TouchableOpacity onPress={onClose} className="p-1 rounded-full active:bg-gray-100">
                            <X size={20} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                    <View className="space-y-4">
                        {/* Edit Action */}
                        <TouchableOpacity
                            onPress={onEdit}
                            className="flex-row items-center p-3 rounded-xl bg-gray-50 active:bg-gray-100"
                        >
                            <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                                <Edit2 size={20} color="#3B82F6" />
                            </View>
                            <View>
                                <Text className="font-semibold text-gray-900">Edit Details</Text>
                                <Text className="text-xs text-gray-500">Update event information</Text>
                            </View>
                        </TouchableOpacity>

                        {/* Toggle Status Action */}
                        <TouchableOpacity
                            onPress={onToggleStatus}
                            className="flex-row items-center p-3 rounded-xl bg-gray-50 active:bg-gray-100"
                        >
                            <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${event.status === 'published' ? 'bg-orange-100' : 'bg-green-100'}`}>
                                {event.status === 'published' ? (
                                    <EyeOff size={20} color="#F97316" />
                                ) : (
                                    <Eye size={20} color="#22C55E" />
                                )}
                            </View>
                            <View>
                                <Text className="font-semibold text-gray-900">
                                    {event.status === 'published' ? 'Unpublish Event' : 'Publish Event'}
                                </Text>
                                <Text className="text-xs text-gray-500">
                                    {event.status === 'published' ? 'Hide from public view' : 'Make visible to everyone'}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {/* Delete Action */}
                        <TouchableOpacity
                            onPress={onDelete}
                            className="flex-row items-center p-3 rounded-xl bg-red-50 active:bg-red-100"
                        >
                            <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-3">
                                <Trash2 size={20} color="#EF4444" />
                            </View>
                            <View>
                                <Text className="font-semibold text-red-600">Delete Event</Text>
                                <Text className="text-xs text-red-400">Permanently remove this event</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};
