import React from 'react';
import { Platform, View, ActivityIndicator } from 'react-native';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

// Platform-specific Lottie components
// iOS/Android: uses lottie-react-native (New Architecture / Fabric compatible)
//   NOTE: @lottiefiles/dotlottie-react-native is NOT New-Arch compatible and
//   crashes Fabric ("ComponentView ... not found") — do not use it on native.
// Web: uses @lottiefiles/dotlottie-react
let LottieNative: any = null;
let DotLottieWeb: any = null;

if (Platform.OS !== 'web') {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        LottieNative = require('lottie-react-native').default;
    } catch (e) {
        console.warn('Failed to load lottie-react-native:', e);
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

    // iOS/Android - use lottie-react-native (Fabric compatible)
    if (LottieNative) {
        return (
            <LottieNative
                source={{ uri: source }}
                autoPlay={autoplay}
                loop={loop}
                style={{ width, height }}
                onAnimationFinish={onComplete}
            />
        );
    }

    // Fallback for native platforms if Lottie fails to load
    return (
        <View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#3B82F6" />
        </View>
    );
};
