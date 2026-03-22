import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';

interface OrderSummaryStepProps {
    reservation: any;
    timeLeft: string;
    onProceed: () => void;
    loading: boolean;
    isExpired?: boolean;
}

export const OrderSummaryStep: React.FC<OrderSummaryStepProps> = ({
    reservation,
    timeLeft,
    onProceed,
    loading,
    isExpired
}) => {
    if (!reservation) return null;

    return (
        <View style={{ flex: 1 }}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
                <Text className="text-white text-xl font-bold mb-4">Order Summary</Text>

                <View className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 gap-4">
                    <View className="flex-row justify-between">
                        <Text className="text-zinc-400">Ticket Type</Text>
                        <Text className="text-white font-medium">Standard Entry (x{reservation.quantity})</Text>
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
                            ₹{reservation.totalAmount}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* CTA — pinned at bottom */}
            <View style={{ paddingTop: 16 }}>
                <Text className="text-zinc-500 text-xs text-center mb-4">
                    By clicking "Proceed to Pay", you agree to the refund policy and terms of service.
                </Text>
                {/* TODO: integrate @stripe/stripe-react-native PaymentSheet here with clientSecret from paymentIntent */}
                <TouchableOpacity
                    onPress={onProceed}
                    disabled={loading || isExpired}
                    className={`w-full py-4 rounded-xl items-center justify-center ${loading || isExpired ? 'bg-zinc-800' : 'bg-netsa-accent-purple'}`}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text className={`font-bold text-lg ${isExpired ? 'text-zinc-500' : 'text-white'}`}>
                            {isExpired ? 'Reservation Expired' : 'Proceed to Pay'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};
