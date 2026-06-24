// src/components/profile/ProfileHeader.tsx
import React, { useState } from "react";
import noAvatar from "@/assets/no-avatar.jpg";
import Animated from "react-native-reanimated";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    Linking,
    Platform,
    StyleSheet,
} from "react-native";
import {
    MapPin,
    Share2,
    Edit3,
    UserPlus,
    Check,
    Camera,
    Settings,
    Globe,
    Clock,
    AlertTriangle,
    X,
} from "lucide-react-native";
import { ProfileHeaderProps } from "./types";
import { useProfileUiStore } from "@/stores/profileUiStore";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ animatedStyle,
    isOwner,
    fullName,
    headline,
    artistType,
    location,
    profileImageUrl,
    stats,
    isEditable = false,
    onSharePress,
    connectionStatus = 'none',
    isConnectionLoading = false,
    onConnectPress,
    isOrganizer = false,
    organizationName,
    organizationWebsite,
}) => {
    const { openSheet } = useProfileUiStore();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const showConnectButton = !isEditable && onConnectPress;

    const handleButtonPress = () => {
        if (connectionStatus === 'pending' || connectionStatus === 'connected') {
            setShowConfirmModal(true);
        } else {
            onConnectPress?.();
        }
    };

    const handleConfirmAction = () => {
        setShowConfirmModal(false);
        onConnectPress?.();
    };

    const isWithdraw = connectionStatus === 'pending';
    const isRemove = connectionStatus === 'connected';

    const modalTitle = isWithdraw ? 'Withdraw Request' : 'Remove Connection';
    const modalDescription = isWithdraw
        ? 'Are you sure you want to withdraw this connection request? You can send another request later.'
        : 'Are you sure you want to remove this connection? You will no longer be connected.';
    const modalActionLabel = isWithdraw ? 'Withdraw' : 'Remove';

    return (
        <>
            <Animated.View style={[animatedStyle, {
                backgroundColor: 'rgba(18, 18, 24, 0.85)',
                paddingTop: 32,
                paddingBottom: 24,
                paddingHorizontal: 20,
                marginTop: 20,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
                position: 'relative',
            }]}>
                {/* Settings Dropdown Container */}
                {isEditable && (
                    <View className="absolute top-8 right-5 z-50 flex-row gap-2">
                        <TouchableOpacity
                            onPress={() => setShowDropdown(!showDropdown)}
                            className="w-9 h-9 items-center justify-center rounded-xl bg-white/5 border border-white/10"
                        >
                            <Settings size={15} color="#a1a1aa" />
                        </TouchableOpacity>

                        {showDropdown && (
                            <View className="absolute top-14 right-0 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg overflow-hidden py-1">
                                <TouchableOpacity
                                    onPress={() => {
                                        setShowDropdown(false);
                                        openSheet('header');
                                    }}
                                    className="flex-row items-center gap-3 px-4 py-3 border-b border-zinc-800/50"
                                >
                                    <Edit3 size={16} color="#a1a1aa" />
                                    <Text className="text-zinc-300 font-medium">Edit Profile</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => {
                                        setShowDropdown(false);
                                        router.push('/settings');
                                    }}
                                    className="flex-row items-center gap-3 px-4 py-3"
                                >
                                    <Settings size={16} color="#a1a1aa" />
                                    <Text className="text-zinc-300 font-medium">More Settings</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                <View className="flex-col items-center w-full">
                    {/* Top Row: Avatar and Camera Icon */}
                    <View className="flex-row items-center justify-center mb-4">
                        <View className="relative">
                            <View className="w-[80px] h-[80px] rounded-full overflow-hidden bg-zinc-800">
                                <Image
                                    source={profileImageUrl ? { uri: profileImageUrl } : noAvatar}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' } as any}
                                    resizeMode="cover"
                                />
                            </View>

                            {/* Camera Icon Button */}
                            {isEditable && (
                                <TouchableOpacity
                                    onPress={() => openSheet('media')}
                                    className="w-8 h-8 absolute -bottom-1 -right-1 rounded-full border-2 border-zinc-950 bg-organizer-500 items-center justify-center z-50"
                                >
                                    <Camera size={18} color="#d5d5d5ff" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>


                    {/* Artist Type */}
                    {artistType && (
                        <View className="px-3 py-1 bg-zinc-800 rounded-full mb-2">
                            <Text className="text-zinc-400 text-[10px] font-semibold uppercase tracking-widest">
                                {artistType}
                            </Text>
                        </View>
                    )}

                    {/* Name / Organization */}
                    <Text className="text-2xl font-bold text-white tracking-tight leading-none mb-2 text-center">
                        {isOrganizer ? organizationName : fullName}
                    </Text>

                    {/* Headline (Subtle) */}
                    {headline && (
                        <Text className="text-[13px] text-zinc-500 font-medium mb-3 text-center px-4 leading-relaxed">
                            {headline}
                        </Text>
                    )}

                    {/* Location & Website */}
                    <View className="flex-col items-center gap-1 mb-6">
                        <View className="flex-row items-center gap-1.5">
                            <MapPin size={12} color="#a1a1aa" />
                            <Text className="text-[13px] text-zinc-500 font-medium">
                                {location || (isEditable ? "Location" : "TBA")}
                            </Text>
                        </View>
                        {organizationWebsite && (
                            <TouchableOpacity onPress={() => Linking.openURL(organizationWebsite)} className="flex-row items-center gap-1.5 mt-1">
                                <Globe size={11} color="#a1a1aa" />
                                <Text className="text-[12px] text-emerald-400 font-medium opacity-80">
                                    {organizationWebsite.replace(/^https?:\/\//, '')}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    {/* Stats Row under Avatar */}
                    <View className="flex-row items-center gap-6 mb-4">
                        <View className="items-center">
                            <Text className="text-[16px] font-bold text-white">
                                {stats.events || 0}
                            </Text>
                            <Text className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">
                                GIGS
                            </Text>
                        </View>
                        <View className="w-[1px] h-6 bg-zinc-800" />
                        <View className="items-center">
                            <Text className="text-[16px] font-bold text-white">
                                {stats.connections || 0}
                            </Text>
                            <Text className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">
                                CONNECTIONS
                            </Text>
                        </View>
                    </View>


                    {/* Actions Row */}
                    <View className="flex-row items-center justify-center gap-3 w-full">
                        {showConnectButton && !isOwner && (
                            <TouchableOpacity
                                disabled={isConnectionLoading}
                                onPress={handleButtonPress}
                                className={`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl ${connectionStatus === 'connected' ? 'bg-emerald-500/20 border border-emerald-500/30' :
                                    connectionStatus === 'pending' ? 'bg-zinc-800 border border-zinc-700' : 'bg-white'
                                    }`}
                                activeOpacity={0.7}
                            >
                                {isConnectionLoading ? (
                                    <ActivityIndicator size="small" color={connectionStatus === 'none' ? "black" : "white"} />
                                ) : connectionStatus === 'connected' ? (
                                    <>
                                        <Check size={16} color="#10b981" />
                                        <Text className="text-emerald-500 font-semibold">Connected</Text>
                                    </>
                                ) : connectionStatus === 'pending' ? (
                                    <>
                                        <Clock size={16} color="#a1a1aa" />
                                        <Text className="text-zinc-400 font-semibold">Pending</Text>
                                    </>
                                ) : (
                                    <>
                                        <UserPlus size={16} color="black" />
                                        <Text className="text-black font-semibold">Connect</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            onPress={onSharePress}
                            className={`flex-row items-center justify-center gap-2 px-6 py-2 rounded-xl border border-zinc-700 bg-transparent`}
                        >
                            <Share2 size={16} color="#fff" />
                            <Text className="text-white text-xs font-semibold">Share Profile</Text>
                        </TouchableOpacity>

                        {isEditable && (
                            <TouchableOpacity
                                onPress={() => openSheet('header')}
                                className={`flex-row items-center justify-center gap-2 px-6 py-2 rounded-xl border border-zinc-700 bg-transparent`}
                            >
                                <Edit3 size={16} color="#fff" />
                                <Text className="text-white text-xs font-semibold">Edit Profile</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Animated.View>

            {/* Withdraw / Remove Confirmation Modal */}
            <Modal
                visible={showConfirmModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowConfirmModal(false)}
            >
                <View style={modalStyles.overlay}>
                    <View style={modalStyles.container}>
                        {/* Close button */}
                        <TouchableOpacity
                            onPress={() => setShowConfirmModal(false)}
                            style={modalStyles.closeButton}
                        >
                            <X size={18} color="#71717a" />
                        </TouchableOpacity>

                        {/* Icon */}
                        <View style={modalStyles.iconWrapper}>
                            <AlertTriangle size={28} color={isWithdraw ? '#f59e0b' : '#ef4444'} />
                        </View>

                        {/* Title */}
                        <Text style={modalStyles.title}>{modalTitle}</Text>

                        {/* Description */}
                        <Text style={modalStyles.description}>{modalDescription}</Text>

                        {/* Actions */}
                        <View style={modalStyles.actions}>
                            <TouchableOpacity
                                onPress={() => setShowConfirmModal(false)}
                                style={modalStyles.cancelButton}
                                activeOpacity={0.7}
                            >
                                <Text style={modalStyles.cancelText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleConfirmAction}
                                style={[modalStyles.confirmButton, { backgroundColor: isWithdraw ? '#f59e0b' : '#ef4444' }]}
                                activeOpacity={0.7}
                            >
                                {isConnectionLoading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={modalStyles.confirmText}>{modalActionLabel}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const modalStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: '85%',
        maxWidth: 360,
        backgroundColor: '#18181b',
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 4,
    },
    iconWrapper: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    description: {
        color: '#a1a1aa',
        fontSize: 13,
        lineHeight: 20,
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 8,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelText: {
        color: '#a1a1aa',
        fontWeight: '600',
        fontSize: 14,
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
});

export default ProfileHeader;

