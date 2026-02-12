import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert, Animated, BackHandler, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    ChevronRight,
    ChevronLeft,
    Check,
    MapPin,
    Calendar,
    Users,
    Briefcase,
    Layout,
    Type,
    Eye,
} from 'lucide-react-native';
import { InputGroup } from '@/components/ui/InputGroup';
import { SelectInput } from '@/components/ui/SelectInput';
import { TextArea } from '@/components/ui/TextArea';
import { TagInput } from '@/components/ui/TagInput';
import { DatePickerInput } from '@/components/ui/DatePickerInput';
import { LeaveEventModal } from './LeaveEventModal';
import { MapLinkCard } from '@/components/location/MapLinkCard';

import { eventSchema, EventFormData } from '@/schemas/eventSchema';
import { useCreateEvent, usePublishEvent } from '@/hooks/useEvents';
import { useAuthStore } from '@/stores/authStore';
import { CreateEventDTO } from '@/types/event';
import { useCreateEventStore } from '@/stores/createEventStore';

// NETSA Organizer-themed TextInput (Matches GigForm)
const StyledTextInput = ({ value, onChangeText, placeholder, icon: Icon, type = 'text', error, ...props }: any) => (
    <View className="relative">
        {Icon && (
            <View className="absolute left-3 top-[50%] -translate-y-1/2 z-10">
                <Icon size={18} color="rgba(255, 255, 255, 0.4)" />
            </View>
        )}
        <TextInput
            className={`w-full bg-zinc-900/50 border outline-none ${error ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 ${Icon ? 'pl-10' : 'pl-4'} pr-4 text-white placeholder-zinc-500 focus:border-[#FF6B35]`}
            placeholder={placeholder}
            placeholderTextColor="rgba(255, 255, 255, 0.3)"
            value={value}
            onChangeText={onChangeText}
            {...props}
        />
        {error && <Text className="text-red-500 text-xs mt-1 ml-1">{error}</Text>}
    </View>
);

// Helper to format date as YYYY-MM-DD in local time
const toLocalDateString = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

interface EventFormProps {
    onPublish: (data: any) => void;
    onCancel: () => void;
}

export interface EventFormHandle {
    handleBack: () => boolean;
}

