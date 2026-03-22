import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    LayoutAnimation,
    UIManager,
} from 'react-native';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { User, Mail, Phone, FileText, ChevronDown, ChevronUp, Plus, Minus } from 'lucide-react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type AttendeeInfo = {
    fullName: string;
    email?: string;
    phone: string;
    notes?: string;
};

type FormValues = {
    attendees: AttendeeInfo[];
};

interface AttendeeInfoStepProps {
    attendees: AttendeeInfo[];
    quantity: number;
    onQuantityChange: (q: number) => void;
    onChange: (data: AttendeeInfo[]) => void;
    onNext: () => void;
    onBack: () => void;
    loading?: boolean;
}

export const AttendeeInfoStep: React.FC<AttendeeInfoStepProps> = ({
    attendees,
    quantity,
    onQuantityChange,
    onChange,
    onNext,
    onBack,
    loading = false,
}) => {
    const [expandedIndex, setExpandedIndex] = useState(0);

    const {
        control,
        handleSubmit,
        formState: { errors, isValid },
        watch,
        setValue,
        getValues,
    } = useForm<FormValues>({
        defaultValues: {
            attendees: attendees.length > 0 ? attendees : [{ fullName: '', email: '', phone: '', notes: '' }],
        },
        mode: 'onChange',
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'attendees',
    });

    // Sync quantity changes with field array
    useEffect(() => {
        const currentCount = fields.length;
        if (quantity > currentCount) {
            for (let i = currentCount; i < quantity; i++) {
                append({ fullName: '', email: '', phone: '', notes: '' });
            }
        } else if (quantity < currentCount) {
            for (let i = currentCount - 1; i >= quantity; i--) {
                remove(i);
            }
        }
    }, [quantity]);

    // Sync form data back to parent
    const watchedValues = watch('attendees');
    useEffect(() => {
        if (watchedValues) {
            onChange(watchedValues);
        }
    }, [JSON.stringify(watchedValues)]);

    const toggleAccordion = (index: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedIndex(expandedIndex === index ? -1 : index);
    };

    const isAttendeeValid = (index: number): boolean => {
        const attendee = watchedValues?.[index];
        if (!attendee) return false;
        return attendee.fullName.trim().length > 0 && attendee.phone.trim().length >= 10;
    };

    const allAttendeesValid = (): boolean => {
        if (!watchedValues || watchedValues.length !== quantity) return false;
        return watchedValues.every(
            (a) => a.fullName.trim().length > 0 && a.phone.trim().length >= 10
        );
    };

    const onSubmit = (data: FormValues) => {
        onChange(data.attendees);
        onNext();
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={120}
        >
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Quantity Selector */}
                <View style={styles.quantityContainer}>
                    <Text style={styles.quantityLabel}>Number of Tickets</Text>
                    <View style={styles.quantityRow}>
                        <TouchableOpacity
                            onPress={() => onQuantityChange(Math.max(1, quantity - 1))}
                            style={styles.quantityButton}
                            disabled={loading}
                        >
                            <Minus size={16} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.quantityValue}>{quantity}</Text>
                        <TouchableOpacity
                            onPress={() => onQuantityChange(Math.min(10, quantity + 1))}
                            style={styles.quantityButton}
                            disabled={loading}
                        >
                            <Plus size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Attendee Accordions */}
                <Text style={styles.sectionTitle}>Attendee Details</Text>
                <Text style={styles.sectionSubtitle}>
                    Fill in details for {quantity === 1 ? 'the attendee' : `all ${quantity} attendees`}
                </Text>

                {fields.map((field, index) => {
                    const isExpanded = expandedIndex === index;
                    const valid = isAttendeeValid(index);

                    return (
                        <View key={field.id} style={styles.accordionContainer}>
                            {/* Accordion Header */}
                            <TouchableOpacity
                                onPress={() => toggleAccordion(index)}
                                style={[
                                    styles.accordionHeader,
                                    isExpanded && styles.accordionHeaderExpanded,
                                ]}
                                activeOpacity={0.7}
                            >
                                <View style={styles.accordionHeaderLeft}>
                                    <View style={[styles.statusDot, valid ? styles.statusDotValid : styles.statusDotInvalid]} />
                                    <Text style={styles.accordionTitle}>
                                        {watchedValues?.[index]?.fullName?.trim() || `Attendee ${index + 1}`}
                                    </Text>
                                </View>
                                {isExpanded
                                    ? <ChevronUp size={18} color="#71717a" />
                                    : <ChevronDown size={18} color="#71717a" />
                                }
                            </TouchableOpacity>

                            {/* Accordion Body */}
                            {isExpanded && (
                                <View style={styles.accordionBody}>
                                    {/* Full Name */}
                                    <View style={styles.fieldContainer}>
                                        <View style={styles.labelRow}>
                                            <User size={13} color="#a1a1aa" />
                                            <Text style={styles.label}>Full Name</Text>
                                        </View>
                                        <Controller
                                            control={control}
                                            name={`attendees.${index}.fullName`}
                                            rules={{ required: 'Full name is required' }}
                                            render={({ field: { onChange: onFieldChange, onBlur, value } }) => (
                                                <TextInput
                                                    style={[
                                                        styles.input,
                                                        errors.attendees?.[index]?.fullName && styles.inputError,
                                                    ]}
                                                    placeholder="John Doe"
                                                    placeholderTextColor="#52525b"
                                                    value={value}
                                                    onChangeText={onFieldChange}
                                                    onBlur={onBlur}
                                                    returnKeyType="next"
                                                    autoCapitalize="words"
                                                />
                                            )}
                                        />
                                        {errors.attendees?.[index]?.fullName && (
                                            <Text style={styles.errorText}>{errors.attendees[index]?.fullName?.message}</Text>
                                        )}
                                    </View>

                                    {/* Email (Optional) */}
                                    <View style={styles.fieldContainer}>
                                        <View style={styles.labelRow}>
                                            <Mail size={13} color="#a1a1aa" />
                                            <Text style={styles.label}>Email</Text>
                                            <Text style={styles.optionalTag}>Optional</Text>
                                        </View>
                                        <Controller
                                            control={control}
                                            name={`attendees.${index}.email`}
                                            rules={{
                                                pattern: {
                                                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                                    message: 'Enter a valid email',
                                                },
                                            }}
                                            render={({ field: { onChange: onFieldChange, onBlur, value } }) => (
                                                <TextInput
                                                    style={[
                                                        styles.input,
                                                        errors.attendees?.[index]?.email && styles.inputError,
                                                    ]}
                                                    placeholder="john@example.com"
                                                    placeholderTextColor="#52525b"
                                                    value={value}
                                                    onChangeText={onFieldChange}
                                                    onBlur={onBlur}
                                                    returnKeyType="next"
                                                    keyboardType="email-address"
                                                    autoCapitalize="none"
                                                    autoCorrect={false}
                                                />
                                            )}
                                        />
                                        {errors.attendees?.[index]?.email && (
                                            <Text style={styles.errorText}>{errors.attendees[index]?.email?.message}</Text>
                                        )}
                                    </View>

                                    {/* Phone */}
                                    <View style={styles.fieldContainer}>
                                        <View style={styles.labelRow}>
                                            <Phone size={13} color="#a1a1aa" />
                                            <Text style={styles.label}>Phone</Text>
                                        </View>
                                        <Controller
                                            control={control}
                                            name={`attendees.${index}.phone`}
                                            rules={{
                                                required: 'Phone number is required',
                                                minLength: {
                                                    value: 10,
                                                    message: 'Enter a valid phone number',
                                                },
                                            }}
                                            render={({ field: { onChange: onFieldChange, onBlur, value } }) => (
                                                <TextInput
                                                    style={[
                                                        styles.input,
                                                        errors.attendees?.[index]?.phone && styles.inputError,
                                                    ]}
                                                    placeholder="+91 98765 43210"
                                                    placeholderTextColor="#52525b"
                                                    value={value}
                                                    onChangeText={onFieldChange}
                                                    onBlur={onBlur}
                                                    returnKeyType="next"
                                                    keyboardType="phone-pad"
                                                />
                                            )}
                                        />
                                        {errors.attendees?.[index]?.phone && (
                                            <Text style={styles.errorText}>{errors.attendees[index]?.phone?.message}</Text>
                                        )}
                                    </View>

                                    {/* Notes (Optional) */}
                                    <View style={styles.fieldContainer}>
                                        <View style={styles.labelRow}>
                                            <FileText size={13} color="#a1a1aa" />
                                            <Text style={styles.label}>Notes</Text>
                                            <Text style={styles.optionalTag}>Optional</Text>
                                        </View>
                                        <Controller
                                            control={control}
                                            name={`attendees.${index}.notes`}
                                            render={({ field: { onChange: onFieldChange, onBlur, value } }) => (
                                                <TextInput
                                                    style={[styles.input, styles.textArea]}
                                                    placeholder="Dietary needs, accessibility, etc."
                                                    placeholderTextColor="#52525b"
                                                    value={value}
                                                    onChangeText={onFieldChange}
                                                    onBlur={onBlur}
                                                    multiline
                                                    numberOfLines={2}
                                                    textAlignVertical="top"
                                                />
                                            )}
                                        />
                                    </View>
                                </View>
                            )}
                        </View>
                    );
                })}
            </ScrollView>

            {/* Bottom Buttons */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity onPress={onBack} style={styles.backButton} disabled={loading}>
                    <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handleSubmit(onSubmit)}
                    disabled={!allAttendeesValid() || loading}
                    style={[
                        styles.continueButton,
                        (!allAttendeesValid() || loading) && styles.continueButtonDisabled,
                    ]}
                >
                    <Text
                        style={[
                            styles.continueButtonText,
                            (!allAttendeesValid() || loading) && styles.continueButtonTextDisabled,
                        ]}
                    >
                        {loading ? 'Reserving...' : 'Continue'}
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    quantityContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#18181b',
        borderWidth: 1,
        borderColor: '#27272a',
        borderRadius: 14,
        padding: 16,
        marginBottom: 20,
    },
    quantityLabel: {
        color: '#a1a1aa',
        fontSize: 14,
        fontWeight: '600',
    },
    quantityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    quantityButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#27272a',
        alignItems: 'center',
        justifyContent: 'center',
    },
    quantityValue: {
        color: '#ffffff',
        fontSize: 22,
        fontWeight: '700',
        minWidth: 28,
        textAlign: 'center',
    },
    sectionTitle: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    sectionSubtitle: {
        color: '#71717a',
        fontSize: 13,
        marginBottom: 16,
    },
    accordionContainer: {
        marginBottom: 10,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#27272a',
        backgroundColor: '#18181b',
        overflow: 'hidden',
    },
    accordionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    accordionHeaderExpanded: {
        borderBottomWidth: 1,
        borderBottomColor: '#27272a',
    },
    accordionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusDotValid: {
        backgroundColor: '#4ade80',
    },
    statusDotInvalid: {
        backgroundColor: '#52525b',
    },
    accordionTitle: {
        color: '#e4e4e7',
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
    },
    accordionBody: {
        padding: 16,
        paddingTop: 14,
    },
    fieldContainer: {
        marginBottom: 16,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    label: {
        color: '#a1a1aa',
        fontSize: 13,
        fontWeight: '600',
    },
    optionalTag: {
        color: '#52525b',
        fontSize: 11,
        fontStyle: 'italic',
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#0f0f0f',
        borderWidth: 1,
        borderColor: '#27272a',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: '#ffffff',
        fontSize: 14,
    },
    inputError: {
        borderColor: 'rgba(239, 68, 68, 0.5)',
    },
    textArea: {
        minHeight: 60,
        paddingTop: 12,
    },
    errorText: {
        color: '#f87171',
        fontSize: 12,
        marginTop: 5,
        marginLeft: 4,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        paddingTop: 16,
    },
    backButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#27272a',
    },
    backButtonText: {
        color: '#a1a1aa',
        fontSize: 16,
        fontWeight: '600',
    },
    continueButton: {
        flex: 2,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#a855f7',
    },
    continueButtonDisabled: {
        backgroundColor: '#27272a',
    },
    continueButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
    continueButtonTextDisabled: {
        color: '#52525b',
    },
});
