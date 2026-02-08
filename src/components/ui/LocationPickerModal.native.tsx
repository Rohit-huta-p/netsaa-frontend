import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { X, Check, MapPin, Navigation } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

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
    initialRegion?: Region;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
    visible,
    onClose,
    onSelectLocation,
    initialRegion
}) => {
    const [region, setRegion] = useState<Region>(initialRegion || {
        latitude: 18.5204, // Default to Pune
        longitude: 73.8567,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });
    const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [address, setAddress] = useState<string>('');

    useEffect(() => {
        if (visible) {
            getCurrentLocation();
        }
    }, [visible]);

    const getCurrentLocation = async () => {
        setLoading(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission to access location was denied');
                setLoading(false);
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            setRegion({
                latitude,
                longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });
            setSelectedLocation({ latitude, longitude });
            await reverseGeocode(latitude, longitude);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to get current location');
        } finally {
            setLoading(false);
        }
    };

    const reverseGeocode = async (latitude: number, longitude: number) => {
        try {
            const result = await Location.reverseGeocodeAsync({ latitude, longitude });
            if (result.length > 0) {
                const place = result[0];
                const formattedAddress = [
                    place.name,
                    place.street,
                    place.city,
                    place.region,
                    place.country
                ].filter(Boolean).join(', ');
                setAddress(formattedAddress);
                return place; // Return useful parts for breakdown
            }
        } catch (error) {
            console.error('Reverse geocoding failed', error);
        }
        return null; // Return null if failed or no result
    };

    const handleRegionChangeComplete = async (newRegion: Region) => {
        setRegion(newRegion);
        // Optimize: Don't reverse geocode on every drag, maybe only on select or map stop?
        // For better UX, let's reverse geocode when the map stops moving (which this callback does)
        setSelectedLocation({ latitude: newRegion.latitude, longitude: newRegion.longitude });
        await reverseGeocode(newRegion.latitude, newRegion.longitude);
    };

    const handleConfirm = async () => {
        if (selectedLocation) {
            const place = await reverseGeocode(selectedLocation.latitude, selectedLocation.longitude);
            onSelectLocation({
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
                address: address, // full string
                city: place?.city || place?.subregion || '',
                state: place?.region || '',
                country: place?.country || ''
            });
            onClose();
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View className="flex-1 bg-zinc-900">
                {/* Header */}
                <View className="flex-row justify-between items-center p-4 pt-12 border-b border-white/10 bg-zinc-900 z-10">
                    <Text className="text-white text-lg font-bold">Select Location</Text>
                    <TouchableOpacity onPress={onClose} className="p-2 bg-zinc-800 rounded-full">
                        <X size={20} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Map Container */}
                <View className="flex-1 relative">
                    <MapView
                        className="flex-1"
                        region={region}
                        onRegionChangeComplete={handleRegionChangeComplete}
                        showsUserLocation={true}
                        showsMyLocationButton={false} // Custom button below
                    />

                    {/* Center Marker Overlay */}
                    <View className="absolute top-1/2 left-1/2 -ml-4 -mt-8 pointer-events-none" style={{ transform: [{ translateY: -15 }] }}>
                        <MapPin size={40} color="#FF6B35" fill="rgba(255, 107, 53, 0.2)" />
                    </View>

                    {/* Current Location Button */}
                    <TouchableOpacity
                        className="absolute bottom-40 right-4 p-3 bg-zinc-900 rounded-full shadow-lg border border-white/10"
                        onPress={getCurrentLocation}
                    >
                        <Navigation size={24} color="#FF6B35" />
                    </TouchableOpacity>

                    {/* Footer Info & Action */}
                    <View className="absolute bottom-0 left-0 right-0 bg-zinc-900 p-6 rounded-t-3xl border-t border-white/10 shadow-2xl">
                        <View className="mb-4">
                            <Text className="text-zinc-400 text-xs uppercase mb-1 font-medium">Selected Location</Text>
                            <Text className="text-white text-base font-semibold" numberOfLines={2}>
                                {loading ? 'Locating...' : (address || 'Select a location')}
                            </Text>
                            {selectedLocation && !loading && (
                                <Text className="text-zinc-500 text-xs mt-1">
                                    {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                                </Text>
                            )}
                        </View>

                        <TouchableOpacity onPress={handleConfirm} disabled={loading}>
                            <LinearGradient
                                colors={['#FF6B35', '#FF8C42']}
                                start={[0, 0]}
                                end={[1, 0]}
                                className="flex-row items-center justify-center gap-2 py-4 rounded-xl"
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <Text className="text-white font-black text-base">Confirm Location</Text>
                                        <Check size={20} color="white" />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};
