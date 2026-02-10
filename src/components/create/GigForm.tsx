import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import {
    ChevronRight,
    ChevronLeft,
    Check,
    MapPin,
    Calendar,
    DollarSign,
    User,
    Briefcase,
    Layout,
    AlignLeft,
    Eye,
    Clock,
    Pencil,
    Wand2
} from 'lucide-react-native';
import gigService from '@/services/gigService';
import { LinearGradient } from 'expo-linear-gradient';
import { StepIndicator } from '@/components/common/StepIndicator';
import { InputGroup } from '@/components/ui/InputGroup';
import { SelectInput } from '@/components/ui/SelectInput';
import { TextArea } from '@/components/ui/TextArea';
import { Chip } from '@/components/ui/Chip';
import { TagInput } from '@/components/ui/TagInput';
import { DatePickerInput } from '@/components/ui/DatePickerInput';

import dayjs from 'dayjs';
import { z } from 'zod';
import { useCreateGig, useUpdateGig } from '@/hooks/useGigs';
import { Gig } from '@/types/gig';
import { MapLinkCard } from '@/components/location/MapLinkCard';

// Zod Schema synced to backend
const formSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    gigType: z.enum(['one-time', 'recurring', 'contract']),
    category: z.string().min(1, "Category is required"),
    tags: z.string().optional(),

    artistType: z.string().min(1, "Artist type is required"),
    skills: z.string().optional(),
    experienceLevel: z.enum(['beginner', 'intermediate', 'professional']),
    gender: z.enum(['any', 'male', 'female', 'other']),
    minAge: z.string().optional(),
    maxAge: z.string().optional(),
    minHeight: z.string().optional(),
    maxHeight: z.string().optional(),

    compType: z.enum(['fixed', 'hourly', 'per-day']),
    compStructure: z.enum(['fixed', 'range', 'tbd']).optional(),
    amount: z.string().optional(),
    minAmount: z.string().optional(),
    maxAmount: z.string().optional(),
    negotiable: z.boolean(),

    city: z.string().min(1, "City is required"),
    venue: z.string().optional(),
    address: z.string().optional(),
    startDate: z.string().min(1, "Start Date is required"),
    endDate: z.string().optional(),
    timeCommitment: z.string().optional(),

    description: z.string().min(10, "Description must be at least 10 chars"),
    requirements: z.string().optional(),
    benefits: z.string().optional(),

    mediaHeadshot: z.boolean(),
    mediaFullBody: z.boolean(),
    mediaReel: z.boolean(),
    mediaAudio: z.boolean(),

    maxApplicants: z.string().optional(),
    deadline: z.string().optional(),

    urgent: z.boolean(),
    featured: z.boolean(),

    practiceCount: z.string().optional(),
    practicePaid: z.boolean(),
    practiceExtend: z.boolean(),
    practiceNotes: z.string().optional(),

    termsAndConditions: z.string().optional()
});

// NETSA Organizer-themed TextInput
const StyledTextInput = ({ value, onChangeText, placeholder, icon: Icon, type = 'text', ...props }: any) => (
    <View className="relative">
        {Icon && (
            <View className="absolute left-3 top-[50%] -translate-y-1/2 z-10">
                <Icon size={18} color="rgba(255, 255, 255, 0.4)" />
            </View>
        )}
        <TextInput
            className={`w-full bg-zinc-900/50 border border-white/10 rounded-xl py-3 ${Icon ? 'pl-10' : 'pl-4'} pr-4 text-white placeholder-zinc-500 focus:border-[#FF6B35] outline-none`}
            placeholder={placeholder}
            placeholderTextColor="rgba(255, 255, 255, 0.3)"
            value={value}
            onChangeText={onChangeText}
            {...props}
        />
    </View>
);

interface GigFormProps {
    onPublish: (data: any) => void;
    onCancel: () => void;
}

