
import React, { useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Check } from 'lucide-react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    interpolateColor,
    interpolate
} from 'react-native-reanimated';

interface Step {
    title: string;
    subtitle: string;
}

interface StepIndicatorProps {
    currentStep: number;
    steps: Step[];
    completedSteps: number[];
}

const StepItem = ({ step, index, isActive, isCompleted }: { step: Step, index: number, isActive: boolean, isCompleted: boolean }) => {
    const stepNum = index + 1;

    // Animation values
    const scale = useSharedValue(1);
    const progress = useSharedValue(0); // 0: Inactive/Completed, 1: Active

    useEffect(() => {
        scale.value = withSpring(isActive ? 1.1 : 1);
        progress.value = withTiming(isActive ? 1 : 0, { duration: 300 });
    }, [isActive]);

    const animatedCircleStyle = useAnimatedStyle(() => {
        // Background color interpolation is tricky with "Completed" state not being a simple 0-1 linear transition from Active.
        // Instead, we'll control specific active-state animations (scale) and let React handle the base color class logic for now, 
        // or effectively mix them. 
        // For simplicity and robustness given the "Completed" state (green), "Active" (indigo), "Inactive" (zinc),
        // let's stick to using classes for colors to avoid complex worklet interpolation logic for 3 states,
        // and just animate the SCALE and potentially Opacity or slight highlight.

        return {
            transform: [{ scale: scale.value }],
        };
    });

    return (
        <View className="flex-row items-center min-w-[max-content] lg:min-w-0 lg:mr-0">
            <Animated.View
                style={animatedCircleStyle}
                className={`
                    w-8 h-8 rounded-full items-center justify-center border
                    ${isActive ? 'bg-indigo-600 border-indigo-600' :
                        isCompleted ? 'bg-green-500/20 border-green-500/30' :
                            'bg-zinc-800 border-zinc-700'}
                `}
            >
                {isCompleted ? (
                    <Check size={16} color="#4ade80" />
                ) : (
                    <Text className={`text-sm font-medium ${isActive ? 'text-white' : 'text-zinc-500'}`}>
                        {stepNum}
                    </Text>
                )}
            </Animated.View>

            <View className="ml-3 hidden sm:flex">
                <Text className={`text-sm font-medium ${isActive ? 'text-white' : isCompleted ? 'text-zinc-300' : 'text-zinc-500'}`}>
                    {step.title}
                </Text>
                <Text className="text-xs text-zinc-500 mt-0.5">{step.subtitle}</Text>
            </View>
        </View>
    );
};

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, steps, completedSteps }) => {
    // Progress calculation
    const progress = (currentStep / steps.length) * 100;
    const currentStepData = steps[currentStep - 1];

    return (
        <View className="w-full lg:w-64 flex-shrink-0 lg:border-r border-zinc-800 lg:pr-8 mb-6 lg:mb-0">
            {/* Desktop Title */}
            <Text className="text-xl font-bold text-white mb-6 hidden lg:flex">Create Listing</Text>

            {/* Mobile View: Progress Bar & Current Step Info */}
            <View className="flex lg:hidden mb-2">
                <View className="flex-row justify-between items-end mb-2">
                    <View>
                        <Text className="text-xs font-bold text-[#FF6B35] uppercase tracking-wider mb-0.5">
                            Step {currentStep} of {steps.length}
                        </Text>
                        <Text className="text-lg font-bold text-white leading-tight">
                            {currentStepData?.title}
                        </Text>
                    </View>
                    <Text className="text-xs text-zinc-500 font-medium mb-1">
                        {Math.round(progress)}% Completed
                    </Text>
                </View>

                {/* Progress Bar Track */}
                <View className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    {/* Animated Progress Fill */}
                    <View
                        className="h-full bg-[#FF6B35] rounded-full"
                        style={{ width: `${progress}%` }}
                    />
                </View>
            </View>

            {/* Desktop View: Vertical List */}
            <View className="hidden lg:flex lg:space-y-6">
                {steps.map((step, index) => {
                    const stepNum = index + 1;
                    const isActive = currentStep === stepNum;
                    const isCompleted = completedSteps.includes(stepNum);

                    return (
                        <StepItem
                            key={index}
                            step={step}
                            index={index}
                            isActive={isActive}
                            isCompleted={isCompleted}
                        />
                    );
                })}
            </View>
        </View>
    );
};
