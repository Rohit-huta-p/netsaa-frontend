import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert, Animated, ScrollView } from 'react-native';
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
    Wand2,
} from 'lucide-react-native';
import { InputGroup } from '@/components/ui/InputGroup';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { TextArea } from '@/components/ui/TextArea';
import { TagInput } from '@/components/ui/TagInput';
import { DatePickerInput } from '@/components/ui/DatePickerInput';
import { LeaveEventModal } from './LeaveEventModal';
import { MapLinkCard } from '@/components/location/MapLinkCard';
import { LinearGradient } from 'expo-linear-gradient';
import gigService from '@/services/gigService';

import { useCreateEvent, usePublishEvent } from '@/hooks/useEvents';
import { useAuthStore } from '@/stores/authStore';
import { CreateEventDTO } from '@/types/event';
import { useCreateEventStore } from '@/stores/createEventStore';

// NETSA Organizer-themed TextInput (Matches GigForm)
const StyledTextInput = ({ value, onChangeText, placeholder, icon: Icon, error, type = 'text', ...props }: any) => (
    <View className="relative">
        {Icon && (
            <View className="absolute left-3 top-[50%] -translate-y-1/2 z-10">
                <Icon size={18} color="rgba(255, 255, 255, 0.4)" />
            </View>
        )}
        <TextInput
            className={`w-full bg-zinc-900/50 border outline-none ${error ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 ${Icon ? 'pl-10' : 'pl-4'} pr-4 text-white placeholder-zinc-500`}
            style={{ outlineStyle: 'none' } as any}
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
    eventId?: string;
}

export interface EventFormHandle {
    handleBack: () => boolean;
}

