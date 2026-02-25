import React from "react";
import {
    View,
    Text,
} from "react-native";
import { Quote, Star } from "lucide-react-native";
import { TestimonialsProps } from "./types";

export const Testimonials: React.FC<TestimonialsProps> = ({
    testimonials = [],
}) => {
    if (!testimonials || testimonials.length === 0) {
        return (
            <View className="py-12 px-6 rounded-[2rem] bg-zinc-900/40 border border-white/5 items-center justify-center">
                <Quote size={48} color="#52525b" className="mb-4 opacity-50" />
                <Text className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] text-center">
                    No Testimonials Yet
                </Text>
            </View>
        );
    }

    return (
        <View className="space-y-6">
            {testimonials.map((testimonial, index) => (
                <View key={index} className="p-12 rounded-[2rem] bg-zinc-900/20 border border-white/5 relative overflow-hidden">
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
            ))}
        </View>
    );
};

export default Testimonials;
