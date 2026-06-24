// app/(auth)/welcome.tsx
import { View, Text, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Briefcase, Crown, Star } from 'lucide-react-native';

const CARDS = [
    {
        role: 'client',
        icon: Briefcase,
        tint: '#FF6B35',
        title: "I'm a Client",
        blurb: 'Post work, get proposals from Creative Leads',
    },
    {
        role: 'creative_lead',
        icon: Crown,
        tint: '#8B5CF6',
        title: "I'm a Creative Lead",
        blurb: 'Win client work, hire artists to deliver it',
    },
    {
        role: 'artist',
        icon: Star,
        tint: '#8B5CF6',
        title: "I'm an Artist",
        blurb: 'Find gigs from Creative Leads, get hired',
    },
] as const;

export default function Welcome() {
    const router = useRouter();

    const pick = (role: string) => {
        if (role === 'client') {
            router.push('/(auth)/client-signup' as any);
        } else {
            router.push({ pathname: '/(auth)/register', params: { role } } as any);
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View className="flex-1 bg-[#09090b] px-5 justify-center">
                <Text
                    className="text-[#F5F0E8] text-[26px]"
                    style={{ fontFamily: 'DMSerifDisplay_400Regular' }}
                >
                    netsa<Text style={{ color: '#FF6B35' }}>.</Text>
                </Text>
                <Text
                    className="text-zinc-100 text-[20px] mt-4 mb-1"
                    style={{ fontFamily: 'Outfit-SemiBold' }}
                >
                    How will you use NETSA?
                </Text>
                <Text
                    className="text-zinc-500 text-[13px] mb-5"
                    style={{ fontFamily: 'Outfit-Regular' }}
                >
                    Pick one to get started
                </Text>

                {CARDS.map((c) => (
                    <Pressable
                        key={c.role}
                        onPress={() => pick(c.role)}
                        className="border border-white/10 rounded-2xl px-4 py-4 mb-3 active:bg-white/5"
                    >
                        <c.icon size={20} color={c.tint} />
                        <Text
                            className="text-zinc-100 text-[15px] mt-2"
                            style={{ fontFamily: 'Outfit-SemiBold' }}
                        >
                            {c.title}
                        </Text>
                        <Text
                            className="text-zinc-500 text-[12px] mt-0.5"
                            style={{ fontFamily: 'Outfit-Regular' }}
                        >
                            {c.blurb}
                        </Text>
                    </Pressable>
                ))}

                <Text
                    className="text-zinc-600 text-[11px] text-center mt-3"
                    style={{ fontFamily: 'Outfit-Regular' }}
                >
                    You can switch roles later in Settings
                </Text>

                <Pressable
                    onPress={() => router.push('/(auth)/login' as any)}
                    className="mt-6"
                >
                    <Text
                        className="text-zinc-400 text-[13px] text-center"
                        style={{ fontFamily: 'Outfit-Regular' }}
                    >
                        Already have an account?{' '}
                        <Text style={{ color: '#FF6B35' }}>Log in</Text>
                    </Text>
                </Pressable>
            </View>
        </>
    );
}
