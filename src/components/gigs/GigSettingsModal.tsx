import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Pressable, ActivityIndicator } from 'react-native';
import { Trash2, Edit2, EyeOff, Eye, X, AlertTriangle } from 'lucide-react-native';
import { Gig } from '@/types/gig';
import { useUpdateGig, useDeleteGig } from '@/hooks/useGigs';
import { useRouter } from 'expo-router';

interface GigSettingsModalProps {
    visible: boolean;
    onClose: () => void;
    gig: Gig;
}

interface ConfirmDialogProps {
    visible: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
    onCancel: () => void;
    destructive?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    visible,
    title,
    message,
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
    destructive = false
}) => (
    <Modal visible={visible} transparent animationType="fade">
        <Pressable className="flex-1 bg-black/80 justify-center items-center px-6" onPress={onCancel}>
            <Pressable
                className="bg-black w-full max-w-sm rounded-3xl p-8 border border-white/10"
                onPress={(e) => e.stopPropagation()}
            >
                <View className="items-center mb-6">
                    <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${destructive ? 'bg-red-500/10' : 'bg-blue-500/10'}`}>
                        <AlertTriangle size={32} color={destructive ? '#EF4444' : '#3B82F6'} />
                    </View>
                    <Text className="text-2xl font-black text-white text-center mb-3">{title}</Text>
                    <Text className="text-zinc-400 text-center leading-relaxed">{message}</Text>
                </View>

                <View className="gap-3">
                    <TouchableOpacity
                        onPress={onConfirm}
                        className={`py-4 rounded-2xl items-center ${destructive ? 'bg-red-500' : 'bg-blue-500'}`}
                    >
                        <Text className="text-white font-black text-base">{confirmText}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={onCancel}
                        className="py-4 rounded-2xl items-center bg-zinc-900 border border-white/10"
                    >
                        <Text className="text-white font-semibold">{cancelText}</Text>
                    </TouchableOpacity>
                </View>
            </Pressable>
        </Pressable>
    </Modal>
);

export const GigSettingsModal: React.FC<GigSettingsModalProps> = ({
    visible,
    onClose,
    gig,
}) => {
    const router = useRouter();
    const updateGigMutation = useUpdateGig();
    const deleteGigMutation = useDeleteGig();
    const [isProcessing, setIsProcessing] = useState(false);

    // Confirmation dialog state
    const [confirmDialog, setConfirmDialog] = useState<{
        visible: boolean;
        title: string;
        message: string;
        confirmText: string;
        onConfirm: () => void;
        destructive?: boolean;
    }>({
        visible: false,
        title: '',
        message: '',
        confirmText: '',
        onConfirm: () => { },
        destructive: false
    });

    const handleEdit = () => {
        onClose();
        router.push({
            pathname: '/(app)/create',
            params: { gigId: gig._id }
        });
    };

    const handleToggleStatus = () => {
        const newStatus = gig.status === 'published' ? 'draft' : 'published';
        const actionText = newStatus === 'published' ? 'publish' : 'unpublish';

        setConfirmDialog({
            visible: true,
            title: `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Gig`,
            message: `Are you sure you want to ${actionText} this gig?`,
            confirmText: actionText.charAt(0).toUpperCase() + actionText.slice(1),
            destructive: newStatus === 'draft',
            onConfirm: async () => {
                setConfirmDialog({ ...confirmDialog, visible: false });
                setIsProcessing(true);
                try {
                    console.log('Updating gig status to:', newStatus);
                    await updateGigMutation.mutateAsync({
                        id: gig._id!,
                        payload: { status: newStatus as 'draft' | 'published' }
                    });
                    console.log('✅ Status updated successfully');
                    onClose();
                } catch (error: any) {
                    console.error('❌ Status update error:', error);
                    alert(`Failed to ${actionText} gig: ${error.message || 'Unknown error'}`);
                } finally {
                    setIsProcessing(false);
                }
            }
        });
    };

    const handleDelete = () => {
        console.log('🗑️ Showing delete confirmation');
        setConfirmDialog({
            visible: true,
            title: 'Delete Gig',
            message: 'Are you sure you want to permanently delete this gig? This action cannot be undone.',
            confirmText: 'Delete',
            destructive: true,
            onConfirm: async () => {
                console.log('✅ Delete confirmed - starting deletion');
                setConfirmDialog({ ...confirmDialog, visible: false });
                setIsProcessing(true);
                try {
                    console.log('Calling deleteGigMutation with ID:', gig._id);
                    await deleteGigMutation.mutateAsync(gig._id!);
                    console.log('✅ Gig deleted successfully');
                    onClose();
                    router.replace('/(app)/dashboard');
                } catch (error: any) {
                    console.error('❌ Delete error:', error);
                    alert(`Failed to delete gig: ${error.message || 'Unknown error'}`);
                } finally {
                    setIsProcessing(false);
                }
            }
        });
    };

    return (
        <>
            <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
                <Pressable className="flex-1 bg-black/80 justify-center items-center px-6" onPress={onClose}>
                    <Pressable
                        className="bg-black w-full max-w-md rounded-[2rem] p-8 border border-white/10"
                        onPress={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <View className="flex-row justify-between items-center mb-8">
                            <Text className="text-2xl font-black text-white tracking-tight">Gig Settings</Text>
                            <TouchableOpacity
                                onPress={onClose}
                                className="w-10 h-10 rounded-full bg-zinc-900/60 border border-white/10 items-center justify-center"
                            >
                                <X size={18} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>

                        <View className="space-y-4">
                            {/* Edit Action */}
                            <TouchableOpacity
                                onPress={handleEdit}
                                disabled={isProcessing}
                                activeOpacity={0.7}
                                className="flex-row items-center p-6 rounded-[2rem] bg-zinc-900/40 border border-white/10 active:bg-zinc-900/60"
                            >
                                <View className="w-12 h-12 rounded-2xl bg-blue-500/10 items-center justify-center mr-4">
                                    <Edit2 size={20} color="#3B82F6" />
                                </View>
                                <View className="flex-1">
                                    <Text className="font-black text-white tracking-tight">Edit Details</Text>
                                    <Text className="text-xs text-zinc-500 font-light mt-1">
                                        Update gig information
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            {/* Toggle Status Action */}
                            <TouchableOpacity
                                onPress={handleToggleStatus}
                                disabled={isProcessing}
                                activeOpacity={0.7}
                                className="flex-row items-center p-6 rounded-[2rem] bg-zinc-900/40 border border-white/10 active:bg-zinc-900/60"
                            >
                                <View
                                    className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${gig.status === 'published' ? 'bg-orange-500/10' : 'bg-emerald-500/10'
                                        }`}
                                >
                                    {gig.status === 'published' ? (
                                        <EyeOff size={20} color="#F97316" />
                                    ) : (
                                        <Eye size={20} color="#10B981" />
                                    )}
                                </View>
                                <View className="flex-1">
                                    <Text className="font-black text-white tracking-tight">
                                        {gig.status === 'published' ? 'Unpublish Gig' : 'Publish Gig'}
                                    </Text>
                                    <Text className="text-xs text-zinc-500 font-light mt-1">
                                        {gig.status === 'published'
                                            ? 'Hide from public view'
                                            : 'Make visible to everyone'}
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            {/* Delete Action */}
                            <TouchableOpacity
                                onPress={handleDelete}
                                disabled={isProcessing}
                                activeOpacity={0.7}
                                className="flex-row items-center p-6 rounded-[2rem] bg-red-500/10 border border-red-500/20 active:bg-red-500/20"
                            >
                                <View className="w-12 h-12 rounded-2xl bg-red-500/10 items-center justify-center mr-4">
                                    <Trash2 size={20} color="#EF4444" />
                                </View>
                                <View className="flex-1">
                                    <Text className="font-black text-red-400 tracking-tight">Delete Gig</Text>
                                    <Text className="text-xs text-red-400/60 font-light mt-1">
                                        Permanently remove this gig
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Loading Overlay */}
                        {isProcessing && (
                            <View className="absolute inset-0 bg-black/60 rounded-[2rem] items-center justify-center">
                                <View className="bg-zinc-900 p-6 rounded-2xl border border-white/10 items-center">
                                    <ActivityIndicator size="large" color="#3B82F6" />
                                    <Text className="text-white mt-4 font-medium">Processing...</Text>
                                </View>
                            </View>
                        )}
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Confirmation Dialog */}
            <ConfirmDialog
                visible={confirmDialog.visible}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmText={confirmDialog.confirmText}
                cancelText="Cancel"
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog({ ...confirmDialog, visible: false })}
                destructive={confirmDialog.destructive}
            />
        </>
    );
};