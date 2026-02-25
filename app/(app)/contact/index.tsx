import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, Animated, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useForm, Controller } from 'react-hook-form';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageCircle, Mail, Phone, Instagram, Send, ShieldAlert, Users, Music, Briefcase, MapPin, Check, Clock, Star, Zap } from 'lucide-react-native';


import AppScrollView from '@/components/AppScrollView';
import FloatingParticles from '@/components/ui/FloatingParticles';
import { Input } from '@/components/ui/Input';
import { SelectInput } from '@/components/ui/SelectInput';
import { TextArea } from '@/components/ui/TextArea';
import { Button } from '@/components/ui/Button';
import { useThemeColors, NETSA_COLORS } from '@/hooks/useThemeColors';

const INQUIRY_OPTIONS = [
    { label: 'General Inquiry', value: 'general' },
    { label: 'Technical Support', value: 'tech_support' },
    { label: 'Billing Issue', value: 'billing' },
    { label: 'Partnership', value: 'partnership' },
    { label: 'Report a Concern', value: 'report' },
];

export default function ContactPage() {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const theme = useThemeColors();
    const scrollY = useRef(new Animated.Value(0)).current;

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm({
        defaultValues: {
            name: '',
            email: '',
            inquiryType: 'general',
            subject: '',
            message: '',
        },
    });

    const onSubmit = (data: any) => {
        console.log('Form Submit:', data);
        // Add actual submit logic here
    };

    return (
        <>
            <StatusBar style="light" />
            <View className="flex-1 bg-[#0a0a0f]">
                {/* Background Details matching landing page */}
                <FloatingParticles />

                {/* Decorative Gradients */}
                <View
                    style={{
                        position: 'absolute',
                        top: '10%',
                        left: isMobile ? '-50%' : '-25%',
                        width: isMobile ? 400 : 800,
                        height: isMobile ? 400 : 800,
                        borderRadius: isMobile ? 200 : 400,
                        backgroundColor: NETSA_COLORS.netsa[1],
                        opacity: 0.15,
                        filter: 'blur(100px)',
                    } as any}
                />

                <View
                    style={{
                        position: 'absolute',
                        top: '40%',
                        right: isMobile ? '-50%' : '-25%',
                        width: isMobile ? 300 : 600,
                        height: isMobile ? 300 : 600,
                        borderRadius: isMobile ? 150 : 300,
                        backgroundColor: NETSA_COLORS.netsa[10],
                        opacity: 0.1,
                        filter: 'blur(100px)',
                    } as any}
                />



                <AppScrollView
                    showsVerticalScrollIndicator={false}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: false }
                    )}
                    scrollEventThrottle={16}
                >
                    <View
                        style={{
                            paddingTop: isMobile ? 100 : 140,
                            paddingHorizontal: isMobile ? 16 : 24,
                            maxWidth: 1200,
                            width: '100%',
                            alignSelf: 'center',
                            zIndex: 10,
                        }}
                    >
                        {/* 1. HERO SECTION */}
                        <View style={{ alignItems: 'center', marginBottom: isMobile ? 64 : 96 }}>
                            <View
                                style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    borderWidth: 1,
                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                    paddingHorizontal: 16,
                                    paddingVertical: 6,
                                    borderRadius: 20,
                                    marginBottom: 24,
                                }}
                            >
                                <Text style={{ fontSize: 13, color: '#d4d4d8', fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' }}>
                                    Help & Support
                                </Text>
                            </View>

                            <Text
                                style={{
                                    fontSize: isMobile ? 38 : isTablet ? 56 : 72,
                                    fontWeight: '900',
                                    color: '#fff',
                                    textAlign: 'center',
                                    letterSpacing: -1.5,
                                    lineHeight: isMobile ? 44 : isTablet ? 64 : 80,
                                    marginBottom: 12,
                                }}
                            >
                                We're Here to Support
                            </Text>
                            <Text
                                className="text-transparent bg-clip-text bg-gradient-to-r from-netsa-5 via-netsa-8 to-netsa-10"
                                style={{
                                    fontSize: isMobile ? 38 : isTablet ? 56 : 72,
                                    fontWeight: '900',
                                    textAlign: 'center',
                                    letterSpacing: -1.5,
                                    lineHeight: isMobile ? 44 : isTablet ? 64 : 82,
                                    marginBottom: 24,
                                }}
                            >
                                Your Creative Journey
                            </Text>
                            <Text
                                style={{
                                    fontSize: isMobile ? 16 : 20,
                                    color: '#a1a1aa',
                                    fontWeight: '300',
                                    textAlign: 'center',
                                    maxWidth: 700,
                                    lineHeight: isMobile ? 26 : 32,
                                    marginBottom: 48,
                                }}
                            >
                                Whether you're an artist looking for gigs or an organizer managing events, our team is ready to help you thrive in the NETSA ecosystem.
                            </Text>

                            <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 16, width: isMobile ? '100%' : 'auto' }}>
                                <Button
                                    label="Chat on WhatsApp"
                                    variant="white"
                                    size={isMobile ? "md" : "lg"}
                                    icon={<Phone size={20} color={NETSA_COLORS.netsa[10]} />}
                                    onPress={() => Linking.openURL('whatsapp://send?phone=+919673390378')}
                                    className="w-full md:w-auto px-8"
                                />
                                <Button
                                    label="Send a Message"
                                    variant="outline"
                                    size={isMobile ? "md" : "lg"}
                                    icon={<Mail size={20} color="#fff" />}
                                    onPress={() => {
                                        // Optional: scroll to form
                                    }}
                                    className="w-full md:w-auto px-8"
                                />
                            </View>
                        </View>

                        {/* 2. SEGMENTED SUPPORT — Artist & Organizer */}
                        <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 24, marginBottom: isMobile ? 64 : 96 }}>
                            {/* ARTIST SUPPORT CARD */}
                            <View
                                className="flex-1 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md overflow-hidden"
                                style={{ position: 'relative' }}
                            >
                                {/* Decorative accent */}
                                <View
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        right: 0,
                                        width: 140,
                                        height: 140,
                                        borderBottomLeftRadius: 140,
                                        backgroundColor: 'rgba(234, 105, 139, 0.08)',
                                    }}
                                />

                                <View style={{ padding: isMobile ? 24 : 32 }}>
                                    <View className="w-14 h-14 bg-netsa-10/20 rounded-2xl items-center justify-center mb-6">
                                        <Music size={28} color={NETSA_COLORS.netsa[10]} />
                                    </View>
                                    <Text
                                        style={{
                                            fontSize: isMobile ? 24 : 28,
                                            fontWeight: '800',
                                            color: '#fff',
                                            letterSpacing: -0.5,
                                            marginBottom: 8,
                                        }}
                                    >
                                        Artist Support
                                    </Text>
                                    <Text className="text-zinc-400 text-base leading-relaxed mb-6">
                                        We help artists navigate the platform confidently. Reach out for assistance with:
                                    </Text>

                                    <View style={{ gap: 14, marginBottom: 32 }}>
                                        {[
                                            'Applying to gigs',
                                            'Contract issues',
                                            'Payment settlements',
                                            'Event registration',
                                            'Profile verification',
                                        ].map((item) => (
                                            <View key={item} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                <View
                                                    style={{
                                                        width: 24,
                                                        height: 24,
                                                        borderRadius: 12,
                                                        backgroundColor: 'rgba(234, 105, 139, 0.15)',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <Check size={14} color={NETSA_COLORS.netsa[10]} />
                                                </View>
                                                <Text className="text-zinc-300 text-base">{item}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        onPress={() => Linking.openURL('mailto:artists@netsa.in')}
                                        className="overflow-hidden rounded-full"
                                    >
                                        <LinearGradient
                                            colors={['#EA698B', '#C77DFF'] as any}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={{
                                                paddingVertical: 16,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexDirection: 'row',
                                                gap: 8,
                                            }}
                                        >
                                            <Mail size={18} color="#fff" />
                                            <Text className="text-white font-bold text-base">Contact Artist Support</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* ORGANIZER SUPPORT CARD */}
                            <View
                                className="flex-1 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md overflow-hidden"
                                style={{ position: 'relative' }}
                            >
                                {/* Decorative accent */}
                                <View
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        right: 0,
                                        width: 140,
                                        height: 140,
                                        borderBottomLeftRadius: 140,
                                        backgroundColor: 'rgba(168, 85, 247, 0.08)',
                                    }}
                                />

                                <View style={{ padding: isMobile ? 24 : 32 }}>
                                    <View className="w-14 h-14 bg-purple-500/20 rounded-2xl items-center justify-center mb-6">
                                        <Briefcase size={28} color="#a855f7" />
                                    </View>
                                    <Text
                                        style={{
                                            fontSize: isMobile ? 24 : 28,
                                            fontWeight: '800',
                                            color: '#fff',
                                            letterSpacing: -0.5,
                                            marginBottom: 8,
                                        }}
                                    >
                                        Organizer Support
                                    </Text>
                                    <Text className="text-zinc-400 text-base leading-relaxed mb-6">
                                        Running events and managing talent shouldn't be stressful. Get help with:
                                    </Text>

                                    <View style={{ gap: 14, marginBottom: 32 }}>
                                        {[
                                            'Posting gigs',
                                            'Managing applications',
                                            'Ticketing & payouts',
                                            'Contract generation',
                                            'Business verification',
                                        ].map((item) => (
                                            <View key={item} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                <View
                                                    style={{
                                                        width: 24,
                                                        height: 24,
                                                        borderRadius: 12,
                                                        backgroundColor: 'rgba(168, 85, 247, 0.15)',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <Check size={14} color="#a855f7" />
                                                </View>
                                                <Text className="text-zinc-300 text-base">{item}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        onPress={() => Linking.openURL('mailto:organizers@netsa.in')}
                                        className="overflow-hidden rounded-full"
                                    >
                                        <LinearGradient
                                            colors={['#9D4EDD', '#C77DFF'] as any}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={{
                                                paddingVertical: 16,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexDirection: 'row',
                                                gap: 8,
                                            }}
                                        >
                                            <Mail size={18} color="#fff" />
                                            <Text className="text-white font-bold text-base">Contact Organizer Support</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 48, marginBottom: isMobile ? 64 : 96 }}>
                            {/* LEFT COLUMN: Form */}
                            <View style={{ flex: isTablet ? 1.5 : isMobile ? 1 : 2 }}>
                                {/* 5. CONTACT FORM SECTION */}
                                <View className="bg-white/5 border border-white/10 rounded-3xl p-6 lg:p-10 backdrop-blur-md">
                                    <Text className="text-2xl font-bold text-white mb-2">Send us a message</Text>
                                    <Text className="text-zinc-400 mb-8">Fill out the form below and we'll get back to you within 24 hours.</Text>

                                    <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
                                        <View className="flex-1">
                                            <Input
                                                control={control}
                                                name="name"
                                                label="Full Name"
                                                placeholder="John Doe"
                                                error={errors.name?.message as string}
                                                startIcon={<Users size={18} color="#71717a" />}
                                            />
                                        </View>
                                        <View className="flex-1">
                                            <Input
                                                control={control}
                                                name="email"
                                                label="Email Address"
                                                placeholder="john@example.com"
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                                error={errors.email?.message as string}
                                                startIcon={<Mail size={18} color="#71717a" />}
                                            />
                                        </View>
                                    </View>

                                    <View className="mb-4">
                                        <Text className="text-sm font-medium text-gray-300 mb-2 ml-1">Inquiry Type</Text>
                                        <Controller
                                            control={control}
                                            name="inquiryType"
                                            render={({ field: { onChange, value } }) => (
                                                <SelectInput
                                                    options={INQUIRY_OPTIONS}
                                                    value={value}
                                                    onChange={onChange}
                                                    icon={Music}
                                                />
                                            )}
                                        />
                                    </View>

                                    <Input
                                        control={control}
                                        name="subject"
                                        label="Subject"
                                        placeholder="How can we help you?"
                                        error={errors.subject?.message as string}
                                        startIcon={<MessageCircle size={18} color="#71717a" />}
                                    />

                                    <View className="mb-6">
                                        <Text className="text-sm font-medium text-gray-300 mb-2 ml-1">Message</Text>
                                        <Controller
                                            control={control}
                                            name="message"
                                            rules={{ required: 'Message is required' }}
                                            render={({ field: { onChange, value } }) => (
                                                <TextArea
                                                    value={value}
                                                    onChangeText={onChange}
                                                    placeholder="Provide as much detail as possible..."
                                                    error={errors.message?.message as string}
                                                    rows={6}
                                                />
                                            )}
                                        />
                                    </View>

                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        onPress={handleSubmit(onSubmit)}
                                        className="overflow-hidden rounded-full"
                                    >
                                        <LinearGradient
                                            colors={theme.cta.colors as any}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={{
                                                paddingVertical: 18,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexDirection: 'row',
                                            }}
                                        >
                                            <Send size={20} color="#fff" className="mr-2" />
                                            <Text className="text-white font-bold text-lg">Send Message</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* RIGHT COLUMN: Contact Alternative Cards */}
                            <View style={{ flex: 1, gap: 24 }}>
                                {/* 3. WHATSAPP SECTION */}
                                <View className="bg-white/5 border border-white/10 rounded-3xl p-6 lg:p-8 backdrop-blur-md overflow-hidden relative">
                                    <View className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-bl-[100px]" />

                                    <View className="w-12 h-12 bg-green-500/20 rounded-2xl items-center justify-center mb-5">
                                        <Phone size={24} color="#22c55e" />
                                    </View>
                                    <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 8 }}>
                                        Need Quick Help?
                                    </Text>
                                    <Text className="text-zinc-400 mb-5 leading-relaxed">
                                        Chat directly with our support team on WhatsApp.
                                    </Text>

                                    {/* Availability & Response Time */}
                                    <View style={{ gap: 10, marginBottom: 24 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                            <View
                                                style={{
                                                    width: 28,
                                                    height: 28,
                                                    borderRadius: 14,
                                                    backgroundColor: 'rgba(34, 197, 94, 0.12)',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Clock size={14} color="#22c55e" />
                                            </View>
                                            <Text className="text-zinc-300 text-sm">Mon–Sat  |  10 AM – 7 PM IST</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                            <View
                                                style={{
                                                    width: 28,
                                                    height: 28,
                                                    borderRadius: 14,
                                                    backgroundColor: 'rgba(34, 197, 94, 0.12)',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Zap size={14} color="#22c55e" />
                                            </View>
                                            <Text className="text-zinc-300 text-sm">Avg. response time: ~15 min</Text>
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        onPress={() => Linking.openURL('https://wa.me/919999999999?text=Hi%20NETSA%20Support')}
                                        style={{
                                            backgroundColor: '#22c55e',
                                            borderRadius: 999,
                                            paddingVertical: 14,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 8,
                                        }}
                                    >
                                        <MessageCircle size={18} color="#fff" />
                                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Chat on WhatsApp</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* 4. INSTAGRAM SECTION */}
                                <View className="bg-white/5 border border-white/10 rounded-3xl p-6 lg:p-8 backdrop-blur-md overflow-hidden relative">
                                    <View className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-bl-[100px]" />

                                    <View className="w-12 h-12 bg-pink-500/20 rounded-2xl items-center justify-center mb-5">
                                        <Instagram size={24} color="#ec4899" />
                                    </View>
                                    <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 8 }}>
                                        Stay Connected with NETSA
                                    </Text>
                                    <Text className="text-zinc-400 mb-5 leading-relaxed">
                                        Follow us for the latest from the NETSA community.
                                    </Text>

                                    {/* Community highlights */}
                                    <View style={{ gap: 12, marginBottom: 24 }}>
                                        {[
                                            { icon: Star, label: 'Artist spotlights' },
                                            { icon: Music, label: 'Event announcements' },
                                            { icon: Users, label: 'Community highlights' },
                                        ].map((item) => (
                                            <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                                <View
                                                    style={{
                                                        width: 28,
                                                        height: 28,
                                                        borderRadius: 14,
                                                        backgroundColor: 'rgba(236, 72, 153, 0.12)',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <item.icon size={14} color="#ec4899" />
                                                </View>
                                                <Text className="text-zinc-300 text-sm">{item.label}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        onPress={() => Linking.openURL('https://instagram.com/netsa.official')}
                                        style={{
                                            borderWidth: 1,
                                            borderColor: 'rgba(236, 72, 153, 0.3)',
                                            borderRadius: 999,
                                            paddingVertical: 14,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 8,
                                        }}
                                    >
                                        <Instagram size={18} color="#ec4899" />
                                        <Text style={{ color: '#ec4899', fontWeight: '700', fontSize: 15 }}>Follow @netsa.official</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* 6. PARTNERSHIPS */}
                                <View className="bg-white/5 border border-white/10 rounded-3xl p-6 lg:p-8 backdrop-blur-md">
                                    <Text className="text-lg font-bold text-white mb-2">Partnerships</Text>
                                    <Text className="text-zinc-400 text-sm mb-4 leading-relaxed">
                                        Looking to partner with NETSA for large-scale campaigns or corporate events?
                                    </Text>
                                    <TouchableOpacity
                                        className="flex-row items-center"
                                        onPress={() => Linking.openURL('mailto:partnerships@netsa.in')}
                                    >
                                        <Text className="text-indigo-400 font-semibold mr-2">Email Partnerships</Text>
                                        <Mail size={16} color="#818cf8" />
                                    </TouchableOpacity>
                                </View>

                                {/* 7. SAFETY / REPORT SECTION */}
                                <View className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 lg:p-8 backdrop-blur-md">
                                    <View className="flex-row items-center mb-3">
                                        <ShieldAlert size={20} color="#ef4444" className="mr-3" />
                                        <Text className="text-lg font-bold text-red-100">Trust & Safety</Text>
                                    </View>
                                    <Text className="text-zinc-400 text-sm mb-4 leading-relaxed">
                                        Report inappropriate behavior, scam attempts, or safety concerns immediately.
                                    </Text>
                                    <TouchableOpacity
                                        className="bg-red-500/20 border border-red-500/30 rounded-xl py-3 px-4 items-center justify-center"
                                        onPress={() => Linking.openURL('mailto:safety@netsa.in')}
                                    >
                                        <Text className="text-red-400 font-semibold">Report a Concern</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                </AppScrollView>
            </View>
        </>
    );
}

