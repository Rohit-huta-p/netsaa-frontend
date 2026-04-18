import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Modal,
    StyleSheet,
    Image,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    ChevronLeft,
    Lock,
    Calendar,
    Minus,
    Plus,
    CreditCard,
    Wallet,
    ShieldCheck,
    Clock,
    Tag,
    ChevronDown,
} from 'lucide-react-native';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { useEventRegister } from '@/hooks/useEventRegister';
import { SuccessStep } from './registration/SuccessStep';
import { IEvent } from '@/types/event';

interface EventRegisterSheetProps {
    visible: boolean;
    onClose: () => void;
    eventId: string;
    ticketTypes: any[];
    ticketPrice?: number;
    event?: IEvent;
}

type AttendeeFormValue = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company: string;
};

type FormValues = {
    attendees: AttendeeFormValue[];
};

export const EventRegisterSheet: React.FC<EventRegisterSheetProps> = ({
    visible,
    onClose,
    eventId,
    ticketTypes,
    ticketPrice,
    event,
}) => {
    const {
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
        cancelSession,
    } = useEventRegister(eventId, ticketTypes, onClose);

    const router = useRouter();

    const [checkoutStep, setCheckoutStep] = useState<'ATTENDEES' | 'PAYMENT'>('ATTENDEES');
    const [expandedAccordion, setExpandedAccordion] = useState<number>(0);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card');

    const isFreeEvent =
        (ticketPrice === 0 || !ticketPrice) &&
        (!ticketTypes || ticketTypes.every((t: any) => t.price === 0));

    // Auto-select single ticket type
    useEffect(() => {
        if (ticketTypes?.length === 1 && !selectedTicketId) {
            setSelectedTicketId(ticketTypes[0]._id);
        }
    }, [ticketTypes, selectedTicketId]);

    // Determine the price per ticket
    const getTicketPrice = (): number => {
        if (selectedTicketId && ticketTypes?.length > 0) {
            const selectedTicket = ticketTypes.find((t: any) => t._id === selectedTicketId);
            return selectedTicket?.price || 0;
        }
        return ticketPrice || 0;
    };

    const unitPrice = getTicketPrice();
    const totalAmount = unitPrice * quantity;

    // Form setup
    const {
        control,
        formState: { errors, isValid },
        watch,
        getValues,
    } = useForm<FormValues>({
        defaultValues: { attendees: [{ firstName: '', lastName: '', email: '', phone: '', company: '' }] },
        mode: 'onChange',
    });

    const { fields, replace } = useFieldArray({
        control,
        name: 'attendees',
    });

    // Keep attendee form instances in sync with quantity
    useEffect(() => {
        const currentAttendees = getValues('attendees') || [];
        if (currentAttendees.length < quantity) {
            // Add more attendees
            const padding = Array(quantity - currentAttendees.length).fill({
                firstName: '', lastName: '', email: '', phone: '', company: ''
            });
            replace([...currentAttendees, ...padding]);
        } else if (currentAttendees.length > quantity) {
            // Remove extra attendees
            replace(currentAttendees.slice(0, quantity));
        }
    }, [quantity, replace, getValues]);

    // Sync form data to parent attendeeInfo on changes
    const watchedValues = watch('attendees');
    useEffect(() => {
        if (watchedValues && watchedValues.length > 0) {
            const mappedAttendees = watchedValues.map(att => ({
                fullName: `${att?.firstName || ''} ${att?.lastName || ''}`.trim() || 'Attendee',
                email: att?.email || '',
                phone: att?.phone || '',
                notes: att?.company ? `Company: ${att.company}` : '',
            }));
            setAttendeeInfo(mappedAttendees);
        }
    }, [watchedValues]);

    // Unified submit handler
    const onFormSubmit = async () => {
        // Validate at least first attendee name is present
        const currentAttendees = getValues('attendees');
        const firstValid = currentAttendees?.[0]?.firstName?.trim();
        if (!firstValid) return; // Prevent advancing if blank

        // Sync to parent explicitly before advancing to avoid async state drops
        const mappedAttendees = currentAttendees.map((att: any) => ({
            fullName: `${att?.firstName || ''} ${att?.lastName || ''}`.trim() || 'Attendee',
            email: att?.email || '',
            phone: att?.phone || '',
            notes: att?.company ? `Company: ${att.company}` : '',
        }));
        setAttendeeInfo(mappedAttendees);

        if (checkoutStep === 'ATTENDEES') {
            if (isFreeEvent) {
                // Free event skips payment entirely
                await handleNextFromAttendeeInfo(mappedAttendees);
            } else {
                setCheckoutStep('PAYMENT');
            }
        } else if (checkoutStep === 'PAYMENT') {
            // Process payment logic for paid events
            await handleNextFromAttendeeInfo(mappedAttendees);
        }
    };

    // Format event dates
    const formatDateRange = () => {
        if (!event?.schedule?.startDate) return 'TBD';
        const start = new Date(event.schedule.startDate);
        const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (event.schedule?.endDate) {
            const end = new Date(event.schedule.endDate);
            const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return `${startStr} - ${endStr}`;
        }
        return startStr;
    };

    const imageUri = event?.coverImage || event?.image;

    // Ticket name
    const ticketName = (): string => {
        if (selectedTicketId && ticketTypes?.length > 0) {
            const ticket = ticketTypes.find((t: any) => t._id === selectedTicketId);
            return ticket?.name || 'General Admission';
        }
        return 'General Admission';
    };

    // Show timer banner
    const showTimerBanner =
        !!reservation && step !== 'SUCCESS' && step !== 'TICKET_SELECTION';

    // CTA label
    const ctaLabel = (): string => {
        if (isProcessing) return 'Processing...';
        if (isFreeEvent) return `Register Free · ${quantity} ${quantity === 1 ? 'ticket' : 'tickets'}`;
        if (checkoutStep === 'PAYMENT' || step === 'ORDER_SUMMARY') return `Pay ₹${reservation?.totalAmount || totalAmount}`;
        return `Continue to Payment`;
    };

    const isCtaDisabled = (): boolean => {
        if (isProcessing) return true;
        if (isExpired && step === 'ORDER_SUMMARY') return true;

        // Attendee info validation: at minimum need firstName and phone for all required attendees
        const currentAttendees = watch('attendees') || [];
        const hasMissingRequiredFields = currentAttendees.some(
            att => !att?.firstName?.trim() || !att?.phone?.trim()
        );
        if (checkoutStep === 'ATTENDEES' && hasMissingRequiredFields) return true;

        if (checkoutStep === 'PAYMENT' && !termsAccepted) return true;
        return false;
    };

    const handleCtaPress = async () => {
        if (step === 'ORDER_SUMMARY') {
            await handleProceedToPayment();
        } else {
            // Need to select ticket first if not auto-selected
            if (!selectedTicketId && ticketTypes?.length > 0) {
                handleNextFromTicketSelection();
                return;
            }
            await onFormSubmit();
        }
    };

    // ── SUCCESS VIEW ──────────────────────────────────────────────
    if (step === 'SUCCESS') {
        return (
            <View style={styles.fullScreen}>
                <SuccessStep
                    onClose={() => router.back()}
                    eventTitle={event?.title}
                    eventDate={event?.schedule?.startDate}
                />
            </View>
        );
    }

    // ── CHECKOUT VIEW ─────────────────────────────────────────────
    return (
        <View style={styles.fullScreen}>
            {/* ─── TOP NAV ─── */}
            <View style={styles.topNav}>
                <TouchableOpacity
                    onPress={() => {
                        if (checkoutStep === 'PAYMENT') {
                            setCheckoutStep('ATTENDEES');
                        } else {
                            router.back();
                        }
                    }}
                    style={styles.backRow}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <View style={styles.backCircle}>
                        <ChevronLeft size={18} color="#a1a1aa" />
                    </View>
                    <Text style={styles.backLabel}>
                        {checkoutStep === 'PAYMENT' ? 'Back' : 'Back to Event'}
                    </Text>
                </TouchableOpacity>

                <View style={styles.secureLockRow}>
                    <Lock size={14} color="#71717a" />
                    <Text style={styles.secureLabel}>Secure Checkout</Text>
                </View>

                <View style={{ width: 32 }} />
            </View>

            {/* ─── TIMER BANNER ─── */}
            {showTimerBanner && (
                <View
                    style={[
                        styles.timerBanner,
                        isExpired ? styles.timerExpired : styles.timerActive,
                    ]}
                >
                    <View style={styles.timerLeft}>
                        <Clock
                            size={14}
                            color={isExpired ? '#EF4444' : '#fb923c'}
                        />
                        <Text
                            style={[
                                styles.timerLabel,
                                isExpired ? styles.timerTextExpired : styles.timerTextActive,
                            ]}
                        >
                            {isExpired ? 'Reservation expired' : 'Ticket reserved for'}
                        </Text>
                    </View>
                    {!isExpired && (
                        <Text style={styles.timerCountdown}>{timeLeft}</Text>
                    )}
                </View>
            )}

            {/* ─── ERROR BANNER ─── */}
            {error && (
                <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {/* ─── BODY ─── */}
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={0}
            >
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* ────── ORDER SUMMARY CARD ────── */}
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryTitle}>Order Summary</Text>

                        {/* Event Mini Card */}
                        <View style={styles.eventRow}>
                            <Image
                                source={imageUri ? { uri: imageUri } : require('@/assets/netsaa.png')}
                                style={styles.eventThumb}
                            />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.eventName} numberOfLines={2}>
                                    {event?.title || 'Event'}
                                </Text>
                                <View style={styles.dateRow}>
                                    <Calendar size={13} color="#a1a1aa" />
                                    <Text style={styles.dateText}>{formatDateRange()}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.dashedDivider} />

                        {/* Line Items */}
                        <View style={{ gap: 14 }}>
                            {/* Ticket + Qty */}
                            <View style={styles.lineItemRow}>
                                <View>
                                    <Text style={styles.lineItemLabel}>{ticketName()}</Text>
                                    {/* Quantity Stepper */}
                                    <View style={styles.qtyContainer}>
                                        <Text style={styles.qtyLabel}>Qty</Text>
                                        <View style={styles.qtyStepper}>
                                            <TouchableOpacity
                                                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                                                style={styles.qtyBtn}
                                            >
                                                <Minus size={11} color="#a1a1aa" />
                                            </TouchableOpacity>
                                            <Text style={styles.qtyValue}>{quantity}</Text>
                                            <TouchableOpacity
                                                onPress={() => setQuantity(Math.min(10, quantity + 1))}
                                                style={styles.qtyBtn}
                                            >
                                                <Plus size={11} color="#a1a1aa" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                                <Text style={styles.lineItemPrice}>
                                    {isFreeEvent ? 'Free' : `₹${unitPrice}`}
                                </Text>
                            </View>

                            {/* Processing Fee */}
                            {!isFreeEvent && (
                                <View style={styles.lineItemRowSimple}>
                                    <Text style={styles.feeLabel}>Processing Fee</Text>
                                    <Text style={styles.feeValue}>₹0.00</Text>
                                </View>
                            )}

                            {/* Promo Code */}
                            {!isFreeEvent && (
                                <TouchableOpacity style={styles.promoRow}>
                                    <Tag size={13} color="#a78bfa" />
                                    <Text style={styles.promoText}>Add promo code</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={styles.solidDivider} />

                        {/* Total */}
                        <View style={styles.totalRow}>
                            <View>
                                <Text style={styles.totalLabel}>Total</Text>
                                {!isFreeEvent && (
                                    <Text style={styles.totalSub}>Including taxes</Text>
                                )}
                            </View>
                            <Text style={styles.totalAmount}>
                                {isFreeEvent ? 'Free' : `₹${totalAmount}`}
                            </Text>
                        </View>
                    </View>

                    {/* ────── CHECKOUT FORM ────── */}
                    <View style={{ marginTop: 32 }}>
                        <Text style={styles.heading}>Complete your registration</Text>
                        <Text style={styles.subheading}>
                            Please provide your details to secure your ticket.
                        </Text>
                    </View>

                    {/* STEP 1: ATTENDEES */}
                    {checkoutStep === 'ATTENDEES' && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionBadge}>
                                    <Text style={styles.sectionBadgeText}>1</Text>
                                </View>
                                <Text style={styles.sectionTitle}>Attendee Information</Text>
                            </View>

                            {/* Accordion For Each Attendee (Mapped by quantity) */}
                            {fields.map((attendeeField, index) => {
                                const isExpanded = expandedAccordion === index;
                                return (
                                    <View key={attendeeField.id} style={{ marginBottom: 16 }}>
                                        {/* Accordion Header */}
                                        <TouchableOpacity
                                            activeOpacity={0.7}
                                            onPress={() => setExpandedAccordion(isExpanded ? -1 : index)}
                                            style={[styles.accordionHeader, isExpanded && styles.accordionHeaderActive]}
                                        >
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                <View style={styles.attendeeAvatar}>
                                                    <Text style={styles.attendeeAvatarText}>{(index + 1).toString()}</Text>
                                                </View>
                                                <View>
                                                    <Text style={styles.accordionTitle}>
                                                        {watchedValues?.[index]?.firstName || watchedValues?.[index]?.lastName
                                                            ? `${watchedValues[index].firstName || ''} ${watchedValues[index].lastName || ''}`.trim()
                                                            : `Attendee ${index + 1}`}
                                                    </Text>
                                                    {!isExpanded && (
                                                        <Text style={styles.accordionSubtitle}>
                                                            {watchedValues?.[index]?.email || 'Not provided'}
                                                        </Text>
                                                    )}
                                                </View>
                                            </View>
                                            <ChevronDown
                                                size={20}
                                                color="#a1a1aa"
                                                style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}
                                            />
                                        </TouchableOpacity>

                                        {/* Accordion Body */}
                                        {isExpanded && (
                                            <View style={styles.accordionBody}>
                                                <View style={styles.fieldGrid}>
                                                    {/* First Name */}
                                                    <View style={styles.fieldHalf}>
                                                        <Text style={styles.fieldLabel}>First Name</Text>
                                                        <Controller
                                                            control={control}
                                                            name={`attendees.${index}.firstName` as const}
                                                            rules={{ required: 'Required' }}
                                                            render={({ field: { onChange, onBlur, value } }) => (
                                                                <TextInput
                                                                    style={[styles.input, errors?.attendees?.[index]?.firstName && styles.inputError]}
                                                                    placeholder="Jane"
                                                                    placeholderTextColor="#52525b"
                                                                    value={value}
                                                                    onChangeText={onChange}
                                                                    onBlur={onBlur}
                                                                    autoCapitalize="words"
                                                                />
                                                            )}
                                                        />
                                                    </View>

                                                    {/* Last Name */}
                                                    <View style={styles.fieldHalf}>
                                                        <Text style={styles.fieldLabel}>Last Name</Text>
                                                        <Controller
                                                            control={control}
                                                            name={`attendees.${index}.lastName` as const}
                                                            render={({ field: { onChange, onBlur, value } }) => (
                                                                <TextInput
                                                                    style={styles.input}
                                                                    placeholder="Doe"
                                                                    placeholderTextColor="#52525b"
                                                                    value={value}
                                                                    onChangeText={onChange}
                                                                    onBlur={onBlur}
                                                                    autoCapitalize="words"
                                                                />
                                                            )}
                                                        />
                                                    </View>

                                                    {/* Email */}
                                                    <View style={styles.fieldFull}>
                                                        <Text style={styles.fieldLabel}>Email Address (Optional)</Text>
                                                        <Controller
                                                            control={control}
                                                            name={`attendees.${index}.email` as const}
                                                            rules={{ validate: (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || 'Invalid email' }}
                                                            render={({ field: { onChange, onBlur, value } }) => (
                                                                <TextInput
                                                                    style={[styles.input, errors?.attendees?.[index]?.email && styles.inputError]}
                                                                    placeholder="jane@example.com"
                                                                    placeholderTextColor="#52525b"
                                                                    value={value}
                                                                    onChangeText={onChange}
                                                                    onBlur={onBlur}
                                                                    keyboardType="email-address"
                                                                    autoCapitalize="none"
                                                                    autoCorrect={false}
                                                                />
                                                            )}
                                                        />
                                                    </View>

                                                    {/* Phone */}
                                                    <View style={styles.fieldFull}>
                                                        <Text style={styles.fieldLabel}>Phone Number</Text>
                                                        <Controller
                                                            control={control}
                                                            name={`attendees.${index}.phone` as const}
                                                            rules={{ required: 'Required' }}
                                                            render={({ field: { onChange, onBlur, value } }) => (
                                                                <TextInput
                                                                    style={[styles.input, errors?.attendees?.[index]?.phone && styles.inputError]}
                                                                    placeholder="+1 (555) 000-0000"
                                                                    placeholderTextColor="#52525b"
                                                                    value={value}
                                                                    onChangeText={onChange}
                                                                    onBlur={onBlur}
                                                                    keyboardType="phone-pad"
                                                                />
                                                            )}
                                                        />
                                                    </View>

                                                    {/* Company (Optional) */}
                                                    <View style={styles.fieldFull}>
                                                        <Text style={styles.fieldLabel}>Company (Optional)</Text>
                                                        <Controller
                                                            control={control}
                                                            name={`attendees.${index}.company` as const}
                                                            render={({ field: { onChange, onBlur, value } }) => (
                                                                <TextInput
                                                                    style={styles.input}
                                                                    placeholder="Acme Corp"
                                                                    placeholderTextColor="#52525b"
                                                                    value={value}
                                                                    onChangeText={onChange}
                                                                    onBlur={onBlur}
                                                                />
                                                            )}
                                                        />
                                                    </View>
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    {/* STEP 2: PAYMENT (non-free events only) */}
                    {checkoutStep === 'PAYMENT' && !isFreeEvent && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionBadge}>
                                    <Text style={styles.sectionBadgeText}>2</Text>
                                </View>
                                <Text style={styles.sectionTitle}>Payment Method</Text>
                            </View>

                            {/* Payment Options */}
                            <View style={styles.paymentGrid}>
                                <TouchableOpacity
                                    onPress={() => setPaymentMethod('card')}
                                    style={[
                                        styles.paymentOption,
                                        paymentMethod === 'card'
                                            ? styles.paymentOptionActive
                                            : styles.paymentOptionInactive,
                                    ]}
                                >
                                    <CreditCard
                                        size={22}
                                        color={paymentMethod === 'card' ? '#a78bfa' : '#a1a1aa'}
                                    />
                                    <Text
                                        style={[
                                            styles.paymentOptionLabel,
                                            paymentMethod === 'card' && { color: '#ffffff' },
                                        ]}
                                    >
                                        Credit Card
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setPaymentMethod('upi')}
                                    style={[
                                        styles.paymentOption,
                                        paymentMethod === 'upi'
                                            ? styles.paymentOptionActive
                                            : styles.paymentOptionInactive,
                                    ]}
                                >
                                    {/* Using Zap as a generic UPI-like fast payment icon */}
                                    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: paymentMethod === 'upi' ? '#a78bfa22' : 'transparent', borderRadius: 4 }}>
                                        <Text style={{ color: paymentMethod === 'upi' ? '#a78bfa' : '#a1a1aa', fontWeight: '900', fontSize: 13 }}>UPI</Text>
                                    </View>
                                    <Text
                                        style={[
                                            styles.paymentOptionLabel,
                                            paymentMethod === 'upi' && { color: '#ffffff' },
                                        ]}
                                    >
                                        UPI / Apps
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Card Input Fields (placeholder) */}
                            {paymentMethod === 'card' && (
                                <View style={styles.cardInputWrapper}>
                                    <View style={styles.cardTopRow}>
                                        <TextInput
                                            style={styles.cardInput}
                                            placeholder="Card number"
                                            placeholderTextColor="#52525b"
                                            keyboardType="number-pad"
                                        />
                                        <View style={styles.cardBrandsRow}>
                                            <View style={styles.cardBrand} />
                                            <View style={styles.cardBrand} />
                                        </View>
                                    </View>
                                    <View style={styles.cardBottomRow}>
                                        <View style={styles.cardHalf}>
                                            <TextInput
                                                style={styles.cardInput}
                                                placeholder="MM / YY"
                                                placeholderTextColor="#52525b"
                                            />
                                        </View>
                                        <View style={styles.cardHalfRight}>
                                            <TextInput
                                                style={styles.cardInput}
                                                placeholder="CVC"
                                                placeholderTextColor="#52525b"
                                            />
                                        </View>
                                    </View>
                                </View>
                            )}

                            {/* Name on Card */}
                            {paymentMethod === 'card' && (
                                <View style={{ marginTop: 14 }}>
                                    <Text style={styles.fieldLabel}>Name on Card</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Jane Doe"
                                        placeholderTextColor="#52525b"
                                        autoCapitalize="words"
                                    />
                                </View>
                            )}

                            {/* Terms Checkbox */}
                            <TouchableOpacity
                                onPress={() => setTermsAccepted(!termsAccepted)}
                                style={styles.termsRow}
                                activeOpacity={0.7}
                            >
                                <View
                                    style={[
                                        styles.checkbox,
                                        termsAccepted && styles.checkboxChecked,
                                    ]}
                                >
                                    {termsAccepted && (
                                        <Text style={styles.checkmark}>✓</Text>
                                    )}
                                </View>
                                <Text style={styles.termsText}>
                                    I accept the{' '}
                                    <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                                    <Text style={styles.termsLink}>Privacy Policy</Text>. I
                                    understand that tickets are non-refundable within 7 days of
                                    the event.
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Spacer for sticky CTA */}
                    <View style={{ height: 100 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* ─── STICKY BOTTOM CTA ─── */}
            <View style={styles.ctaContainer}>
                <TouchableOpacity
                    onPress={handleCtaPress}
                    disabled={isCtaDisabled()}
                    style={[
                        styles.ctaButton,
                        isCtaDisabled() && styles.ctaButtonDisabled,
                    ]}
                    activeOpacity={0.85}
                >
                    {isProcessing ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <>
                            <Text style={styles.ctaText}>{ctaLabel()}</Text>
                            <Lock size={14} color="#ffffff" style={{ marginLeft: 6 }} />
                        </>
                    )}
                </TouchableOpacity>
                {!isFreeEvent && (
                    <View style={styles.sslRow}>
                        <ShieldCheck size={13} color="#71717a" />
                        <Text style={styles.sslText}>Secure SSL encryption</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

// ─── STYLES ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
    fullScreen: {
        flex: 1,
        backgroundColor: '#09090b', // zinc-950
    },

    // ── Top Navigation ──
    topNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 56 : 16,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#27272a',
        backgroundColor: 'rgba(9,9,11,0.85)',
    },
    backRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    backCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#18181b',
        borderWidth: 1,
        borderColor: '#27272a',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backLabel: {
        color: '#a1a1aa',
        fontSize: 13,
        fontWeight: '500',
    },
    secureLockRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    secureLabel: {
        color: '#d4d4d8',
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0.2,
    },

    // ── Timer ──
    timerBanner: {
        marginHorizontal: 20,
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    timerActive: {
        backgroundColor: 'rgba(251, 146, 60, 0.1)',
        borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    timerExpired: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    timerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    timerLabel: { fontSize: 13, marginLeft: 4 },
    timerTextActive: { color: '#fb923c' },
    timerTextExpired: { color: '#EF4444' },
    timerCountdown: {
        color: '#fb923c',
        fontWeight: '700',
        fontSize: 16,
        fontVariant: ['tabular-nums'],
    },

    // ── Error ──
    errorBanner: {
        marginHorizontal: 20,
        marginTop: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        padding: 12,
        borderRadius: 12,
    },
    errorText: { color: '#f87171', fontSize: 13 },

    // ── Scroll Body ──
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 40,
    },

    // ── Order Summary Card ──
    summaryCard: {
        padding: 24,
        borderRadius: 24,
        backgroundColor: 'rgba(24,24,27,0.5)',
        borderWidth: 1,
        borderColor: '#27272a',
        gap: 20,
    },
    summaryTitle: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '500',
    },
    eventRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    eventThumb: {
        width: 56,
        height: 56,
        borderRadius: 10,
        backgroundColor: '#27272a',
        borderWidth: 1,
        borderColor: '#27272a',
    },
    eventName: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: -0.2,
        marginBottom: 4,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    dateText: { color: '#a1a1aa', fontSize: 12 },
    dashedDivider: {
        borderBottomWidth: 1,
        borderStyle: 'dashed',
        borderBottomColor: '#27272a',
    },
    solidDivider: {
        borderBottomWidth: 1,
        borderBottomColor: '#27272a',
    },

    // ── Line Items ──
    lineItemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    lineItemLabel: { color: '#d4d4d8', fontSize: 14 },
    lineItemPrice: { color: '#ffffff', fontSize: 14, fontWeight: '500' },
    qtyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
    },
    qtyLabel: { color: '#71717a', fontSize: 12 },
    qtyStepper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#09090b',
        borderWidth: 1,
        borderColor: '#27272a',
        borderRadius: 6,
    },
    qtyBtn: {
        width: 26,
        height: 26,
        alignItems: 'center',
        justifyContent: 'center',
    },
    qtyValue: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '500',
        width: 26,
        textAlign: 'center',
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#27272a',
        lineHeight: 26,
    },
    lineItemRowSimple: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    feeLabel: { color: '#a1a1aa', fontSize: 14 },
    feeValue: { color: '#ffffff', fontSize: 14 },
    promoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingTop: 4,
    },
    promoText: {
        color: '#a78bfa',
        fontSize: 12,
        fontWeight: '500',
    },

    // ── Total ──
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    totalLabel: { color: '#ffffff', fontSize: 14, fontWeight: '500' },
    totalSub: { color: '#71717a', fontSize: 12, marginTop: 2 },
    totalAmount: {
        color: '#ffffff',
        fontSize: 30,
        fontWeight: '600',
        letterSpacing: -1,
    },

    // ── Heading ──
    heading: {
        color: '#ffffff',
        fontSize: 24,
        fontWeight: '600',
        letterSpacing: -0.5,
        marginBottom: 6,
    },
    subheading: {
        color: '#a1a1aa',
        fontSize: 14,
    },

    // ── Sections ──
    section: {
        marginTop: 32,
        gap: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#27272a',
        paddingBottom: 12,
    },
    sectionBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#27272a',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionBadgeText: { color: '#d4d4d8', fontSize: 10 },
    sectionTitle: { color: '#ffffff', fontSize: 14, fontWeight: '500' },

    // ── Fields ──
    fieldGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 14,
    },
    fieldHalf: { width: '47%', gap: 6 },
    fieldFull: { width: '100%', gap: 6 },
    fieldLabel: {
        color: '#a1a1aa',
        fontSize: 12,
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#18181b',
        borderWidth: 1,
        borderColor: '#27272a',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        color: '#ffffff',
        fontSize: 14,
    },
    inputError: {
        borderColor: 'rgba(139, 92, 246, 0.6)',
    },

    // ── Accordion ──
    accordionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#18181b',
        borderRadius: 16,
    },
    accordionHeaderActive: {
        backgroundColor: '#27272a',
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#3f3f46',
    },
    accordionBody: {
        padding: 16,
        backgroundColor: '#18181b',
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
    },
    accordionTitle: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '600',
    },
    accordionSubtitle: {
        color: '#a1a1aa',
        fontSize: 13,
        marginTop: 2,
    },
    attendeeAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#3f3f46',
        alignItems: 'center',
        justifyContent: 'center',
    },
    attendeeAvatarText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '700',
    },

    // ── Payment ──
    paymentGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    paymentOption: {
        flex: 1,
        paddingVertical: 18,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    paymentOptionActive: {
        borderColor: 'rgba(139, 92, 246, 0.6)',
        backgroundColor: 'rgba(139, 92, 246, 0.05)',
    },
    paymentOptionInactive: {
        borderColor: '#27272a',
        backgroundColor: '#18181b',
    },
    paymentOptionLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#d4d4d8',
    },

    // ── Card Input ──
    cardInputWrapper: {
        marginTop: 20,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#27272a',
        backgroundColor: '#18181b',
        overflow: 'hidden',
    },
    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#27272a',
        paddingHorizontal: 4,
    },
    cardInput: {
        flex: 1,
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: '#ffffff',
        fontSize: 14,
    },
    cardBrandsRow: {
        flexDirection: 'row',
        gap: 4,
        paddingRight: 12,
    },
    cardBrand: {
        width: 32,
        height: 20,
        borderRadius: 4,
        backgroundColor: '#27272a',
        borderWidth: 1,
        borderColor: '#3f3f46',
    },
    cardBottomRow: {
        flexDirection: 'row',
    },
    cardHalf: {
        flex: 1,
        borderRightWidth: 1,
        borderRightColor: '#27272a',
        paddingHorizontal: 4,
    },
    cardHalfRight: {
        flex: 1,
        paddingHorizontal: 4,
    },

    // ── Terms ──
    termsRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginTop: 20,
        paddingTop: 16,
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#3f3f46',
        backgroundColor: '#18181b',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    checkboxChecked: {
        backgroundColor: '#7c3aed',
        borderColor: '#7c3aed',
    },
    checkmark: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '700',
    },
    termsText: {
        flex: 1,
        color: '#a1a1aa',
        fontSize: 12,
        lineHeight: 18,
    },
    termsLink: {
        color: '#ffffff',
        textDecorationLine: 'underline',
    },

    // ── Sticky CTA ──
    ctaContainer: {
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: Platform.OS === 'ios' ? 36 : 20,
        borderTopWidth: 1,
        borderTopColor: '#27272a',
        backgroundColor: '#09090b',
    },
    ctaButton: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 14,
        backgroundColor: '#7c3aed',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 10,
    },
    ctaButtonDisabled: {
        backgroundColor: '#27272a',
        shadowOpacity: 0,
    },
    ctaText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    sslRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        marginTop: 12,
    },
    sslText: {
        color: '#71717a',
        fontSize: 12,
        fontWeight: '500',
    },
});