export const EventForm = React.forwardRef<EventFormHandle, EventFormProps>(({ onPublish, onCancel }, ref) => {
    // Persistent State
    const {
        currentStep: storedStep,
        setStep: setStoredStep,
        completedSteps,
        setCompletedSteps,
        formData: storedData,
        updateFormData,
        resetForm
    } = useCreateEventStore();

    const createEventMutation = useCreateEvent();
    const publishEventMutation = usePublishEvent();
    const { user } = useAuthStore();

    // Modal State
    const [leaveModalVisible, setLeaveModalVisible] = useState(false);
    const isNavigatingAway = useRef(false);

    const [addingTicket, setAddingTicket] = useState(false);

    // Temporary state for the new ticket form
    const [newTicket, setNewTicket] = useState({
        name: '',
        price: '',
        capacity: '',
        isRefundable: false,
        refundPolicyNotes: '',
        salesStartAt: '',
        salesEndAt: '',
    });

    const handleAddTicket = (currentTypes: any[], onChange: (val: any) => void) => {
        if (!newTicket.name || !newTicket.price || !newTicket.capacity || !newTicket.salesStartAt || !newTicket.salesEndAt) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }

        const tick = {
            name: newTicket.name,
            price: Number(newTicket.price),
            capacity: Number(newTicket.capacity),
            currency: 'INR',
            salesStartAt: newTicket.salesStartAt,
            salesEndAt: newTicket.salesEndAt,
            isRefundable: newTicket.isRefundable,
            refundPolicyNotes: newTicket.refundPolicyNotes
        };

        onChange([...(currentTypes || []), tick]);
        setNewTicket({ name: '', price: '', capacity: '', isRefundable: false, refundPolicyNotes: '', salesStartAt: '', salesEndAt: '' });
        setAddingTicket(false);
    };

    const { control, handleSubmit, formState: { errors }, trigger, watch, getValues } = useForm({
        resolver: zodResolver(eventSchema),
        defaultValues: storedData as EventFormData,
        mode: 'onBlur'
    });

    // Auto-save form data to store on change
    const formData = watch();
    useEffect(() => {
        const subscription = watch((value) => {
            updateFormData(value as Partial<EventFormData>);
        });
        return () => subscription.unsubscribe();
    }, [watch, updateFormData]);

    // 9 Steps Structure (Matches User Requirement)
    const steps = [
        { title: "Identity", subtitle: "What is this event?" },
        { title: "Audience", subtitle: "Who is this for?" },
        { title: "Location", subtitle: "Where will it happen?" },
        { title: "Schedule", subtitle: "When is it happening?" },
        { title: "Pricing", subtitle: "How much does it cost?" },
        { title: "The Pitch", subtitle: "Why should people attend?" },
        { title: "Registration", subtitle: "How should registrations work?" },
        { title: "Visibility", subtitle: "How visible should this be?" },
        { title: "Review", subtitle: "Final check" },
    ];

    const TOTAL_STEPS = steps.length;
    const [step, setStep] = useState(0);
    const [pricingMode, setPricingMode] = useState<'simple' | 'types'>(storedData.pricingMode || 'simple');

    /* ── Animation ── */
    const slideX = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const animateToStep = useCallback((newStep: number) => {
        const dir = newStep > step ? 1 : -1;
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
            Animated.timing(slideX, { toValue: dir * -180, duration: 120, useNativeDriver: true }),
        ]).start(() => {
            setStep(newStep);
            slideX.setValue(dir * 180);
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
                Animated.spring(slideX, { toValue: 0, stiffness: 300, damping: 30, mass: 1, useNativeDriver: true }),
            ]).start();
        });
    }, [step, fadeAnim, slideX]);


    // Sync local state to store
    useEffect(() => {
        updateFormData({ pricingMode } as any);
    }, [pricingMode]);

    const validateStep = async (stepIndex: number) => {
        let fieldsToValidate: (keyof EventFormData)[] = [];
        switch (stepIndex) {
            case 0: fieldsToValidate = ['title', 'eventType', 'category', 'tags']; break;
            case 1: fieldsToValidate = ['skillLevel', 'maxParticipants']; break;
            case 2: fieldsToValidate = ['city', 'venue', 'address']; break;
            case 3: fieldsToValidate = ['startDate', 'endDate']; break;
            case 4:
                fieldsToValidate = pricingMode === 'simple' ? ['ticketPrice'] : ['ticketTypes'];
                break;
            case 5: fieldsToValidate = ['description']; break;
            case 6: fieldsToValidate = ['deadline']; break;
            case 7: break; // No required fields for Visibility
        }

        const result = await trigger(fieldsToValidate);

        // Manual check for ticket types
        if (stepIndex === 4 && pricingMode === 'types') {
            const types = getValues('ticketTypes');
            if (!types || types.length === 0) {
                Alert.alert('Required', 'Please add at least one ticket type.');
                return false;
            }
        }

        return result;
    }

    const handleNext = async () => {
        const isValid = await validateStep(step);
        if (isValid) {
            if (!completedSteps.includes(step)) {
                setCompletedSteps([...completedSteps, step]);
            }
            if (step < TOTAL_STEPS - 1) {
                animateToStep(step + 1);
            }
        }
    };

    const handleBackInternal = () => {
        if (isNavigatingAway.current) return;

        if (step > 0) {
            animateToStep(step - 1);
        } else {
            setLeaveModalVisible(true);
        }
    };

    React.useImperativeHandle(ref, () => ({
        handleBack: () => {
            if (isNavigatingAway.current) return false;

            if (step > 0) {
                animateToStep(step - 1);
                return true;
            } else {
                setLeaveModalVisible(true);
                return true;
            }
        }
    }));

    // Removed hardwareBackPress listener to rely on parent controller

    // Discard Handler
    const handleDiscard = () => {
        setLeaveModalVisible(false);
        isNavigatingAway.current = true;
        resetForm(); // Clear persisted data
        onCancel();
    };

    const onSubmit = async (data: EventFormData, isDraft: boolean = false) => {
        isNavigatingAway.current = true;

        // Map form data to backend DTO structure
        const eventPayload: CreateEventDTO = {
            title: data.title,
            description: data.description,
            eventType: data.eventType as any,
            category: data.category,
            tags: typeof data.tags === 'string' ? data.tags.split(',').map((t: string) => t.trim()) : data.tags,
            skillLevel: data.skillLevel as any,
            eligibleArtistTypes: [], // TODO: Add field to form

            // Ticket Logic
            ticketPrice: pricingMode === 'simple' ? (Number(data.ticketPrice) || 0) :
                (data.ticketTypes?.length ? Math.min(...data.ticketTypes.map((t: any) => Number(t.price))) : 0),

            ticketTypes: pricingMode === 'types' ? data.ticketTypes : [],

            // Construct nested objects
            schedule: {
                startDate: new Date(data.startDate).toISOString(),
                endDate: new Date(data.endDate).toISOString(),
                totalDurationMinutes: 120,
                dayBreakdown: [{
                    date: new Date(data.startDate).toISOString(),
                    durationMinutes: 120
                }]
            },

            location: {
                type: 'physical',
                city: data.city,
                venueName: data.venue,
                address: data.address,
                state: 'State',
                country: 'India'
            },

            maxParticipants: Number(data.maxParticipants),
            registrationDeadline: data.deadline ? new Date(data.deadline).toISOString() : undefined,
            allowWaitlist: false,
            registered: 0,

            isFeatured: data.featured,

            organizerId: user?._id,
            organizerSnapshot: {
                name: user?.displayName || (user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Unknown Organizer'),
                organizationName: (user as any)?.organizationName || (user as any)?.displayName || 'Unknown Org',
                profileImageUrl: (user as any)?.profileImageUrl
            }
        };

        createEventMutation.mutate(eventPayload, {
            onSuccess: (result) => {
                if (isDraft) {
                    Alert.alert("Draft Saved", "Your event has been saved as a draft.");
                    resetForm();
                    onPublish(result);
                } else {
                    publishEventMutation.mutate(result._id, {
                        onSuccess: () => {
                            Alert.alert("Success", "Event published successfully!");
                            resetForm();
                            onPublish(result);
                        },
                        onError: () => {
                            Alert.alert("Notice", "Event created but failed to publish. Check your drafts.");
                            resetForm();
                            onPublish(result);
                        }
                    });
                }
            },
            onError: (error: any) => {
                Alert.alert("Creation Failed", error.message || "Failed to create event. Please check your inputs.");
                isNavigatingAway.current = false;
            }
        });
    };

    /* -------------------------------------------------------------------------- */
    /*                             RENDER STEPS                                   */
    /* -------------------------------------------------------------------------- */

    // Step 0: Identity
    const renderStep0 = () => (
        <View className="gap-6">
            <Controller
                control={control}
                name="title"
                render={({ field: { onChange, value } }) => (
                    <InputGroup label="Event Title" required subtitle="Make it catchy and clear" error={errors.title?.message}>
                        <StyledTextInput
                            icon={Type}
                            value={value}
                            onChangeText={onChange}
                            placeholder="e.g. Summer Dance Workshop 2024"
                            error={errors.title?.message}
                        />
                    </InputGroup>
                )}
            />

            <View className="flex-col md:flex-row gap-4">
                <Controller
                    control={control}
                    name="eventType"
                    render={({ field: { onChange, value } }) => (
                        <InputGroup label="Format" required error={errors.eventType?.message}>
                            <SelectInput
                                icon={Layout}
                                options={[
                                    { label: 'Workshop', value: 'workshop' },
                                    { label: 'Battle', value: 'competition' },
                                    { label: 'Show/Performance', value: 'showcase' },
                                    { label: 'Meetup', value: 'meetup' },
                                ]}
                                value={value}
                                onChange={onChange}
                            />
                        </InputGroup>
                    )}
                />

                <Controller
                    control={control}
                    name="category"
                    render={({ field: { onChange, value } }) => (
                        <InputGroup label="Creative Category" required error={errors.category?.message}>
                            <SelectInput
                                icon={Briefcase}
                                options={[
                                    { label: 'Dance', value: 'dance' },
                                    { label: 'Music', value: 'music' },
                                    { label: 'Art', value: 'art' }
                                ]}
                                value={value}
                                onChange={onChange}
                            />
                        </InputGroup>
                    )}
                />
            </View>

            <Controller
                control={control}
                name="tags"
                render={({ field: { onChange, value } }) => (
                    <InputGroup label="Tags" subtitle="Type comma or enter to add tags" error={errors.tags?.message}>
                        <TagInput
                            value={Array.isArray(value) ? value.join(', ') : value}
                            onChangeTags={onChange}
                            placeholder="e.g. hip-hop, contemporary, workshop"
                        />
                    </InputGroup>
                )}
            />
        </View>
    );

    // Step 1: Audience
    const renderStep1 = () => (
        <View className="gap-6">
            <Controller
                control={control}
                name="skillLevel"
                render={({ field: { onChange, value } }) => (
                    <InputGroup label="Skill Level" error={errors.skillLevel?.message}>
                        <View className="flex-row gap-3">
                            {['All', 'Beginner', 'Intermediate', 'Advanced'].map(level => (
                                <TouchableOpacity
                                    key={level}
                                    onPress={() => onChange(level.toLowerCase())}
                                    className={`flex-1 px-3 py-3 rounded-xl border ${value?.toLowerCase() === level.toLowerCase()
                                        ? 'bg-[#FF6B35]/15 border-[#FF6B35]'
                                        : 'bg-zinc-900/50 border-white/10'
                                        }`}
                                >
                                    <Text className={`text-center font-bold text-xs capitalize ${value?.toLowerCase() === level.toLowerCase() ? 'text-[#FF6B35]' : 'text-zinc-400'
                                        }`}>
                                        {level}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </InputGroup>
                )}
            />

            <Controller
                control={control}
                name="maxParticipants"
                render={({ field: { onChange, value } }) => (
                    <InputGroup label="Capacity" error={errors.maxParticipants?.message}>
                        <StyledTextInput
                            inputMode="numeric"
                            icon={Users}
                            value={String(value || '')}
                            onChangeText={onChange}
                            placeholder="e.g. 50"
                            error={errors.maxParticipants?.message}
                            subtitle="Leave empty for unlimited"
                        />
                    </InputGroup>
                )}
            />
        </View>
    );

    // Step 2: Location
    const renderStep2 = () => (
        <View className="gap-6">
            <Controller
                control={control}
                name="city"
                render={({ field: { onChange, value } }) => (
                    <InputGroup label="City" required error={errors.city?.message}>
                        <StyledTextInput
                            value={value}
                            onChangeText={onChange}
                            placeholder="e.g. Mumbai"
                            error={errors.city?.message}
                        />
                    </InputGroup>
                )}
            />
            <Controller
                control={control}
                name="venue"
                render={({ field: { onChange, value } }) => (
                    <InputGroup label="Venue Name">
                        <StyledTextInput
                            value={value}
                            onChangeText={onChange}
                            placeholder="e.g. The Royal Opera House"
                        />
                    </InputGroup>
                )}
            />
            <Controller
                control={control}
                name="address"
                render={({ field: { onChange, value } }) => (
                    <InputGroup label="Complete Address">
                        <View className="flex-col gap-3">
                            <StyledTextInput
                                value={value}
                                onChangeText={onChange}
                                placeholder="Street, Area, Landmark"
                            />
                            {/* Location Preview */}
                            <MapLinkCard
                                venueName={watch('venue')}
                                address={watch('address') || ''}
                                city={watch('city')}
                                state={'State'}
                                country={'India'}
                            />
                        </View>
                    </InputGroup>
                )}
            />
        </View>
    );

    // Step 3: Schedule
    const renderStep3 = () => (
        <View className="gap-6">
            <View className="flex-1">
                <Controller
                    control={control}
                    name="startDate"
                    render={({ field: { onChange, value } }) => (
                        <DatePickerInput
                            label="Start Date"
                            required
                            value={value}
                            onChange={(date) => onChange(toLocalDateString(date))}
                            error={errors.startDate?.message}
                            placeholder="Select Date"
                            minimumDate={new Date()}
                        />
                    )}
                />
            </View>
            <View className="flex-1">
                <Controller
                    control={control}
                    name="endDate"
                    render={({ field: { onChange, value } }) => (
                        <DatePickerInput
                            label="End Date"
                            value={value}
                            onChange={(date) => onChange(toLocalDateString(date))}
                            error={errors.endDate?.message}
                            placeholder="Select Date"
                            minimumDate={watch('startDate') ? new Date(watch('startDate')) : new Date()}
                        />
                    )}
                />
            </View>
        </View>
    );

    const renderTicketForm = (onChange: (val: any) => void, currentTypes: any[]) => (
        <View className="gap-4 p-4 rounded-xl bg-zinc-900/50 border border-white/10">
            <Text className="text-white font-bold mb-2">New Ticket Type</Text>
            <View className="gap-4">
                <InputGroup label="Ticket Name" required>
                    <StyledTextInput
                        value={newTicket.name}
                        onChangeText={(t: string) => setNewTicket({ ...newTicket, name: t })}
                        placeholder="e.g. VIP Access"
                    />
                </InputGroup>
            </View>

            <View className="flex-row gap-4">
                <View className="flex-1">
                    <InputGroup label="Price (₹)" required>
                        <StyledTextInput
                            inputMode="numeric"
                            value={newTicket.price}
                            onChangeText={(t: string) => setNewTicket({ ...newTicket, price: t })}
                            placeholder="0"
                        />
                    </InputGroup>
                </View>
                <View className="flex-1">
                    <InputGroup label="Capacity" required>
                        <StyledTextInput
                            inputMode="numeric"
                            value={String(newTicket.capacity)}
                            onChangeText={(t: string) => setNewTicket({ ...newTicket, capacity: t })}
                            placeholder="100"
                        />
                    </InputGroup>
                </View>
            </View>

            <View className="flex-row gap-4 relative">
                <View className="flex-1">
                    <DatePickerInput
                        label="Sales Start"
                        required
                        value={newTicket.salesStartAt}
                        onChange={(date) => setNewTicket({ ...newTicket, salesStartAt: toLocalDateString(date) })}
                        placeholder="Start Date"
                        minimumDate={new Date()}
                    />
                </View>
                <View className="flex-1">
                    <DatePickerInput
                        label="Sales End"
                        required
                        value={newTicket.salesEndAt}
                        onChange={(date) => setNewTicket({ ...newTicket, salesEndAt: toLocalDateString(date) })}
                        placeholder="End Date"
                        minimumDate={newTicket.salesStartAt ? new Date(newTicket.salesStartAt) : new Date()}
                    />
                </View>
            </View>

            <View className="flex-row gap-3 mt-2">
                <TouchableOpacity
                    className="flex-1 py-3 bg-zinc-700 rounded-xl items-center"
                    onPress={() => setAddingTicket(false)}
                >
                    <Text className="text-white font-medium">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className="flex-1 py-3 bg-indigo-600 rounded-xl items-center"
                    onPress={() => handleAddTicket(currentTypes, onChange)}
                >
                    <Text className="text-white font-bold">Add Ticket</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // Step 4: Pricing
    const renderStep4 = () => (
        <View className="gap-6">
            <View className="bg-zinc-900/50 p-1 rounded-xl flex-row mb-2 border border-white/10">
                <TouchableOpacity
                    onPress={() => setPricingMode('simple')}
                    className={`flex-1 py-2 rounded-lg items-center ${pricingMode === 'simple' ? 'bg-[#FF6B35]/20' : ''}`}
                >
                    <Text className={`font-medium ${pricingMode === 'simple' ? 'text-[#FF6B35]' : 'text-zinc-400'}`}>Fixed Price</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setPricingMode('types')}
                    className={`flex-1 py-2 rounded-lg items-center ${pricingMode === 'types' ? 'bg-[#FF6B35]/20' : ''}`}
                >
                    <Text className={`font-medium ${pricingMode === 'types' ? 'text-[#FF6B35]' : 'text-zinc-400'}`}>Ticket Types</Text>
                </TouchableOpacity>
            </View>

            {pricingMode === 'simple' ? (
                <Controller
                    control={control}
                    name="ticketPrice"
                    render={({ field: { onChange, value } }) => (
                        <InputGroup label="Entry Fee (₹)" error={errors.ticketPrice?.message}>
                            <StyledTextInput
                                inputMode="numeric"
                                value={String(value === undefined ? '' : value)}
                                onChangeText={onChange}
                                placeholder="0 or Free"
                                error={errors.ticketPrice?.message}
                            />
                        </InputGroup>
                    )}
                />
            ) : (
                <View className="flex-1">
                    <Text className="text-zinc-400 mb-2 font-medium">Ticket Types</Text>
                    <Controller
                        control={control}
                        name="ticketTypes"
                        render={({ field: { onChange, value } }) => (
                            <View className="gap-3 relative">
                                {addingTicket ? (
                                    renderTicketForm(onChange, value || [])
                                ) : (
                                    <>
                                        {/* List of added ticket types */}
                                        {value && value.map((ticket: any, index: number) => (
                                            <View key={index} className="bg-zinc-900/50 p-3 rounded-lg border border-white/10 flex-row justify-between items-center">
                                                <View>
                                                    <Text className="text-white font-medium">{ticket.name}</Text>
                                                    <Text className="text-zinc-400 text-xs">
                                                        ₹{ticket.price} • {ticket.capacity} seats • {ticket.isRefundable ? 'Refundable' : 'Non-refundable'}
                                                    </Text>
                                                </View>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        const newTypes = [...value];
                                                        newTypes.splice(index, 1);
                                                        onChange(newTypes);
                                                    }}
                                                    className="p-2 bg-zinc-800 rounded-full"
                                                >
                                                    <Text className="text-zinc-400 font-bold">✕</Text>
                                                </TouchableOpacity>
                                            </View>
                                        ))}

                                        <TouchableOpacity
                                            onPress={() => setAddingTicket(true)}
                                            className="flex-row items-center justify-center p-4 border border-dashed border-zinc-700 rounded-xl bg-[#FF6B35]/5"
                                        >
                                            <View className="bg-[#FF6B35]/20 p-1 rounded mr-2">
                                                <Text className="text-[#FF6B35] font-bold text-lg leading-none">+</Text>
                                            </View>
                                            <Text className="text-zinc-300 font-medium">Add Ticket Type</Text>
                                        </TouchableOpacity>
                                        {errors.ticketTypes && <Text className="text-red-500 text-xs">{errors.ticketTypes.message}</Text>}
                                    </>
                                )}
                            </View>
                        )}
                    />
                </View>
            )}
        </View>
    );

    // Step 5: The Pitch
    const renderStep5 = () => (
        <View className="gap-6">
            <Controller
                control={control}
                name="description"
                render={({ field: { onChange, value } }) => (
                    <InputGroup label="Event Description" required subtitle="Tell people what to expect" error={errors.description?.message}>
                        <TextArea
                            rows={6}
                            value={value}
                            onChangeText={onChange}
                            placeholder="Describe the event, the vibe, special guests..."
                            error={errors.description?.message}
                        />
                    </InputGroup>
                )}
            />
        </View>
    );

    // Step 6: Registration
    const renderStep6 = () => (
        <View className="gap-6">
            <Controller
                control={control}
                name="deadline"
                render={({ field: { onChange, value } }) => (
                    <DatePickerInput
                        label="Registration Closes"
                        value={value}
                        onChange={(date) => onChange(toLocalDateString(date))}
                        placeholder="Select Deadline"
                        minimumDate={new Date()}
                        maximumDate={watch('startDate') ? new Date(watch('startDate')) : undefined}
                        subtitle="When do sales/registrations close?"
                    />
                )}
            />
        </View>
    );

    // Step 7: Visibility
    const renderStep7 = () => (
        <View className="gap-6">
            <Controller
                control={control}
                name="urgent"
                render={({ field: { onChange, value } }) => (
                    <TouchableOpacity
                        className="flex-row items-center space-x-3 p-3 rounded-xl bg-zinc-800/50 border border-white/10"
                        onPress={() => onChange(!value)}
                    >
                        <View className={`w-6 h-6 rounded-md border items-center justify-center ${value ? 'bg-orange-500 border-orange-500' : 'border-zinc-600'}`}>
                            {value && <Check size={14} color="#fff" />}
                        </View>
                        <View>
                            <Text className="text-zinc-200 font-medium h-full align-middle pt-1 ml-2">Urgent Event</Text>
                            <Text className="text-xs text-zinc-500 ml-2">Adds an "Urgent" badge</Text>
                        </View>
                    </TouchableOpacity>
                )}
            />

            <Controller
                control={control}
                name="featured"
                render={({ field: { onChange, value } }) => (
                    <TouchableOpacity
                        className="flex-row items-center space-x-3 p-3 rounded-xl bg-zinc-800/50 border border-white/10"
                        onPress={() => onChange(!value)}
                    >
                        <View className={`w-6 h-6 rounded-md border items-center justify-center ${value ? 'bg-[#FF6B35] border-[#FF6B35]' : 'border-zinc-600'}`}>
                            {value && <Check size={14} color="#fff" />}
                        </View>
                        <View>
                            <Text className="text-zinc-200 font-medium h-full align-middle pt-1 ml-2">Feature this Event</Text>
                            <Text className="text-xs text-zinc-500 ml-2">Pin to top (+$15.00)</Text>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    );

    // Step 8: Review
    const renderStep8 = () => (
        <View className="gap-4">
            <View className="bg-[#FF6B35]/10 border border-[#FF6B35]/30 rounded-2xl p-6">
                <Text className="text-[#FF6B35] font-semibold mb-4 flex-row items-center">
                    <Eye size={18} color="#FF6B35" /> Summary
                </Text>
                <View className="gap-2">
                    <View className="flex-row justify-between items-start">
                        <View className="flex-1 mr-2">
                            <View className="flex-row gap-2 mb-2">
                                <Text className="bg-zinc-800 text-zinc-300 text-xs px-2 py-0.5 rounded capitalize overflow-hidden">{formData.eventType}</Text>
                            </View>
                            <Text className="text-xl font-bold text-white mb-1">{formData.title}</Text>
                            <Text className="text-zinc-400 text-sm flex-row items-center">
                                <MapPin size={12} color="#a1a1aa" /> {formData.city} • <Calendar size={12} color="#a1a1aa" /> {formData.startDate}
                            </Text>
                        </View>
                        <View className="items-end">
                            <Text className="text-xl font-bold text-white">{formData.ticketPrice && Number(formData.ticketPrice) > 0 ? `₹${formData.ticketPrice}` : 'Free'}</Text>
                        </View>
                    </View>
                    <View className="h-[1px] bg-[#FF6B35]/20 my-2" />
                    <Text className="text-zinc-300 text-sm italic" numberOfLines={3}>"{formData.description}"</Text>
                </View>
            </View>

            {createEventMutation.isError && (
                <View className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <Text className="text-red-400 text-sm center text-center">
                        Submission failed. Please check your connection.
                    </Text>
                </View>
            )}
        </View>
    );

    const renderCurrentStep = () => {
        switch (step) {
            case 0: return renderStep0();
            case 1: return renderStep1();
            case 2: return renderStep2();
            case 3: return renderStep3();
            case 4: return renderStep4();
            case 5: return renderStep5();
            case 6: return renderStep6();
            case 7: return renderStep7();
            case 8: return renderStep8();
            default: return null;
        }
    };

    return (
        <View className="flex-1 bg-black">
            {/* Progress Bar (Top) */}
            <View className="h-1 bg-zinc-900 w-full absolute top-0 left-0 z-10">
                <Animated.View
                    style={{
                        width: `${((step + 1) / TOTAL_STEPS) * 100}%`,
                        height: '100%',
                        backgroundColor: '#FF6B35'
                    }}
                />
            </View>

            <View className="flex-1 px-6 pt-6">
                <Animated.View
                    style={{
                        flex: 1,
                        opacity: fadeAnim,
                        transform: [{ translateX: slideX }],
                    }}
                >
                    <View className="mb-6">
                        <Text className="text-[#FF6B35] font-bold text-xs uppercase tracking-widest mb-2">
                            Step {step + 1} of {TOTAL_STEPS}
                        </Text>
                        <Text className="text-3xl font-black text-white tracking-tight leading-8 mb-2">
                            {steps[step].title}
                        </Text>
                        <Text className="text-zinc-400 text-base font-light">
                            {steps[step].subtitle}
                        </Text>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 120 }}
                    >
                        {renderCurrentStep()}
                    </ScrollView>
                </Animated.View>
            </View>

            <View className="px-6 py-6 pb-10 border-t border-white/5 bg-black">
                <View className="flex-row justify-between items-center">
                    <TouchableOpacity
                        onPress={handleBackInternal}
                        disabled={createEventMutation.isPending}
                        className="w-12 h-12 rounded-full bg-zinc-900 border border-white/10 items-center justify-center"
                    >
                        {step === 0 ? <Text className="text-zinc-400 font-bold">✕</Text> : <ChevronLeft size={24} color="#a1a1aa" />}
                    </TouchableOpacity>

                    <View className="flex-1 ml-4">
                        {step === TOTAL_STEPS - 1 ? (
                            <View className="flex-row gap-2">
                                <TouchableOpacity
                                    className="flex-1 py-4 bg-zinc-800 rounded-xl items-center"
                                    onPress={handleSubmit((data) => onSubmit(data, true))}
                                    disabled={createEventMutation.isPending}
                                >
                                    <Text className="text-white font-bold">Draft</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="flex-[2] py-4 bg-[#FF6B35] rounded-xl items-center flex-row justify-center gap-2"
                                    onPress={handleSubmit((data) => onSubmit(data, false))}
                                    disabled={createEventMutation.isPending}
                                >
                                    {createEventMutation.isPending ? <ActivityIndicator color="#fff" /> : (
                                        <>
                                            <Text className="text-white font-black text-lg">
                                                Publish
                                            </Text>
                                            <Check size={20} color="#fff" />
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                onPress={handleNext}
                                className="w-full py-4 bg-[#FF6B35] rounded-xl items-center flex-row justify-center gap-2 shadow-lg shadow-orange-500/20"
                            >
                                <Text className="text-white font-black text-lg tracking-wide">Next</Text>
                                <ChevronRight size={20} color="#fff" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>

            <LeaveEventModal
                visible={leaveModalVisible}
                onDismiss={() => setLeaveModalVisible(false)}
                onDiscard={handleDiscard}
            />
        </View>
    );
});

EventForm.displayName = 'EventForm';
