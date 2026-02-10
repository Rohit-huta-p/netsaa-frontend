// app/(auth)/register.tsx — Multi-step, scroll-free, 100vh registration
import React, { useState, useRef, useCallback } from "react";
import {
    View, Text, TouchableOpacity, Animated, TextInput, Platform,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    Sparkles, Mic2, Calendar, Target, Users, BookOpen,
    Instagram, ChevronLeft, ArrowRight, MapPin, Check,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import useAuthStore from "@/stores/authStore";
import { useRegister } from "@/hooks/useAuthQueries";
import type { Role, Intent, ExperienceLevel } from "@/schemas/register.schema";

/* ════════════════════════════════════════════════════ */
/*  CONSTANTS                                          */
/* ════════════════════════════════════════════════════ */

const C = {
    primary: '#8B5CF6', secondary: '#3B82F6', bg: '#0a0a0f',
    w95: 'rgba(255,255,255,0.95)', w80: 'rgba(255,255,255,0.80)',
    w60: 'rgba(255,255,255,0.60)', w50: 'rgba(255,255,255,0.50)',
    w40: 'rgba(255,255,255,0.40)', w30: 'rgba(255,255,255,0.30)',
    w25: 'rgba(255,255,255,0.25)', w15: 'rgba(255,255,255,0.15)',
    w10: 'rgba(255,255,255,0.10)', w08: 'rgba(255,255,255,0.08)',
    w06: 'rgba(255,255,255,0.06)', w03: 'rgba(255,255,255,0.03)',
    activeB: 'rgba(139,92,246,0.6)', activeBg: 'rgba(139,92,246,0.1)',
};

const INTENT_OPTIONS: { id: Intent; label: string; icon: React.ElementType }[] = [
    { id: "find_gigs", label: "Find Gigs", icon: Target },
    { id: "hire_artists", label: "Hire Artists", icon: Users },
    { id: "learn_workshops", label: "Learn & Grow", icon: BookOpen },
    { id: "host_events", label: "Host Events", icon: Calendar },
];

const ARTIST_TYPES = ["Singer", "Dancer", "Musician", "DJ", "Actor", "Band", "Model", "Anchor", "Other"];
const ORG_TYPES = ["Event Company", "Venue", "Agency", "Brand", "Independent", "Other"];

const EXP_LEVELS: { id: ExperienceLevel; label: string; sub: string }[] = [
    { id: "beginner", label: "Beginner", sub: "Just starting out" },
    { id: "intermediate", label: "Intermediate", sub: "Some experience" },
    { id: "professional", label: "Professional", sub: "Industry veteran" },
];

const TOTAL_STEPS = 7; // steps 0-6 are data steps, 7 is completion

/* ════════════════════════════════════════════════════ */
/*  SUB-COMPONENTS                                     */
/* ════════════════════════════════════════════════════ */

/* -- Text input -- */
const StepInput = ({ label, value, onChangeText, icon, error, ...props }: {
    label: string; value: string; onChangeText: (v: string) => void;
    icon?: React.ReactNode; error?: boolean;[k: string]: any;
}) => (
    <View style={{ marginBottom: 16 }}>
        <Text style={{ color: C.w30, fontSize: 12, fontWeight: '500', marginBottom: 6 }}>{label}</Text>
        <View style={{
            flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 16,
            borderWidth: 1, borderColor: error ? 'rgba(239,68,68,0.5)' : C.w08,
            backgroundColor: C.w03, paddingHorizontal: icon ? 0 : 16,
        }}>
            {icon && <View style={{ paddingLeft: 14, paddingRight: 6 }}>{icon}</View>}
            <TextInput
                value={value} onChangeText={onChangeText}
                placeholderTextColor={C.w15}
                className="outline-none"
                style={{ flex: 1, color: C.w80, fontSize: 15, paddingHorizontal: icon ? 8 : 0, height: '100%' }}
                {...props}
            />
        </View>
    </View>
);

/* -- Large role card (Step 0) -- */
const LargeRoleCard = ({ icon: Icon, title, subtitle, selected, onPress }: {
    icon: React.ElementType; title: string; subtitle: string; selected: boolean; onPress: () => void;
}) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{
        flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, borderRadius: 20,
        borderWidth: 1.5, borderColor: selected ? C.activeB : C.w08,
        backgroundColor: selected ? C.activeBg : C.w03,
    }}>
        <View style={{
            width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
            backgroundColor: selected ? C.primary : C.w06,
        }}>
            <Icon size={22} color={selected ? '#fff' : C.w30} />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: selected ? C.primary : C.w60 }}>{title}</Text>
            <Text style={{ fontSize: 13, color: selected ? C.w50 : C.w30, marginTop: 2 }}>{subtitle}</Text>
        </View>
        {selected && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: C.primary }} />}
    </TouchableOpacity>
);

