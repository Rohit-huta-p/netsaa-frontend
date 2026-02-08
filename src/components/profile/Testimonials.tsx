// src/components/profile/Testimonials.tsx
import React from "react";
import {
    View,
    Text,
} from "react-native";
import { Quote, Star } from "lucide-react-native";
import { TestimonialsProps } from "./types";

const DEFAULT_TESTIMONIAL = {
    text: "The artist demonstrates exceptional skill and professionalism. Truly a rising star.",
    author: "Event Organizer",
    role: "Director • Verified Venue"
};

export const Testimonials: React.FC<TestimonialsProps> = ({
    testimonial = DEFAULT_TESTIMONIAL,
}) => {
    return (
        <View className="p-12 rounded-[2rem] bg-zinc-900/20 border border-white/5 relative overflow-hidden">
            <View className="absolute -top-4 -right-4 rotate-12 opacity-5">
                <Quote size={128} color="white" />
            </View>
            <View className="relative z-10">
                <View className="flex-row gap-1 mb-6">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} fill="#ea698b" color="#ea698b" />)}
                </View>
                <Text className="text-2xl md:text-3xl font-medium italic tracking-tight leading-relaxed text-zinc-200 mb-10">
                    "{testimonial.text}"
                </Text>
                <View className="flex-row items-center gap-4 border-t border-white/5 pt-8">
                    <View className="w-10 h-10 rounded-full bg-zinc-800" />
                    <View>
                        <Text className="text-sm text-white font-black uppercase italic">{testimonial.author}</Text>
                        <Text className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{testimonial.role}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default Testimonials;
