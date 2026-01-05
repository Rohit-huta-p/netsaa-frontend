import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Clock } from 'lucide-react-native';

interface OrderSummaryStepProps {
    reservation: any; // Using any for now, ideally IEventReservation
    timeLeft: string;
    onProceed: () => void;
    loading: boolean;
}

export const OrderSummaryStep: React.FC<OrderSummaryStepProps> = ({
    reservation,
    timeLeft,
    onProceed,
    loading
}) => {
    if (!reservation) return null;

    return (
        <View className="flex-1">
            <View className="flex-row justify-between items-center mb-6 bg-orange-500/10 p-3 rounded-lg border border-orange-500/30">
                <Text className="text-orange-400 text-sm">Tickets reserved for</Text>
                <View className="flex-row items-center gap-1">
                    <Clock size={14} color="#fb923c" />
                    <Text className="text-orange-400 font-bold font-mono">{timeLeft}</Text>
                </View>
            </View>

            <Text className="text-white text-xl font-bold mb-4">Order Summary</Text>

            <View className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 gap-4">
                <View className="flex-row justify-between">
                    <Text className="text-zinc-400">Ticket Type</Text>
                    <Text className="text-white font-medium">Standard Entry (x{reservation.quantity})</Text>
                    {/* Note: Ticket name isn't directly in reservation, might need to pass it or fetch it. using placeholder logic */}
                </View>
                <View className="flex-row justify-between">
                    <Text className="text-zinc-400">Price per ticket</Text>
                    <Text className="text-white">₹{reservation.totalAmount / reservation.quantity}</Text>
                </View>
                <View className="flex-row justify-between">
                    <Text className="text-zinc-400">Subtotal</Text>
                    <Text className="text-white">₹{reservation.totalAmount}</Text>
                </View>
                <View className="h-[1px] bg-zinc-800 my-2" />
                <View className="flex-row justify-between items-center">
                    <Text className="text-white font-bold text-lg">Total Payable</Text>
                    <Text className="text-netsa-accent-purple font-bold text-2xl">
                        {reservation.totalAmount === 0 ? 'Free' : `₹${reservation.totalAmount}`}
                    </Text>
                </View>
            </View>

            <View className="flex-1 justify-end">
                <Text className="text-zinc-500 text-xs text-center mb-4">
                    By clicking "Confirm", you agree to the refund policy and terms of service.
                </Text>
                <TouchableOpacity
                    onPress={onProceed}
                    disabled={loading}
                    className="w-full py-4 rounded-xl items-center justify-center bg-netsa-accent-purple"
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text className="text-white font-bold text-lg">
                            {reservation.totalAmount === 0 ? 'Confirm Registration' : 'Proceed to Pay'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};