/* -- Intent card (Step 3, 2x2 grid) -- */
const IntentCard = ({ icon: Icon, label, selected, onPress }: {
    icon: React.ElementType; label: string; selected: boolean; onPress: () => void;
}) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{
        width: '47%', padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center', gap: 10,
        borderColor: selected ? C.activeB : C.w08, backgroundColor: selected ? C.activeBg : C.w03,
    }}>
        <View style={{
            width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
            backgroundColor: selected ? C.primary : C.w06,
        }}>
            <Icon size={20} color={selected ? '#fff' : C.w30} />
        </View>
        <Text style={{ fontSize: 13, fontWeight: '600', color: selected ? C.primary : C.w40, textAlign: 'center' }}>
            {label}
        </Text>
    </TouchableOpacity>
);

/* -- Pill chip (Step 4) -- */
const TypeChip = ({ label, selected, onPress }: {
    label: string; selected: boolean; onPress: () => void;
}) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{
        paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, borderWidth: 1,
        borderColor: selected ? C.activeB : C.w08, backgroundColor: selected ? C.activeBg : C.w03,
    }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: selected ? C.primary : C.w40 }}>{label}</Text>
    </TouchableOpacity>
);

/* -- Experience card (Step 5) -- */
const ExpCard = ({ label, sub, selected, onPress }: {
    label: string; sub: string; selected: boolean; onPress: () => void;
}) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 18, borderRadius: 16, borderWidth: 1,
        borderColor: selected ? C.activeB : C.w08, backgroundColor: selected ? C.activeBg : C.w03,
    }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: selected ? C.primary : C.w50 }}>{label}</Text>
        <Text style={{ fontSize: 12, color: C.w30 }}>{sub}</Text>
    </TouchableOpacity>
);

/* ════════════════════════════════════════════════════ */
/*  MAIN SCREEN                                        */
/* ════════════════════════════════════════════════════ */

