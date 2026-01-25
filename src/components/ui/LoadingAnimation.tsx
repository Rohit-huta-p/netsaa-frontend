import React from 'react';
import { Platform, View, ActivityIndicator } from 'react-native';
import { DotLottie } from '@lottiefiles/dotlottie-react-native';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

// Platform-specific Lottie components
// iOS/Android: uses @lottiefiles/dotlottie-react-native
// Web: uses @lottiefiles/dotlottie-react
let DotLottieNative: any = null;
let DotLottieWeb: any = null;

if (Platform.OS !== 'web') {
    try {
        DotLottieNative = DotLottie;
    } catch (e) {
        console.warn('Failed to load dotlottie-react-native:', e);
    }
} else {
    try {
        DotLottieWeb = DotLottieReact;
    } catch (e) {
        console.warn('Failed to load dotlottie-react for web:', e);
    }
}

interface LoadingAnimationProps {
    source: string;
    width?: number;
    height?: number;
    loop?: boolean;
    autoplay?: boolean;
    onComplete?: () => void;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
    source,
    width = 200,
    height = 200,
    loop = true,
    autoplay = true,
    onComplete,
}) => {
    // Web platform - use DotLottieReact
    if (Platform.OS === 'web') {
        if (DotLottieWeb) {
            return (
                <div style={{ width, height }}>
                    <DotLottieWeb
                        src={source}
                        loop={loop}
                        autoplay={autoplay}
                        onComplete={onComplete}
                        style={{ width: '100%', height: '100%' }}
                    />
                </div>
            );
        }
        // Fallback for web if DotLottieReact fails to load
        return (
            <View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    // iOS/Android - use DotLottie from dotlottie-react-native
    if (DotLottieNative) {
        return (
            <DotLottieNative
                source={source}
                loop={loop}
                autoplay={autoplay}
                onComplete={onComplete}
                style={{ width, height }}
            />
        );
    }

    // Fallback for native platforms if DotLottie fails to load
    return (
        <View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#3B82F6" />
        </View>
    );
};