export const GigForm: React.FC<GigFormProps> = ({ onPublish, onCancel }) => {
    const createGigMutation = useCreateGig();
    const updateGigMutation = useUpdateGig();
    const isLoading = createGigMutation.isPending || updateGigMutation.isPending;

    const [currentStep, setCurrentStep] = useState(1);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [rephrasingField, setRephrasingField] = useState<string | null>(null);

    // Form State
    // const [formData, setFormData] = useState({
    //     title: 'Need 5 dancers ',
    //     gigType: 'one-time',
    //     category: 'music_video',
    //     tags: 'sangeet',

    //     artistType: 'dancer',
    //     skills: '',
    //     experienceLevel: 'intermediate',
    //     gender: 'any',
    //     minAge: '21',
    //     maxAge: '28',
    //     minHeight: '150',
    //     maxHeight: '200',

    //     compType: 'fixed',
    //     compStructure: 'fixed', // 'fixed' | 'range' | 'tbd'
    //     amount: '2500',
    //     minAmount: '',
    //     maxAmount: '',
    //     negotiable: false,

    //     city: 'Pune',
    //     venue: 'JW Marriott',
    //     address: 'Pune',
    //     startDate: '2025-12-21',
    //     endDate: '2025-12-21',
    //     timeCommitment: '10 hours',

    //     description: 'Need 5 dancers for sangeet',
    //     requirements: 'Should be good at dancing',
    //     benefits: 'Good salary',

    //     mediaHeadshot: false,
    //     mediaFullBody: false,
    //     mediaReel: false,
    //     mediaAudio: false,

    //     maxApplicants: '100',
    //     deadline: '2025-12-21',
    //     urgent: false,
    //     featured: false,

    //     practiceCount: '',
    //     practicePaid: false,
    //     practiceExtend: false,
    //     practiceNotes: '',

    //     termsAndConditions: ''
    // });
    const [formData, setFormData] = useState({
        title: 'Need 5 dancers ',
        gigType: 'one-time',
        category: 'music_video',
        tags: 'sangeet',

        artistType: 'dancer',
        skills: '',
        experienceLevel: 'intermediate',
        gender: 'any',
        minAge: '21',
        maxAge: '28',
        minHeight: '150',
        maxHeight: '200',

        compType: 'fixed',
        compStructure: 'fixed', // 'fixed' | 'range' | 'tbd'
        amount: '2500',
        minAmount: '',
        maxAmount: '',
        negotiable: false,

        city: 'Pune',
        venue: 'JW Marriott',
        address: 'Pune',
        startDate: '2025-12-21',
        endDate: '2025-12-21',
        timeCommitment: '10 hours',

        description: 'Need 5 dancers for sangeet',
        requirements: 'Should be good at dancing',
        benefits: 'Good salary',

        mediaHeadshot: false,
        mediaFullBody: false,
        mediaReel: false,
        mediaAudio: false,

        maxApplicants: '100',
        deadline: '2025-12-21',
        urgent: false,
        featured: false,

        practiceCount: '',
        practicePaid: false,
        practiceExtend: false,
        practiceNotes: '',

        termsAndConditions: ''
    });

    const steps = [
        { title: "Core Details", subtitle: "What are you casting?" },
        { title: "The Talent", subtitle: "Who are you looking for?" },
        { title: "Logistics", subtitle: "Where, When & How Much" },
        { title: "The Pitch", subtitle: "Requirements & Benefits" },
        { title: "Finalize", subtitle: "Review & Publish" },
    ];

    const scrollViewRef = useRef<ScrollView>(null);

    const scrollToTop = () => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    };

    const handleNext = () => {
        if (currentStep === 1 && !formData.title) {
            Alert.alert("Validation", "Please enter a title");
            return;
        }

        if (!completedSteps.includes(currentStep)) {
            setCompletedSteps(prev => [...prev, currentStep]);
        }
        setCurrentStep(prev => Math.min(prev + 1, steps.length));
        scrollToTop();
    };

    const handleBack = () => {
        if (currentStep === 1) {
            onCancel();
        } else {
            setCurrentStep(prev => Math.max(prev - 1, 1));
            scrollToTop();
        }
    };

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleRephrase = async (field: 'description' | 'termsAndConditions') => {
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

    const handleSubmit = async (isDraft: boolean) => {
        try {
            const parsed = formSchema.parse(formData);

            // Custom Validation for Compensation
            if (formData.compStructure === 'fixed' && !formData.amount) {
                Alert.alert("Validation", "Please enter an amount");
                return;
            }
            if (formData.compStructure === 'range' && !formData.minAmount) {
                Alert.alert("Validation", "Please enter a minimum amount");
                return;
            }

            const payload = {
                title: parsed.title,
                description: parsed.description,
                type: parsed.gigType,
                category: parsed.category,
                tags: parsed.tags?.split(',').map(t => t.trim()).filter(Boolean) || [],

                artistTypes: [parsed.artistType],
                requiredSkills: parsed.skills?.split(',').map(s => s.trim()).filter(Boolean) || [],
                experienceLevel: parsed.experienceLevel,

                ageRange: {
                    min: parsed.minAge ? parseInt(parsed.minAge) : undefined,
                    max: parsed.maxAge ? parseInt(parsed.maxAge) : undefined
                },
                genderPreference: parsed.gender,
                physicalRequirements: `Height: ${parsed.minHeight}-${parsed.maxHeight}cm`,

                location: {
                    city: parsed.city,
                    state: 'Maharashtra',
                    country: 'India',
                    venueName: parsed.venue,
                    address: parsed.address,
                    isRemote: false
                },

                schedule: {
                    startDate: new Date(parsed.startDate),
                    endDate: parsed.endDate ? new Date(parsed.endDate) : new Date(parsed.startDate),
                    durationLabel: parsed.timeCommitment || '1 day',
                    timeCommitment: parsed.timeCommitment,
                    practiceDays: {
                        count: parsed.practiceCount ? parseInt(parsed.practiceCount) : 0,
                        isPaid: parsed.practicePaid,
                        mayExtend: parsed.practiceExtend,
                        notes: parsed.practiceNotes
                    }
                },

                compensation: {
                    model: parsed.compType,
                    // Use optional mapping based on structure
                    amount: (formData.compStructure === 'fixed' && parsed.amount) ? parseInt(parsed.amount) : undefined,
                    minAmount: (formData.compStructure === 'range' && parsed.minAmount) ? parseInt(parsed.minAmount) : undefined,
                    maxAmount: (formData.compStructure === 'range' && parsed.maxAmount) ? parseInt(parsed.maxAmount) : undefined,
                    currency: 'INR',
                    negotiable: parsed.negotiable,
                    perks: parsed.benefits?.split(',').map(p => p.trim()).filter(Boolean) || []
                },

                applicationDeadline: parsed.deadline ? new Date(parsed.deadline) : undefined,
                maxApplications: parsed.maxApplicants ? parseInt(parsed.maxApplicants) : undefined,

                mediaRequirements: {
                    headshots: parsed.mediaHeadshot,
                    fullBody: parsed.mediaFullBody,
                    videoReel: parsed.mediaReel,
                    audioSample: parsed.mediaAudio,
                    notes: parsed.requirements
                },

                status: (isDraft ? 'draft' : 'published') as Gig['status'],
                isUrgent: parsed.urgent,
                isFeatured: parsed.featured,
                termsAndConditions: parsed.termsAndConditions
            };

            await createGigMutation.mutateAsync(payload);
            Alert.alert("Success", `Gig ${isDraft ? 'saved as draft' : 'published'} successfully!`);
            onPublish(payload);
        } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to create gig");
        }
    };

    /* -------------------------------------------------------------------------- */
    /*                                 STEP 1                                     */
    /* -------------------------------------------------------------------------- */
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
                    <Briefcase size={20} color="#fff" />
                    <Text className="text-white font-black text-sm ml-2 uppercase tracking-wider">
                        Gig Basics
                    </Text>
                </View>
                <Text className="text-white/90 text-sm font-light">
                    Start with the essentials—what's this gig all about?
                </Text>
            </LinearGradient>

            <InputGroup label="Gig Title" subtitle="Make it clear and specific">
                <StyledTextInput
                    icon={Pencil}
                    value={formData.title}
                    onChangeText={(val: string) => updateField('title', val)}
                    placeholder="e.g. Need 5 Dancers for Sangeet Performance"
                />
            </InputGroup>
            <InputGroup label="Description" subtitle="Paint the full picture">
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
                    placeholder="Describe the gig, atmosphere, what makes it special..."
                />
            </InputGroup>

            <InputGroup label="Gig Type">
                <View className="flex-row gap-3">
                    {['one-time', 'recurring', 'contract'].map((type) => (
                        <TouchableOpacity
                            key={type}
                            onPress={() => updateField('gigType', type)}
                            className={`flex-1 px-4 py-3 rounded-xl border ${formData.gigType === type
                                ? 'bg-[#FF6B35]/15 border-[#FF6B35]'
                                : 'bg-zinc-900/50 border-white/10'
                                }`}
                        >
                            <Text className={`text-center font-bold capitalize ${formData.gigType === type ? 'text-[#FF6B35]' : 'text-zinc-400'
                                }`}>
                                {type.replace('-', ' ')}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </InputGroup>

            <InputGroup label="Category">
                <StyledTextInput
                    icon={Layout}
                    value={formData.category}
                    onChangeText={(val: string) => updateField('category', val)}
                    placeholder="e.g. Wedding, Corporate Event, Concert"
                />
            </InputGroup>

            <InputGroup label="Tags" subtitle="Type comma or enter to add tags">
                <TagInput
                    value={formData.tags}
                    onChangeTags={(val: string) => updateField('tags', val)}
                    placeholder="e.g. sangeet, classical"
                />
            </InputGroup>


        </View>
    );

    /* -------------------------------------------------------------------------- */
    /*                                 STEP 2                                     */
    /* -------------------------------------------------------------------------- */
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
                    <User size={20} color="#fff" />
                    <Text className="text-white font-black text-sm ml-2 uppercase tracking-wider">
                        Talent Requirements
                    </Text>
                </View>
                <Text className="text-white/90 text-sm font-light">
                    Define who you're looking for—skills, experience, attributes
                </Text>
            </LinearGradient>

            <InputGroup label="Artist Type" subtitle="Primary performer role">
                <StyledTextInput
                    icon={User}
                    value={formData.artistType}
                    onChangeText={(val: string) => updateField('artistType', val)}
                    placeholder="e.g. Dancer, Singer, Actor"
                />
            </InputGroup>

            <InputGroup label="Required Skills" subtitle="Type comma or enter to add skills">
                <TagInput
                    value={formData.skills}
                    onChangeTags={(val: string) => updateField('skills', val)}
                    placeholder="e.g. Classical Dance, Bollywood"
                />
            </InputGroup>

            <InputGroup label="Experience Level">
                <View className="flex-row gap-3">
                    {['beginner', 'intermediate', 'professional'].map((level) => (
                        <TouchableOpacity
                            key={level}
                            onPress={() => updateField('experienceLevel', level)}
                            className={`flex-1 px-4 py-3 rounded-xl border ${formData.experienceLevel === level
                                ? 'bg-[#FF6B35]/15 border-[#FF6B35]'
                                : 'bg-zinc-900/50 border-white/10'
                                }`}
                        >
                            <Text className={`text-center font-bold capitalize ${formData.experienceLevel === level ? 'text-[#FF6B35]' : 'text-zinc-400'
                                }`}>
                                {level}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </InputGroup>

            <View className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6">
                <Text className="text-white font-black text-lg tracking-tight mb-4">
                    Physical Attributes
                </Text>

                <InputGroup label="Gender Preference">
                    <View className="flex-row gap-3">
                        {['any', 'male', 'female', 'other'].map((gen) => (
                            <TouchableOpacity
                                key={gen}
                                onPress={() => updateField('gender', gen)}
                                className={`flex-1 px-4 py-3 rounded-xl border ${formData.gender === gen
                                    ? 'bg-[#FF6B35]/15 border-[#FF6B35]'
                                    : 'bg-zinc-900/50 border-white/10'
                                    }`}
                            >
                                <Text className={`text-center font-bold capitalize ${formData.gender === gen ? 'text-[#FF6B35]' : 'text-zinc-400'
                                    }`}>
                                    {gen}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </InputGroup>

                <View className="flex-row gap-4 mt-4">
                    {/* Age Range - Compact Row */}
                    <View className="flex-1">
                        <Text className="text-zinc-400 mb-2 font-medium">Age Range (Years)</Text>
                        <View className="flex-row items-center gap-3">
                            <View className="flex-1">
                                <TextInput
                                    className="bg-zinc-900/50 border border-white/10 rounded-xl py-3 px-4 text-white text-center font-bold"
                                    placeholder="Min"
                                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                                    keyboardType="numeric"
                                    value={formData.minAge}
                                    onChangeText={(val) => updateField('minAge', val)}
                                />
                            </View>
                            <Text className="text-zinc-500 font-medium text-lg">-</Text>
                            <View className="flex-1">
                                <TextInput
                                    className="bg-zinc-900/50 border border-white/10 rounded-xl py-3 px-4 text-white text-center font-bold"
                                    placeholder="Max"
                                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                                    keyboardType="numeric"
                                    value={formData.maxAge}
                                    onChangeText={(val) => updateField('maxAge', val)}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Height Range - Compact Row */}
                    <View className="flex-1">
                        <Text className="text-zinc-400 mb-2 font-medium">Height (cm)</Text>
                        <View className="flex-row items-center gap-3">
                            <View className="flex-1">
                                <TextInput
                                    className="bg-zinc-900/50 border border-white/10 rounded-xl py-3 px-4 text-white text-center font-bold"
                                    placeholder="Min"
                                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                                    keyboardType="numeric"
                                    value={formData.minHeight}
                                    onChangeText={(val) => updateField('minHeight', val)}
                                />
                            </View>
                            <Text className="text-zinc-500 font-medium text-lg">-</Text>
                            <View className="flex-1">
                                <TextInput
                                    className="bg-zinc-900/50 border border-white/10 rounded-xl py-3 px-4 text-white text-center font-bold"
                                    placeholder="Max"
                                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                                    keyboardType="numeric"
                                    value={formData.maxHeight}
                                    onChangeText={(val) => updateField('maxHeight', val)}
                                />
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );

    /* -------------------------------------------------------------------------- */
    /*                                 STEP 3                                     */
    /* -------------------------------------------------------------------------- */
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
                        Logistics
                    </Text>
                </View>
                <Text className="text-white/90 text-sm font-light">
                    Location, schedule, and compensation details
                </Text>
            </LinearGradient>

            {/* Location */}
            <View className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6">
                <Text className="text-white font-black text-lg tracking-tight mb-4">
                    Location
                </Text>

                <InputGroup label="City">
                    <StyledTextInput
                        icon={MapPin}
                        value={formData.city}
                        onChangeText={(val: string) => updateField('city', val)}
                        placeholder="e.g. Mumbai, Delhi, Bangalore"
                    />
                </InputGroup>

                <View className="mt-4">
                    <InputGroup label="Venue Name (Optional)">
                        <StyledTextInput
                            value={formData.venue}
                            onChangeText={(val: string) => updateField('venue', val)}
                            placeholder="e.g. Grand Ballroom, XYZ Hotel"
                        />
                    </InputGroup>
                </View>

                <View className="mt-4">
                    <InputGroup label="Full Address (Optional)">
                        <View className="flex-row gap-2">
                            <View className="flex-1">
                                <StyledTextInput
                                    value={formData.address}
                                    onChangeText={(val: string) => updateField('address', val)}
                                    placeholder="Street, Area, Landmark"
                                />
                            </View>
                        </View>
                        {/* Map Link Preview */}
                    </InputGroup>
                    <View className="">
                        <MapLinkCard
                            venueName={formData.venue}
                            address={formData.address}
                            city={formData.city}
                            state={'State'}
                            country={'India'}
                        />
                    </View>
                </View>
            </View>

            {/* Schedule */}
            <View className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6">
                <Text className="text-white font-black text-lg tracking-tight mb-4">
                    Schedule
                </Text>

                <View className="flex-row gap-4">
                    <View className="flex-1">
                        <DatePickerInput
                            label="Start Date"
                            value={formData.startDate}
                            onChange={(date: Date) => updateField('startDate', dayjs(date).format('YYYY-MM-DD'))}
                            placeholder="Select Date"
                            minimumDate={new Date()}
                        />
                    </View>
                    <View className="flex-1">
                        <DatePickerInput
                            label="End Date"
                            value={formData.endDate}
                            onChange={(date: Date) => updateField('endDate', dayjs(date).format('YYYY-MM-DD'))}
                            placeholder="Select Date"
                            minimumDate={formData.startDate ? new Date(formData.startDate) : new Date()}
                        />
                    </View>
                </View>

                <View className="mt-4">
                    <InputGroup label="Time Commitment">
                        <StyledTextInput
                            icon={Clock}
                            value={formData.timeCommitment}
                            onChangeText={(val: string) => updateField('timeCommitment', val)}
                            placeholder="e.g. 2 hours, Full day, 3 days"
                        />
                    </InputGroup>
                </View>

                {/* Practice Days */}
                <View className="mt-6 p-4 bg-zinc-800/50 rounded-xl border border-white/5">
                    <Text className="text-zinc-300 font-bold mb-3">Practice Days</Text>

                    <InputGroup label="Number of Practice Days">
                        <StyledTextInput
                            inputMode="numeric"
                            value={formData.practiceCount}
                            onChangeText={(val: string) => updateField('practiceCount', val)}
                            placeholder="e.g. 3"
                        />
                    </InputGroup>

                    <View className="flex-row gap-4 mt-3">
                        <TouchableOpacity
                            className="flex-row items-center gap-2 flex-1 p-3 rounded-lg bg-zinc-900/50"
                            onPress={() => updateField('practicePaid', !formData.practicePaid)}
                        >
                            <View className={`w-5 h-5 rounded border items-center justify-center ${formData.practicePaid ? 'bg-[#FF6B35] border-[#FF6B35]' : 'border-zinc-500'
                                }`}>
                                {formData.practicePaid && <Check size={12} color="#fff" />}
                            </View>
                            <Text className="text-zinc-300 text-sm">Paid Practice</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="flex-row items-center gap-2 flex-1 p-3 rounded-lg bg-zinc-900/50"
                            onPress={() => updateField('practiceExtend', !formData.practiceExtend)}
                        >
                            <View className={`w-5 h-5 rounded border items-center justify-center ${formData.practiceExtend ? 'bg-[#FF6B35] border-[#FF6B35]' : 'border-zinc-500'
                                }`}>
                                {formData.practiceExtend && <Check size={12} color="#fff" />}
                            </View>
                            <Text className="text-zinc-300 text-sm">May Extend</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="mt-3">
                        <TextArea
                            rows={2}
                            value={formData.practiceNotes}
                            onChangeText={(val: string) => updateField('practiceNotes', val)}
                            placeholder="Any notes about practice sessions..."
                        />
                    </View>
                </View>
            </View>

            <View className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6">
                <Text className="text-white font-black text-lg tracking-tight mb-4">
                    Compensation
                </Text>

                <InputGroup label="Payment Period">
                    <View className="flex-row gap-3">
                        {['fixed', 'hourly', 'per-day'].map((type) => (
                            <TouchableOpacity
                                key={type}
                                onPress={() => updateField('compType', type)}
                                className={`flex-1 px-4 py-3 rounded-xl border ${formData.compType === type
                                    ? 'bg-[#FF6B35]/15 border-[#FF6B35]'
                                    : 'bg-zinc-900/50 border-white/10'
                                    }`}
                            >
                                <Text className={`text-center font-bold capitalize ${formData.compType === type ? 'text-[#FF6B35]' : 'text-zinc-400'
                                    }`}>
                                    {type.replace('-', ' ')}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </InputGroup>

                <View className="mt-4">
                    <InputGroup label="Payment Structure">
                        <View className="flex-row gap-2">
                            {[
                                { id: 'fixed', label: 'Fixed Amount' },
                                { id: 'range', label: 'Range / Min' },
                                { id: 'tbd', label: 'To Be Discussed' }
                            ].map((struct) => (
                                <TouchableOpacity
                                    key={struct.id}
                                    onPress={() => updateField('compStructure', struct.id)}
                                    className={`flex-1 px-3 py-3 rounded-xl border ${formData.compStructure === struct.id
                                        ? 'bg-[#FF6B35]/15 border-[#FF6B35]'
                                        : 'bg-zinc-900/50 border-white/10'
                                        }`}
                                >
                                    <Text className={`text-center text-xs font-bold ${formData.compStructure === struct.id ? 'text-[#FF6B35]' : 'text-zinc-400'
                                        }`}>
                                        {struct.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </InputGroup>
                </View>

                {formData.compStructure === 'fixed' && (
                    <View className="mt-4">
                        <InputGroup label="Amount (₹)">
                            <StyledTextInput
                                icon={DollarSign}
                                inputMode="numeric"
                                value={formData.amount}
                                onChangeText={(val: string) => updateField('amount', val)}
                                placeholder="e.g. 5000"
                            />
                        </InputGroup>
                    </View>
                )}

                {formData.compStructure === 'range' && (
                    <View className="mt-4 flex-row gap-4">
                        <View className="flex-1">
                            <InputGroup label="Minimum (₹)">
                                <StyledTextInput
                                    inputMode="numeric"
                                    value={formData.minAmount}
                                    onChangeText={(val: string) => updateField('minAmount', val)}
                                    placeholder="e.g. 3000"
                                />
                            </InputGroup>
                        </View>
                        <View className="flex-1">
                            <InputGroup label="Maximum (₹) (Optional)">
                                <StyledTextInput
                                    inputMode="numeric"
                                    value={formData.maxAmount}
                                    onChangeText={(val: string) => updateField('maxAmount', val)}
                                    placeholder="e.g. 8000"
                                />
                            </InputGroup>
                        </View>
                    </View>
                )}

                <TouchableOpacity
                    className="flex-row items-center gap-3 mt-4 p-3 rounded-xl bg-zinc-800/50"
                    onPress={() => updateField('negotiable', !formData.negotiable)}
                >
                    <View className={`w-6 h-6 rounded-md border items-center justify-center ${formData.negotiable ? 'bg-[#FF6B35] border-[#FF6B35]' : 'border-zinc-600'
                        }`}>
                        {formData.negotiable && <Check size={14} color="#fff" />}
                    </View>
                    <View>
                        <Text className="text-white font-medium">Negotiable</Text>
                        <Text className="text-xs text-zinc-500">Open to discuss compensation</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );

    /* -------------------------------------------------------------------------- */
    /*                                 STEP 4                                     */
    /* -------------------------------------------------------------------------- */
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
                    Sell the opportunity—requirements and benefits
                </Text>
            </LinearGradient>

            <View className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6">
                <Text className="text-white font-black text-lg tracking-tight mb-4">
                    Media Requirements
                </Text>
                <Text className="text-zinc-400 text-sm mb-4">
                    What should applicants submit?
                </Text>

                <View className="gap-3">
                    {[
                        { key: 'mediaHeadshot', label: 'Headshot Photos' },
                        { key: 'mediaFullBody', label: 'Full-Body Photos' },
                        { key: 'mediaReel', label: 'Video Reel' },
                        { key: 'mediaAudio', label: 'Audio Sample' }
                    ].map((item) => (
                        <TouchableOpacity
                            key={item.key}
                            className="flex-row items-center gap-3 p-3 rounded-xl bg-zinc-800/50"
                            onPress={() => updateField(item.key, !formData[item.key as keyof typeof formData])}
                        >
                            <View className={`w-5 h-5 rounded border items-center justify-center ${formData[item.key as keyof typeof formData]
                                ? 'bg-[#FF6B35] border-[#FF6B35]'
                                : 'border-zinc-500'
                                }`}>
                                {formData[item.key as keyof typeof formData] && <Check size={12} color="#fff" />}
                            </View>
                            <Text className="text-white text-sm font-medium">{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <InputGroup label="Specific Instructions" subtitle="Notes for applicants">
                <TextArea
                    rows={4}
                    value={formData.requirements}
                    onChangeText={(val: string) => updateField('requirements', val)}
                    placeholder="e.g. Please wear black for the audition reel."
                />
            </InputGroup>

            <InputGroup label="Additional Benefits" subtitle="Perks attract better talent">
                <TagInput
                    value={formData.benefits}
                    onChangeTags={(val: string) => updateField('benefits', val)}
                    placeholder="e.g. Travel, Meals"
                />
            </InputGroup>

            <InputGroup label="Terms and Conditions" subtitle="Legal or specific conditions for the gig">
                <View className="items-end mb-2">
                    <TouchableOpacity
                        onPress={() => handleRephrase('termsAndConditions')}
                        disabled={!!rephrasingField}
                        className="flex-row items-center gap-1.5 bg-zinc-800/80 px-3 py-1.5 rounded-full border border-zinc-700/50"
                    >
                        {rephrasingField === 'termsAndConditions' ? (
                            <ActivityIndicator size="small" color="#FF6B35" />
                        ) : (
                            <Wand2 size={12} color="#FF6B35" />
                        )}
                        <Text className="text-[#FF6B35] text-[10px] font-black uppercase tracking-wider">
                            {rephrasingField === 'termsAndConditions' ? 'AI Magic...' : 'Rephrase with AI'}
                        </Text>
                    </TouchableOpacity>
                </View>
                <TextArea
                    rows={4}
                    value={formData.termsAndConditions}
                    onChangeText={(val: string) => updateField('termsAndConditions', val)}
                    placeholder="e.g. Non-disclosure agreement required, no social media posting during shoot, etc."
                />
            </InputGroup>
        </View>
    );

    /* -------------------------------------------------------------------------- */
    /*                                 STEP 5                                     */
    /* -------------------------------------------------------------------------- */
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
                    Almost there! Review and publish your gig
                </Text>
            </LinearGradient>

            {/* Settings */}
            <View className="gap-6">
                <View className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6">
                    <Text className="text-white font-black text-lg tracking-tight mb-4">
                        Application Settings
                    </Text>

                    <InputGroup label="Max Applications" subtitle="Stop accepting after X applies">
                        <StyledTextInput
                            inputMode="numeric"
                            value={formData.maxApplicants}
                            onChangeText={(val: string) => updateField('maxApplicants', val)}
                            placeholder="e.g. 100"
                        />
                    </InputGroup>

                    <View className="mt-4">
                        <DatePickerInput
                            label="Application Deadline"
                            value={formData.deadline}
                            onChange={(date: Date) => updateField('deadline', dayjs(date).format('YYYY-MM-DD'))}
                            placeholder="Select Deadline"
                            minimumDate={new Date()}
                        />
                    </View>
                </View>

                <View className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6 gap-4">
                    <Text className="text-white font-black text-lg tracking-tight mb-2">
                        Boost Visibility
                    </Text>

                    <TouchableOpacity
                        className="flex-row items-center gap-3 p-4 rounded-xl bg-zinc-800/50"
                        onPress={() => updateField('urgent', !formData.urgent)}
                    >
                        <View className={`w-6 h-6 rounded-md border items-center justify-center ${formData.urgent ? 'bg-orange-500 border-orange-500' : 'border-zinc-600'
                            }`}>
                            {formData.urgent && <Check size={14} color="#fff" />}
                        </View>
                        <View className="flex-1">
                            <Text className="text-white font-bold">Urgent Gig</Text>
                            <Text className="text-xs text-zinc-400">Adds an "URGENT" badge to attract fast applicants</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="flex-row items-center gap-3 p-4 rounded-xl bg-zinc-800/50"
                        onPress={() => updateField('featured', !formData.featured)}
                    >
                        <View className={`w-6 h-6 rounded-md border items-center justify-center ${formData.featured ? 'bg-[#FF6B35] border-[#FF6B35]' : 'border-zinc-600'
                            }`}>
                            {formData.featured && <Check size={14} color="#fff" />}
                        </View>
                        <View className="flex-1">
                            <Text className="text-white font-bold">Feature this Gig</Text>
                            <Text className="text-xs text-zinc-400">Pin to top of search results (+₹500)</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Preview Card */}
            <View className="bg-zinc-900/40 border border-[#FF6B35]/30 rounded-2xl p-6">
                <View className="flex-row items-center mb-4">
                    <Eye size={18} color="#FF6B35" />
                    <Text className="text-[#FF6B35] font-black ml-2 uppercase tracking-wider text-sm">
                        Preview
                    </Text>
                </View>

                <View className="gap-3">
                    <View className="flex-row gap-2 mb-2">
                        {formData.urgent && (
                            <View className="bg-orange-500/20 px-3 py-1 rounded">
                                <Text className="text-orange-300 text-xs font-black uppercase">URGENT</Text>
                            </View>
                        )}
                        <View className="bg-zinc-700 px-3 py-1 rounded">
                            <Text className="text-zinc-300 text-xs font-medium capitalize">{formData.artistType}</Text>
                        </View>
                    </View>

                    <Text className="text-white text-2xl font-black tracking-tight">
                        {formData.title}
                    </Text>

                    <View className="flex-row items-center gap-4 mt-2">
                        <View className="flex-row items-center">
                            <MapPin size={14} color="rgba(255, 255, 255, 0.5)" />
                            <Text className="text-zinc-400 text-sm ml-1">{formData.city}</Text>
                        </View>
                        <View className="flex-row items-center">
                            <Calendar size={14} color="rgba(255, 255, 255, 0.5)" />
                            <Text className="text-zinc-400 text-sm ml-1">{formData.startDate}</Text>
                        </View>
                    </View>

                    <View className="h-px bg-white/10 my-3" />

                    <View className="flex-row justify-between items-end">
                        <View>
                            <Text className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Compensation</Text>
                            <Text className="text-white text-2xl font-black">₹{formData.amount}</Text>
                            <Text className="text-zinc-500 text-xs uppercase tracking-wide">{formData.compType}</Text>
                        </View>
                        {formData.featured && (
                            <View className="bg-[#FF6B35]/15 px-3 py-2 rounded-lg">
                                <Text className="text-[#FF6B35] text-xs font-black uppercase tracking-wider">
                                    ⭐ FEATURED
                                </Text>
                            </View>
                        )}
                    </View>

                    <View className="mt-3 p-3 bg-zinc-800/50 rounded-lg">
                        <Text className="text-zinc-300 text-sm italic" numberOfLines={3}>
                            "{formData.description}"
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );

    return (
        <ScrollView ref={scrollViewRef} className="flex-1 bg-black" contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
            <View className="flex-col lg:flex-row gap-8">
                <StepIndicator
                    currentStep={currentStep}
                    steps={steps}
                    completedSteps={completedSteps}
                />

                <View className="flex-1 max-w-3xl">
                    <View className="mb-6">
                        <Text className="text-4xl font-black text-white mb-2 tracking-tight">
                            {steps[currentStep - 1].title}
                        </Text>
                        <Text className="text-zinc-400 font-light">{steps[currentStep - 1].subtitle}</Text>
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

            {/* Footer Actions */}
            <View className="flex-row justify-between items-center mt-12 pt-8 border-t border-white/10">
                <TouchableOpacity
                    onPress={handleBack}
                    className={`flex-row items-center gap-2 px-6 py-3 rounded-xl ${currentStep === 1 ? 'opacity-50' : ''}`}
                    disabled={isLoading}
                >
                    <ChevronLeft size={20} color={currentStep === 1 ? "#52525b" : "#d4d4d8"} />
                    <Text className={`font-medium ${currentStep === 1 ? 'text-zinc-600' : 'text-zinc-300'}`}>
                        {currentStep === 1 ? 'Cancel' : 'Back'}
                    </Text>
                </TouchableOpacity>

                {currentStep === steps.length ? (
                    <View className="flex-row gap-3">
                        {/* Draft Button */}
                        <TouchableOpacity
                            className={`px-6 py-3 rounded-xl border border-white/20 bg-zinc-900/50 ${isLoading ? 'opacity-50' : ''}`}
                            onPress={() => handleSubmit(true)}
                            disabled={isLoading}
                        >
                            <Text className="text-zinc-300 font-bold">Save Draft</Text>
                        </TouchableOpacity>

                        {/* Publish Button */}
                        <TouchableOpacity
                            onPress={() => handleSubmit(false)}
                            disabled={isLoading}
                        >
                            <LinearGradient
                                colors={['#FF6B35', '#FF8C42']}
                                start={[0, 0]}
                                end={[1, 0]}
                                className="flex-row items-center gap-2 px-8 py-3 rounded-xl"
                                style={{
                                    shadowColor: '#FF6B35',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 12,
                                }}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Text className="text-white font-black text-base tracking-tight">
                                            Publish Gig
                                        </Text>
                                        <Check size={20} color="#fff" />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity onPress={handleNext} disabled={isLoading}>
                        <LinearGradient
                            colors={['#FF6B35', '#FF8C42']}
                            start={[0, 0]}
                            end={[1, 0]}
                            className="flex-row items-center gap-2 px-8 py-3 rounded-xl"
                            style={{
                                shadowColor: '#FF6B35',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 12,
                            }}
                        >
                            <Text className="text-white font-black text-base tracking-tight">Next Step</Text>
                            <ChevronRight size={20} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                )}
            </View>


        </ScrollView >
    );
};