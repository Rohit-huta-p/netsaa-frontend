import React, { useState } from 'react';
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
    Sparkles,
    Layout,
    Type,
    AlignLeft,
    Eye,
    Camera,
    Clock
} from 'lucide-react-native';
import { StepIndicator } from '@/components/common/StepIndicator';
import { InputGroup } from '@/components/ui/InputGroup';
import { SelectInput } from '@/components/ui/SelectInput';
import { TextArea } from '@/components/ui/TextArea';
import { Chip } from '@/components/ui/Chip';
import { z } from 'zod';
import { useCreateGig, useUpdateGig } from '@/hooks/useGigs';
import { Gig } from '@/types/gig';

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
    amount: z.string().min(1, "Amount is required"),
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
    practiceNotes: z.string().optional()
});

// Simple TextInput wrapper for consistency with design
const StyledTextInput = ({ value, onChangeText, placeholder, icon: Icon, type = 'text', ...props }: any) => (
    <View className="relative">
        {Icon && (
            <View className="absolute left-3 top-1/2 -translate-y-6 z-10">
                <Icon size={18} color="#71717a" />
            </View>
        )}
        <TextInput
            className={`w-full bg-zinc-900/50 border border-zinc-700 rounded-xl py-3 ${Icon ? 'pl-10' : 'pl-4'} pr-4 text-zinc-100 placeholder-zinc-600 focus:border-indigo-500`}
            placeholder={placeholder}
            placeholderTextColor="#52525b"
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

    // Form State
    const [formData, setFormData] = useState({
        title: 'Need 5 dancers ',
        gigType: 'one-time', // Backend Enum
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

        compType: 'fixed', // Backend Enum
        amount: '2500',
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

        // Practice Days (New)
        practiceCount: '',
        practicePaid: false,
        practiceExtend: false,
        practiceNotes: ''
    });

    const steps = [
        { title: "Core Details", subtitle: "What are you casting?" },
        { title: "The Talent", subtitle: "Who are you looking for?" },
        { title: "Logistics", subtitle: "Where, When & How Much" },
        { title: "The Pitch", subtitle: "Requirements & Benefits" },
        { title: "Finalize", subtitle: "Review & Publish" },
    ];

    const handleNext = () => {
        // Validate current step fields before moving?
        // simple validation for now
        if (currentStep === 1 && !formData.title) {
            Alert.alert("Validation", "Please enter a title");
            return;
        }

        if (!completedSteps.includes(currentStep)) {
            setCompletedSteps(prev => [...prev, currentStep]);
        }
        setCurrentStep(prev => Math.min(prev + 1, steps.length));
    };

    const handleBack = () => {
        if (currentStep === 1) {
            onCancel();
        } else {
            setCurrentStep(prev => Math.max(prev - 1, 1));
        }
    };

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear specific error if any
        if (validationErrors[field]) {
            setValidationErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleSubmit = async (isDraft: boolean = false) => {
        // Zod Validation
        const result = formSchema.safeParse(formData);

        if (!result.success) {
            const errors: any = {};
            result.error.issues.forEach(issue => {
                errors[issue.path[0]] = issue.message;
            });
            setValidationErrors(errors);
            Alert.alert("Validation Error", "Please check the form for errors.");
            return;
        }

        // Map to Backend DTO
        const payload: Partial<Gig> = {
            title: formData.title,
            description: formData.description,
            type: formData.gigType as any,
            category: formData.category,
            tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],

            artistTypes: [formData.artistType],
            requiredSkills: formData.skills ? formData.skills.split(',').map(s => s.trim()) : [],
            experienceLevel: formData.experienceLevel as any,

            genderPreference: formData.gender as any,
            physicalRequirements: `Height: ${formData.minHeight || '?'} - ${formData.maxHeight || '?'} cm`,

            ageRange: {
                min: formData.minAge ? parseInt(formData.minAge) : undefined,
                max: formData.maxAge ? parseInt(formData.maxAge) : undefined
            },

            location: {
                city: formData.city,
                venueName: formData.venue,
                address: formData.address,
                isRemote: false,
                country: 'India',
                state: ''
            },

            schedule: {
                startDate: formData.startDate,
                endDate: formData.endDate || formData.startDate,
                durationLabel: 'TBD',
                timeCommitment: formData.timeCommitment,
                practiceDays: {
                    count: parseInt(formData.practiceCount) || 0,
                    isPaid: formData.practicePaid,
                    mayExtend: formData.practiceExtend,
                    notes: formData.practiceNotes
                }
            },

            compensation: {
                model: formData.compType as any,
                amount: parseFloat(formData.amount) || 0,
                currency: 'INR',
                negotiable: formData.negotiable,
                perks: formData.benefits ? [formData.benefits] : []
            },

            mediaRequirements: {
                headshots: formData.mediaHeadshot,
                fullBody: formData.mediaFullBody,
                videoReel: formData.mediaReel,
                audioSample: formData.mediaAudio,
                notes: formData.requirements // Mapped correctly now
            },

            applicationDeadline: formData.deadline || new Date().toISOString(),
            maxApplications: parseInt(formData.maxApplicants) || 100,

            isUrgent: formData.urgent,
            isFeatured: formData.featured,
            // Set status based on isDraft parameter
            status: isDraft ? 'draft' : 'published'
        };

        // Create gig with appropriate status (draft or published)
        createGigMutation.mutate(payload, {
            onSuccess: (createdGig) => {
                if (isDraft) {
                    Alert.alert("Draft Saved", "Your gig has been saved as a draft.");
                } else {
                    Alert.alert("Success", "Gig published successfully!");
                }
                onPublish(createdGig);
            },
            onError: (err) => {
                Alert.alert("Error", err.message || `Failed to ${isDraft ? 'save draft' : 'publish gig'}`);
            }
        });
    };

    // Render Steps
    const renderStep1 = () => (
        <View className="gap-4">
            <View className="bg-indigo-500/10 p-4 rounded-2xl border border-indigo-500/20 mb-4">
                <Text className="text-indigo-300 font-semibold mb-2 flex-row items-center">
                    <Sparkles size={16} color="#818cf8" /> Pro Tip
                </Text>
                <Text className="text-zinc-400 text-sm">
                    Specific titles attract 40% more qualified applicants. Instead of "Dancer needed", try "Hip-Hop Dancer for Music Video".
                </Text>
            </View>

            <InputGroup label="Gig Title" required error={validationErrors.title}>
                <StyledTextInput
                    icon={Type}
                    value={formData.title}
                    onChangeText={(val: string) => updateField('title', val)}
                    placeholder="e.g. Lead Guitarist for Summer Tour"
                />
            </InputGroup>

            <View className="flex-col md:flex-row gap-4">
                <InputGroup label="Gig Type" required>
                    <SelectInput
                        icon={Layout}
                        options={[
                            { label: 'One-Time', value: 'one-time' },
                            { label: 'Recurring', value: 'recurring' },
                            { label: 'Contract', value: 'contract' }
                        ]}
                        value={formData.gigType}
                        onChange={(val) => updateField('gigType', val)}
                    />
                </InputGroup>

                <InputGroup label="Category" required error={validationErrors.category}>
                    <SelectInput
                        icon={Briefcase}
                        options={[
                            { label: 'Music Video', value: 'music_video' },
                            { label: 'Commercial', value: 'commercial' },
                            { label: 'Live Event', value: 'live_event' },
                            { label: 'Movie / Film', value: 'movie' },
                            { label: 'Theatre', value: 'theatre' }
                        ]}
                        value={formData.category}
                        onChange={(val) => updateField('category', val)}
                    />
                </InputGroup>
            </View>

            <InputGroup label="Tags" subtitle="Press Enter to add">
                <StyledTextInput
                    icon={AlignLeft}
                    value={formData.tags}
                    onChangeText={(val: string) => updateField('tags', val)}
                    placeholder="Add tags separated by commas..."
                />
            </InputGroup>
        </View>
    );

    const renderStep2 = () => (
        <View className="gap-4">
            <InputGroup label="Artist Type" required error={validationErrors.artistType}>
                <View className="flex-row flex-wrap">
                    {['Dancer', 'Singer', 'Model', 'Musician', 'DJ', 'Actor', 'Other'].map(type => (
                        <Chip
                            key={type}
                            label={type}
                            selected={formData.artistType.toLowerCase() === type.toLowerCase()}
                            onClick={() => updateField('artistType', type.toLowerCase())}
                        />
                    ))}
                </View>
            </InputGroup>

            <InputGroup label="Experience Level" required>
                <SelectInput
                    options={[
                        { label: 'Beginner', value: 'beginner' },
                        { label: 'Intermediate', value: 'intermediate' },
                        { label: 'Professional', value: 'professional' }
                    ]}
                    value={formData.experienceLevel}
                    onChange={(val) => updateField('experienceLevel', val)}
                />
            </InputGroup>

            <InputGroup label="Required Skills">
                <StyledTextInput
                    value={formData.skills}
                    onChangeText={(val: string) => updateField('skills', val)}
                    placeholder="e.g. Ballet, Tap, Sight Reading"
                />
            </InputGroup>

            <View className="gap-4">
                <InputGroup label="Gender Preference">
                    <SelectInput
                        icon={User}
                        options={[
                            { label: 'Any', value: 'any' },
                            { label: 'Female', value: 'female' },
                            { label: 'Male', value: 'male' },
                            { label: 'Other / NB', value: 'other' }
                        ]}
                        value={formData.gender}
                        onChange={(val) => updateField('gender', val)}
                    />
                </InputGroup>

                <View className="flex-row gap-4">
                    <View className="flex-1">
                        <InputGroup label="Min Age">
                            <StyledTextInput
                                inputMode="numeric"
                                value={formData.minAge}
                                onChangeText={(val: string) => updateField('minAge', val)}
                                placeholder="18"
                            />
                        </InputGroup>
                    </View>
                    <View className="flex-1">
                        <InputGroup label="Max Age">
                            <StyledTextInput
                                inputMode="numeric"
                                value={formData.maxAge}
                                onChangeText={(val: string) => updateField('maxAge', val)}
                                placeholder="60"
                            />
                        </InputGroup>
                    </View>
                </View>

                <View className="flex-row gap-4">
                    <View className="flex-1">
                        <InputGroup label="Min Ht (cm)">
                            <StyledTextInput
                                inputMode="numeric"
                                value={formData.minHeight}
                                onChangeText={(val: string) => updateField('minHeight', val)}
                                placeholder="150"
                            />
                        </InputGroup>
                    </View>
                    <View className="flex-1">
                        <InputGroup label="Max Ht (cm)">
                            <StyledTextInput
                                inputMode="numeric"
                                value={formData.maxHeight}
                                onChangeText={(val: string) => updateField('maxHeight', val)}
                                placeholder="200"
                            />
                        </InputGroup>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderStep3 = () => (
        <View className="gap-6">
            {/* Compensation Section */}
            <View className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
                <Text className="text-lg font-medium text-white mb-4 flex-row items-center">
                    <DollarSign size={18} color="#4ade80" /> Compensation
                </Text>
                <View className="gap-4">
                    <InputGroup label="Model" required>
                        <SelectInput
                            options={[
                                { label: 'Fixed Price', value: 'fixed' },
                                { label: 'Hourly Rate', value: 'hourly' },
                                { label: 'Per Day', value: 'per-day' }
                            ]}
                            value={formData.compType}
                            onChange={(val) => updateField('compType', val)}
                        />
                    </InputGroup>

                    <View className="flex-row gap-4">
                        <View className="flex-1">
                            <InputGroup label="Amount (INR)" error={validationErrors.amount}>
                                <StyledTextInput
                                    inputMode="numeric"
                                    value={formData.amount}
                                    onChangeText={(val: string) => updateField('amount', val)}
                                    placeholder="0.00"
                                />
                            </InputGroup>
                        </View>
                        <View className="justify-end mb-6">
                            <TouchableOpacity
                                className={`flex-row items-center space-x-2 p-3 rounded-xl border ${formData.negotiable ? 'bg-indigo-500/20 border-indigo-500' : 'border-zinc-700 bg-zinc-900/50'}`}
                                onPress={() => updateField('negotiable', !formData.negotiable)}
                            >
                                <View className={`w-5 h-5 rounded border items-center justify-center ${formData.negotiable ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-500'}`}>
                                    {formData.negotiable && <Check size={12} color="#fff" />}
                                </View>
                                <Text className="text-zinc-300">Negotiable</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>

            {/* Location Section */}
            <View className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
                <Text className="text-lg font-medium text-white mb-4 flex-row items-center">
                    <MapPin size={18} color="#818cf8" /> Location & Schedule
                </Text>
                <View className="gap-4">
                    <InputGroup label="City" required error={validationErrors.city}>
                        <StyledTextInput
                            value={formData.city}
                            onChangeText={(val: string) => updateField('city', val)}
                            placeholder="City, State"
                        />
                    </InputGroup>
                    <InputGroup label="Venue Name">
                        <StyledTextInput
                            value={formData.venue}
                            onChangeText={(val: string) => updateField('venue', val)}
                            placeholder="e.g. MSG"
                        />
                    </InputGroup>
                </View>
                <View className="mt-4">
                    <InputGroup label="Full Address">
                        <StyledTextInput
                            value={formData.address}
                            onChangeText={(val: string) => updateField('address', val)}
                            placeholder="Street Address"
                        />
                    </InputGroup>
                </View>
                <View className="gap-4 mt-4">
                    <InputGroup label="Start Date" required error={validationErrors.startDate}>
                        <StyledTextInput
                            icon={Calendar}
                            value={formData.startDate}
                            onChangeText={(val: string) => updateField('startDate', val)}
                            placeholder="YYYY-MM-DD"
                        />
                    </InputGroup>
                    <InputGroup label="End Date">
                        <StyledTextInput
                            icon={Calendar}
                            value={formData.endDate}
                            onChangeText={(val: string) => updateField('endDate', val)}
                            placeholder="YYYY-MM-DD"
                        />
                    </InputGroup>
                    <InputGroup label="Time Commitment">
                        <StyledTextInput
                            icon={Clock}
                            value={formData.timeCommitment}
                            onChangeText={(val: string) => updateField('timeCommitment', val)}
                            placeholder="e.g. 4 hours per day, 2 days a week"
                        />
                    </InputGroup>

                    {/* Practice Days */}
                    <View className="bg-zinc-800/30 p-4 rounded-xl border border-zinc-800 gap-3">
                        <Text className="text-zinc-400 font-medium mb-1">Rehearsals & Practice</Text>
                        <View className="flex-row gap-4">
                            <View className="flex-1">
                                <InputGroup label="Practice Days (Count)">
                                    <StyledTextInput
                                        inputMode="numeric"
                                        value={formData.practiceCount}
                                        onChangeText={(val: string) => updateField('practiceCount', val)}
                                        placeholder="0"
                                    />
                                </InputGroup>
                            </View>
                            <View className="flex-1 justify-center pt-6">
                                <TouchableOpacity
                                    className="flex-row items-center space-x-2"
                                    onPress={() => updateField('practicePaid', !formData.practicePaid)}
                                >
                                    <View className={`w-5 h-5 rounded border items-center justify-center ${formData.practicePaid ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-500'}`}>
                                        {formData.practicePaid && <Check size={12} color="#fff" />}
                                    </View>
                                    <Text className="text-zinc-300">Paid Rehearsals?</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <InputGroup label="Practice Notes">
                            <StyledTextInput
                                value={formData.practiceNotes}
                                onChangeText={(val: string) => updateField('practiceNotes', val)}
                                placeholder="e.g. 5pm - 8pm at Studio A"
                            />
                        </InputGroup>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderStep4 = () => (
        <View className="gap-4">
            <InputGroup label="Description" required subtitle="Be descriptive. What's the vibe?" error={validationErrors.description}>
                <TextArea
                    rows={6}
                    value={formData.description}
                    onChangeText={(val: string) => updateField('description', val)}
                    placeholder="Describe the role, the project, and the team..."
                />
            </InputGroup>

            {/* Media Requirements Toggle Section */}
            <View className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
                <Text className="text-lg font-medium text-white mb-4 flex-row items-center">
                    <Camera size={18} color="#f472b6" /> Application Requirements
                </Text>
                <Text className="text-zinc-400 text-sm mb-4">What must the artist submit?</Text>

                <View className="flex-row flex-wrap gap-3">
                    {[
                        { key: 'mediaHeadshot', label: 'Headshots' },
                        { key: 'mediaFullBody', label: 'Full Body Shots' },
                        { key: 'mediaReel', label: 'Video Reel' },
                        { key: 'mediaAudio', label: 'Audio Sample' }
                    ].map((item) => (
                        <TouchableOpacity
                            key={item.key}
                            className={`flex-row items-center space-x-2 px-3 py-2 rounded-lg border ${formData[item.key as keyof typeof formData] ? 'bg-pink-500/20 border-pink-500' : 'border-zinc-700 bg-zinc-900'}`}
                            onPress={() => updateField(item.key, !formData[item.key as keyof typeof formData])}
                        >
                            <View className={`w-4 h-4 rounded border items-center justify-center ${formData[item.key as keyof typeof formData] ? 'bg-pink-500 border-pink-500' : 'border-zinc-500'}`}>
                                {formData[item.key as keyof typeof formData] && <Check size={10} color="#fff" />}
                            </View>
                            <Text className="text-zinc-200 text-sm">{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <InputGroup label="Specific Instructions" subtitle="Notes for applicants">
                <TextArea
                    rows={3}
                    value={formData.requirements}
                    onChangeText={(val: string) => updateField('requirements', val)}
                    placeholder="e.g. Please wear black for the audition reel."
                />
            </InputGroup>

            <InputGroup label="Additional Benefits" subtitle="Perks attract better talent.">
                <StyledTextInput
                    icon={Sparkles}
                    value={formData.benefits}
                    onChangeText={(val: string) => updateField('benefits', val)}
                    placeholder="e.g. Travel covered, Meals provided"
                />
            </InputGroup>
        </View>
    );

    const renderStep5 = () => (
        <View className="gap-6">
            {/* Settings */}
            <View className="gap-6">
                <View className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
                    <InputGroup label="Max Applications" subtitle="Stop accepting after X applies">
                        <StyledTextInput
                            inputMode="numeric"
                            value={formData.maxApplicants}
                            onChangeText={(val: string) => updateField('maxApplicants', val)}
                        />
                    </InputGroup>
                    <View className="mt-4">
                        <InputGroup label="Deadline">
                            <StyledTextInput
                                value={formData.deadline}
                                onChangeText={(val: string) => updateField('deadline', val)}
                                placeholder="YYYY-MM-DD"
                            />
                        </InputGroup>
                    </View>
                </View>

                <View className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 gap-4">
                    <TouchableOpacity
                        className="flex-row items-center space-x-3 p-3 rounded-xl bg-zinc-800/50"
                        onPress={() => updateField('urgent', !formData.urgent)}
                    >
                        <View className={`w-6 h-6 rounded-md border items-center justify-center ${formData.urgent ? 'bg-orange-500 border-orange-500' : 'border-zinc-600'}`}>
                            {formData.urgent && <Check size={14} color="#fff" />}
                        </View>
                        <View>
                            <Text className="text-zinc-200 font-medium">Urgent Gig</Text>
                            <Text className="text-xs text-zinc-500">Adds an "Urgent" badge</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="flex-row items-center space-x-3 p-3 rounded-xl bg-zinc-800/50"
                        onPress={() => updateField('featured', !formData.featured)}
                    >
                        <View className={`w-6 h-6 rounded-md border items-center justify-center ${formData.featured ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-600'}`}>
                            {formData.featured && <Check size={14} color="#fff" />}
                        </View>
                        <View>
                            <Text className="text-zinc-200 font-medium">Feature this Gig</Text>
                            <Text className="text-xs text-zinc-500">Pin to top (+$15.00)</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Summary Card */}
            <View className="bg-indigo-900/20 border border-indigo-500/30 rounded-2xl p-6">
                <Text className="text-indigo-200 font-semibold mb-4 flex-row items-center">
                    <Eye size={18} color="#c7d2fe" /> Preview
                </Text>
                <View className="gap-2">
                    <View className="flex-row justify-between items-start">
                        <View className="flex-1 mr-2">
                            <View className="flex-row gap-2 mb-2">
                                {formData.urgent && <Text className="bg-orange-500/20 text-orange-300 text-xs px-2 py-0.5 rounded font-medium overflow-hidden">URGENT</Text>}
                                <Text className="bg-zinc-700 text-zinc-300 text-xs px-2 py-0.5 rounded capitalize overflow-hidden">{formData.artistType}</Text>
                            </View>
                            <Text className="text-xl font-bold text-white mb-1">{formData.title}</Text>
                            <Text className="text-zinc-400 text-sm flex-row items-center">
                                <MapPin size={12} color="#a1a1aa" /> {formData.city} • <Calendar size={12} color="#a1a1aa" /> {formData.startDate}
                            </Text>
                        </View>
                        <View className="items-end">
                            <Text className="text-xl font-bold text-white">₹{formData.amount}</Text>
                            <Text className="text-xs text-zinc-500 uppercase tracking-wide">{formData.compType}</Text>
                        </View>
                    </View>
                    <View className="h-[1px] bg-indigo-500/20 my-2" />
                    <Text className="text-zinc-300 text-sm italic" numberOfLines={3}>"{formData.description}"</Text>
                </View>
            </View>
        </View>
    );

    return (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
            <View className="flex-col lg:flex-row gap-8">
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

            {/* Footer Actions */}
            <View className="flex-row justify-between items-center mt-12 pt-8 border-t border-zinc-800">
                <TouchableOpacity
                    onPress={handleBack}
                    className={`flex-row items-center gap-2 px-6 py-3 rounded-xl font-medium ${currentStep === 1 ? 'opacity-70' : ''}`}
                    disabled={isLoading}
                >
                    <ChevronLeft size={20} color={currentStep === 1 ? "#52525b" : "#d4d4d8"} />
                    <Text className={`${currentStep === 1 ? 'text-zinc-600' : 'text-zinc-300'}`}>{currentStep === 1 ? 'Cancel' : 'Back'}</Text>
                </TouchableOpacity>

                {currentStep === steps.length ? (
                    <View className="flex-row gap-3">
                        {/* Draft Button */}
                        <TouchableOpacity
                            className={`px-6 py-3 rounded-xl font-semibold border border-zinc-600 ${isLoading ? 'opacity-50' : 'active:bg-zinc-800'}`}
                            onPress={() => handleSubmit(true)}
                            disabled={isLoading}
                        >
                            <Text className="text-zinc-300">Save Draft</Text>
                        </TouchableOpacity>

                        {/* Publish Button */}
                        <TouchableOpacity
                            className={`flex-row items-center gap-2 px-8 py-3 rounded-xl font-bold bg-indigo-600 ${isLoading ? 'opacity-50' : 'hover:bg-indigo-500'}`}
                            onPress={() => handleSubmit(false)}
                            disabled={isLoading}
                        >
                            {isLoading ? <ActivityIndicator color="#fff" /> : (
                                <>
                                    <Text className="text-white font-bold mr-2">Publish Gig</Text>
                                    <Check size={20} color="#fff" />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        onPress={handleNext}
                        className="flex-row items-center gap-2 px-8 py-3 rounded-xl font-bold bg-white"
                        disabled={isLoading}
                    >
                        <Text className="text-black font-bold mr-2">Next Step</Text>
                        <ChevronRight size={20} color="#000" />
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
    );
};
