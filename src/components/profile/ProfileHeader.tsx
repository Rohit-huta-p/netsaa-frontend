// src/components/profile/ProfileHeader.tsx
import React, { useState, useEffect } from "react";
import noAvatar from "@/assets/no-avatar.jpg";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
} from "react-native";
import {
    MapPin,
    Share2,
    Edit3,
    UserPlus,
    Check,
    UserMinus,
    ArrowDown,
    Camera,
} from "lucide-react-native";
import { ProfileHeaderProps } from "./types";
import { useProfileUiStore } from "@/stores/profileUiStore";
import { useAuthStore } from "@/stores/authStore";
import authService from "@/services/authService";

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
    fullName,
    artistType,
    location,
    profileImageUrl,
    stats,
    isDesktop,
    isEditable = false,
    onSharePress,
    connectionStatus = 'none',
    isConnectionLoading = false,
    onConnectPress,
}) => {
    const { activeEditSection, setEditSection, openSheet, setSaving, setSectionError } = useProfileUiStore();
    const { user, setAuth, accessToken } = useAuthStore();
    const [showDropdown, setShowDropdown] = useState(false);

    const isHeaderEditing = activeEditSection === 'header' && isEditable;

    // Local edit state
    const [editName, setEditName] = useState(fullName || "");
    const [editArtistType, setEditArtistType] = useState(artistType || "");
    const [editLocation, setEditLocation] = useState(location || "");

    // Reset when exiting edit mode
    useEffect(() => {
        if (!activeEditSection) {
            setEditName(fullName || "");
            setEditArtistType(artistType || "");
            setEditLocation(location || "");
        }
    }, [activeEditSection, fullName, artistType, location]);

    const isDirty =
        editName !== (fullName || "") ||
        editArtistType !== (artistType || "") ||
        editLocation !== (location || "");

    const handleSave = async () => {
        setSaving('header');
        try {
            const payload = {
                displayName: editName,
                artistType: editArtistType,
                location: editLocation,
            };
            const updatedUser = await authService.updateProfile(payload);
            if (user) {
                setAuth({ user: { ...user, ...updatedUser }, accessToken: accessToken || '' });
                setEditSection(null);
            }
        } catch (err: any) {
            setSectionError('header', err?.message || 'Failed to save');
        } finally {
            setSaving(null);
        }
    };

    const handleCancel = () => {
        setEditName(fullName || "");
        setEditArtistType(artistType || "");
        setEditLocation(location || "");
        setEditSection(null);
    };

    const showConnectButton = !isEditable && onConnectPress;

    return (
        <View className="relative pt-12 pb-8 border-b px-6 py-10">
            <View className={`flex-col ${isDesktop ? 'md:flex-row' : ''} items-center md:items-start gap-10 bg-zinc-900/80 rounded-2xl py-6 px-4`}>
                {/* Avatar */}
                <View className="relative">
                    <View className=" w-32 h-32 md:w-44 md:h-44 rounded-full overflow-hidden border border-white/10 relative">
                        <Image
                            source={profileImageUrl ? { uri: profileImageUrl } : noAvatar}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' } as any}
                            className="rounded-full bg-gray-800"
                            resizeMode="cover"
                        />
                    </View>
                    {/* Available Tag */}
                    {isEditable && (
                        <View className="absolute -bottom-2 -right-2 bg-green-500 px-2 py-0.5 rounded-lg border-2 border-black">
                            <Text className="text-black font-black text-[8px] uppercase tracking-tighter">Available</Text>
                        </View>
                    )}
                    {/* Photo edit overlay */}
                    {isEditable && (
                        <TouchableOpacity
                            onPress={() => openSheet('media')}
                            style={{
                                position: 'absolute',
                                bottom: 8,
                                left: 8,
                                width: 32,
                                height: 32,
                                borderRadius: 16,
                                backgroundColor: 'rgba(234,105,139,0.9)',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 2,
                                borderColor: '#000',
                            }}
                        >
                            <Camera size={14} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Info */}
                <View className="flex-1 space-y-3">
                    <View className="flex-row items-center justify-center lg:justify-start gap-3">
                        {/* <View className="bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-full">
                            <Text className="text-pink-500 text-[9px] font-bold uppercase tracking-widest">Verified Artist</Text>
                        </View> */}
                        {isHeaderEditing ? (
                            <TextInput
                                value={editArtistType}
                                onChangeText={setEditArtistType}
                                placeholder="YOUR ROLE"
                                placeholderTextColor="#52525b"
                                style={{
                                    color: '#a1a1aa',
                                    fontSize: 9,
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    letterSpacing: 2,
                                    borderBottomWidth: 1,
                                    borderBottomColor: 'rgba(234,105,139,0.3)',
                                    paddingBottom: 2,
                                    paddingHorizontal: 4,
                                    minWidth: 80,
                                }}
                            />
                        ) : artistType ? (
                            <Text className="text-xs bg-buttons-apply border border-buttons-apply text-white italic px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">{artistType}</Text>
                        ) : null}
                    </View>

                    <View className="flex-col items-center md:items-start">
                        {isHeaderEditing ? (
                            <>
                                <TextInput
                                    value={editName}
                                    onChangeText={setEditName}
                                    placeholder="YOUR NAME"
                                    placeholderTextColor="#52525b"
                                    style={{
                                        fontSize: 32,
                                        fontWeight: '900',
                                        fontStyle: 'italic',
                                        color: '#fff',
                                        textTransform: 'uppercase',
                                        letterSpacing: -0.5,
                                        borderBottomWidth: 2,
                                        borderBottomColor: 'rgba(234,105,139,0.4)',
                                        paddingBottom: 4,
                                        marginBottom: 6,
                                        width: '100%',
                                    }}
                                />
                                <View className="flex-row items-center gap-2">
                                    <MapPin size={18} color="#a1a1aa" />
                                    <TextInput
                                        value={editLocation}
                                        onChangeText={setEditLocation}
                                        placeholder="City, Country"
                                        placeholderTextColor="#52525b"
                                        style={{
                                            fontSize: 18,
                                            fontWeight: '500',
                                            fontStyle: 'italic',
                                            color: '#a1a1aa',
                                            borderBottomWidth: 1,
                                            borderBottomColor: 'rgba(234,105,139,0.3)',
                                            paddingBottom: 4,
                                            flex: 1,
                                        }}
                                    />
                                </View>
                            </>
                        ) : (
                            <>
                                <Text className="text-4xl md:text-5xl font-black tracking-tight text-white italic uppercase leading-none mb-1">
                                    {fullName || "YOUR NAME"}
                                </Text>
                                <View className="flex-row items-center gap-1.5 mt-1">
                                    <MapPin size={18} color="#a1a1aa" />
                                    <Text className="text-lg md:text-xl text-zinc-400 font-medium italic">
                                        {location || (isEditable ? "Add Location" : "TBA")}
                                    </Text>
                                </View>
                            </>
                        )}
                    </View>

                    {/* Save / Cancel buttons (inline, under the fields) */}
                    {isHeaderEditing && isDirty && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8 }}>
                            <TouchableOpacity
                                onPress={handleCancel}
                                style={{
                                    paddingHorizontal: 12,
                                    paddingVertical: 8,
                                    borderRadius: 8,
                                    borderWidth: 1,
                                    borderColor: 'rgba(255,255,255,0.1)',
                                }}
                            >
                                <Text style={{ color: '#a1a1aa', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSave}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 6,
                                    paddingHorizontal: 12,
                                    paddingVertical: 8,
                                    borderRadius: 8,
                                    backgroundColor: '#ec4899',
                                    borderWidth: 1,
                                    borderColor: '#db2777',
                                }}
                            >
                                <Check size={12} color="#fff" />
                                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Stats Bar */}
                    <View className="flex-row flex-wrap items-center md:items-start justify-center md:justify-start gap-6 pt-6">
                        <View className="flex flex-col items-center gap-1">
                            <Text className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Base</Text>
                            <Text className="text-[15px] text-white font-black italic">
                                {(isHeaderEditing ? editLocation : location) ? (isHeaderEditing ? editLocation : location)!.charAt(0).toUpperCase() + (isHeaderEditing ? editLocation : location)!.slice(1) : "TBA"}
                            </Text>
                        </View>
                        <View className="flex flex-col items-center gap-1">
                            <Text className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Connections</Text>
                            <Text className="text-[15px] text-white font-black italic">{stats.connections}</Text>
                        </View>
                    </View>
                </View>

                {/* Actions */}
                <View className={`flex-row ${isEditable ? 'absolute right-5 top-4' : ''} gap-2 items-center ${isDesktop ? 'w-auto' : ''}`}>
                    {/* Edit Header Button - shown on own profile */}
                    {isEditable && (
                        <TouchableOpacity
                            onPress={() => isHeaderEditing ? setEditSection(null) : setEditSection('header')}
                            style={{
                                height: 48,
                                width: 48,
                                borderRadius: 8,
                                alignItems: 'center',
                                justifyContent: 'center',
                                // backgroundColor: 'rgba(255,255,255,0.05)',
                                // borderWidth: 1,
                                // borderColor: 'rgba(255,255,255,0.1)',
                            }}
                        >
                            <Edit3 size={16} color={isHeaderEditing ? "#ea698b" : "#fff"} />
                        </TouchableOpacity>
                    )}
                    {/* Connect Button - shown on other people's profiles */}
                    {showConnectButton && (
                        <View className="relative flex-row  z-50">

                            <View

                                className={`flex-row items-center px-2 py-1 rounded-l-xl border ${connectionStatus === 'connected' || connectionStatus === 'pending'
                                    ? "bg-white/5 border-white/20"
                                    : "bg-white border-white"
                                    }`}
                            >
                                {isConnectionLoading ? (
                                    <ActivityIndicator size="small" color={connectionStatus === 'none' ? "black" : "white"} />
                                ) : connectionStatus === 'connected' ? (
                                    <View className="flex-row items-center gap-1">
                                        <Check size={16} color="#10b981" />
                                        <Text className="text-emerald-500 font-bold text-xs">Connected</Text>

                                    </View>
                                ) : connectionStatus === 'pending' ? (
                                    <View className="flex-row items-center gap-1">
                                        <Check size={16} color="#9ca3af" />
                                        <Text className="text-gray-400 font-bold text-xs">Pending</Text>
                                    </View>
                                ) : (
                                    <View className="flex-row items-center gap-1">
                                        <UserPlus size={16} color="black" />
                                        <Text className="text-black font-bold text-xs">Connect</Text>
                                    </View>
                                )}
                            </View>
                            <TouchableOpacity
                                disabled={connectionStatus === 'pending' || isConnectionLoading}
                                activeOpacity={0.8} onPress={connectionStatus === 'connected' ? () => setShowDropdown(!showDropdown) : onConnectPress} className={`flex-row items-center px-1 py-2 rounded-r-xl border ${connectionStatus === 'connected' || connectionStatus === 'pending'
                                    ? "bg-white/5 border-white/20"
                                    : "bg-white border-white"
                                    }`}>
                                <ArrowDown size={16} color="#aaaaaaff" />
                            </TouchableOpacity>
                            {/* Dropdown Menu */}
                            {showDropdown && connectionStatus === 'connected' && (
                                <View className="absolute top-full mt-2 right-0 w-48 bg-zinc-800 border border-white/10 rounded-xl overflow-hidden shadow-xl z-[100]">
                                    <TouchableOpacity
                                        onPress={() => {
                                            setShowDropdown(false);
                                            onConnectPress?.();
                                        }}
                                        className="flex-row items-center gap-3 px-4 py-3 active:bg-white/5"
                                    >
                                        <UserMinus size={16} color="#ef4444" />
                                        <Text className="text-red-500 font-medium">Remove Connection</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    )}
                    <TouchableOpacity
                        onPress={onSharePress}
                        className="h-12 w-12 rounded-lg items-center justify-center "
                    >
                        <Share2 size={16} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default ProfileHeader;
