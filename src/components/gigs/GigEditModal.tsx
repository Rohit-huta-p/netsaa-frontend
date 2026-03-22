import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    useWindowDimensions
} from 'react-native';
import { ChevronDown, ChevronUp, X, Save, Pencil, Clock, MapPin, DollarSign, Layout, User, Calendar, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gig } from '@/types/gig';
import { useUpdateGig } from '@/hooks/useGigs';
import { Typography } from '@/constants/Typography';
import dayjs from 'dayjs';

import { TagInput } from '@/components/ui/TagInput';
import { DatePickerInput } from '@/components/ui/DatePickerInput';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import MultiSlider from '@ptomasroos/react-native-multi-slider';

const T = Typography;

const ARTIST_TYPES = [
    { label: "Dancer", value: "Dancer" },
    { label: "Singer", value: "Singer" },
    { label: "Musician", value: "Musician" },
    { label: "Actor", value: "Actor" },
    { label: "Model", value: "Model" },
    { label: "DJ", value: "DJ" },
    { label: "Photographer", value: "Photographer" },
    { label: "Videographer", value: "Videographer" },
    { label: "Makeup Artist", value: "Makeup Artist" },
    { label: "Emcee/Host", value: "Emcee" },
    { label: "Performing Artist", value: "Performing Artist" },
    { label: "Band", value: "Band" },
    { label: "Other", value: "Other" }
];

interface GigEditModalProps {
    visible: boolean;
    onClose: () => void;
    gig: Gig;
    initialTab: string;
}

// Simple InputGroup component
const InputGroup = ({ label, subtitle, children }: any) => (
    <View className="mb-6">
        <Text style={{ color: '#fff', fontSize: T.size.secondary, fontWeight: T.weight.bold as any, marginBottom: subtitle ? 2 : 8 }}>
            {label}
        </Text>
        {subtitle && <Text className="text-zinc-500 text-xs mb-3">{subtitle}</Text>}
        {children}
    </View>
);

// Styled TextInput
const StyledTextInput = ({ value, onChangeText, placeholder, icon: Icon, multiline = false, keyboardType = 'default', ...props }: any) => (
    <View className="relative">
        {Icon && (
            <View className="absolute left-3 top-[50%] -translate-y-[50%] z-10">
                <Icon size={18} color="rgba(255, 255, 255, 0.4)" />
            </View>
        )}
        <TextInput
            className={`w-full bg-zinc-900/50 border border-white/10 rounded-xl ${multiline ? 'py-4 min-h-[100px]' : 'py-3'} ${Icon ? 'pl-10' : 'pl-4'} pr-4 text-white outline-none`}
            placeholder={placeholder}
            placeholderTextColor="rgba(255, 255, 255, 0.3)"
            value={value}
            onChangeText={onChangeText}
            multiline={multiline}
            keyboardType={keyboardType as any}
            textAlignVertical={multiline ? 'top' : 'center'}
            style={{ fontSize: T.size.body }}
            {...props}
        />
    </View>
);

const AccordionItem = ({ title, sectionKey, isOpen, onToggle, children }: any) => {
    return (
        <View className="mb-4 bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden">
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onToggle(sectionKey)}
                className="p-5 flex-row justify-between items-center"
            >
                <Text className="text-white font-bold text-lg">{title}</Text>
                <View className={`w-8 h-8 rounded-full items-center justify-center ${isOpen ? 'bg-[#FF6B35]/20' : 'bg-white/5'}`}>
                    {isOpen ? <ChevronUp size={16} color="#FF6B35" /> : <ChevronDown size={16} color="rgba(255,255,255,0.5)" />}
                </View>
            </TouchableOpacity>
            {isOpen && (
                <View className="p-5 pt-0 border-t border-white/5 mt-2">
                    {children}
                </View>
            )}
        </View>
    );
};

