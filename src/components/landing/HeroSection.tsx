import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { Button } from '../ui/Button'; // Assuming you have this, or replace with standard Touchable
import { GradientButton } from '../ui/GradientButton'; // Use your Gradient Button
import { Play } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function HeroSection() {
    const router = useRouter();
    const video = React.useRef(null);
    const { height } = useWindowDimensions();

    return (
        <View
            className="relative justify-center overflow-hidden mb-8"
            style={{ height: Math.max(550, height * 0.7) }}
        >
            <Video
                ref={video}
                style={{
                    position: 'absolute',
                    top: 0, left: 0, bottom: 0, right: 0,
                    opacity: 0.6 // Slightly dimmer to make text pop
                }}
                source={require('../../../assets/header-video.mp4')}
                useNativeControls={false}
                resizeMode={ResizeMode.COVER}
                isLooping
                shouldPlay
                isMuted
            />

            {/* Gradient Overlay: Fades from transparent to the dark background color at the bottom */}
            <LinearGradient
                colors={['transparent', 'rgba(9, 9, 11, 0.2)', '#09090b']}
                style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' }}
            />

            <View className="px-6 items-center justify-end h-full pb-20 z-10">
                <View className="items-center space-y-6 max-w-xl">

                    {/* Badge */}
                    <View className="bg-white/10 border border-white/20 px-4 py-1.5 rounded-full backdrop-blur-md mb-2">
                        <Text className="text-pink-400 font-bold text-xs uppercase tracking-widest">
                            The Performing Arts Network
                        </Text>
                    </View>

                    <Text className="text-5xl md:text-7xl font-black text-white text-center leading-tight tracking-tight">
                        Own the{'\n'}
                        <Text className="text-transparent" style={{ color: '#F472B6' }}>Stage.</Text>
                    </Text>

                    <Text className="text-gray-300 text-center text-lg md:text-xl px-2 leading-7">
                        Discover gigs, book talent, and connect with the creative underground.
                    </Text>

                    <View className="flex-row gap-4 mt-6 w-full justify-center">
                        <View className="flex-1 max-w-[160px]">
                            <GradientButton
                                label="Join Now"
                                colors={["#db2777", "#f472b6"]} // Pink Gradient
                                onPress={() => router.push('/(auth)/register')}
                            />
                        </View>

                        <Button
                            label="Watch Demo"
                            variant="outline" // Ensure your Button component handles transparent/outline styles
                            className="flex-1 max-w-[160px] border-white/30 bg-black/30 backdrop-blur-sm active:bg-white/10"
                            textClassName="text-white"
                            icon={<Play size={16} color="white" fill="white" />}
                        />
                    </View>
                </View>
            </View>
        </View>
    );
}