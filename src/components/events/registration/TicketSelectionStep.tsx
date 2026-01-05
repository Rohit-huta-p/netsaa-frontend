import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ticket, Users } from 'lucide-react-native';

interface TicketSelectionStepProps {
    ticketTypes: any[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    quantity: number;
    onQuantityChange: (q: number) => void;
    onNext: () => void;
    loading: boolean;
    ticketPrice?: number;
}

export const TicketSelectionStep: React.FC<TicketSelectionStepProps> = ({
    ticketTypes,
    selectedId,
    onSelect,
    quantity,
    onQuantityChange,
    onNext,
    loading,
    ticketPrice
}) => {
    // Auto-select if only one ticket type
    React.useEffect(() => {
        if (ticketTypes.length === 1 && !selectedId) {
            onSelect(ticketTypes[0]._id);
        }
    }, [ticketTypes, selectedId]);

    const singleTicket = ticketTypes.length === 1
        ? ticketTypes[0]
        : (ticketTypes.length === 0 && typeof ticketPrice === 'number')
            ? { price: ticketPrice, capacity: 'Open', name: 'General Entry' }
            : null;

    // Simplified UI for Single Ticket Type
    if (singleTicket) {
        return (
            <View className="flex-1">
                <Text className="text-white text-xl font-bold mb-6">Complete Registration</Text>

                <View className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
                    <View className="flex-row justify-between items-center mb-8">
                        <View>
                            <Text className="text-zinc-400 mb-1">Price per person</Text>
                            <Text className="text-white text-2xl font-bold">
                                {singleTicket.price === 0 ? 'Free' : `₹${singleTicket.price}`}
                            </Text>
                        </View>
                        {singleTicket.capacity !== 'Open' && (
                            <View className="items-end">
                                <Text className="text-zinc-400 mb-1">Seats Available</Text>
                                <Text className="text-white font-bold">{singleTicket.capacity}</Text>
                            </View>
                        )}
                    </View>

                    <View>
                        <Text className="text-zinc-400 mb-4">Select Quantity</Text>
                        <View className="flex-row items-center justify-between bg-zinc-800 p-2 rounded-xl">
                            <TouchableOpacity
                                onPress={() => onQuantityChange(Math.max(1, quantity - 1))}
                                className="w-12 h-12 rounded-lg bg-zinc-700 items-center justify-center active:bg-zinc-600"
                            >
                                <Text className="text-white text-2xl font-medium">-</Text>
                            </TouchableOpacity>
                            <Text className="text-white text-3xl font-bold">{quantity}</Text>
                            <TouchableOpacity
                                onPress={() => onQuantityChange(Math.min(10, quantity + 1))}
                                className="w-12 h-12 rounded-lg bg-zinc-700 items-center justify-center active:bg-zinc-600"
                            >
                                <Text className="text-white text-2xl font-medium">+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className="mt-8 pt-6 border-t border-white/10 flex-row justify-between items-center">
                        <Text className="text-zinc-400">Total Amount</Text>
                        <Text className="text-netsa-accent-purple text-3xl font-bold">
                            {singleTicket.price === 0 ? 'Free' : `₹${singleTicket.price * quantity}`}
                        </Text>
                    </View>
                </View>

                <View className="mt-auto pt-4 border-t border-white/10">
                    <TouchableOpacity
                        onPress={onNext}
                        disabled={loading}
                        className={`w-full py-4 rounded-xl items-center justify-center ${loading ? 'bg-zinc-800' : 'bg-netsa-accent-purple'}`}
                    >
                        <Text className="font-bold text-lg text-white">
                            {loading ? 'Processing...' : 'Continue'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1">
            <Text className="text-white text-xl font-bold mb-4">Select Ticket</Text>

            <ScrollView className="flex-1">
                <View className="gap-3">
                    {ticketTypes.map((ticket) => {
                        const isSelected = selectedId === ticket._id;
                        const isSoldOut = ticket.capacity <= 0;

                        return (
                            <TouchableOpacity
                                key={ticket._id}
                                onPress={() => !isSoldOut && onSelect(ticket._id)}
                                disabled={isSoldOut}
                                className={`p-4 rounded-xl border ${isSelected ? 'border-netsa-accent-purple bg-netsa-accent-purple/10' : 'border-zinc-800 bg-zinc-900'} ${isSoldOut ? 'opacity-50' : ''}`}
                            >
                                <View className="flex-row justify-between items-center mb-1">
                                    <Text className="text-white font-bold text-lg">{ticket.name}</Text>
                                    <Text className="text-netsa-accent-purple font-bold">
                                        {ticket.price === 0 ? 'Free' : `₹${ticket.price}`}
                                    </Text>
                                </View>
                                <View className="flex-row items-center gap-4">
                                    <Text className="text-zinc-400 text-xs flex-row items-center">
                                        <Users size={12} color="#a1a1aa" /> {ticket.capacity} seats
                                    </Text>
                                    {isSoldOut && <Text className="text-red-500 text-xs font-bold">SOLD OUT</Text>}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {selectedId && (
                    <View className="mt-6 bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                        <Text className="text-zinc-400 mb-2">Quantity</Text>
                        <View className="flex-row items-center gap-4">
                            <TouchableOpacity
                                onPress={() => onQuantityChange(Math.max(1, quantity - 1))}
                                className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center"
                            >
                                <Text className="text-white text-xl">-</Text>
                            </TouchableOpacity>
                            <Text className="text-white text-xl font-bold">{quantity}</Text>
                            <TouchableOpacity
                                onPress={() => onQuantityChange(Math.min(10, quantity + 1))}
                                className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center"
                            >
                                <Text className="text-white text-xl">+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>

            <View className="mt-4 pt-4 border-t border-white/10">
                <TouchableOpacity
                    onPress={onNext}
                    disabled={!selectedId || loading}
                    className={`w-full py-4 rounded-xl items-center justify-center ${!selectedId || loading ? 'bg-zinc-800' : 'bg-netsa-accent-purple'}`}
                >
                    <Text className={`font-bold text-lg ${!selectedId ? 'text-zinc-500' : 'text-white'}`}>
                        {loading ? 'Reserving...' : 'Continue'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};
