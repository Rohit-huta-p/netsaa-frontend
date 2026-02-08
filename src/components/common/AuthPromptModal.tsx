import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Lock, ArrowRight, Star, Sparkles, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AuthPromptModalProps {
    visible: boolean;
    onClose: () => void;
}

export const AuthPromptModal: React.FC<AuthPromptModalProps> = ({ visible, onClose }) => {
    const router = useRouter();

    const handleLogin = () => {
        onClose();
        router.push('/(auth)/login');
    };

    const handleSignup = () => {
        onClose();
        router.push('/(auth)/register');
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-center items-center bg-black/80">
                {/* Background Blur Effect */}
                {Platform.OS !== 'web' && (
                    <BlurView
                        intensity={20}
                        tint="dark"
                        style={StyleSheet.absoluteFill}
                    />
                )}

                <View className="w-[90%] max-w-md bg-[#121212] rounded-[32px] overflow-hidden border border-white/10 shadow-2xl">
                    {/* Decorative Background Elements */}
                    <LinearGradient
                        colors={['rgba(139, 92, 246, 0.1)', 'transparent']}
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 200 }}
                    />

                    <View className="p-8 items-center">
                        {/* Icon Header */}
                        <View className="mb-6 relative">
                            <View className="w-20 h-20 rounded-full bg-zinc-900 border border-white/10 items-center justify-center shadow-lg transform rotate-3">
                                <LinearGradient
                                    colors={['#8B5CF6', '#3B82F6']}
                                    className="w-16 h-16 rounded-full items-center justify-center opacity-90"
                                >
                                    <Lock size={32} color="white" />
                                </LinearGradient>
                            </View>
                            <View className="absolute -top-1 -right-2 bg-yellow-500/20 p-2 rounded-full border border-yellow-500/30">
                                <Sparkles size={14} color="#EAB308" fill="#EAB308" />
                            </View>
                        </View>

                        {/* Text Content */}
                        <View className="items-center mb-8">
                            <Text className="text-white text-2xl font-black text-center mb-3 tracking-tight">
                                Unlock Your Career
                            </Text>
                            <Text className="text-zinc-400 text-center text-sm leading-6 px-4 font-medium">
                                Join NETSA's exclusive professional network to apply for gigs, register for events, and connect with top industry talent.
                            </Text>
                        </View>

                        {/* Feature List (Subtle) */}
                        <View className="w-full flex-row justify-center gap-6 mb-8">
                            <View className="items-center gap-1">
                                <Zap size={14} color="#8B5CF6" />
                                <Text className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Gigs</Text>
                            </View>
                            <View className="w-[1px] h-full bg-white/10" />
                            <View className="items-center gap-1">
                                <Star size={14} color="#EAB308" />
                                <Text className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Events</Text>
                            </View>
                            <View className="w-[1px] h-full bg-white/10" />
                            <View className="items-center gap-1">
                                <Lock size={14} color="#10B981" />
                                <Text className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Network</Text>
                            </View>
                        </View>

                        {/* Actions */}
                        <View className="w-full gap-3">
                            <TouchableOpacity
                                onPress={handleLogin}
                                className="w-full py-4 bg-white rounded-2xl flex-row items-center justify-center active:scale-[0.98] transition-all"
                            >
                                <Text className="text-black font-black text-lg mr-2">
                                    Log In
                                </Text>
                                <ArrowRight size={20} color="black" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleSignup}
                                className="w-full py-4 bg-zinc-800/50 border border-white/10 rounded-2xl items-center justify-center active:bg-zinc-800 active:scale-[0.98]"
                            >
                                <Text className="text-white font-bold text-base">
                                    Create Account
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={onClose}
                            className="mt-6 p-2"
                        >
                            <Text className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                                Cancel
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};
