import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert, Animated, Dimensions, Platform, ScrollView } from 'react-native';
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
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { LeaveGigModal } from './LeaveGigModal';

const ARTIST_TYPES = [
    { label: "Dancer", value: "Dancer" },
    { label: "Singer", value: "Singer" },
    { label: "Musician", value: "Musician" },
    { label: "Actor", value: "Actor" },
    { label: "Model", value: "Model" },
    { label: "DJ", value: "DJ" },
    // { label: "Magician", value: "Magician" },
    // { label: "Comedian", value: "Comedian" },
    { label: "Photographer", value: "Photographer" },
    { label: "Videographer", value: "Videographer" },
    { label: "Makeup Artist", value: "Makeup Artist" },
    // { label: "Stylist", value: "Stylist" },
    { label: "Emcee/Host", value: "Emcee" },
    { label: "Performing Artist", value: "Performing Artist" },
    { label: "Band", value: "Band" },
    { label: "Other", value: "Other" }
];

import dayjs from 'dayjs';
import { z } from 'zod';
import { useCreateGig, useUpdateGig, useGig } from '@/hooks/useGigs';
import { Gig } from '@/types/gig';
import { MapLinkCard } from '@/components/location/MapLinkCard';

// Zod Schema synced to backend
const formSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    gigType: z.enum(['one-time', 'recurring', 'contract']),
    category: z.string().optional(),
    tags: z.string().optional(),

    artistType: z.string().min(1, "Artist type is required"),
    skills: z.string().optional(),
    experienceLevel: z.enum(['beginner', 'intermediate', 'professional']),
    gender: z.enum(['any', 'male', 'female', 'other']),
    minAge: z.string().optional(),
    maxAge: z.string().optional(),

    // Height Requirements
    heightSplit: z.boolean().optional(),
    minHeight: z.string().optional(), // Generic or Male
    maxHeight: z.string().optional(),
    femaleMinHeight: z.string().optional(),
    femaleMaxHeight: z.string().optional(),

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

    description: z.string().optional(),
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
const StyledTextInput = ({ value, onChangeText, placeholder, icon: Icon, error, type = 'text', ...props }: any) => (
    <View className="relative">
        {Icon && (
            <View className="absolute left-3 top-[50%] -translate-y-1/2 z-10">
                <Icon size={18} color="rgba(255, 255, 255, 0.4)" />
            </View>
        )}
        <TextInput
            className={`w-full bg-zinc-900/50 border ${error ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 ${Icon ? 'pl-10' : 'pl-4'} pr-4 text-white placeholder-zinc-500 focus:border-[#FF6B35] outline-none`}
            placeholder={placeholder}
            placeholderTextColor="rgba(255, 255, 255, 0.3)"
            value={value}
            onChangeText={onChangeText}
            {...props}
        />
        {error && <Text className="text-red-500 text-xs mt-1 ml-1">{error}</Text>}
    </View>
);

interface GigFormProps {
    onPublish: (data: any) => void;
    onCancel: () => void;
    gigId?: string;
}

export interface GigFormHandle {
    handleBack: () => boolean; // Return true if handled (step > 1), false if should exit (step 1)
}