export const GigEditModal: React.FC<GigEditModalProps> = ({ visible, onClose, gig, initialTab }) => {
    const { width: windowWidth } = useWindowDimensions();
    const [containerWidth, setContainerWidth] = useState(windowWidth - 120);
    const sliderWidth = Math.max(containerWidth - 40, 100);

    const [activeSection, setActiveSection] = useState<string>(initialTab || 'about');
    const updateGigMutation = useUpdateGig();

    // Form State
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        if (visible && gig) {
            const heightReqs = gig.heightRequirements || {};
            const isSplit = heightReqs.male?.min !== heightReqs.female?.min || heightReqs.male?.max !== heightReqs.female?.max;

            setFormData({
                // About
                title: gig.title || '',
                description: gig.description || '',
                type: gig.type || 'one-time',
                category: gig.category || '',
                tags: gig.tags?.join(', ') || '',
                
                // Talent
                artistType: gig.artistTypes?.[0] || '',
                skills: gig.requiredSkills?.join(', ') || '',
                experienceLevel: gig.experienceLevel || 'intermediate',
                gender: gig.genderPreference || 'any',
                minAge: gig.ageRange?.min?.toString() || '18',
                maxAge: gig.ageRange?.max?.toString() || '60',
                heightSplit: isSplit,
                minHeight: (isSplit ? heightReqs.male?.min : heightReqs.male?.min) || '4.0',
                maxHeight: (isSplit ? heightReqs.male?.max : heightReqs.male?.max) || '7.0',
                femaleMinHeight: heightReqs.female?.min || '4.0',
                femaleMaxHeight: heightReqs.female?.max || '7.0',
                
                // Location / Schedule
                city: gig.location?.city || '',
                venueName: gig.location?.venueName || '',
                address: gig.location?.address || '',
                startDate: gig.schedule?.startDate ? dayjs(gig.schedule.startDate).format('YYYY-MM-DD') : '',
                endDate: gig.schedule?.endDate ? dayjs(gig.schedule.endDate).format('YYYY-MM-DD') : '',
                timeCommitment: gig.schedule?.timeCommitment || '',
                
                // Pay
                compType: gig.compensation?.model || 'fixed',
                compStructure: gig.compensation?.minAmount ? 'range' : (gig.compensation?.amount ? 'fixed' : 'tbd'),
                amount: gig.compensation?.amount?.toString() || '',
                minAmount: gig.compensation?.minAmount?.toString() || '',
                maxAmount: gig.compensation?.maxAmount?.toString() || '',
                negotiable: gig.compensation?.negotiable || false,
                perks: gig.compensation?.perks?.join(', ') || '',

                // Apply
                maxApplications: gig.maxApplications?.toString() || '',
                deadline: gig.applicationDeadline ? dayjs(gig.applicationDeadline).format('YYYY-MM-DD') : '',
                
                // Terms
                termsAndConditions: gig.termsAndConditions || '',
            });
            setActiveSection(initialTab);
        }
    }, [visible, gig, initialTab]);

    const handleSave = async () => {
        if (formData.compStructure === 'fixed' && !formData.amount) {
            Alert.alert("Validation Error", "Please enter a fixed amount.");
            return;
        }
        if (formData.compStructure === 'range' && !formData.minAmount) {
            Alert.alert("Validation Error", "Please enter a minimum amount for the range.");
            return;
        }

        try {
            const payload = {
                title: formData.title,
                description: formData.description,
                type: formData.type,
                category: formData.category,
                tags: formData.tags?.split(',').map((t: string) => t.trim()).filter(Boolean) || [],
                
                artistTypes: formData.artistType ? [formData.artistType] : [],
                requiredSkills: formData.skills?.split(',').map((t: string) => t.trim()).filter(Boolean) || [],
                experienceLevel: formData.experienceLevel,
                genderPreference: formData.gender,
                ageRange: {
                    min: formData.minAge ? parseInt(formData.minAge) : undefined,
                    max: formData.maxAge ? parseInt(formData.maxAge) : undefined
                },
                heightRequirements: formData.heightSplit ? {
                    male: { min: formData.minHeight || "", max: formData.maxHeight || "" },
                    female: { min: formData.femaleMinHeight || "", max: formData.femaleMaxHeight || "" }
                } : {
                    male: { min: formData.minHeight || "", max: formData.maxHeight || "" },
                    female: { min: formData.minHeight || "", max: formData.maxHeight || "" }
                },

                location: {
                    ...(gig.location || {}),
                    city: formData.city,
                    venueName: formData.venueName,
                    address: formData.address,
                },
                
                schedule: {
                    ...(gig.schedule || {}),
                    startDate: formData.startDate ? new Date(formData.startDate) : undefined as any,
                    endDate: formData.endDate ? new Date(formData.endDate) : (formData.startDate ? new Date(formData.startDate) : undefined as any),
                    timeCommitment: formData.timeCommitment,
                },

                compensation: {
                    ...(gig.compensation || {}),
                    model: formData.compType,
                    amount: (formData.compStructure === 'fixed' && formData.amount) ? parseInt(formData.amount) : undefined,
                    minAmount: (formData.compStructure === 'range' && formData.minAmount) ? parseInt(formData.minAmount) : undefined,
                    maxAmount: (formData.compStructure === 'range' && formData.maxAmount) ? parseInt(formData.maxAmount) : undefined,
                    negotiable: formData.negotiable,
                    perks: formData.perks?.split(',').map((t: string) => t.trim()).filter(Boolean) || [],
                },

                maxApplications: formData.maxApplications ? parseInt(formData.maxApplications) : undefined,
                applicationDeadline: formData.deadline ? new Date(formData.deadline) : undefined,
                
                termsAndConditions: formData.termsAndConditions,
            };

            await updateGigMutation.mutateAsync({ id: gig._id, payload });
            onClose();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update gig');
        }
    };

    const toggleSection = (section: string) => {
        setActiveSection(activeSection === section ? '' : section);
    };

    const updateField = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View className="flex-1 justify-end bg-black/80">
                <View className="bg-[#0A0A0A] w-full h-[90%] rounded-t-[32px] overflow-hidden border-t border-white/10">
                    
                    {/* Header */}
                    <View className="flex-row items-center justify-between p-6 border-b border-white/5">
                        <View>
                            <Text className="text-white text-2xl font-black">Edit Gig</Text>
                            <Text className="text-zinc-500 text-xs mt-1">Make changes to your gig details</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} className="w-10 h-10 bg-white/5 rounded-full items-center justify-center">
                            <X size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                        <ScrollView 
                            className="flex-1 p-5" 
                            showsVerticalScrollIndicator={false} 
                            contentContainerStyle={{ paddingBottom: 100 }}
                            onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
                        >
                            
                            {/* ABOUT SECTION */}
                            <AccordionItem title="About" sectionKey="about" isOpen={activeSection === 'about'} onToggle={toggleSection}>
                                <InputGroup label="Gig Title">
                                    <StyledTextInput
                                        icon={Pencil}
                                        value={formData.title}
                                        onChangeText={(val: string) => updateField('title', val)}
                                        placeholder="Add a catchy title"
                                    />
                                </InputGroup>

                                <InputGroup label="Gig Type">
                                    <View className="flex-row gap-3">
                                        {['one-time', 'recurring', 'contract'].map((type) => (
                                            <TouchableOpacity
                                                key={type}
                                                onPress={() => updateField('type', type)}
                                                className={`flex-1 px-3 py-3 rounded-xl border ${formData.type === type
                                                    ? 'bg-[#FF6B35]/15 border-[#FF6B35]'
                                                    : 'bg-zinc-900/50 border-white/10'
                                                    }`}
                                            >
                                                <Text className={`text-center font-bold capitalize text-xs ${formData.type === type ? 'text-[#FF6B35]' : 'text-zinc-400'
                                                    }`}>
                                                    {type.replace('-', ' ')}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </InputGroup>

                                <InputGroup label="Description">
                                    <StyledTextInput
                                        value={formData.description}
                                        onChangeText={(val: string) => updateField('description', val)}
                                        placeholder="Describe the gig requirements..."
                                        multiline={true}
                                    />
                                </InputGroup>
                                
                                <InputGroup label="Category">
                                    <StyledTextInput
                                        icon={Layout}
                                        value={formData.category}
                                        onChangeText={(val: string) => updateField('category', val)}
                                        placeholder="e.g. Corporate Event, Wedding"
                                    />
                                </InputGroup>

                                <InputGroup label="Tags" subtitle="Type comma or enter to add tags">
                                    <TagInput
                                        value={formData.tags}
                                        onChangeTags={(val: string) => updateField('tags', val)}
                                        placeholder="e.g. sangeet, classical"
                                    />
                                </InputGroup>
                            </AccordionItem>

                            {/* TALENT CRITERIA SECTION */}
                            <AccordionItem title="Talent Criteria" sectionKey="talent" isOpen={activeSection === 'talent'} onToggle={toggleSection}>
                                <InputGroup label="Artist Type">
                                    <SearchableSelect
                                        options={ARTIST_TYPES}
                                        value={formData.artistType}
                                        onChange={(val) => updateField('artistType', val)}
                                        placeholder="Select Artist Type"
                                        icon={User}
                                        allowCustom={true}
                                        label="Select Artist Type"
                                    />
                                </InputGroup>

                                <InputGroup label="Required Skills">
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
                                                className={`flex-1 px-3 py-3 rounded-xl border ${formData.experienceLevel === level
                                                    ? 'bg-[#FF6B35]/15 border-[#FF6B35]'
                                                    : 'bg-zinc-900/50 border-white/10'
                                                    }`}
                                            >
                                                <Text className={`text-center font-bold capitalize text-xs ${formData.experienceLevel === level ? 'text-[#FF6B35]' : 'text-zinc-400'
                                                    }`}>
                                                    {level}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </InputGroup>

                                <InputGroup label="Gender Preference">
                                    <View className="flex-row gap-3 flex-wrap">
                                        {['Any', 'Male', 'Female', 'Other'].map((gen) => (
                                            <TouchableOpacity
                                                key={gen}
                                                onPress={() => updateField('gender', gen.toLowerCase())}
                                                className={`flex-1 min-w-[45%] px-3 py-3 rounded-xl border ${formData.gender === gen.toLowerCase()
                                                    ? 'bg-[#FF6B35]/15 border-[#FF6B35]'
                                                    : 'bg-zinc-900/50 border-white/10'
                                                    }`}
                                            >
                                                <Text className={`text-center font-bold capitalize text-xs ${formData.gender === gen.toLowerCase() ? 'text-[#FF6B35]' : 'text-zinc-400'
                                                    }`}>
                                                    {gen}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </InputGroup>

                                <View>
                                    <Text className="text-zinc-400 mb-2 font-medium">Age Range (Years)</Text>
                                    <View className="bg-zinc-900/50 border border-white/10 rounded-xl py-4 px-4 mb-4">
                                        <View className="flex-row justify-between mb-2">
                                            <Text style={{ color: '#fff', fontWeight: T.weight.bold as any }}>{formData.minAge || '18'}y</Text>
                                            <Text style={{ color: '#fff', fontWeight: T.weight.bold as any }}>{formData.maxAge || '60'}y</Text>
                                        </View>
                                        <View className="items-center">
                                            <MultiSlider
                                                values={[parseInt(formData.minAge) || 18, parseInt(formData.maxAge) || 60]}
                                                sliderLength={sliderWidth}
                                                onValuesChange={(vals) => {
                                                    updateField('minAge', vals[0].toString());
                                                    updateField('maxAge', vals[1].toString());
                                                }}
                                                min={5} max={100} step={1} allowOverlap={false} snapped
                                                selectedStyle={{ backgroundColor: '#FF6B35' }}
                                                unselectedStyle={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                                                markerStyle={{ backgroundColor: '#FF6B35', width: 20, height: 20, borderWidth: 0, marginTop: 4 }}
                                            />
                                        </View>
                                    </View>
                                </View>

                                <View>
                                    <View className='flex-row justify-between'>
                                        <Text className="text-zinc-400 mb-2 font-medium">Height (ft)</Text>
                                        {(formData.gender === 'any' || formData.gender === 'other') && (
                                            <TouchableOpacity onPress={() => updateField('heightSplit', !formData.heightSplit)} className="flex-row items-center gap-2 mb-3">
                                                <View className={`w-3 h-3 rounded border ${formData.heightSplit ? 'bg-[#FF6B35] border-[#FF6B35]' : 'border-zinc-500'} items-center justify-center`}>
                                                    {formData.heightSplit && <Check size={10} color="#fff" />}
                                                </View>
                                                <Text className="text-zinc-400 text-[10px]">Different for Male/Female?</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    <View className="mb-3">
                                        {formData.heightSplit && <Text className="text-zinc-500 text-xs mb-1">Male / Generic</Text>}
                                        <View className="bg-zinc-900/50 border border-white/10 rounded-xl py-4 px-4">
                                            <View className="flex-row justify-between mb-2">
                                                <Text className="text-white font-bold">{formData.minHeight || '4.0'} ft</Text>
                                                <Text className="text-white font-bold">{formData.maxHeight || '7.0'} ft</Text>
                                            </View>
                                            <View className="items-center">
                                                <MultiSlider
                                                    values={[parseFloat(formData.minHeight) || 4.0, parseFloat(formData.maxHeight) || 7.0]}
                                                    sliderLength={sliderWidth}
                                                    onValuesChange={(vals) => {
                                                        updateField('minHeight', vals[0].toFixed(1));
                                                        updateField('maxHeight', vals[1].toFixed(1));
                                                    }}
                                                    min={3.0} max={8.0} step={0.1} allowOverlap={false} snapped
                                                    selectedStyle={{ backgroundColor: '#FF6B35' }}
                                                    unselectedStyle={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                                                    markerStyle={{ backgroundColor: '#FF6B35', width: 20, height: 20, borderWidth: 0, marginTop: 4 }}
                                                />
                                            </View>
                                        </View>
                                    </View>

                                    {formData.heightSplit && (
                                        <View>
                                            <Text className="text-zinc-500 text-xs mb-1">Female</Text>
                                            <View className="bg-zinc-900/50 border border-white/10 rounded-xl py-4 px-4">
                                                <View className="flex-row justify-between mb-2">
                                                    <Text className="text-white font-bold">{formData.femaleMinHeight || '4.0'} ft</Text>
                                                    <Text className="text-white font-bold">{formData.femaleMaxHeight || '7.0'} ft</Text>
                                                </View>
                                                <View className="items-center">
                                                    <MultiSlider
                                                        values={[parseFloat(formData.femaleMinHeight) || 4.0, parseFloat(formData.femaleMaxHeight) || 7.0]}
                                                        sliderLength={sliderWidth}
                                                        onValuesChange={(vals) => {
                                                            updateField('femaleMinHeight', vals[0].toFixed(1));
                                                            updateField('femaleMaxHeight', vals[1].toFixed(1));
                                                        }}
                                                        min={3.0} max={8.0} step={0.1} allowOverlap={false} snapped
                                                        selectedStyle={{ backgroundColor: '#FF6B35' }}
                                                        unselectedStyle={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                                                        markerStyle={{ backgroundColor: '#FF6B35', width: 20, height: 20, borderWidth: 0, marginTop: 4 }}
                                                    />
                                                </View>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            </AccordionItem>

                            {/* SCHEDULE & PAY SECTION */}
                            <AccordionItem title="Schedule & Pay" sectionKey="schedule" isOpen={activeSection === 'schedule'} onToggle={toggleSection}>
                                <InputGroup label="Address">
                                    <StyledTextInput
                                        icon={MapPin}
                                        value={formData.address}
                                        onChangeText={(val: string) => updateField('address', val)}
                                        placeholder="Full address (optional)"
                                    />
                                </InputGroup>

                                <View className="flex-row gap-4 mb-6">
                                    <View className="flex-1">
                                        <InputGroup label="City">
                                            <StyledTextInput
                                                icon={MapPin}
                                                value={formData.city}
                                                onChangeText={(val: string) => updateField('city', val)}
                                                placeholder="e.g. Mumbai"
                                            />
                                        </InputGroup>
                                    </View>
                                    <View className="flex-1">
                                        <InputGroup label="Venue Name">
                                            <StyledTextInput
                                                icon={MapPin}
                                                value={formData.venueName}
                                                onChangeText={(val: string) => updateField('venueName', val)}
                                                placeholder="e.g. JW Marriott"
                                            />
                                        </InputGroup>
                                    </View>
                                </View>

                                <View className="flex-row gap-4 mb-2">
                                    <View className="flex-1">
                                        <InputGroup label="Start Date">
                                            <DatePickerInput
                                                value={formData.startDate}
                                                onChange={(val) => updateField('startDate', val)}
                                                placeholder="Select Date"
                                                icon={Calendar}
                                            />
                                        </InputGroup>
                                    </View>
                                    <View className="flex-1">
                                        <InputGroup label="End Date">
                                            <DatePickerInput
                                                value={formData.endDate}
                                                onChange={(val) => updateField('endDate', val)}
                                                placeholder="Select Date"
                                                icon={Calendar}
                                            />
                                        </InputGroup>
                                    </View>
                                </View>
                                
                                <InputGroup label="Time Commitment">
                                    <StyledTextInput
                                        icon={Clock}
                                        value={formData.timeCommitment}
                                        onChangeText={(val: string) => updateField('timeCommitment', val)}
                                        placeholder="e.g. 9 AM to 5 PM"
                                    />
                                </InputGroup>

                                <InputGroup label="Payment Period">
                                    <View className="flex-row gap-3 flex-wrap">
                                        {['fixed', 'hourly', 'per-day'].map((type) => (
                                            <TouchableOpacity
                                                key={type}
                                                onPress={() => updateField('compType', type)}
                                                className={`flex-1 min-w-[30%] px-3 py-3 rounded-xl border ${formData.compType === type
                                                    ? 'bg-[#FF6B35]/15 border-[#FF6B35]'
                                                    : 'bg-zinc-900/50 border-white/10'
                                                    }`}
                                            >
                                                <Text className={`text-center font-bold capitalize text-xs ${formData.compType === type ? 'text-[#FF6B35]' : 'text-zinc-400'
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
                                                <Text
                                                    style={{
                                                        textAlign: 'center',
                                                        fontSize: T.size.xs,
                                                        fontWeight: T.weight.bold as any,
                                                        color: formData.compStructure === struct.id ? '#FF6B35' : '#a1a1aa'
                                                    }}
                                                >
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
                                                keyboardType="numeric"
                                                value={formData.amount}
                                                onChangeText={(val: string) => updateField('amount', val)}
                                                placeholder="e.g. 5000"
                                            />
                                        </InputGroup>
                                    </View>
                                )}

                                {formData.compStructure === 'range' && (
                                    <View className="mt-2 flex-row gap-4">
                                        <View className="flex-1">
                                            <InputGroup label="Minimum (₹)">
                                                <StyledTextInput
                                                    icon={DollarSign}
                                                    keyboardType="numeric"
                                                    value={formData.minAmount}
                                                    onChangeText={(val: string) => updateField('minAmount', val)}
                                                    placeholder="e.g. 3000"
                                                />
                                            </InputGroup>
                                        </View>
                                        <View className="flex-1">
                                            <InputGroup label="Maximum (₹) (Optional)">
                                                <StyledTextInput
                                                    icon={DollarSign}
                                                    keyboardType="numeric"
                                                    value={formData.maxAmount}
                                                    onChangeText={(val: string) => updateField('maxAmount', val)}
                                                    placeholder="e.g. 8000"
                                                />
                                            </InputGroup>
                                        </View>
                                    </View>
                                )}

                                <TouchableOpacity 
                                    className="flex-row items-center gap-3 mt-2 mb-6 p-3 rounded-xl bg-zinc-800/50" 
                                    onPress={() => updateField('negotiable', !formData.negotiable)}
                                >
                                    <View className={`w-6 h-6 rounded-md border items-center justify-center ${formData.negotiable ? 'bg-[#FF6B35] border-[#FF6B35]' : 'border-zinc-600'}`}>
                                        {formData.negotiable && <Check size={14} color="#fff" />}
                                    </View>
                                    <View>
                                        <Text className="text-white font-medium">Negotiable</Text>
                                        <Text className="text-xs text-zinc-500">Open to discuss compensation</Text>
                                    </View>
                                </TouchableOpacity>

                                <InputGroup label="Benefits / Perks">
                                    <TagInput
                                        value={formData.perks}
                                        onChangeTags={(val: string) => updateField('perks', val)}
                                        placeholder="e.g. Travel, Food"
                                    />
                                </InputGroup>
                            </AccordionItem>

                            {/* HOW TO APPLY SECTION */}
                            <AccordionItem title="How to Apply" sectionKey="apply" isOpen={activeSection === 'apply'} onToggle={toggleSection}>
                                <InputGroup label="Max Applications">
                                    <StyledTextInput
                                        value={formData.maxApplications}
                                        onChangeText={(val: string) => updateField('maxApplications', val)}
                                        placeholder="e.g. 50"
                                        keyboardType="numeric"
                                    />
                                </InputGroup>
                                <InputGroup label="Application Deadline">
                                    <DatePickerInput
                                        value={formData.deadline}
                                        onChange={(val) => updateField('deadline', val)}
                                        placeholder="Select Date"
                                        icon={Calendar}
                                    />
                                </InputGroup>
                            </AccordionItem>

                            {/* TERMS SECTION */}
                            <AccordionItem title="Terms" sectionKey="terms" isOpen={activeSection === 'terms'} onToggle={toggleSection}>
                                <InputGroup label="Terms & Conditions">
                                    <StyledTextInput
                                        value={formData.termsAndConditions}
                                        onChangeText={(val: string) => updateField('termsAndConditions', val)}
                                        placeholder="Add any specific terms for the artist..."
                                        multiline={true}
                                    />
                                </InputGroup>
                            </AccordionItem>

                        </ScrollView>
                    </KeyboardAvoidingView>

                    {/* Footer / Save Button */}
                    <View className="p-6 border-t border-white/10 bg-[#0A0A0A] pb-10">
                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={updateGigMutation.isPending}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={['#FF6B35', '#FF8C42']}
                                start={[0, 0]}
                                end={[1, 0]}
                                className="py-4 rounded-xl items-center justify-center flex-row shadow-lg shadow-[#FF6B35]/30"
                            >
                                {updateGigMutation.isPending ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Save size={20} color="#fff" />
                                        <Text className="text-white font-black text-lg ml-2">Save Changes</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};
