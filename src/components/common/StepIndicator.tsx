import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Check } from 'lucide-react-native';

interface Step {
    title: string;
    subtitle: string;
}

interface StepIndicatorProps {
    currentStep: number;
    steps: Step[];
    completedSteps: number[];
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, steps, completedSteps }) => {
    return (
        <View className="w-full lg:w-64 flex-shrink-0 lg:border-r border-zinc-800 lg:pr-8 mb-8 lg:mb-0">
            {/* Desktop Title - hidden on mobile via nativewind classes if applicable, but RN might need conditional rendering or different styling */}
            <Text className="text-xl font-bold text-white mb-6 hidden lg:flex">Create Gig</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row lg:flex-col lg:overflow-visible pb-4 lg:pb-0">
                <View className="flex-row lg:flex-col lg:space-y-6">
                    {steps.map((step, index) => {
                        const stepNum = index + 1;
                        const isActive = currentStep === stepNum;
                        const isCompleted = completedSteps.includes(stepNum);

                        return (
                            <View key={index} className="flex-row items-center min-w-[max-content] lg:min-w-0 mr-6 lg:mr-0">
                                <View
                                    className={`
                  w-8 h-8 rounded-full items-center justify-center border
                  ${isActive ? 'bg-indigo-600 border-indigo-600' :
                                            isCompleted ? 'bg-green-500/20 border-green-500/30' :
                                                'bg-zinc-800 border-zinc-700'}
                `}
                                >
                                    {isCompleted ? <Check size={16} color="#4ade80" /> : <Text className={`text-sm font-medium ${isActive ? 'text-white' : 'text-zinc-500'}`}>{stepNum}</Text>}
                                </View>
                                <View className="ml-3 hidden sm:flex">
                                    <Text className={`text-sm font-medium ${isActive ? 'text-white' : isCompleted ? 'text-zinc-300' : 'text-zinc-500'}`}>
                                        {step.title}
                                    </Text>
                                    <Text className="text-xs text-zinc-500 mt-0.5">{step.subtitle}</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
};
