import React from 'react';
import { View, Text, Modal, TouchableOpacity, Pressable } from 'react-native';
import { Trash2, Edit2, EyeOff, Eye, X, ChevronRight } from 'lucide-react-native';
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
            <TouchableOpacity
                activeOpacity={1}
                onPress={onClose}
                style={{
                    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
                    alignItems: 'center', justifyContent: 'center',
                    padding: 24,
                }}
            >
                <TouchableOpacity activeOpacity={1} style={{
                    width: '100%', maxWidth: 380,
                    backgroundColor: '#18181b',
                    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
                    overflow: 'hidden',
                }}>
                    {/* Modal Header */}
                    <View style={{
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                        paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
                        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
                    }}>
                        <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: -0.3 }}>
                            Event Settings
                        </Text>
                        <TouchableOpacity
                            onPress={onClose}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={{
                                width: 30, height: 30, borderRadius: 15,
                                backgroundColor: 'rgba(255,255,255,0.06)',
                                alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            <X size={14} color="#71717a" />
                        </TouchableOpacity>
                    </View>

                    {/* Options */}
                    <View style={{ paddingVertical: 8 }}>
                        {/* Edit Action */}
                        <TouchableOpacity
                            activeOpacity={0.6}
                            onPress={() => {
                                onClose();
                                setTimeout(() => onEdit(), 350);
                            }}
                            style={{
                                flexDirection: 'row', alignItems: 'center',
                                paddingVertical: 14, paddingHorizontal: 20, gap: 14,
                            }}
                        >
                            <View style={{
                                width: 34, height: 34, borderRadius: 10,
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Edit2 size={16} color="#a1a1aa" />
                            </View>
                            <Text style={{ flex: 1, color: '#e4e4e7', fontSize: 15, fontWeight: '500' }}>
                                Edit Details
                            </Text>
                            <ChevronRight size={16} color="#52525b" />
                        </TouchableOpacity>

                        <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginHorizontal: 20 }} />

                        {/* Toggle Status Action */}
                        <TouchableOpacity
                            activeOpacity={0.6}
                            onPress={() => {
                                onClose();
                                setTimeout(() => onToggleStatus(), 150);
                            }}
                            style={{
                                flexDirection: 'row', alignItems: 'center',
                                paddingVertical: 14, paddingHorizontal: 20, gap: 14,
                            }}
                        >
                            <View style={{
                                width: 34, height: 34, borderRadius: 10,
                                backgroundColor: event.status === 'published' ? 'rgba(249,115,22,0.15)' : 'rgba(34,197,94,0.15)',
                                alignItems: 'center', justifyContent: 'center',
                            }}>
                                {event.status === 'published' ? (
                                    <EyeOff size={16} color="#f97316" />
                                ) : (
                                    <Eye size={16} color="#22c55e" />
                                )}
                            </View>
                            <Text style={{ flex: 1, color: '#e4e4e7', fontSize: 15, fontWeight: '500' }}>
                                {event.status === 'published' ? 'Unpublish Event' : 'Publish Event'}
                            </Text>
                            <ChevronRight size={16} color="#52525b" />
                        </TouchableOpacity>

                        <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginHorizontal: 20 }} />

                        {/* Delete Action */}
                        <TouchableOpacity
                            activeOpacity={0.6}
                            onPress={() => {
                                onClose();
                                setTimeout(() => onDelete(), 150);
                            }}
                            style={{
                                flexDirection: 'row', alignItems: 'center',
                                paddingVertical: 14, paddingHorizontal: 20, gap: 14,
                            }}
                        >
                            <View style={{
                                width: 34, height: 34, borderRadius: 10,
                                backgroundColor: 'rgba(239,68,68,0.15)',
                                alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Trash2 size={16} color="#ef4444" />
                            </View>
                            <Text style={{ flex: 1, color: '#ef4444', fontSize: 15, fontWeight: '500' }}>
                                Delete Event
                            </Text>
                            <ChevronRight size={16} color="#52525b" />
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};
