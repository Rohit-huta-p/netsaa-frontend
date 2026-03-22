import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, Modal, ScrollView,
    Animated, Dimensions, KeyboardAvoidingView, Platform, ActivityIndicator, Switch, Alert
} from 'react-native';
import { X, Check, ChevronDown, Plus, Wand2, Image as ImageIcon } from 'lucide-react-native';
import { DatePickerInput } from '@/components/ui/DatePickerInput';
import { IEvent, IEventTicketType } from '@/types/event';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type Props = {
    visible: boolean;
    onClose: () => void;
    event: IEvent;
    onSave: (payload: Partial<IEvent & { ticketTypes?: IEventTicketType[] }>) => void;
    isSaving: boolean;
};

// ─── Helpers ───

const toLocalDateString = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const AccordionSection = ({ title, defaultExpanded = false, children }: any) => {
    const [expanded, setExpanded] = useState(defaultExpanded);
    return (
        <View className="mb-6">
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setExpanded(!expanded)}
                className="flex-row items-center border-b border-zinc-800 pb-2 mb-4 justify-between"
            >
                <Text className="text-sm font-semibold text-white">{title}</Text>
                <View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
                    <ChevronDown size={18} color="#71717a" />
                </View>
            </TouchableOpacity>
            {expanded && <View className="flex-col gap-4">{children}</View>}
        </View>
    );
};

const Field = ({ label, children, rightTopElement }: any) => (
    <View>
        <View className="flex-row items-center justify-between mb-1.5">
            <Text className="text-xs font-medium text-zinc-400">{label}</Text>
            {rightTopElement}
        </View>
        {children}
    </View>
);

const Input = ({ value, onChangeText, placeholder, multiline = false, keyboardType = 'default' }: any) => (
    <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#52525b"
        multiline={multiline}
        keyboardType={keyboardType}
        className={`bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 px-4 text-sm text-white focus:border-violet-500 outline-none ${multiline ? 'min-h-[100px]' : ''}`}
        style={{ textAlignVertical: multiline ? 'top' : 'center', outlineStyle: 'none' } as any}
    />
);

const BasicSelect = ({ value, onChange, options }: any) => (
    <View className="relative bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 flex-row items-center justify-between">
        <TextInput
            value={value}
            onChangeText={onChange}
            className="text-white text-sm flex-1 outline-none"
            style={{ outlineStyle: 'none' } as any}
        />
        <ChevronDown size={14} color="#71717a" />
    </View>
); // Very basic placeholder since we don't have a reliable dropdown for standard RN Modal except custom UI. We'll use TextInput for now to mimic standard inputs.

// ─── Main Component ───

