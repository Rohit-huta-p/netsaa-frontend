import React, { useState, useCallback } from 'react';
import { View } from 'react-native';
import { LoadingAnimation } from './LoadingAnimation';
import { tr } from 'zod/v4/locales';

interface SequentialLoadingAnimationProps {
    animations: {
        source: string;
        width?: number;
        height?: number;
    }[];
    width?: number;
    height?: number;
}

export const SequentialLoadingAnimation: React.FC<SequentialLoadingAnimationProps> = ({
    animations,
    width = 200,
    height = 200,
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleComplete = useCallback(() => {
        // Move to next animation, or loop back to the first
        setCurrentIndex((prevIndex) => (prevIndex + 1) % animations.length);
    }, [animations.length]);

    const currentAnimation = animations[currentIndex];

    return (
        <View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
            <LoadingAnimation
                key={currentIndex} // Force re-mount when animation changes
                source={currentAnimation.source}
                width={currentAnimation.width || width}
                height={currentAnimation.height || height}
                loop={true} // Don't loop individual animations
                autoplay={true}
                onComplete={handleComplete}
            />
        </View>
    );
};
