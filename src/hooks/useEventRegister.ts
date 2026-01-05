import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import eventService from '@/services/eventService';
import { IEventTicketType } from '@/types/event'; // Need to ensure this exists or use any

export type RegisterStep = 'TICKET_SELECTION' | 'ORDER_SUMMARY' | 'PAYMENT' | 'SUCCESS';

export const useEventRegister = (eventId: string, ticketTypes: any[], onComplete: () => void) => {
    const [step, setStep] = useState<RegisterStep>('TICKET_SELECTION');
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);

    // Reservation State
    const [reservation, setReservation] = useState<any>(null);
    const [reservationExpiry, setReservationExpiry] = useState<Date | null>(null);
    const [timeLeft, setTimeLeft] = useState<string>('');

    // Payment State
    const [paymentIntent, setPaymentIntent] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Errors
    const [error, setError] = useState<string | null>(null);

    // Timer Logic
    useEffect(() => {
        if (!reservationExpiry) return;

        const interval = setInterval(() => {
            const now = new Date();
            const diff = reservationExpiry.getTime() - now.getTime();

            if (diff <= 0) {
                clearInterval(interval);
                handleExpiry();
                setTimeLeft('00:00');
            } else {
                const minutes = Math.floor(diff / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [reservationExpiry]);

    const handleExpiry = () => {
        setReservation(null);
        setReservationExpiry(null);
        setStep('TICKET_SELECTION');
        Alert.alert('Session Expired', 'Your reservation has expired. Please try again.');
    };

    const handleReserve = async () => {
        if (!selectedTicketId && ticketTypes.length > 0) return;
        setIsProcessing(true);
        setError(null);
        try {
            const res = await eventService.reserveTickets(eventId, {
                ticketTypeId: selectedTicketId || undefined,
                quantity
            });
            if (res.success) {
                setReservation(res.data);
                const expires = new Date(res.data.expiresAt);
                setReservationExpiry(expires);
                setStep('ORDER_SUMMARY');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to reserve tickets');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleProceedToPayment = async () => {
        if (!reservation) return;

        // If Free, skip to finalize
        if (reservation.totalAmount === 0) {
            await handleFinalize();
            return;
        }

        setIsProcessing(true);
        try {
            const res = await eventService.createPaymentIntent(eventId, { reservationId: reservation._id });
            if (res.success) {
                setPaymentIntent(res);
                setStep('PAYMENT'); // Move to Stripe specific step
            }
        } catch (err: any) {
            setError(err.message || 'Payment initiation failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFinalize = async (paymentIntentId?: string) => {
        setIsProcessing(true);
        try {
            const res = await eventService.finalizeRegistration(eventId, {
                reservationId: reservation._id,
                paymentIntentId
            });
            if (res.success) {
                setStep('SUCCESS');
                // Cleanup
                setReservation(null);
                setReservationExpiry(null);
            }
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setIsProcessing(false);
        }
    };

    // Cleanup on unmount or cancel
    const cancelSession = async () => {
        if (reservation && step !== 'SUCCESS') {
            try {
                await eventService.cancelReservation(reservation._id);
            } catch (e) {
                console.log('Error cancelling reservation', e);
            }
        }
        onComplete();
    };

    return {
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
    };
};
