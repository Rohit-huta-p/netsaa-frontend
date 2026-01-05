import React, { useEffect } from 'react';
import { View, TouchableOpacity, Modal, Text, ActivityIndicator } from 'react-native';
import { X } from 'lucide-react-native';
import { useEventRegister } from '@/hooks/useEventRegister';
import { TicketSelectionStep } from './registration/TicketSelectionStep';
import { OrderSummaryStep } from './registration/OrderSummaryStep';
import { SuccessStep } from './registration/SuccessStep';

interface EventRegisterModalProps {
    visible: boolean;
    onClose: () => void;
    eventId: string;
    ticketTypes: any[]; // Pass ticket details
    ticketPrice?: number;
}

export const EventRegisterModal: React.FC<EventRegisterModalProps> = ({
    visible,
    onClose,
    eventId,
    ticketTypes,
    ticketPrice
}) => {
    const {
        step,
        selectedTicketId,
        setSelectedTicketId,
        quantity,
        setQuantity,
        reservation,
        timeLeft,
        error,
        isProcessing,
        handleReserve,
        handleProceedToPayment,
        handleFinalize,
        paymentIntent,
        cancelSession
    } = useEventRegister(eventId, ticketTypes, onClose);

    // If closed, ensure we clean up
    useEffect(() => {
        if (!visible) {
            // Potential cleanup logic if user swipes down etc
        }
    }, [visible]);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={cancelSession}
        >
            <View className="flex-1 justify-end bg-black/80">
                <View className="bg-netsa-bg w-full h-[85%] rounded-t-3xl p-6 relative">
                    {/* Header */}
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-zinc-500 text-sm uppercase tracking-wider">
                            {step === 'TICKET_SELECTION' ? 'Select Tickets' :
                                step === 'ORDER_SUMMARY' ? 'Checkout' :
                                    step === 'SUCCESS' ? '' : 'Payment'}
                        </Text>
                        <TouchableOpacity onPress={cancelSession} className="p-2 bg-zinc-800 rounded-full">
                            <X size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Error Banner */}
                    {error && (
                        <View className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg mb-4">
                            <Text className="text-red-400 text-sm">{error}</Text>
                        </View>
                    )}

                    {/* Content Steps */}
                    {step === 'TICKET_SELECTION' && (
                        <TicketSelectionStep
                            ticketTypes={ticketTypes}
                            selectedId={selectedTicketId}
                            onSelect={setSelectedTicketId}
                            quantity={quantity}
                            onQuantityChange={setQuantity}
                            onNext={handleReserve}
                            loading={isProcessing}
                            ticketPrice={ticketPrice}
                        />
                    )}

                    {step === 'ORDER_SUMMARY' && reservation && (
                        <OrderSummaryStep
                            reservation={reservation}
                            timeLeft={timeLeft}
                            onProceed={handleProceedToPayment}
                            loading={isProcessing}
                        />
                    )}

                    {step === 'PAYMENT' && (
                        <View className="flex-1 justify-center items-center">
                            <ActivityIndicator size="large" color="#818cf8" />
                            <Text className="text-zinc-400 mt-4">Initializing Payment...</Text>
                            {/* In a real implementation, Stripe Provider and PaymentSheet would trigger here */}
                            {/* For this mock, we effectivley handled it in logic or need a trigger */}
                            <TouchableOpacity onPress={() => handleFinalize(paymentIntent?.paymentIntentId)} className="mt-8 bg-zinc-800 p-4 rounded">
                                <Text className="text-white">Simulate Payment Completion</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {step === 'SUCCESS' && (
                        <SuccessStep onClose={onClose} />
                    )}

                </View>
            </View>
        </Modal>
    );
};