export const EventEditModal: React.FC<Props> = ({ visible, onClose, event, onSave, isSaving }) => {
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    // ─── Form State ───
    const [title, setTitle] = useState('');
    const [eventType, setEventType] = useState('');
    const [category, setCategory] = useState('');
    const [tagsText, setTagsText] = useState('');

    const [skillLevel, setSkillLevel] = useState('');
    const [maxParticipants, setMaxParticipants] = useState('');

    const [venueName, setVenueName] = useState('');
    const [city, setCity] = useState('');
    const [address, setAddress] = useState('');

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [deadline, setDeadline] = useState('');

    const [description, setDescription] = useState('');

    const [pricingMode, setPricingMode] = useState('Fixed Price');
    const [ticketPrice, setTicketPrice] = useState('');
    const [isFeatured, setIsFeatured] = useState(false);
    const [isUrgent, setIsUrgent] = useState(false); // Just local state for UI matching

    // Ticket Form logic
    const [ticketTypes, setTicketTypes] = useState<IEventTicketType[]>([]);
    const [addingTicket, setAddingTicket] = useState(false);
    const [newTicket, setNewTicket] = useState({
        name: '', price: '', capacity: '', isRefundable: false, refundPolicyNotes: '', salesStartAt: '', salesEndAt: ''
    });

    useEffect(() => {
        if (!visible) return;
        setTitle(event.title || '');
        setEventType(event.eventType || 'workshop');
        setCategory(event.category || 'dance');
        setTagsText((event.tags || []).join(', '));

        setSkillLevel(event.skillLevel || 'all');
        setMaxParticipants(event.maxParticipants?.toString() || '');

        setVenueName(event.location?.venueName || '');
        setCity(event.location?.city || '');
        setAddress(event.location?.address || '');

        setStartDate(event.schedule?.startDate ? new Date(event.schedule.startDate).toISOString().split('T')[0] : '');
        setEndDate(event.schedule?.endDate ? new Date(event.schedule.endDate).toISOString().split('T')[0] : '');
        setDeadline(event.registrationDeadline ? new Date(event.registrationDeadline).toISOString().split('T')[0] : '');

        setDescription(event.description || '');

        // Using any since IEvent doesn't explicitly type ticketTypes
        const existingTicketTypes = (event as any).ticketTypes || [];
        setTicketTypes(existingTicketTypes);
        setTicketPrice(event.ticketPrice?.toString() || '0');
        setPricingMode(existingTicketTypes.length > 0 ? 'Ticket Types' : 'Fixed Price');

        setIsFeatured(event.isFeatured || false);
        // isUrgent not natively in IEvent
    }, [visible, event]);

    // Animation
    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                damping: 24,
                stiffness: 200,
            }).start();
        } else {
            slideAnim.setValue(SCREEN_HEIGHT);
        }
    }, [visible]);

    const handleClose = () => {
        Animated.timing(slideAnim, {
            toValue: SCREEN_HEIGHT,
            duration: 200,
            useNativeDriver: true,
        }).start(() => onClose());
    };

    const handleAddTicket = () => {
        if (!newTicket.name || !newTicket.price || !newTicket.capacity || !newTicket.salesStartAt || !newTicket.salesEndAt) {
            Alert.alert('Error', 'Please fill all ticket fields');
            return;
        }

        const tick: IEventTicketType = {
            name: newTicket.name,
            price: Number(newTicket.price),
            capacity: Number(newTicket.capacity),
            currency: 'INR',
            salesStartAt: newTicket.salesStartAt,
            salesEndAt: newTicket.salesEndAt,
            isRefundable: newTicket.isRefundable,
            refundPolicyNotes: newTicket.refundPolicyNotes
        };

        setTicketTypes([...(ticketTypes || []), tick]);
        setNewTicket({ name: '', price: '', capacity: '', isRefundable: false, refundPolicyNotes: '', salesStartAt: '', salesEndAt: '' });
        setAddingTicket(false);
    };

    const handleSave = () => {
        const payload: Partial<IEvent & { ticketTypes?: IEventTicketType[] }> = {};

        if (title !== event.title) payload.title = title;
        if (description !== event.description) payload.description = description;

        const typedEventType = eventType.toLowerCase() as any;
        if (typedEventType !== event.eventType) payload.eventType = typedEventType;
        if (category !== event.category) payload.category = category;

        const typedSkillLevel = skillLevel.toLowerCase() as any;
        if (typedSkillLevel !== event.skillLevel) payload.skillLevel = typedSkillLevel;
        if (isFeatured !== event.isFeatured) payload.isFeatured = isFeatured;

        const parsedCapacity = parseInt(maxParticipants, 10);
        if (!isNaN(parsedCapacity) && parsedCapacity !== event.maxParticipants) {
            payload.maxParticipants = Math.max(0, parsedCapacity);
        }

        const tagsArray = tagsText.split(',').map(t => t.trim()).filter(Boolean);
        if (JSON.stringify(tagsArray) !== JSON.stringify(event.tags)) {
            payload.tags = tagsArray;
        }

        // Location
        const newLocation = { ...event.location };
        let locChanged = false;
        if (venueName !== (event.location?.venueName || '')) { newLocation.venueName = venueName; locChanged = true; }
        if (address !== (event.location?.address || '')) { newLocation.address = address; locChanged = true; }
        if (city !== (event.location?.city || '')) { newLocation.city = city; locChanged = true; }
        if (locChanged) payload.location = newLocation;

        // Schedule
        let schedChanged = false;
        const newSchedule = { ...event.schedule };
        if (startDate) {
            const currentIso = event.schedule?.startDate;
            const newIso = new Date(startDate).toISOString();
            if (!currentIso || currentIso.split('T')[0] !== newIso.split('T')[0]) {
                newSchedule.startDate = newIso;
                schedChanged = true;
            }
        }
        if (endDate) {
            const currentIso = event.schedule?.endDate;
            const newIso = new Date(endDate).toISOString();
            if (!currentIso || currentIso.split('T')[0] !== newIso.split('T')[0]) {
                newSchedule.endDate = newIso;
                schedChanged = true;
            }
        }
        if (schedChanged) payload.schedule = newSchedule;

        if (deadline) {
            const newIso = new Date(deadline).toISOString();
            if (!event.registrationDeadline || event.registrationDeadline.split('T')[0] !== newIso.split('T')[0]) {
                payload.registrationDeadline = newIso;
            }
        }

        // Pricing Mode
        if (pricingMode === 'Ticket Types') {
            payload.ticketTypes = ticketTypes;
            payload.ticketPrice = ticketTypes.length > 0 ? Math.min(...ticketTypes.map(t => Number(t.price))) : 0;
        } else {
            payload.ticketTypes = [];
            payload.ticketPrice = Number(ticketPrice) || 0;
        }

        if (Object.keys(payload).length === 0) {
            handleClose();
            return;
        }
        onSave(payload);
    };

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <TouchableOpacity activeOpacity={1} onPress={handleClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }}>
                    <Animated.View style={{
                        transform: [{ translateY: slideAnim }],
                        maxHeight: SCREEN_HEIGHT * 0.9, backgroundColor: '#09090b', // bg-zinc-950
                        borderTopLeftRadius: 24, borderTopRightRadius: 24,
                        borderWidth: 1, borderBottomWidth: 0, borderColor: '#27272a', // border-zinc-800
                        overflow: 'hidden',
                    }}>
                        <TouchableOpacity activeOpacity={1} className="flex-1">
                            {/* Header */}
                            <View className="px-6 py-5 border-b border-zinc-800 flex-row items-center justify-between bg-zinc-950">
                                <Text className="text-lg font-semibold tracking-tight text-white">Edit Event Details</Text>
                                <TouchableOpacity onPress={handleClose} className="p-1 rounded-lg">
                                    <X size={22} color="#a1a1aa" />
                                </TouchableOpacity>
                            </View>

                            {/* Form Body */}
                            <ScrollView className="px-6 py-6" contentContainerStyle={{ paddingBottom: 120 }}>

                                {/* COVER IMAGE UPLOAD (MOCKUP) */}
                                <View className="mb-8">
                                    <Text className="text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wide">Cover Image</Text>
                                    <TouchableOpacity
                                        className="mt-1 justify-center items-center rounded-xl border border-dashed border-zinc-700 px-6 py-8 bg-zinc-900/30"
                                    >
                                        <ImageIcon size={32} color="#71717a" />
                                        <View className="mt-4 flex-row items-center justify-center">
                                            <Text className="font-medium text-violet-400">Upload a file</Text>
                                            <Text className="text-zinc-400 ml-1">or tap to browse</Text>
                                        </View>
                                        <Text className="text-xs text-zinc-500 mt-1">PNG, JPG, GIF up to 10MB</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* IDENTITY */}
                                <AccordionSection title="Identity" defaultExpanded>
                                    <Field label="Event Title">
                                        <Input value={title} onChangeText={setTitle} />
                                    </Field>
                                    <View className="flex-row gap-4">
                                        <View className="flex-1">
                                            <Field label="Format">
                                                <BasicSelect value={eventType} onChange={setEventType} />
                                            </Field>
                                        </View>
                                        <View className="flex-1">
                                            <Field label="Category">
                                                <BasicSelect value={category} onChange={setCategory} />
                                            </Field>
                                        </View>
                                    </View>
                                    <Field label="Tags">
                                        <Input value={tagsText} onChangeText={setTagsText} placeholder="e.g. hip-hop, contemporary" />
                                    </Field>
                                </AccordionSection>

                                {/* AUDIENCE */}
                                <AccordionSection title="Audience">
                                    <View className="flex-row gap-4">
                                        <View className="flex-1">
                                            <Field label="Skill Level">
                                                <BasicSelect value={skillLevel} onChange={setSkillLevel} />
                                            </Field>
                                        </View>
                                        <View className="flex-1">
                                            <Field label="Capacity">
                                                <Input value={maxParticipants} onChangeText={setMaxParticipants} keyboardType="numeric" placeholder="Unlimited" />
                                            </Field>
                                        </View>
                                    </View>
                                </AccordionSection>

                                {/* LOCATION */}
                                <AccordionSection title="Location">
                                    <Field label="Venue Name">
                                        <Input value={venueName} onChangeText={setVenueName} />
                                    </Field>
                                    <View className="flex-row gap-4">
                                        <View className="flex-1">
                                            <Field label="City">
                                                <Input value={city} onChangeText={setCity} />
                                            </Field>
                                        </View>
                                        <View className="flex-1">
                                            <Field label="Address">
                                                <Input value={address} onChangeText={setAddress} />
                                            </Field>
                                        </View>
                                    </View>
                                </AccordionSection>

                                {/* SCHEDULE */}
                                <AccordionSection title="Schedule">
                                    <View className="flex-row gap-4">
                                        <View className="flex-1">
                                            <DatePickerInput
                                                label="Start Date"
                                                value={startDate}
                                                onChange={(d) => setStartDate(toLocalDateString(d))}
                                            />
                                        </View>
                                        <View className="flex-1">
                                            <DatePickerInput
                                                label="End Date"
                                                value={endDate}
                                                onChange={(d) => setEndDate(toLocalDateString(d))}
                                            />
                                        </View>
                                    </View>
                                    <View className="mt-2">
                                        <DatePickerInput
                                            label="Registration Closes"
                                            value={deadline}
                                            onChange={(d) => setDeadline(toLocalDateString(d))}
                                        />
                                    </View>
                                </AccordionSection>

                                {/* DETAILS */}
                                <AccordionSection title="Details">
                                    <Field
                                        label="Description"
                                        rightTopElement={
                                            <TouchableOpacity className="flex-row items-center gap-1">
                                                <Wand2 size={12} color="#a78bfa" />
                                                <Text className="text-[10px] font-bold uppercase tracking-wider text-violet-400">Rephrase</Text>
                                            </TouchableOpacity>
                                        }
                                    >
                                        <Input value={description} onChangeText={setDescription} multiline />
                                    </Field>
                                </AccordionSection>

                                {/* VISIBILITY & PRICING SETTINGS */}
                                <AccordionSection title="Visibility & Pricing Settings">
                                    <View className="flex-row justify-between items-center py-2">
                                        <View>
                                            <Text className="text-sm font-medium text-white">Pricing Mode</Text>
                                            <Text className="text-xs text-zinc-500 mt-0.5">Fixed Price or Ticket Types</Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => setPricingMode(pricingMode === 'Fixed Price' ? 'Ticket Types' : 'Fixed Price')}
                                            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5"
                                        >
                                            <Text className="text-xs font-medium text-white">{pricingMode}</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {pricingMode === 'Fixed Price' && (
                                        <Field label="Entry Fee (₹)">
                                            <Input value={ticketPrice} onChangeText={setTicketPrice} keyboardType="numeric" placeholder="0" />
                                        </Field>
                                    )}

                                    {pricingMode === 'Ticket Types' && (
                                        <View className="mt-2">
                                            {addingTicket ? (
                                                <View className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl gap-4">
                                                    <Text className="text-white font-bold mb-2">New Ticket</Text>
                                                    <Field label="Name"><Input value={newTicket.name} onChangeText={(t: string) => setNewTicket({ ...newTicket, name: t })} /></Field>
                                                    <View className="flex-row gap-4">
                                                        <View className="flex-1"><Field label="Price (₹)"><Input value={newTicket.price} onChangeText={(t: string) => setNewTicket({ ...newTicket, price: t })} keyboardType="numeric" /></Field></View>
                                                        <View className="flex-1"><Field label="Capacity"><Input value={newTicket.capacity} onChangeText={(t: string) => setNewTicket({ ...newTicket, capacity: t })} keyboardType="numeric" /></Field></View>
                                                    </View>
                                                    <View className="flex-row gap-4">
                                                        <View className="flex-1"><DatePickerInput label="Sales Start" value={newTicket.salesStartAt} onChange={(d) => setNewTicket({ ...newTicket, salesStartAt: toLocalDateString(d) })} /></View>
                                                        <View className="flex-1"><DatePickerInput label="Sales End" value={newTicket.salesEndAt} onChange={(d) => setNewTicket({ ...newTicket, salesEndAt: toLocalDateString(d) })} /></View>
                                                    </View>
                                                    <View className="flex-row gap-3 mt-2">
                                                        <TouchableOpacity className="flex-1 py-3 bg-zinc-800 rounded-xl items-center" onPress={() => setAddingTicket(false)}><Text className="text-white font-medium">Cancel</Text></TouchableOpacity>
                                                        <TouchableOpacity className="flex-1 py-3 bg-violet-600 rounded-xl items-center" onPress={handleAddTicket}><Text className="text-white font-bold">Add</Text></TouchableOpacity>
                                                    </View>
                                                </View>
                                            ) : (
                                                <View className="gap-3">
                                                    {ticketTypes.map((t, idx) => (
                                                        <View key={idx} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex-row justify-between items-center">
                                                            <View>
                                                                <Text className="text-white font-medium">{t.name}</Text>
                                                                <Text className="text-zinc-400 text-xs">₹{t.price} • {t.capacity} cap</Text>
                                                            </View>
                                                            <TouchableOpacity onPress={() => setTicketTypes(ticketTypes.filter((_, i) => i !== idx))}>
                                                                <X size={16} color="#71717a" />
                                                            </TouchableOpacity>
                                                        </View>
                                                    ))}
                                                    <TouchableOpacity onPress={() => setAddingTicket(true)} className="flex-row items-center justify-center p-3 border border-dashed border-zinc-700 rounded-xl">
                                                        <Text className="text-violet-400 font-medium">+ Add Ticket Type</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        </View>
                                    )}

                                    <View className="flex justify-between items-center py-2 flex-row border-t border-zinc-800/50 mt-4 pt-4">
                                        <View>
                                            <Text className="text-sm font-medium text-white">Featured Event</Text>
                                            <Text className="text-xs text-zinc-500 mt-0.5">Pin to top of lists</Text>
                                        </View>
                                        <Switch value={isFeatured} onValueChange={setIsFeatured} trackColor={{ false: '#27272a', true: '#a78bfa' }} />
                                    </View>
                                    <View className="flex justify-between items-center py-2 flex-row">
                                        <View>
                                            <Text className="text-sm font-medium text-white">Urgent Event</Text>
                                            <Text className="text-xs text-zinc-500 mt-0.5">Adds an "Urgent" badge</Text>
                                        </View>
                                        <Switch value={isUrgent} onValueChange={setIsUrgent} trackColor={{ false: '#27272a', true: '#fb923c' }} />
                                    </View>
                                </AccordionSection>
                            </ScrollView>

                            {/* Footer */}
                            <View className="px-6 py-5 border-t border-zinc-800 bg-zinc-950 flex-row justify-end gap-3 pb-8">
                                <TouchableOpacity onPress={handleClose} className="px-4 py-2.5 rounded-xl bg-transparent justify-center">
                                    <Text className="text-sm font-medium text-zinc-300">Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleSave} disabled={isSaving} className="px-5 py-2.5 rounded-xl bg-white justify-center flex-row items-center gap-2">
                                    {isSaving ? <ActivityIndicator size="small" color="#09090b" /> : null}
                                    <Text className="text-sm font-medium text-zinc-950">Save Changes</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </Modal>
    );
};
