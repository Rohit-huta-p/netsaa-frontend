import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    ChevronRight,
    ChevronLeft,
    Check,
    MapPin,
    Calendar,
    Users,
    Ticket,
    Briefcase,
    Sparkles,
    Layout,
    Type,
    AlignLeft,
    Eye,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StepIndicator } from '@/components/common/StepIndicator';
import { InputGroup } from '@/components/ui/InputGroup';
import { SelectInput } from '@/components/ui/SelectInput';
import { TextArea } from '@/components/ui/TextArea';
import { TagInput } from '@/components/ui/TagInput';
import { DatePickerInput } from '@/components/ui/DatePickerInput';

import { eventSchema, EventFormData } from '@/schemas/eventSchema';
import { useCreateEvent, usePublishEvent } from '@/hooks/useEvents';
import { useAuthStore } from '@/stores/authStore';
import { CreateEventDTO } from '@/types/event';

// NETSA Organizer-themed TextInput (Matches GigForm)
const StyledTextInput = ({ value, onChangeText, placeholder, icon: Icon, type = 'text', error, ...props }: any) => (
    <View className="relative">
        {Icon && (
            <View className="absolute left-3 top-1/2 -translate-y-6 z-10">
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

interface EventFormProps {
    onPublish: (data: any) => void; // Keeping compatible signature, but internal logic changes
    onCancel: () => void;
}


import { useCreateEventStore } from '@/stores/createEventStore';
import { useEffect } from 'react';
import { MapLinkCard } from '@/components/location/MapLinkCard';

// Helper to format date as YYYY-MM-DD in local time
const toLocalDateString = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const EventForm: React.FC<EventFormProps> = ({ onPublish, onCancel }) => {
    // Persistent State
    const {
        currentStep,
        setStep,
        completedSteps,
        setCompletedSteps,
        formData: storedData,
        updateFormData,
        resetForm
    } = useCreateEventStore();

    const createEventMutation = useCreateEvent();
    const publishEventMutation = usePublishEvent();
    const { user } = useAuthStore();
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

    const { control, handleSubmit, formState: { errors }, trigger, watch, setValue, getValues } = useForm({
        resolver: zodResolver(eventSchema),
        defaultValues: storedData as EventFormData, // Initialize with stored data
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

    const steps = [
        { title: "Event Essentials", subtitle: "Name & Type" },
        { title: "Details", subtitle: "Format & Access" },
        { title: "Logistics", subtitle: "Where & When" },
        { title: "Review", subtitle: "Finalize & Publish" },
    ];

    const [pricingMode, setPricingMode] = useState<'simple' | 'types'>(storedData.pricingMode || 'simple');

    // Sync local state to store
    useEffect(() => {
        updateFormData({ pricingMode } as any);
    }, [pricingMode]);

    const validateStep = async (step: number) => {
        let fieldsToValidate: (keyof EventFormData)[] = [];
        switch (step) {
            case 1: fieldsToValidate = ['title', 'eventType', 'category', 'tags']; break;
            case 2:
                fieldsToValidate = ['skillLevel', 'maxParticipants'];
                if (pricingMode === 'simple') {
                    fieldsToValidate.push('ticketPrice');
                } else {
                    fieldsToValidate.push('ticketTypes');
                }
                break;
            case 3: fieldsToValidate = ['city', 'venue', 'address', 'startDate', 'endDate']; break;
            case 4: fieldsToValidate = ['description', 'deadline']; break;
        }

        const result = await trigger(fieldsToValidate);
        if (!result) return false;

        // Custom validation
        if (step === 2) {
            if (pricingMode === 'types') {
                const types = getValues('ticketTypes');
                if (!types || types.length === 0) {
                    Alert.alert('Required', 'Please add at least one ticket type.');
                    return false;
                }
            }
        }

        return true;
    }

    const handleNext = async () => {
        const isValid = await validateStep(currentStep);
        if (isValid) {
            if (!completedSteps.includes(currentStep)) {
                setCompletedSteps([...completedSteps, currentStep]);
            }
            setStep(Math.min(currentStep + 1, steps.length));
        }
    };

    const handleBack = () => {
        if (currentStep === 1) {
            // Maybe alert before cancelling if dirty?
            onCancel();
        } else {
            setStep(Math.max(currentStep - 1, 1));
        }
    };

    const onSubmit = async (data: EventFormData, isDraft: boolean = false) => {
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

            ticketTypes: pricingMode === 'types' ? data.ticketTypes : [], // Ensure empty if simple mode

            // Construct nested objects
            schedule: {
                startDate: new Date(data.startDate).toISOString(),
                endDate: new Date(data.endDate).toISOString(),
                totalDurationMinutes: 120, // Default for now
                dayBreakdown: [{
                    date: new Date(data.startDate).toISOString(),
                    durationMinutes: 120
                }]
            },

            location: {
                type: 'physical', // Default for now
                city: data.city,
                venueName: data.venue,
                address: data.address,
                state: 'State', // TODO: Add field
                country: 'India'
            },

            maxParticipants: Number(data.maxParticipants),
            registrationDeadline: data.deadline ? new Date(data.deadline).toISOString() : undefined,
            allowWaitlist: false,
            registered: 0, // Default to 0

            isFeatured: data.featured,

            // Populate organizer details from auth user
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
                    // Auto-publish after creation
                    publishEventMutation.mutate(result._id, {
                        onSuccess: () => {
                            Alert.alert("Success", "Event published successfully!");
                            resetForm();
                            onPublish(result);
                        },
                        onError: (pubError: any) => {
                            // Even if publish fails, event is created.
                            Alert.alert("Notice", "Event created but failed to publish. Check your drafts.");
                            resetForm();
                            onPublish(result);
                        }
                    });
                }
            },
            onError: (error: any) => {
                Alert.alert("Creation Failed", error.message || "Failed to create event. Please check your inputs.");
            }
        });
    };

    const renderStep1 = () => (
        <View className="gap-6">
            {/* Gradient Header Card */}
            <LinearGradient
                colors={['#FF6B35', '#FF8C42']}
                start={[0, 0]}
                end={[1, 0]}
                className="rounded-2xl p-6 mb-2"
                style={{
                    shadowColor: '#FF6B35',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.3,
                    shadowRadius: 16,
                }}
            >
                <View className="flex-row items-center mb-2">
                    <Layout size={20} color="#fff" />
                    <Text className="text-white font-black text-sm ml-2 uppercase tracking-wider">
                        Event Basics
                    </Text>
                </View>
                <Text className="text-white/90 text-sm font-light">
                    Start with the essentials—what's this event all about?
                </Text>
            </LinearGradient>

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
                        <InputGroup label="Event Type" required error={errors.eventType?.message}>
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
                        <InputGroup label="Category" required error={errors.category?.message}>
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

    const renderStep2 = () => (
        <View className="gap-6">
            <LinearGradient
                colors={['#FF6B35', '#FF8C42']}
                start={[0, 0]}
                end={[1, 0]}
                className="rounded-2xl p-6 mb-2"
                style={{
                    shadowColor: '#FF6B35',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.3,
                    shadowRadius: 16,
                }}
            >
                <View className="flex-row items-center mb-2">
                    <Ticket size={20} color="#fff" />
                    <Text className="text-white font-black text-sm ml-2 uppercase tracking-wider">
                        Access & Fees
                    </Text>
                </View>
                <Text className="text-white/90 text-sm font-light">
                    Who can join and how much does it cost?
                </Text>
            </LinearGradient>

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

            <View className="gap-4 flex-1">
                <View className="">
                    <Controller
                        control={control}
                        name="maxParticipants"
                        render={({ field: { onChange, value } }) => (
                            <InputGroup label="Max Participants" error={errors.maxParticipants?.message}>
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

                {/* Pricing Mode Toggle */}
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

                                            {/* Add New Ticket Type Trigger */}
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
        </View>
    );

    const renderStep3 = () => (
        <View className="gap-6">
            <LinearGradient
                colors={['#FF6B35', '#FF8C42']}
                start={[0, 0]}
                end={[1, 0]}
                className="rounded-2xl p-6 mb-2"
                style={{
                    shadowColor: '#FF6B35',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.3,
                    shadowRadius: 16,
                }}
            >
                <View className="flex-row items-center mb-2">
                    <MapPin size={20} color="#fff" />
                    <Text className="text-white font-black text-sm ml-2 uppercase tracking-wider">
                        Location & Time
                    </Text>
                </View>
                <Text className="text-white/90 text-sm font-light">
                    Where is it happening and when?
                </Text>
            </LinearGradient>

            <View className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6">
                <Text className="text-white font-black text-lg tracking-tight mb-4">
                    Location
                </Text>
                <View className="gap-4">
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

                <View className="mt-6 mb-2">
                    <Text className="text-white font-black text-lg tracking-tight mb-4">
                        Schedule
                    </Text>
                    <View className="flex-row gap-4">
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
                </View>
            </View>
        </View>
    );

    const renderStep4 = () => (
        <View className="gap-6">
            <LinearGradient
                colors={['#FF6B35', '#FF8C42']}
                start={[0, 0]}
                end={[1, 0]}
                className="rounded-2xl p-6 mb-2"
                style={{
                    shadowColor: '#FF6B35',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.3,
                    shadowRadius: 16,
                }}
            >
                <View className="flex-row items-center mb-2">
                    <AlignLeft size={20} color="#fff" />
                    <Text className="text-white font-black text-sm ml-2 uppercase tracking-wider">
                        The Pitch
                    </Text>
                </View>
                <Text className="text-white/90 text-sm font-light">
                    Sell the event—what to expect?
                </Text>
            </LinearGradient>

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

            <View className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6">
                <Text className="text-white font-black text-lg tracking-tight mb-4">
                    Registration
                </Text>
                <Controller
                    control={control}
                    name="deadline"
                    render={({ field: { onChange, value } }) => (
                        <DatePickerInput
                            label="Deadline for Registration"
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
        </View>
    );

    const renderStep5 = () => (
        <View className="gap-6">
            <LinearGradient
                colors={['#FF6B35', '#FF8C42']}
                start={[0, 0]}
                end={[1, 0]}
                className="rounded-2xl p-6 mb-2"
                style={{
                    shadowColor: '#FF6B35',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.3,
                    shadowRadius: 16,
                }}
            >
                <View className="flex-row items-center mb-2">
                    <Eye size={20} color="#fff" />
                    <Text className="text-white font-black text-sm ml-2 uppercase tracking-wider">
                        Final Review
                    </Text>
                </View>
                <Text className="text-white/90 text-sm font-light">
                    Check everything before going live!
                </Text>
            </LinearGradient>

            <View className="bg-zinc-900/50 p-6 rounded-2xl border border-white/10 gap-4">
                <Controller
                    control={control}
                    name="urgent"
                    render={({ field: { onChange, value } }) => (
                        <TouchableOpacity
                            className="flex-row items-center space-x-3 p-3 rounded-xl bg-zinc-800/50"
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
                            className="flex-row items-center space-x-3 p-3 rounded-xl bg-zinc-800/50"
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

            {/* Summary Preview */}
            <View className="bg-[#FF6B35]/10 border border-[#FF6B35]/30 rounded-2xl p-6">
                <Text className="text-[#FF6B35] font-semibold mb-4 flex-row items-center">
                    <Eye size={18} color="#FF6B35" /> Preview
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
        </View>
    );

    const renderTicketForm = (onChange: (val: any) => void, value: any[]) => (
        <View className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 gap-4 mt-2">
            <Text className="text-white font-bold text-lg">New Ticket Type</Text>

            <InputGroup label="Ticket Name" required>
                <StyledTextInput
                    value={newTicket.name}
                    onChangeText={(t: string) => setNewTicket({ ...newTicket, name: t })}
                    placeholder="e.g. Early Bird"
                />
            </InputGroup>

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
                            value={newTicket.capacity}
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

            <View className="bg-zinc-800/50 p-3 rounded-lg flex-row justify-between items-center">
                <Text className="text-zinc-300">Refundable?</Text>
                <TouchableOpacity
                    onPress={() => setNewTicket({ ...newTicket, isRefundable: !newTicket.isRefundable })}
                    className={`w-12 h-6 rounded-full px-1 justify-center ${newTicket.isRefundable ? 'bg-indigo-600 items-end' : 'bg-zinc-600 items-start'}`}
                >
                    <View className="w-4 h-4 rounded-full bg-white" />
                </TouchableOpacity>
            </View>

            {newTicket.isRefundable && (
                <InputGroup label="Refund Policy">
                    <StyledTextInput
                        value={newTicket.refundPolicyNotes}
                        onChangeText={(t: string) => setNewTicket({ ...newTicket, refundPolicyNotes: t })}
                        placeholder="e.g. 100% refund until 24h before."
                    />
                </InputGroup>
            )}

            <View className="flex-row gap-3 mt-2">
                <TouchableOpacity
                    className="flex-1 py-3 bg-zinc-700 rounded-xl items-center"
                    onPress={() => setAddingTicket(false)}
                >
                    <Text className="text-white font-medium">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className="flex-1 py-3 bg-indigo-600 rounded-xl items-center"
                    onPress={() => handleAddTicket(value, onChange)}
                >
                    <Text className="text-white font-bold">Add Ticket</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
            {/* Modal or overlay for adding ticket could go here, but inline is fine related to the controller */}

            <View className="flex-col lg:flex-row gap-8 ">
                <StepIndicator
                    currentStep={currentStep}
                    steps={steps}
                    completedSteps={completedSteps}
                />
                <View className="flex-1 max-w-3xl">
                    <View className="mb-6">
                        <Text className="text-3xl font-bold text-white mb-2">{steps[currentStep - 1].title}</Text>
                        <Text className="text-zinc-400">{steps[currentStep - 1].subtitle}</Text>
                    </View>

                    <View>
                        {currentStep === 1 && renderStep1()}
                        {currentStep === 2 && renderStep2()}
                        {currentStep === 3 && renderStep3()}
                        {currentStep === 4 && renderStep4()}
                        {currentStep === 5 && renderStep5()}
                    </View>
                </View>
            </View>

            {/* Override content if adding ticket - simpler for mobile focused view to take over specific area or use modal */}
            {/* But wait, I put the call to setAddingTicket inside the controller details. I need to render the FORM somewhere. 
                I will modify the Controller in renderStep2 to conditionally render the form OR the list.
                Wait, I can't modify the controller render function easily from here. 
                
                Actually, I missed a spot in the previous tool call.
                I replaced the 'Ticket Price' input with the list. 
                But I didn't include the 'renderTicketForm' logic inside that Controller render.
                
                I need to re-edit renderStep2 to include the conditional rendering of the form.
            */}

            <View className="flex-row justify-between items-center mt-12 pt-8 border-t border-zinc-800">
                <TouchableOpacity
                    onPress={handleBack}
                    className={`flex-row items-center gap-2 px-6 py-3 rounded-xl font-medium ${currentStep === 1 ? 'opacity-70' : ''}`}
                    disabled={createEventMutation.isPending}
                >
                    <ChevronLeft size={20} color={currentStep === 1 ? "#52525b" : "#d4d4d8"} />
                    <Text className={`${currentStep === 1 ? 'text-zinc-600' : 'text-zinc-300'}`}>{currentStep === 1 ? 'Cancel' : 'Back'}</Text>
                </TouchableOpacity>

                {currentStep === steps.length ? (
                    <View className="flex-row gap-3">
                        {/* Draft Button */}
                        <TouchableOpacity
                            className={`px-6 py-3 rounded-xl font-semibold border border-zinc-600 ${createEventMutation.isPending ? 'opacity-50' : 'active:bg-zinc-800'}`}
                            onPress={handleSubmit((data) => onSubmit(data, true))}
                            disabled={createEventMutation.isPending}
                        >
                            <Text className="text-zinc-300">Save Draft</Text>
                        </TouchableOpacity>

                        {/* Publish Button */}
                        <TouchableOpacity
                            className={`flex-row items-center gap-2 px-8 py-3 rounded-xl font-bold ${createEventMutation.isPending ? 'bg-indigo-800' : 'bg-indigo-600 hover:bg-indigo-500'}`}
                            onPress={handleSubmit((data) => onSubmit(data, false))}
                            disabled={createEventMutation.isPending}
                        >
                            {createEventMutation.isPending ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Text className="text-white font-bold mr-2">Publish Event</Text>
                                    <Check size={20} color="#fff" />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        onPress={handleNext}
                        className="flex-row items-center gap-2 px-8 py-3 rounded-xl font-bold bg-white"
                        disabled={createEventMutation.isPending}
                    >
                        <Text className="text-black font-bold mr-2">Next Step</Text>
                        <ChevronRight size={20} color="#000" />
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
    );
};
