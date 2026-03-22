import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import eventService from '@/services/eventService';
import { IEventTicketType } from '@/types/event';
import { AttendeeInfo } from '@/components/events/registration/AttendeeInfoStep';

export type RegisterStep = 'TICKET_SELECTION' | 'ATTENDEE_INFO' | 'ORDER_SUMMARY' | 'PAYMENT' | 'SUCCESS';

export const useEventRegister = (eventId: string, ticketTypes: any[], onComplete: () => void) => {
    const [step, setStep] = useState<RegisterStep>('TICKET_SELECTION');
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);

    // Attendee Info State
    const [attendeeInfo, setAttendeeInfo] = useState<AttendeeInfo[]>([
        { fullName: '', email: '', phone: '', notes: '' },
    ]);

    // Reservation State
    const [reservation, setReservation] = useState<any>(null);
    const [reservationExpiry, setReservationExpiry] = useState<Date | null>(null);
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [isExpired, setIsExpired] = useState(false);

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
                setTimeLeft('0:00');
                setIsExpired(true);
                handleExpiry();
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

    // Step 1: Ticket Selection → Attendee Info (NO reservation yet)
    const handleNextFromTicketSelection = () => {
        if (!selectedTicketId && ticketTypes.length > 0) return;
        setStep('ATTENDEE_INFO');
    };

    // Step 2: Attendee Info → Reserve tickets → ORDER_SUMMARY (or finalize for free)
    const handleNextFromAttendeeInfo = async (latestAttendeeInfo?: AttendeeInfo[]) => {
        if (!selectedTicketId && ticketTypes.length > 0) return;

        // If provided securely from form, update state for subsequent steps
        if (latestAttendeeInfo) {
            setAttendeeInfo(latestAttendeeInfo);
        }

        setIsProcessing(true);
        setError(null);
        setIsExpired(false);
        try {
            const res = await eventService.reserveTickets(eventId, {
                ticketTypeId: selectedTicketId || undefined,
                quantity
            });
            if (res.success) {
                setReservation(res.data);
                const expires = new Date(res.data.expiresAt);
                setReservationExpiry(expires);

                // FREE EVENT: finalize immediately
                if (res.data.totalAmount === 0) {
                    await finalizeRegistration(res.data._id, undefined, latestAttendeeInfo);
                } else {
                    // PAID EVENT: go to ORDER_SUMMARY
                    setStep('ORDER_SUMMARY');
                }
            }
        } catch (err: any) {
            setError(err.message || 'Failed to reserve tickets');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleProceedToPayment = async () => {
        if (!reservation) return;

        // If Free, skip to finalize (safety check)
        if (reservation.totalAmount === 0) {
            await finalizeRegistration(reservation._id);
            return;
        }

        setIsProcessing(true);
        try {
            const res = await eventService.createPaymentIntent(eventId, {
                reservationId: reservation._id,
                attendees: attendeeInfo // backend validation error says `attendees.1.phone`, so it likely expects the key to be `attendees`
            } as any);
            if (res.success) {
                setPaymentIntent(res);
                // TODO: integrate @stripe/stripe-react-native PaymentSheet here with clientSecret from paymentIntent
                // For now, finalize immediately after payment intent is created
                await finalizeRegistration(reservation._id, res.paymentIntentId);
            }
        } catch (err: any) {
            setError(err.message || 'Payment initiation failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const finalizeRegistration = async (reservationId: string, paymentIntentId?: string, overrideAttendeeInfo?: AttendeeInfo[]) => {
        setIsProcessing(true);
        console.log("[useEventRegister] Finalizing registration for reservation:", reservationId);

        const payloadAttendeeInfo = overrideAttendeeInfo || attendeeInfo;
        console.log("[useEventRegister] Sending attendeeInfo payload:", JSON.stringify(payloadAttendeeInfo, null, 2));

        try {
            const res = await eventService.finalizeRegistration(eventId, {
                reservationId,
                paymentIntentId,
                attendeeInfo: payloadAttendeeInfo,
            });
            if (res.success) {
                setStep('SUCCESS');
                // Cleanup timer but keep reservation for display
                setReservationExpiry(null);
            }
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setIsProcessing(false);
        }
    };

    // Keep old signature for backward compat
    const handleFinalize = async (paymentIntentId?: string) => {
        if (!reservation) return;
        await finalizeRegistration(reservation._id, paymentIntentId);
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
        setStep,
        selectedTicketId,
        setSelectedTicketId,
        quantity,
        setQuantity,
        attendeeInfo,
        setAttendeeInfo,
        reservation,
        timeLeft,
        isExpired,
        error,
        isProcessing,
        handleNextFromTicketSelection,
        handleNextFromAttendeeInfo,
        handleProceedToPayment,
        handleFinalize,
        paymentIntent,
        cancelSession
    };
};