export default function RegisterScreen() {
    const registerMutation = useRegister();

    /* ── Step state ── */
    const [step, setStep] = useState(0);
    const [stepError, setStepError] = useState<string | null>(null);

    /* ── Field state ── */
    /* ── Field state ── */
    const [role, setRole] = useState<Role | null>(null);
    const [fullName, setFullName] = useState("");
    const [location, setLocation] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [intent, setIntent] = useState<Intent[]>([]); // Multi-select array
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]); // Multi-select array
    const [expLevel, setExpLevel] = useState<ExperienceLevel | null>(null);
    const [instagram, setInstagram] = useState("");

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

    /* ── Per-step validation ── */
    const validateStep = (): string | null => {
        switch (step) {
            case 0: return !role ? "Choose your role to continue" : null;
            case 1:
                if (!fullName.trim() || fullName.trim().length < 2) return "Name must be at least 2 characters";
                if (!location.trim() || location.trim().length < 2) return "Location is required";
                return null;
            case 2:
                if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return "Please enter a valid email";
                if (!phone.trim() || phone.trim().length < 10) return "Phone number must be at least 10 digits";
                if (password.length < 8) return "Password must be at least 8 characters";
                return null;
            case 3: return intent.length === 0 ? "Please select at least one intent" : null;
            case 4: return selectedTypes.length === 0 ? "Please select at least one category" : null;
            default: return null;
        }
    };

    /* ── Navigation ── */
    const handleNext = useCallback((skip = false) => {
        if (!skip) {
            const error = validateStep();
            if (error) { setStepError(error); return; }
        }
        setStepError(null);

        if (step === 6) {
            submitRegistration(skip);
            return;
        }
        animateToStep(step + 1);
    }, [step, role, fullName, location, email, phone, password, intent, selectedTypes]);

    const handleBack = () => {
        if (step > 0 && step < 7) {
            setStepError(null);
            animateToStep(step - 1);
        }
    };

    /* ── Submission ── */
    const submitRegistration = (skipInstagram = false) => {
        const payload: any = {
            name: fullName, email, password, phoneNumber: phone,
            location, userType: role,
        };
        if (intent.length > 0) payload.intent = intent;
        if (expLevel) payload.experienceLevel = expLevel;
        if (!skipInstagram && instagram.trim()) payload.instagramHandle = instagram.trim().replace(/^@/, '');
        if (role === 'artist' && selectedTypes.length > 0) payload.artistType = selectedTypes;
        if (role === 'organizer' && selectedTypes.length > 0) payload.organizationType = selectedTypes;

        registerMutation.mutate(payload, {
            onSuccess: () => animateToStep(7),
            onError: (err: any) => {
                const msg = err.response?.data?.msg || err.response?.data?.message || err.message || "Registration failed.";
                setStepError(msg);
            },
        });
    };

    const navigateAway = () => {
        const { user } = useAuthStore.getState();
        if (user?.roles?.includes("organizer") || role === "organizer") {
            router.replace("/(app)/dashboard");
        } else {
            router.replace("/(app)/gigs");
        }
    };

    /* ── Derived ── */
    const isArtist = role === 'artist';
    const progress = Math.min((step + 1) / TOTAL_STEPS, 1);
    const showBack = step > 0 && step < 7;
    const showSkip = step === 5 || step === 6;
    const ctaLabel = step === 6 ? "Create Account" : step === 7 ? "Let's go!" : "Continue";

    /* ── Toggle helper ── */
    const toggleIntent = (id: Intent) => {
        setIntent(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
        setStepError(null);
    };

    const toggleType = (t: string) => {
        setSelectedTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
        setStepError(null);
    };

    /* ════════════════════════════════════════════════ */
    /*  RENDER                                         */
    /* ════════════════════════════════════════════════ */

    return (
        <View style={{ flex: 1, backgroundColor: C.bg }}>
            <SafeAreaView style={{ flex: 1 }}>

                {/* ═══ HEADER ═══ */}
                <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        {/* Left: Back or Logo */}
                        {showBack ? (
                            <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={{
                                width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: C.w10,
                                alignItems: 'center', justifyContent: 'center',
                            }}>
                                <ChevronLeft size={16} color={C.w40} />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <View style={{
                                    width: 32, height: 32, borderRadius: 10, backgroundColor: C.w06,
                                    borderWidth: 1, borderColor: C.w10, alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Sparkles size={14} color={C.primary} />
                                </View>
                                <Text style={{ fontSize: 18, fontWeight: '700', letterSpacing: -1, color: C.w80 }}>
                                    NETSA
                                </Text>
                            </TouchableOpacity>
                        )}
                        {/* Right: Step counter */}
                        {step < 7 && (
                            <Text style={{ fontSize: 12, fontWeight: '500', color: C.w25 }}>
                                {step + 1} of {TOTAL_STEPS}
                            </Text>
                        )}
                    </View>

                    {/* Progress bar */}
                    <View style={{ height: 3, backgroundColor: C.w08, borderRadius: 2, overflow: 'hidden' }}>
                        <LinearGradient
                            colors={[C.primary, C.secondary]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={{ height: '100%', width: `${progress * 100}%`, borderRadius: 2 }}
                        />
                    </View>
                </View>

                {/* ═══ ANIMATED CONTENT ═══ */}
                <Animated.View style={{
                    flex: 1, justifyContent: 'center', paddingHorizontal: 24,
                    opacity: fadeAnim, transform: [{ translateX: slideX }],
                }}>

                    {/* STEP 0 — Role Selection */}
                    {step === 0 && (
                        <View>
                            <Text style={{ fontSize: 28, fontWeight: '800', color: C.w95, lineHeight: 36 }}>
                                Who are you{'\n'}on NETSA?
                            </Text>
                            <Text style={{ fontSize: 14, color: C.w30, marginTop: 8, marginBottom: 32 }}>
                                Choose your role to get started.
                            </Text>
                            <View style={{ gap: 12 }}>
                                <LargeRoleCard icon={Mic2} title="Artist"
                                    subtitle="Perform & get discovered"
                                    selected={role === 'artist'} onPress={() => { setRole('artist'); setStepError(null); }} />
                                <LargeRoleCard icon={Calendar} title="Organizer"
                                    subtitle="Discover & hire talent"
                                    selected={role === 'organizer'} onPress={() => { setRole('organizer'); setStepError(null); }} />
                            </View>
                        </View>
                    )}

                    {/* STEP 1 — Identity */}
                    {step === 1 && (
                        <View>
                            <Text style={{ fontSize: 28, fontWeight: '800', color: C.w95, lineHeight: 36 }}>
                                How should people{'\n'}recognize you?
                            </Text>
                            <Text style={{ fontSize: 14, color: C.w30, marginTop: 8, marginBottom: 32 }}>
                                This is how you'll appear on NETSA.
                            </Text>
                            <StepInput label="Full Name" value={fullName} onChangeText={(v) => { setFullName(v); setStepError(null); }}
                                placeholder="Your name or stage name" autoCapitalize="words" />
                            <StepInput label="Location" value={location} onChangeText={(v) => { setLocation(v); setStepError(null); }}
                                placeholder="e.g. Mumbai, Delhi, Bangalore"
                                icon={<MapPin size={16} color={C.w25} />} />
                        </View>
                    )}

                    {/* STEP 2 — Contact & Security */}
                    {step === 2 && (
                        <View>
                            <Text style={{ fontSize: 28, fontWeight: '800', color: C.w95, lineHeight: 36 }}>
                                How do we secure{'\n'}your account?
                            </Text>
                            <Text style={{ fontSize: 14, color: C.w30, marginTop: 8, marginBottom: 32 }}>
                                We'll keep your info safe.
                            </Text>
                            <StepInput label="Email" value={email} onChangeText={(v) => { setEmail(v); setStepError(null); }}
                                placeholder="your@email.com" keyboardType="email-address" autoCapitalize="none" />
                            <StepInput label="Phone Number" value={phone} onChangeText={(v) => { setPhone(v); setStepError(null); }}
                                placeholder="+91 98765 43210" keyboardType="phone-pad" />
                            <StepInput label="Password" value={password} onChangeText={(v) => { setPassword(v); setStepError(null); }}
                                placeholder="Min 8 characters" secureTextEntry />
                        </View>
                    )}

                    {/* STEP 3 — Primary Intent */}
                    {step === 3 && (
                        <View>
                            <Text style={{ fontSize: 28, fontWeight: '800', color: C.w95, lineHeight: 36 }}>
                                What brings you{'\n'}to NETSA?
                            </Text>
                            <Text style={{ fontSize: 14, color: C.w30, marginTop: 8, marginBottom: 32 }}>
                                Pick as many as you like.
                            </Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
                                {INTENT_OPTIONS.map((opt) => (
                                    <IntentCard key={opt.id} icon={opt.icon} label={opt.label}
                                        selected={intent.includes(opt.id)}
                                        onPress={() => toggleIntent(opt.id)} />
                                ))}
                            </View>
                        </View>
                    )}

                    {/* STEP 4 — Category */}
                    {step === 4 && (
                        <View>
                            <Text style={{ fontSize: 28, fontWeight: '800', color: C.w95, lineHeight: 36 }}>
                                Where do you{'\n'}belong?
                            </Text>
                            <Text style={{ fontSize: 14, color: C.w30, marginTop: 8, marginBottom: 32 }}>
                                {isArtist ? "Select all that apply." : "Select all that apply."}
                            </Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                {(isArtist ? ARTIST_TYPES : ORG_TYPES).map((t) => (
                                    <TypeChip key={t} label={t}
                                        selected={selectedTypes.includes(t)}
                                        onPress={() => toggleType(t)} />
                                ))}
                            </View>
                        </View>
                    )}

                    {/* STEP 5 — Experience Level */}
                    {step === 5 && (
                        <View>
                            <Text style={{ fontSize: 28, fontWeight: '800', color: C.w95, lineHeight: 36 }}>
                                Where are you in{'\n'}your journey?
                            </Text>
                            <Text style={{ fontSize: 14, color: C.w30, marginTop: 8, marginBottom: 32 }}>
                                No pressure — this helps us curate your feed.
                            </Text>
                            <View style={{ gap: 10 }}>
                                {EXP_LEVELS.map((l) => (
                                    <ExpCard key={l.id} label={l.label} sub={l.sub}
                                        selected={expLevel === l.id}
                                        onPress={() => setExpLevel(l.id)} />
                                ))}
                            </View>
                        </View>
                    )}

                    {/* STEP 6 — Social Proof */}
                    {step === 6 && (
                        <View>
                            <Text style={{ fontSize: 28, fontWeight: '800', color: C.w95, lineHeight: 36 }}>
                                Want to add{'\n'}credibility?
                            </Text>
                            <Text style={{ fontSize: 14, color: C.w30, marginTop: 8, marginBottom: 32 }}>
                                Your Instagram helps build trust with others.{'\n'}
                                <Text style={{ color: C.w15 }}>This is completely optional.</Text>
                            </Text>
                            <StepInput label="Instagram Handle" value={instagram} onChangeText={setInstagram}
                                placeholder="@yourhandle" autoCapitalize="none"
                                icon={<Instagram size={16} color={C.w25} />} />
                        </View>
                    )}

                    {/* STEP 7 — Completion */}
                    {step === 7 && (
                        <View style={{ alignItems: 'center' }}>
                            <LinearGradient
                                colors={[C.primary, C.secondary]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                style={{
                                    width: 80, height: 80, borderRadius: 40,
                                    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
                                }}>
                                <Check size={40} color="#fff" strokeWidth={3} />
                            </LinearGradient>
                            <Text style={{ fontSize: 28, fontWeight: '800', color: C.w95, textAlign: 'center' }}>
                                Your stage is ready.
                            </Text>
                            <Text style={{ fontSize: 14, color: C.w30, marginTop: 12, textAlign: 'center', maxWidth: 280 }}>
                                {isArtist
                                    ? "Time to get discovered by top organizers."
                                    : "Start finding the perfect talent for your events."}
                            </Text>
                        </View>
                    )}
                </Animated.View>

                {/* ═══ CTA AREA ═══ */}
                <View style={{ paddingHorizontal: 24, paddingBottom: Platform.OS === 'android' ? 24 : 16, marginBottom: 64 }}>
                    {/* Error */}
                    {stepError && (
                        <View style={{
                            backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1,
                            borderColor: 'rgba(239,68,68,0.25)', borderRadius: 12,
                            paddingVertical: 10, paddingHorizontal: 14, marginBottom: 12,
                        }}>
                            <Text style={{ color: '#fca5a5', fontSize: 13, textAlign: 'center' }}>{stepError}</Text>
                        </View>
                    )}

                    {/* Primary CTA */}
                    <TouchableOpacity
                        onPress={() => step === 7 ? navigateAway() : handleNext()}
                        activeOpacity={0.85}
                        disabled={registerMutation.isPending}
                        style={{ borderRadius: 16, overflow: 'hidden', opacity: registerMutation.isPending ? 0.6 : 1 }}
                    >
                        <LinearGradient
                            colors={[C.primary, C.secondary]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={{ height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>
                                {registerMutation.isPending ? "Creating account..." : ctaLabel}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Skip */}
                    {showSkip && (
                        <TouchableOpacity
                            onPress={() => handleNext(true)}
                            activeOpacity={0.7}
                            style={{
                                marginTop: 14, alignItems: 'center', flexDirection: 'row',
                                justifyContent: 'center', gap: 4,
                            }}
                        >
                            <Text style={{ fontSize: 13, color: C.w25 }}>
                                {step === 6 ? "Skip for now" : "Skip"}
                            </Text>
                            <ArrowRight size={12} color={C.w25} />
                        </TouchableOpacity>
                    )}

                    {/* Sign in link (step 0 only) */}
                    {step === 0 && (
                        <TouchableOpacity
                            onPress={() => router.push("/(auth)/login")}
                            style={{ marginTop: 20, alignItems: 'center' }}
                        >
                            <Text style={{ fontSize: 12, color: C.w25 }}>
                                Already have an account?{' '}
                                <Text style={{ fontWeight: '600', color: C.primary }}>Sign In</Text>
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </SafeAreaView >
        </View >
    );
}