export const EventForm = React.forwardRef<EventFormHandle, EventFormProps>(({ onPublish, onCancel, eventId }, ref) => {
    const {
        completedSteps,
        setCompletedSteps,
        formData: storedData,
        updateFormData,
        resetForm
    } = useCreateEventStore();

    const createEventMutation = useCreateEvent();
    const publishEventMutation = usePublishEvent();
    const { user } = useAuthStore();
    const isLoading = createEventMutation.isPending || publishEventMutation.isPending;

    const [leaveModalVisible, setLeaveModalVisible] = useState(false);
    const isNavigatingAway = useRef(false);

    const [addingTicket, setAddingTicket] = useState(false);
    const [rephrasingField, setRephrasingField] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: storedData.title || '',
        eventType: storedData.eventType || '',
        category: storedData.category || '',
        tags: storedData.tags || '',
        skillLevel: storedData.skillLevel || 'all',
        maxParticipants: storedData.maxParticipants || '',
        city: storedData.city || '',
        venue: storedData.venue || '',
        address: storedData.address || '',
        startDate: storedData.startDate || '',
        endDate: storedData.endDate || '',
        pricingMode: storedData.pricingMode || 'simple',
        ticketPrice: storedData.ticketPrice || '',
        ticketTypes: storedData.ticketTypes || [],
        description: storedData.description || '',
        deadline: storedData.deadline || '',
        urgent: storedData.urgent || false,
        featured: storedData.featured || false,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const [newTicket, setNewTicket] = useState({
        name: '',
        price: '',
        capacity: '',
        isRefundable: false,
        refundPolicyNotes: '',
        salesStartAt: '',
        salesEndAt: '',
    });

    // Sync formData to store when it changes
    useEffect(() => {
        updateFormData(formData as any);
    }, [formData, updateFormData]);

    const TOTAL_STEPS = 9;
    const [step, setStep] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);

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

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleNext = () => {
        let newErrors: Record<string, string> = {};
        let hasError = false;

        if (step === 0) {
            if (!formData.title?.trim()) { newErrors.title = "Event Title is required"; hasError = true; }
            if (!formData.eventType?.trim()) { newErrors.eventType = "Format is required"; hasError = true; }
            if (!formData.category?.trim()) { newErrors.category = "Category is required"; hasError = true; }
        } else if (step === 2) {
            if (!formData.city?.trim()) { newErrors.city = "City is required"; hasError = true; }
        } else if (step === 3) {
            if (!formData.startDate) {
                newErrors.startDate = "Start Date is required";
                hasError = true;
            }
        } else if (step === 4) {
            if (formData.pricingMode === 'types' && (!formData.ticketTypes || formData.ticketTypes.length === 0)) {
                Alert.alert('Required', 'Please add at least one ticket type.');
                return; // Stop here, using alert instead of field error for ticket array
            }
        } else if (step === 5) {
            if (!formData.description?.trim() || formData.description.length < 5) {
                newErrors.description = "Event Description is required";
                hasError = true;
            }
        }

        if (hasError) {
            setErrors(newErrors);
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
            return;
        }

        if (!completedSteps.includes(step)) {
            setCompletedSteps([...completedSteps, step]);
        }
        if (step < TOTAL_STEPS - 1) {
            setErrors({});
            animateToStep(step + 1);
        }
    };

    const handleBackInternal = (): boolean => {
        if (isNavigatingAway.current) return false;
        if (step > 0) {
            animateToStep(step - 1);
            return true;
        } else {
            setLeaveModalVisible(true);
            return true;
        }
    };

    React.useImperativeHandle(ref, () => ({
        handleBack: handleBackInternal
    }));

    const handleDiscard = () => {
        setLeaveModalVisible(false);
        isNavigatingAway.current = true;
        resetForm();
        onCancel();
    };

    const handleRephrase = async (field: 'description') => {
        const text = formData[field];
        if (!text || text.length < 5) {
            Alert.alert("Input Required", "Please enter some text to rephrase.");
            return;
        }

        setRephrasingField(field);
        try {
            const result = await gigService.rephraseText(text);
            if (result && result.rephrased) {
                updateField(field, result.rephrased);
            }
        } catch (error: any) {
            console.error("Rephrase failed:", error);
            Alert.alert("Error", "Failed to rephrase text. Please try again.");
        } finally {
            setRephrasingField(null);
        }
    };

    const handleAddTicket = () => {
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

        updateField('ticketTypes', [...(formData.ticketTypes || []), tick]);
        setNewTicket({ name: '', price: '', capacity: '', isRefundable: false, refundPolicyNotes: '', salesStartAt: '', salesEndAt: '' });
        setAddingTicket(false);
    };

    const handleSubmit = async (isDraft: boolean = false) => {
        isNavigatingAway.current = true;

        const eventPayload: CreateEventDTO = {
            title: formData.title,
            description: formData.description,
            eventType: formData.eventType as any,
            category: formData.category,
            tags: typeof formData.tags === 'string' ? formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : formData.tags,
            skillLevel: formData.skillLevel as any,
            eligibleArtistTypes: [],

            ticketPrice: formData.pricingMode === 'simple' ? (Number(formData.ticketPrice) || 0) :
                (formData.ticketTypes?.length ? Math.min(...formData.ticketTypes.map((t: any) => Number(t.price))) : 0),
            ticketTypes: formData.pricingMode === 'types' ? formData.ticketTypes : [],

            schedule: {
                startDate: new Date(formData.startDate).toISOString(),
                endDate: formData.endDate ? new Date(formData.endDate).toISOString() : new Date(formData.startDate).toISOString(),
                totalDurationMinutes: 120,
                dayBreakdown: [{
                    date: new Date(formData.startDate).toISOString(),
                    durationMinutes: 120
                }]
            },

            location: {
                type: 'physical',
                city: formData.city,
                venueName: formData.venue,
                address: formData.address,
                state: 'State',
                country: 'India'
            },

            maxParticipants: formData.maxParticipants ? Number(formData.maxParticipants) : 0,
            registrationDeadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
            allowWaitlist: false,
            registered: 0,
            isFeatured: formData.featured,

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

    const renderStep0 = () => (
        <View className="gap-6">
            <InputGroup label="Event Title" required subtitle="Make it catchy and clear" error={errors.title}>
                <StyledTextInput
                    icon={Type}
                    value={formData.title}
                    onChangeText={(val: string) => updateField('title', val)}
                    placeholder="e.g. Summer Dance Workshop 2024"
                    error={errors.title}
                />
            </InputGroup>

            <View className="flex-col md:flex-row gap-4">
                <InputGroup label="Format" required error={errors.eventType}>
                    <SearchableSelect
                        icon={Layout}
                        options={[
                            { label: 'Workshop', value: 'workshop' },
                            { label: 'Battle', value: 'competition' },
                            { label: 'Show/Performance', value: 'showcase' },
                            { label: 'Meetup', value: 'meetup' },
                        ]}
                        value={formData.eventType}
                        onChange={(val: string) => updateField('eventType', val)}
                        placeholder="Select Format"
                        allowCustom={true}
                        label="Select Format"
                    />
                </InputGroup>

                <InputGroup label="Creative Category" required error={errors.category}>
                    <SearchableSelect
                        icon={Briefcase}
                        options={[
                            { label: 'Dance', value: 'dance' },
                            { label: 'Music', value: 'music' },
                            { label: 'Art', value: 'art' }
                        ]}
                        value={formData.category}
                        onChange={(val: string) => updateField('category', val)}
                        placeholder="Select Category"
                        allowCustom={true}
                        label="Select Category"
                    />
                </InputGroup>
            </View>

            <InputGroup label="Tags" subtitle="Type comma or enter to add tags" error={errors.tags}>
                <TagInput
                    value={Array.isArray(formData.tags) ? formData.tags.join(', ') : formData.tags}
                    onChangeTags={(val: string) => updateField('tags', val)}
                    placeholder="e.g. hip-hop, contemporary, workshop"
                />
            </InputGroup>
        </View>
    );

    const renderStep1 = () => (
        <View className="gap-6">
            <InputGroup label="Skill Level" error={errors.skillLevel}>
                <View className="flex-row gap-3">
                    {['All', 'Beginner', 'Intermediate', 'Advanced'].map(level => (
                        <TouchableOpacity
                            key={level}
                            onPress={() => updateField('skillLevel', level.toLowerCase())}
                            className={`flex-1 px-3 py-3 rounded-xl border ${formData.skillLevel?.toLowerCase() === level.toLowerCase()
                                ? 'bg-[#FF6B35]/15 border-[#FF6B35]'
                                : 'bg-zinc-900/50 border-white/10'
                                }`}
                        >
                            <Text className={`text-center font-bold text-xs capitalize ${formData.skillLevel?.toLowerCase() === level.toLowerCase() ? 'text-[#FF6B35]' : 'text-zinc-400'
                                }`}>
                                {level}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </InputGroup>

            <InputGroup label="Capacity" error={errors.maxParticipants}>
                <StyledTextInput
                    inputMode="numeric"
                    icon={Users}
                    value={String(formData.maxParticipants || '')}
                    onChangeText={(val: string) => updateField('maxParticipants', val)}
                    placeholder="e.g. 50"
                    error={errors.maxParticipants}
                    subtitle="Leave empty for unlimited"
                />
            </InputGroup>
        </View>
    );

    const renderStep2 = () => (
        <View className="gap-6">
            <InputGroup label="City" required error={errors.city}>
                <StyledTextInput
                    value={formData.city}
                    onChangeText={(val: string) => updateField('city', val)}
                    placeholder="e.g. Mumbai"
                    error={errors.city}
                />
            </InputGroup>
            <InputGroup label="Venue Name">
                <StyledTextInput
                    value={formData.venue}
                    onChangeText={(val: string) => updateField('venue', val)}
                    placeholder="e.g. The Royal Opera House"
                />
            </InputGroup>
            <InputGroup label="Complete Address">
                <View className="flex-col gap-3">
                    <StyledTextInput
                        value={formData.address}
                        onChangeText={(val: string) => updateField('address', val)}
                        placeholder="Street, Area, Landmark"
                    />
                    {formData.venue && (
                        <MapLinkCard
                            venueName={formData.venue}
                            address={formData.address || ''}
                            city={formData.city}
                            state={'State'}
                            country={'India'}
                        />
                    )}
                </View>
            </InputGroup>
        </View>
    );

    const renderStep3 = () => (
        <View className="gap-6">
            <View className="flex-1">
                <DatePickerInput
                    label="Start Date"
                    required
                    value={formData.startDate}
                    onChange={(date) => updateField('startDate', toLocalDateString(date))}
                    error={errors.startDate}
                    placeholder="Select Date"
                    minimumDate={new Date()}
                />
            </View>
            <View className="flex-1">
                <DatePickerInput
                    label="End Date"
                    value={formData.endDate}
                    onChange={(date) => updateField('endDate', toLocalDateString(date))}
                    error={errors.endDate}
                    placeholder="Select Date"
                    minimumDate={formData.startDate ? new Date(formData.startDate) : new Date()}
                />
            </View>
        </View>
    );

    const renderTicketForm = () => (
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
                    onPress={handleAddTicket}
                >
                    <Text className="text-white font-bold">Add Ticket</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderStep4 = () => (
        <View className="gap-6">
            <View className="bg-zinc-900/50 p-1 rounded-xl flex-row mb-2 border border-white/10">
                <TouchableOpacity
                    onPress={() => {
                        updateField('pricingMode', 'simple');
                        updateField('ticketTypes', []);
                    }}
                    className={`flex-1 py-2 rounded-lg items-center ${formData.pricingMode === 'simple' ? 'bg-[#FF6B35]/20' : ''}`}
                >
                    <Text className={`font-medium ${formData.pricingMode === 'simple' ? 'text-[#FF6B35]' : 'text-zinc-400'}`}>Fixed Price</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => {
                        updateField('pricingMode', 'types');
                        updateField('ticketPrice', '');
                    }}
                    className={`flex-1 py-2 rounded-lg items-center ${formData.pricingMode === 'types' ? 'bg-[#FF6B35]/20' : ''}`}
                >
                    <Text className={`font-medium ${formData.pricingMode === 'types' ? 'text-[#FF6B35]' : 'text-zinc-400'}`}>Ticket Types</Text>
                </TouchableOpacity>
            </View>

            {formData.pricingMode === 'simple' ? (
                <InputGroup label="Entry Fee (₹)" error={errors.ticketPrice}>
                    <StyledTextInput
                        inputMode="numeric"
                        value={String(formData.ticketPrice === undefined ? '' : formData.ticketPrice)}
                        onChangeText={(val: string) => updateField('ticketPrice', val)}
                        placeholder="0 or Free"
                        error={errors.ticketPrice}
                    />
                </InputGroup>
            ) : (
                <View className="flex-1">
                    <Text className="text-zinc-400 mb-2 font-medium">Ticket Types</Text>
                    <View className="gap-3 relative">
                        {addingTicket ? (
                            renderTicketForm()
                        ) : (
                            <>
                                {/* List of added ticket types */}
                                {formData.ticketTypes && formData.ticketTypes.map((ticket: any, index: number) => (
                                    <View key={index} className="bg-zinc-900/50 p-3 rounded-lg border border-white/10 flex-row justify-between items-center">
                                        <View>
                                            <Text className="text-white font-medium">{ticket.name}</Text>
                                            <Text className="text-zinc-400 text-xs">
                                                ₹{ticket.price} • {ticket.capacity} seats • {ticket.isRefundable ? 'Refundable' : 'Non-refundable'}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => {
                                                const newTypes = [...(formData.ticketTypes || [])];
                                                newTypes.splice(index, 1);
                                                updateField('ticketTypes', newTypes);
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
                                {errors.ticketTypes && <Text className="text-red-500 text-xs">{errors.ticketTypes}</Text>}
                            </>
                        )}
                    </View>
                </View>
            )}
        </View>
    );

    const renderStep5 = () => (
        <View className="gap-6">
            <InputGroup label="Event Description" required subtitle="Tell people what to expect" error={errors.description}>
                <View className="items-end mb-2">
                    <TouchableOpacity
                        onPress={() => handleRephrase('description')}
                        disabled={!!rephrasingField}
                        className="flex-row items-center gap-1.5 bg-zinc-800/80 px-3 py-1.5 rounded-full border border-zinc-700/50"
                    >
                        {rephrasingField === 'description' ? (
                            <ActivityIndicator size="small" color="#FF6B35" />
                        ) : (
                            <Wand2 size={12} color="#FF6B35" />
                        )}
                        <Text className="text-[#FF6B35] text-[10px] font-black uppercase tracking-wider">
                            {rephrasingField === 'description' ? 'AI Magic...' : 'Rephrase with AI'}
                        </Text>
                    </TouchableOpacity>
                </View>
                <TextArea
                    rows={6}
                    value={formData.description}
                    onChangeText={(val: string) => updateField('description', val)}
                    placeholder="Describe the event, the vibe, special guests..."
                    error={errors.description}
                />
            </InputGroup>
        </View>
    );

    const renderStep6 = () => (
        <View className="gap-6">
            <DatePickerInput
                label="Registration Closes"
                value={formData.deadline}
                onChange={(date) => updateField('deadline', toLocalDateString(date))}
                placeholder="Select Deadline"
                minimumDate={new Date()}
                maximumDate={formData.startDate ? new Date(formData.startDate) : undefined}
                subtitle="When do sales/registrations close?"
            />
        </View>
    );

    const renderStep7 = () => (
        <View className="gap-6">
            <TouchableOpacity
                className="flex-row items-center space-x-3 p-3 rounded-xl bg-zinc-800/50 border border-white/10"
                onPress={() => updateField('urgent', !formData.urgent)}
            >
                <View className={`w-6 h-6 rounded-md border items-center justify-center ${formData.urgent ? 'bg-orange-500 border-orange-500' : 'border-zinc-600'}`}>
                    {formData.urgent && <Check size={14} color="#fff" />}
                </View>
                <View>
                    <Text className="text-zinc-200 font-medium h-full align-middle pt-1 ml-2">Urgent Event</Text>
                    <Text className="text-xs text-zinc-500 ml-2">Adds an "Urgent" badge</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                className="flex-row items-center space-x-3 p-3 rounded-xl bg-zinc-800/50 border border-white/10"
                onPress={() => updateField('featured', !formData.featured)}
            >
                <View className={`w-6 h-6 rounded-md border items-center justify-center ${formData.featured ? 'bg-[#FF6B35] border-[#FF6B35]' : 'border-zinc-600'}`}>
                    {formData.featured && <Check size={14} color="#fff" />}
                </View>
                <View>
                    <Text className="text-zinc-200 font-medium h-full align-middle pt-1 ml-2">Feature this Event</Text>
                    <Text className="text-xs text-zinc-500 ml-2">Pin to top (+$15.00)</Text>
                </View>
            </TouchableOpacity>
        </View>
    );

    const renderStep8 = () => (
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
                    Almost there! Review and publish your event
                </Text>
            </LinearGradient>

            <View className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
                {/* Preview Header */}
                <View className="p-5 border-b border-white/10 bg-zinc-800/50">
                    <View className="flex-row gap-2 mb-3">
                        {formData.urgent && (
                            <View className="bg-red-500/20 px-2 py-1 rounded">
                                <Text className="text-red-400 text-[10px] font-black uppercase">URGENT</Text>
                            </View>
                        )}
                        <View className="bg-zinc-700 px-2 py-1 rounded">
                            <Text className="text-zinc-300 text-[10px] font-bold uppercase">{formData.eventType || 'Event'}</Text>
                        </View>
                    </View>
                    <Text className="text-white text-xl font-black leading-tight mb-1">{formData.title}</Text>
                    <Text className="text-zinc-400 text-sm flex-row items-center">
                        <MapPin size={12} color="#a1a1aa" /> {formData.city} • <Calendar size={12} color="#a1a1aa" /> {formData.startDate}
                    </Text>
                </View>

                {/* Preview Body */}
                <View className="p-5 gap-4">
                    <View>
                        <Text className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Pricing</Text>
                        {formData.pricingMode === 'simple' ? (
                            <Text className="text-white text-lg font-black">{formData.ticketPrice && Number(formData.ticketPrice) > 0 ? `₹${formData.ticketPrice}` : 'Free'}</Text>
                        ) : (
                            <Text className="text-white text-lg font-black">{formData.ticketTypes?.length ? `${formData.ticketTypes.length} Ticket Types` : 'TBA'}</Text>
                        )}
                    </View>

                    <View>
                        <Text className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Description</Text>
                        <Text className="text-zinc-300 text-sm" numberOfLines={3}>{formData.description}</Text>
                    </View>
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
                        ref={scrollViewRef}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 120 }}
                    >
                        {step === 0 && renderStep0()}
                        {step === 1 && renderStep1()}
                        {step === 2 && renderStep2()}
                        {step === 3 && renderStep3()}
                        {step === 4 && renderStep4()}
                        {step === 5 && renderStep5()}
                        {step === 6 && renderStep6()}
                        {step === 7 && renderStep7()}
                        {step === 8 && renderStep8()}
                    </ScrollView>
                </Animated.View>
            </View>

            <View className="px-6 py-6 pb-10 border-t border-white/5 bg-black">
                <View className="flex-row justify-between items-center">
                    <TouchableOpacity
                        onPress={handleBackInternal}
                        disabled={isLoading}
                        className="w-12 h-12 rounded-full bg-zinc-900 border border-white/10 items-center justify-center"
                    >
                        {step === 0 ? <Text className="text-zinc-400 font-bold">✕</Text> : <ChevronLeft size={24} color="#a1a1aa" />}
                    </TouchableOpacity>

                    <View className="flex-1 ml-4">
                        {step === TOTAL_STEPS - 1 ? (
                            <View className="flex-row gap-2">
                                <TouchableOpacity
                                    className="flex-1 py-4 bg-zinc-800 rounded-xl items-center"
                                    onPress={() => handleSubmit(true)}
                                    disabled={isLoading}
                                >
                                    <Text className="text-white font-bold">Draft</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="flex-[2] py-4 bg-[#FF6B35] rounded-xl items-center flex-row justify-center gap-2"
                                    onPress={() => handleSubmit(false)}
                                    disabled={isLoading}
                                >
                                    {isLoading ? <ActivityIndicator color="#fff" /> : (
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