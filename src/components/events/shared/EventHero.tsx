import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Heart, Settings, Share2 } from 'lucide-react-native';
import { IEvent } from '@/types/event';
import eventService from '@/services/eventService';

interface EventHeroProps {
    onSettingsPress?: () => void;
    event: IEvent;
    isOrganizer?: boolean;
    isSaved?: boolean; // Initial saved state
    onSaveToggle?: (saved: boolean) => void; // Callback when save state changes
}

export const EventHero: React.FC<EventHeroProps> = ({
    onSettingsPress,
    event,
    isOrganizer,
    isSaved: initialSaved = false,
    onSaveToggle
}) => {
    const [isSaved, setIsSaved] = useState(initialSaved);
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveToggle = async () => {
        if (isSaving) return;

        try {
            setIsSaving(true);
            const response = await eventService.saveEvent(event._id);

            // Toggle the saved state based on response
            const newSavedState = response.data?.saved ?? !isSaved;
            setIsSaved(newSavedState);

            // Notify parent component if callback provided
            onSaveToggle?.(newSavedState);

            console.log(`Event ${newSavedState ? 'saved' : 'unsaved'} successfully`);
        } catch (error: any) {
            const serverMsg = error.response?.data?.msg || error.response?.data?.message || (error.response?.data?.errors && error.response.data.errors[0]?.message);
            console.error('Failed to toggle save state:', serverMsg || error.message);
            // Don't change the state if the API call failed
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View className="flex-row h-56 rounded-3xl overflow-hidden relative">
            <View className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400" />

            {/* Center icon */}
            <View className="flex-1 justify-center items-center">
                <Text className="text-4xl">🎭</Text>
            </View>

            {/* Action buttons */}
            <View className="absolute top-4 right-4 flex-row space-x-2 z-50">
                <TouchableOpacity
                    className="bg-white/90 p-2 rounded-full"
                    onPress={handleSaveToggle}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <ActivityIndicator size="small" color="#111" />
                    ) : (
                        <Heart
                            size={16}
                            color="#111"
                            fill={isSaved ? "#EF4444" : "transparent"}
                        />
                    )}
                </TouchableOpacity>
                <TouchableOpacity className="bg-white/90 p-2 rounded-full">
                    <Share2 size={16} color="#111" />
                </TouchableOpacity>
                {
                    isOrganizer && (
                        <TouchableOpacity className="bg-white/90 p-2 rounded-full" onPress={onSettingsPress}>
                            <Settings size={16} color="#111" />
                        </TouchableOpacity>
                    )
                }
            </View>
        </View>
    );
};