export const GigForm = React.forwardRef<GigFormHandle, GigFormProps>(({ onPublish, onCancel, gigId }, ref) => {
    const createGigMutation = useCreateGig();
    const updateGigMutation = useUpdateGig();
    const { data: existingGig, isLoading: isGigLoading } = useGig(gigId || '');
    const isLoading = createGigMutation.isPending || updateGigMutation.isPending || (!!gigId && isGigLoading);
    const [leaveModalVisible, setLeaveModalVisible] = useState(false);
    const isNavigatingAway = useRef(false);

    const [rephrasingField, setRephrasingField] = useState<string | null>(null);

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
        title: '',
        gigType: 'one-time',
        category: '',
        tags: '',

        artistType: '',
        skills: '',
        experienceLevel: 'intermediate',
        gender: 'any',
        minAge: '21',
        maxAge: '28',

        heightSplit: false,
        minHeight: '5.2', // Used for Male or Generic
        maxHeight: '5.8',
        femaleMinHeight: '5.0',
        femaleMaxHeight: '5.6',

        compType: 'fixed',
        compStructure: 'fixed', // 'fixed' | 'range' | 'tbd'
        amount: '',
        minAmount: '',
        maxAmount: '',
        negotiable: false,

        city: '',
        venue: '',
        address: '',
        startDate: '',
        endDate: '',
        timeCommitment: '',

        description: '',
        requirements: '',
        benefits: '',

        mediaHeadshot: false,
        mediaFullBody: false,
        mediaReel: false,
        mediaAudio: false,

        maxApplicants: '',
        deadline: '',
        urgent: false,
        featured: false,

        practiceCount: '',
        practicePaid: false,
        practiceExtend: false,
        practiceNotes: '',

        termsAndConditions: ''
    });

    // Populate form data if editing
    React.useEffect(() => {
        if (existingGig && gigId) {
            const gig = existingGig;

            const heightReqs = gig.heightRequirements || {};
            const isSplit = heightReqs.male?.min !== heightReqs.female?.min || heightReqs.male?.max !== heightReqs.female?.max;

            setFormData({
                title: gig.title || '',
                gigType: gig.type || 'one-time',
                category: gig.category || '',
                tags: gig.tags?.join(', ') || '',

                artistType: gig.artistTypes?.[0] || '',
                skills: gig.requiredSkills?.join(', ') || '',
                experienceLevel: gig.experienceLevel || 'intermediate',
                gender: gig.genderPreference || 'any',
                minAge: gig.ageRange?.min?.toString() || '',
                maxAge: gig.ageRange?.max?.toString() || '',

                heightSplit: isSplit,
                minHeight: (isSplit ? heightReqs.male?.min : heightReqs.male?.min) || '',
                maxHeight: (isSplit ? heightReqs.male?.max : heightReqs.male?.max) || '',
                femaleMinHeight: heightReqs.female?.min || '',
                femaleMaxHeight: heightReqs.female?.max || '',

                compType: gig.compensation?.model || 'fixed',
                compStructure: gig.compensation?.minAmount ? 'range' : 'fixed',
                amount: gig.compensation?.amount?.toString() || '',
                minAmount: gig.compensation?.minAmount?.toString() || '',
                maxAmount: gig.compensation?.maxAmount?.toString() || '',
                negotiable: gig.compensation?.negotiable || false,

                city: gig.location?.city || '',
                venue: gig.location?.venueName || '',
                address: gig.location?.address || '',
                startDate: gig.schedule?.startDate ? dayjs(gig.schedule.startDate).format('YYYY-MM-DD') : '',
                endDate: gig.schedule?.endDate ? dayjs(gig.schedule.endDate).format('YYYY-MM-DD') : '',
                timeCommitment: gig.schedule?.timeCommitment || '',

                description: gig.description || '',
                requirements: gig.mediaRequirements?.notes || '',
                benefits: gig.compensation?.perks?.join(', ') || '',

                mediaHeadshot: gig.mediaRequirements?.headshots || false,
                mediaFullBody: gig.mediaRequirements?.fullBody || false,
                mediaReel: gig.mediaRequirements?.videoReel || false,
                mediaAudio: gig.mediaRequirements?.audioSample || false,

                maxApplicants: gig.maxApplications?.toString() || '',
                deadline: gig.applicationDeadline ? dayjs(gig.applicationDeadline).format('YYYY-MM-DD') : '',
                urgent: gig.isUrgent || false,
                featured: gig.isFeatured || false,

                practiceCount: gig.schedule?.practiceDays?.count?.toString() || '',
                practicePaid: gig.schedule?.practiceDays?.isPaid || false,
                practiceExtend: gig.schedule?.practiceDays?.mayExtend || false,
                practiceNotes: gig.schedule?.practiceDays?.notes || '',

                termsAndConditions: gig.termsAndConditions || ''
            });
        }
    }, [existingGig, gigId]);

    const [errors, setErrors] = useState<Record<string, string>>({});

    // 10-Step Wizard (0-9 index) - Removed Practice Step
    // 0: Identity, 1: Talent Role, 2: Preferences, 3: Location, 4: Schedule, 
    // 5: Compensation (was 6), 6: Pitch (was 7), 7: Media (was 8), 8: Applications (was 9), 9: Review (was 10)
    const TOTAL_STEPS = 10;
    const [step, setStep] = useState(0);
    const [stepError, setStepError] = useState<string | null>(null);
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
        { title: "Gig Identity", subtitle: "What is this gig?" },
        { title: "The Talent", subtitle: "Who are you hiring?" },
        { title: "Preferences", subtitle: "Any specific criteria?" },
        { title: "Gig Location", subtitle: "Where will this happen?" },
        { title: "Schedule", subtitle: "When is the work?" },
        // { title: "Practice", subtitle: "Rehearsal details" }, // Removed
        { title: "Compensation", subtitle: "How will artists be paid?" },
        { title: "The Pitch (Optional)", subtitle: "Why should they apply?" },
        { title: "Media (Optional)", subtitle: "Submission requirements" },
        { title: "Applications", subtitle: "Visibility & Limits" },
        { title: "Review", subtitle: "Ready to publish?" },
    ];

    const handleNext = () => {
        // Validation per step
        let newErrors: Record<string, string> = {};
        let hasError = false;

        if (step === 0) {
            if (!formData.title?.trim()) {
                newErrors.title = "Please enter a title";
                hasError = true;
            }
        } else if (step === 1) {
            if (!formData.artistType?.trim()) {
                newErrors.artistType = "Artist type is required";
                hasError = true;
            }
        } else if (step === 3) {
            if (!formData.city?.trim()) {
                newErrors.city = "City is required";
                hasError = true;
            }
        } else if (step === 4) {
            if (!formData.startDate) {
                newErrors.startDate = "Start Date is required";
                hasError = true;
            } else if (formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
                newErrors.endDate = "End Date cannot be before Start Date";
                hasError = true;
            }
        }
        // Step 5 is now Compensation (was 6)
        else if (step === 5) {
            if (formData.compStructure === 'fixed' && !formData.amount) {
                newErrors.amount = "Please enter an amount";
                hasError = true;
            } else if (formData.compStructure === 'range' && !formData.minAmount) {
                newErrors.minAmount = "Please enter a minimum amount";
                hasError = true;
            }
        }
        // Step 6 is Pitch (was 7) - Description is optional now
        /* else if (step === 6) {
             if (!formData.description?.trim() || formData.description.length < 10) {
                 newErrors.description = "Description must be at least 10 chars";
                 hasError = true;
             }
        } */

        if (hasError) {
            setErrors(newErrors);
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
            return;
        }

        if (step < TOTAL_STEPS - 1) {
            setErrors({}); // Clear errors on success
            animateToStep(step + 1);
        }
    };

    const handleBackInternal = () => {
        // If we want to allow exit (e.g. discarded), return false
        if (isNavigatingAway.current) return false;

        if (step > 0) {
            animateToStep(step - 1);
            return true;
        }
        setLeaveModalVisible(true);
        return true;
    };

    React.useImperativeHandle(ref, () => ({
        handleBack: handleBackInternal
    }));

    // BackHandler is intentionally NOT registered here.
    // The parent (create.tsx) uses useStepBackGuard which handles:
    //   Android → BackHandler
    //   iOS     → navigation.beforeRemove
    //   Web     → window popstate
    // Registering it here too would cause double-fire on Android.



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
        console.log("Publishing Gig");
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

                heightRequirements: parsed.heightSplit ? {
                    male: { min: parsed.minHeight || "", max: parsed.maxHeight || "" },
                    female: { min: parsed.femaleMinHeight || "", max: parsed.femaleMaxHeight || "" }
                } : {
                    male: { min: parsed.minHeight || "", max: parsed.maxHeight || "" },
                    female: { min: parsed.minHeight || "", max: parsed.maxHeight || "" }
                },

                // physicalRequirements: `Height: ${parsed.minHeight}-${parsed.maxHeight}cm`,

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

            if (gigId) {
                await updateGigMutation.mutateAsync({ id: gigId, payload: payload });
                Alert.alert("Success", "Gig updated successfully!");
            } else {
                await createGigMutation.mutateAsync(payload);
                Alert.alert("Success", `Gig ${isDraft ? 'saved as draft' : 'published'} successfully!`);
            }
            isNavigatingAway.current = true;
            onPublish(payload);
        } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to create gig");
        }
    };

    /* -------------------------------------------------------------------------- */
    /*                                 STEP 1                                     */
    /* -------------------------------------------------------------------------- */
    /* -------------------------------------------------------------------------- */
    /*                                 STEP 0: Identity                           */
    /* -------------------------------------------------------------------------- */
    const renderStep0 = () => (
        <View className="">
            <InputGroup label="Gig Title" subtitle="Make it clear and specific">
                <StyledTextInput
                    icon={Pencil}
                    value={formData.title}
                    onChangeText={(val: string) => updateField('title', val)}
                    placeholder="e.g. Need 5 Dancers for Sangeet Performance"
                    error={errors.title}
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

            <InputGroup label="Category (Optional)">
                <StyledTextInput
                    icon={Layout}
                    value={formData.category}
                    onChangeText={(val: string) => updateField('category', val)}
                    placeholder="e.g. Wedding, Corporate Event, Concert"
                    error={errors.category}
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
    /*                                 STEP 1: Talent                             */
    /* -------------------------------------------------------------------------- */
    const renderStep1 = () => (
        <ScrollView className="gap-6">
            <InputGroup label="Artist Type" subtitle="Primary performer role">
                <SearchableSelect
                    options={ARTIST_TYPES}
                    value={formData.artistType}
                    onChange={(val) => updateField('artistType', val)}
                    placeholder="Select Artist Type"
                    icon={User}
                    error={errors.artistType}
                    allowCustom={true}
                    label="Select Artist Type"
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
        </ScrollView>
    );

    /* -------------------------------------------------------------------------- */
    /*                                 STEP 2: Preferences                        */
    /* -------------------------------------------------------------------------- */
    const renderStep2 = () => (
        <View className="gap-6">
            <InputGroup label="Gender Preference">
                <View className="grid grid-cols-2 lg:flex-row gap-3">
                    {['Any', 'Male', 'Female', 'Other'].map((gen) => (
                        <TouchableOpacity
                            key={gen}
                            onPress={() => updateField('gender', gen.toLowerCase())}
                            className={`flex-1 px-4 py-3 rounded-xl border ${formData.gender === gen.toLowerCase()
                                ? 'bg-[#FF6B35]/15 border-[#FF6B35]'
                                : 'bg-zinc-900/50 border-white/10'
                                }`}
                        >
                            <Text className={`text-center font-bold capitalize ${formData.gender === gen.toLowerCase() ? 'text-[#FF6B35]' : 'text-zinc-400'
                                }`}>
                                {gen}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </InputGroup>

            <View className="flex-row gap-4">
                {/* Age Range */}
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

                {/* Height Range */}
                <View className="flex-1">
                    <Text className="text-zinc-400 mb-2 font-medium">Height (ft)</Text>

                    {/* Different Requirements Toggle (Only for 'Any' or 'Other') */}
                    {(formData.gender === 'any' || formData.gender === 'other') && (
                        <TouchableOpacity
                            onPress={() => updateField('heightSplit', !formData.heightSplit)}
                            className="flex-row items-center gap-2 mb-3"
                        >
                            <View className={`w-4 h-4 rounded border ${formData.heightSplit ? 'bg-[#FF6B35] border-[#FF6B35]' : 'border-zinc-500'} items-center justify-center`}>
                                {formData.heightSplit && <Check size={10} color="#fff" />}
                            </View>
                            <Text className="text-zinc-400 text-xs">Different for Male/Female?</Text>
                        </TouchableOpacity>
                    )}

                    {/* Male / Generic Height Input */}
                    <View className="mb-3">
                        {formData.heightSplit && <Text className="text-zinc-500 text-xs mb-1">Male / Generic</Text>}
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

                    {/* Female Height Input (Conditional) */}
                    {formData.heightSplit && (
                        <View>
                            <Text className="text-zinc-500 text-xs mb-1">Female</Text>
                            <View className="flex-row items-center gap-3">
                                <View className="flex-1">
                                    <TextInput
                                        className="bg-zinc-900/50 border border-white/10 rounded-xl py-3 px-4 text-white text-center font-bold"
                                        placeholder="Min"
                                        placeholderTextColor="rgba(255, 255, 255, 0.3)"
                                        keyboardType="numeric"
                                        value={formData.femaleMinHeight}
                                        onChangeText={(val) => updateField('femaleMinHeight', val)}
                                    />
                                </View>
                                <Text className="text-zinc-500 font-medium text-lg">-</Text>
                                <View className="flex-1">
                                    <TextInput
                                        className="bg-zinc-900/50 border border-white/10 rounded-xl py-3 px-4 text-white text-center font-bold"
                                        placeholder="Max"
                                        placeholderTextColor="rgba(255, 255, 255, 0.3)"
                                        keyboardType="numeric"
                                        value={formData.femaleMaxHeight}
                                        onChangeText={(val) => updateField('femaleMaxHeight', val)}
                                    />
                                </View>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );

    /* -------------------------------------------------------------------------- */
    /*                                 STEP 3: Location                           */
    /* -------------------------------------------------------------------------- */
    const renderStep3 = () => (
        <View className="gap-6">
            <InputGroup label="City">
                <StyledTextInput
                    icon={MapPin}
                    value={formData.city}
                    onChangeText={(val: string) => updateField('city', val)}
                    placeholder="e.g. Mumbai, Delhi, Bangalore"
                    error={errors.city}
                />
            </InputGroup>

            <InputGroup label="Venue Name (Optional)">
                <StyledTextInput
                    value={formData.venue}
                    onChangeText={(val: string) => updateField('venue', val)}
                    placeholder="e.g. Grand Ballroom, XYZ Hotel"
                />
            </InputGroup>

            <InputGroup label="Full Address (Optional)">
                <StyledTextInput
                    value={formData.address}
                    onChangeText={(val: string) => updateField('address', val)}
                    placeholder="Street, Area, Landmark"
                />
            </InputGroup>
            {formData.venue && (
                <View className="">
                    <MapLinkCard
                        venueName={formData.venue}
                        address={formData.address}
                        city={formData.city}
                        state={'State'}
                        country={'India'}
                    />
                </View>
            )}
        </View>
    );

    /* -------------------------------------------------------------------------- */
    /*                                 STEP 4: Schedule                           */
    /* -------------------------------------------------------------------------- */
    const renderStep4 = () => (
        <View className="gap-6">
            <View className="flex-row gap-4">
                <View className="flex-1">
                    <DatePickerInput
                        label="Start Date"
                        value={formData.startDate}
                        onChange={(date: Date) => updateField('startDate', dayjs(date).format('YYYY-MM-DD'))}
                        placeholder="Select Date"
                        minimumDate={new Date()}
                        error={errors.startDate}
                    />
                </View>
                <View className="flex-1">
                    <DatePickerInput
                        label="End Date (Optional)"
                        value={formData.endDate}
                        onChange={(date: Date) => updateField('endDate', dayjs(date).format('YYYY-MM-DD'))}
                        placeholder="Select Date"
                        minimumDate={formData.startDate ? new Date(formData.startDate) : new Date()}
                        error={errors.endDate}
                    />
                </View>
            </View>

            <InputGroup label="Time Commitment (Optional)" subtitle="Total hours or daily schedule">
                <StyledTextInput
                    icon={Clock}
                    value={formData.timeCommitment}
                    onChangeText={(val: string) => updateField('timeCommitment', val)}
                    placeholder="2 hours"
                />
            </InputGroup>
        </View>
    );

    /* -------------------------------------------------------------------------- */
    /*                                 STEP 5: Practice (REMOVED)                 */
    /* -------------------------------------------------------------------------- */
    /*
    const renderStep5 = () => (
        <View className="gap-6">
            <InputGroup label="Number of Practices">
                <StyledTextInput
                    value={formData.practiceCount}
                    onChangeText={(val: string) => updateField('practiceCount', val.replace(/[^0-9]/g, ''))}
                    placeholder="e.g. 2"
                    keyboardType="numeric"
                />
            </InputGroup>

            <View className="flex-row gap-3">
                <TouchableOpacity
                    onPress={() => updateField('practicePaid', !formData.practicePaid)}
                    className={`flex-1 px-4 py-3 rounded-xl border ${formData.practicePaid
                        ? 'bg-[#FF6B35]/15 border-[#FF6B35]'
                        : 'bg-zinc-900/50 border-white/10'
                        }`}
                >
                    <Text className={`text-center font-bold ${formData.practicePaid ? 'text-[#FF6B35]' : 'text-zinc-400'}`}>
                        Paid Practice
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => updateField('practiceExtend', !formData.practiceExtend)}
                    className={`flex-1 px-4 py-3 rounded-xl border ${formData.practiceExtend
                        ? 'bg-[#FF6B35]/15 border-[#FF6B35]'
                        : 'bg-zinc-900/50 border-white/10'
                        }`}
                >
                    <Text className={`text-center font-bold ${formData.practiceExtend ? 'text-[#FF6B35]' : 'text-zinc-400'}`}>
                        May Extend
                    </Text>
                </TouchableOpacity>
            </View>

            <InputGroup label="Practice Notes (Optional)">
                <StyledTextInput
                    value={formData.practiceNotes}
                    onChangeText={(val: string) => updateField('practiceNotes', val)}
                    placeholder="Specific timing or requirements..."
                />
            </InputGroup>
        </View>
    );
     */
    /* -------------------------------------------------------------------------- */
    /*                                 STEP 6: Compensation                       */
    /* -------------------------------------------------------------------------- */
    const renderStep6 = () => (
        <View className="gap-6">
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

            <InputGroup label="Payment Structure">
                <View className="flex-row gap-2">
                    {[
                        { id: 'fixed', label: 'Fixed Amount' },
                        { id: 'range', label: 'Range / Min' },
                        { id: 'tbd', label: 'To Be Discussed' }
                    ].map((struct) => (
                        <TouchableOpacity
                            key={struct.id}
                            onPress={() => {
                                updateField('compStructure', struct.id);
                                if (struct.id === 'fixed') {
                                    updateField('minAmount', '');
                                    updateField('maxAmount', '');
                                } else if (struct.id === 'range') {
                                    updateField('amount', '');
                                }
                            }}
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

            {formData.compStructure === 'fixed' && (
                <View className="mt-2">
                    <InputGroup label="Amount (₹)">
                        <StyledTextInput
                            icon={DollarSign}
                            inputMode="numeric"
                            value={formData.amount}
                            onChangeText={(val: string) => updateField('amount', val)}
                            placeholder="e.g. 5000"
                            error={errors.amount}
                        />
                    </InputGroup>
                </View>
            )}

            {formData.compStructure === 'range' && (
                <View className="mt-2 flex-row gap-4">
                    <View className="flex-1">
                        <InputGroup label="Minimum (₹)">
                            <StyledTextInput
                                inputMode="numeric"
                                value={formData.minAmount}
                                onChangeText={(val: string) => updateField('minAmount', val)}
                                placeholder="e.g. 3000"
                                error={errors.minAmount}
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
                className="flex-row items-center gap-3 mt-2 p-3 rounded-xl bg-zinc-800/50"
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
    );

    /* -------------------------------------------------------------------------- */
    /*                                 STEP 7: The Pitch                          */
    /* -------------------------------------------------------------------------- */
    const renderStep7 = () => (
        <View className="gap-6">
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
                    error={errors.description}
                />
            </InputGroup>

            <InputGroup label="Key Requirements">
                <TextArea
                    rows={3}
                    value={formData.requirements}
                    onChangeText={(val: string) => updateField('requirements', val)}
                    placeholder="Bullet points of what is absolutely needed..."
                />
            </InputGroup>

            <InputGroup label="Perks & Benefits">
                <StyledTextInput
                    value={formData.benefits}
                    onChangeText={(val: string) => updateField('benefits', val)}
                    placeholder="Travel, Food, Accommodation..."
                />
            </InputGroup>
        </View>
    );

    /* -------------------------------------------------------------------------- */
    /*                                 STEP 8: Media                              */
    /* -------------------------------------------------------------------------- */
    const renderStep8 = () => (
        <View className="gap-6">
            <Text className="text-white font-black text-lg tracking-tight mb-4">
                Submission Requirements
            </Text>
            <Text className="text-zinc-400 text-sm mb-4">
                What should applicants submit?
            </Text>

            <View className="gap-3">
                {[
                    { key: 'mediaHeadshot', label: 'Headshot Photos' },
                    { key: 'mediaFullBody', label: 'Full-Body Photos' },
                    { key: 'mediaReel', label: 'Video Reel' },
                    { key: 'mediaAudio', label: 'Audio Sample' },
                ].map((item) => (
                    <TouchableOpacity
                        key={item.key}
                        onPress={() => updateField(item.key, !formData[item.key as keyof typeof formData])}
                        className="flex-row items-center justify-between p-4 rounded-xl bg-zinc-900/50 border border-white/5"
                    >
                        <Text className="text-zinc-300 font-medium">{item.label}</Text>
                        <View className={`w-6 h-6 rounded-full border items-center justify-center ${formData[item.key as keyof typeof formData]
                            ? 'bg-[#FF6B35] border-[#FF6B35]'
                            : 'border-zinc-600'
                            }`}>
                            {formData[item.key as keyof typeof formData] && <Check size={14} color="#fff" />}
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );


    /* -------------------------------------------------------------------------- */
    /*                                 STEP 9: Applications                       */
    /* -------------------------------------------------------------------------- */
    const renderStep9 = () => (
        <View className="gap-6">
            <View className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6">
                <Text className="text-white font-black text-lg tracking-tight mb-4">
                    Visibility & Limits
                </Text>

                <InputGroup label="No. Of Spot(s)">
                    <StyledTextInput
                        inputMode="numeric"
                        value={formData.maxApplicants}
                        onChangeText={(val: string) => updateField('maxApplicants', val)}
                        placeholder="e.g. 50 (Leave empty for unlimited)"
                    />
                </InputGroup>

                <View className="mt-4">
                    <DatePickerInput
                        label="Application Deadline"
                        value={formData.deadline}
                        onChange={(date: Date) => updateField('deadline', dayjs(date).format('YYYY-MM-DD'))}
                        placeholder="Select Date"
                        minimumDate={new Date()}
                    />
                </View>

                <View className="flex-row gap-4 mt-6">
                    <TouchableOpacity
                        className="flex-row items-center gap-2 flex-1 p-3 rounded-lg bg-zinc-900/50"
                        onPress={() => updateField('urgent', !formData.urgent)}
                    >
                        <View className={`w-5 h-5 rounded border items-center justify-center ${formData.urgent ? 'bg-red-500 border-red-500' : 'border-zinc-500'
                            }`}>
                            {formData.urgent && <Check size={12} color="#fff" />}
                        </View>
                        <Text className="text-zinc-300 text-sm font-bold text-red-400">Mark Urgent</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="flex-row items-center gap-2 flex-1 p-3 rounded-lg bg-zinc-900/50"
                        onPress={() => updateField('featured', !formData.featured)}
                    >
                        <View className={`w-5 h-5 rounded border items-center justify-center ${formData.featured ? 'bg-yellow-500 border-yellow-500' : 'border-zinc-500'
                            }`}>
                            {formData.featured && <Check size={12} color="#fff" />}
                        </View>
                        <Text className="text-zinc-300 text-sm font-bold text-yellow-400">Featured</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <InputGroup label="Terms and Conditions" subtitle="Legal or specific conditions">
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
                    placeholder="e.g. Non-disclosure agreement required..."
                />
            </InputGroup>
        </View>
    );

    /* -------------------------------------------------------------------------- */
    /*                                 STEP 10: Review                            */
    /* -------------------------------------------------------------------------- */
    const renderStep10 = () => (
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
                            <Text className="text-zinc-300 text-[10px] font-bold uppercase">{formData.gigType}</Text>
                        </View>
                    </View>
                    <Text className="text-white text-xl font-black leading-tight mb-1">{formData.title}</Text>
                    <Text className="text-zinc-400 text-sm">{formData.city}</Text>
                </View>

                {/* Preview Body */}
                <View className="p-5 gap-4">
                    <View>
                        <Text className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Role</Text>
                        <Text className="text-zinc-200 font-medium">{formData.artistType}</Text>
                    </View>

                    <View>
                        <Text className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Schedule</Text>
                        <Text className="text-zinc-200 font-medium">{formData.startDate} {formData.endDate ? `to ${formData.endDate}` : ''}</Text>
                        <Text className="text-zinc-400 text-xs">{formData.timeCommitment}</Text>
                    </View>

                    <View>
                        <Text className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Compensation</Text>
                        {formData.compStructure === 'fixed' ? (
                            <Text className="text-white text-lg font-black">₹{formData.amount}</Text>
                        ) : formData.compStructure === 'range' ? (
                            <Text className="text-white text-lg font-black">
                                ₹{formData.minAmount} - {formData.maxAmount ? `₹${formData.maxAmount}` : 'TBA'}
                            </Text>
                        ) : (
                            <Text className="text-white text-lg font-black">To Be Discussed</Text>
                        )}
                    </View>
                </View>
            </View>
        </View>
    );




    /* -------------------------------------------------------------------------- */
    /*                                 RENDER                                     */
    /* -------------------------------------------------------------------------- */
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
                {/* Step Header */}
                <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateX: slideX }] }}>
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

                    {/* Step Content */}
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
                        {/* Step 5 removed */}
                        {step === 5 && renderStep6()}
                        {step === 6 && renderStep7()}
                        {step === 7 && renderStep8()}
                        {step === 8 && renderStep9()}
                        {step === 9 && renderStep10()}
                    </ScrollView>
                </Animated.View>
            </View>

            {/* Footer Navigation (Pinned Bottom) */}
            <View className="absolute bottom-0 left-0 right-0 p-6 bg-black/90 border-t border-white/10" style={{ paddingBottom: Platform.OS === 'ios' ? 40 : 24 }}>
                <View className="flex-row justify-between items-center gap-4">
                    {step > 0 && (
                        <TouchableOpacity
                            onPress={handleBackInternal}
                            className="w-12 h-12 rounded-full bg-zinc-900 border border-white/10 items-center justify-center"
                        >
                            <ChevronLeft size={24} color="#fff" />
                        </TouchableOpacity>
                    )}

                    <View className="flex-1">
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
                                                {gigId ? 'Update' : 'Publish'}
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

            <LeaveGigModal
                visible={leaveModalVisible}
                onDismiss={() => setLeaveModalVisible(false)}
                onSaveDraft={() => handleSubmit(true)}
                onDiscard={() => {
                    isNavigatingAway.current = true;
                    onCancel();
                }}
                isSaving={isLoading}
            />
        </View>
    );
});

GigForm.displayName = 'GigForm';