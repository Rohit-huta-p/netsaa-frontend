// app/(app)/client/index.tsx
// Client home — "Launchpad": a springboard, not a workbench. A hero post CTA,
// craft quick-starts + browse grid (→ Talent), and a 3-brief peek (→ /briefs for
// the full list). Heavy brief management lives on /briefs and /client/[id].
import { View, Text, Pressable, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Plus, MapPin,
    PersonStanding, Drama, Music, Mic, MicVocal, Laugh,
} from 'lucide-react-native';
import { requirementService } from '@/services/requirementService';
import { useMobileTabBarHeight } from '@/components/MobileTabBar';
import { useOrganizer } from '@/hooks/useOrganizer';

// ─── Status + budget helpers (shared with /briefs, /client/[id]) ──────────────
const STATUS_TINT: Record<string, string> = {
    open: '#5B8DEF', in_discussion: '#F59E0B', booked: '#22C55E',
    closed: '#71717a', cancelled: '#71717a', expired: '#71717a',
};
const STATUS_LABEL: Record<string, string> = {
    open: 'Open', in_discussion: 'In discussion', booked: 'Booked',
    closed: 'Closed', cancelled: 'Cancelled', expired: 'Expired',
};

// ─── Craft taxonomy (launch wedge first). Routes into the Talent tab. ─────────
type Craft = { key: string; label: string; sub: string; Icon: any; tint: string };
const CRAFTS: Craft[] = [
    { key: 'Dancer', label: 'Dancers', sub: 'Classical · crew', Icon: PersonStanding, tint: '#EC4899' },
    { key: 'Actor', label: 'Actors', sub: 'Stage · improv', Icon: Drama, tint: '#A78BFA' },
    { key: 'Band', label: 'Bands', sub: 'Live · instrumental', Icon: Music, tint: '#5B8DEF' },
    { key: 'Singer', label: 'Singers', sub: 'Playback · ghazal', Icon: MicVocal, tint: '#FF6B35' },
    { key: 'Comedian', label: 'Comedians', sub: 'Stand-up · roast', Icon: Laugh, tint: '#EAB308' },
    { key: 'Anchor', label: 'Hosts & MCs', sub: 'Anchors · emcees', Icon: Mic, tint: '#34D399' },
];
// Compact quick-start chips under the hero.
const QUICK: Craft[] = [CRAFTS[0], CRAFTS[2], CRAFTS[4], CRAFTS[5]];

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function ClientHome() {
    const router = useRouter();
    const navClearance = (useMobileTabBarHeight() || 64) + 40;

    // Server-authoritative agency flag — gates the invites inbox + "are you an agency?" prompt.
    const { isAgency } = useOrganizer();

    const { data: requirements = [], isFetching, refetch } = useQuery({
        queryKey: ['client', 'requirements'],
        queryFn: requirementService.mine,
    });

    const openReqs: any[] = (requirements as any[]).filter(
        (r: any) => r.status === 'open' || r.status === 'in_discussion',
    );
    const peek = openReqs.slice(0, 3);

    const goPost = () => router.push('/(app)/client/new-requirement' as any);
    const goTalent = (craft?: string) =>
        router.push((craft ? `/(app)/talent?craft=${encodeURIComponent(craft)}` : '/(app)/talent') as any);

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={{ flex: 1, backgroundColor: '#09090b' }}>
                {/* Branding + inbox live in the global top Navbar (app/_layout.tsx) — this
                    home renders straight into its content, like the artist/CL dashboard. */}
                <ScrollView
                    contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: navClearance }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor="#FF6B35" />}
                >
                    {/* ── Hero / Launchpad ── */}
                    <LinearGradient
                        colors={['rgba(255,107,53,0.18)', 'rgba(236,72,153,0.06)', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ borderRadius: 22, padding: 22, borderWidth: 1, borderColor: 'rgba(255,107,53,0.22)' }}
                    >
                        <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', color: '#f4f4f5', fontSize: 27, lineHeight: 30, letterSpacing: -0.3 }}>
                            What are you{'\n'}planning?
                        </Text>
                        <Text style={{ fontFamily: 'Outfit-Regular', color: '#a1a1aa', fontSize: 13, lineHeight: 19, marginTop: 9, marginBottom: 18, maxWidth: '90%' }}>
                            Post a brief and Creative Leads come to you — usually within a day.
                        </Text>
                        <Pressable
                            onPress={goPost}
                            style={{
                                alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 9,
                                backgroundColor: '#FF6B35', borderRadius: 13, paddingVertical: 13, paddingHorizontal: 20,
                            }}
                        >
                            <Plus size={16} color="#1A0D06" strokeWidth={2.6} />
                            <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#1A0D06', fontSize: 14.5 }}>
                                Post a requirement
                            </Text>
                        </Pressable>
                    </LinearGradient>

                    {/* ── Craft quick-starts ── */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                        {QUICK.map((c) => (
                            <Pressable
                                key={c.key}
                                onPress={() => goTalent(c.key)}
                                style={{
                                    flexDirection: 'row', alignItems: 'center', gap: 6,
                                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', borderRadius: 20,
                                    paddingVertical: 7, paddingHorizontal: 13,
                                }}
                            >
                                <c.Icon size={13} color="#a1a1aa" />
                                <Text style={{ fontFamily: 'Outfit-Regular', color: '#d4d4d8', fontSize: 12.5 }}>{c.key}</Text>
                            </Pressable>
                        ))}
                        <Pressable
                            onPress={() => goTalent()}
                            style={{
                                borderWidth: 1, borderColor: 'rgba(255,107,53,0.3)', borderRadius: 20,
                                paddingVertical: 7, paddingHorizontal: 13,
                            }}
                        >
                            <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#FF6B35', fontSize: 12.5 }}>+ more</Text>
                        </Pressable>
                    </View>

                    {/* ── Your briefs (peek) ── */}
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 30, marginBottom: 6 }}>
                        <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#a1a1aa', fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase' }}>
                            Your briefs
                        </Text>
                        {openReqs.length > 0 && (
                            <Pressable onPress={() => router.push('/(app)/client/briefs' as any)}>
                                <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#FF6B35', fontSize: 12.5 }}>
                                    View all {openReqs.length} →
                                </Text>
                            </Pressable>
                        )}
                    </View>

                    {peek.length === 0 ? (
                        <View style={{ paddingVertical: 16 }}>
                            <Text style={{ fontFamily: 'Outfit-Regular', color: '#71717a', fontSize: 13, lineHeight: 19 }}>
                                No live briefs yet. Post one above and Creative Leads will come to you.
                            </Text>
                        </View>
                    ) : (
                        peek.map((req: any, i: number) => (
                            <Pressable
                                key={req._id}
                                onPress={() => router.push(`/(app)/client/${req._id}` as any)}
                                style={{
                                    flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 15,
                                    borderTopWidth: i === 0 ? 0 : 1, borderTopColor: 'rgba(255,255,255,0.07)',
                                }}
                            >
                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: STATUS_TINT[req.status] ?? '#71717a' }} />
                                <View style={{ flex: 1, minWidth: 0 }}>
                                    <Text style={{ fontFamily: 'Outfit-Regular', color: '#f4f4f5', fontSize: 14.5, letterSpacing: -0.1 }} numberOfLines={1}>
                                        {req.title || req.occasionText}
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 }}>
                                        {!!req.city && <MapPin size={11} color="#71717a" />}
                                        <Text style={{ fontFamily: 'Outfit-Regular', color: '#71717a', fontSize: 11.5 }} numberOfLines={1}>
                                            {[req.occasionText, req.city].filter(Boolean).join(' · ')}
                                        </Text>
                                    </View>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={{ fontFamily: 'Outfit-SemiBold', color: (req.proposalCount ?? 0) > 0 ? '#FF6B35' : '#52525b', fontSize: 13 }}>
                                        {(req.proposalCount ?? 0) > 0 ? `${req.proposalCount} proposal${req.proposalCount === 1 ? '' : 's'}` : 'Open'}
                                    </Text>
                                    <Text style={{ fontFamily: 'Outfit-Regular', color: '#71717a', fontSize: 10.5, marginTop: 1 }}>
                                        {STATUS_LABEL[req.status] ?? req.status}
                                    </Text>
                                </View>
                            </Pressable>
                        ))
                    )}

                    {/* ── Browse by craft ── */}
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 30, marginBottom: 14 }}>
                        <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#a1a1aa', fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase' }}>
                            Browse by craft
                        </Text>
                        <Pressable onPress={() => goTalent()}>
                            <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#FF6B35', fontSize: 12.5 }}>All →</Text>
                        </Pressable>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
                        {CRAFTS.map((c) => (
                            <Pressable
                                key={c.key}
                                onPress={() => goTalent(c.key)}
                                style={{
                                    width: '47.8%', flexDirection: 'row', alignItems: 'center', gap: 11,
                                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14,
                                    padding: 13, backgroundColor: 'rgba(255,255,255,0.02)',
                                }}
                            >
                                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: c.tint + '22', alignItems: 'center', justifyContent: 'center' }}>
                                    <c.Icon size={18} color={c.tint} />
                                </View>
                                <View style={{ flex: 1, minWidth: 0 }}>
                                    <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#f4f4f5', fontSize: 12.5 }} numberOfLines={1}>{c.label}</Text>
                                    <Text style={{ fontFamily: 'Outfit-Regular', color: '#52525b', fontSize: 10 }} numberOfLines={1}>{c.sub}</Text>
                                </View>
                            </Pressable>
                        ))}
                    </View>

                    {/* ── Agency entry (functional; hidden once you're an agency) ── */}
                    {!isAgency && (
                        <Pressable onPress={() => router.push('/(app)/client/business' as any)} style={{ marginTop: 26, alignItems: 'center' }}>
                            <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 12.5, color: '#71717a' }}>
                                Booking as an agency or business?{'  '}
                                <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#FF6B35' }}>Set it up →</Text>
                            </Text>
                        </Pressable>
                    )}
                </ScrollView>
            </View>
        </>
    );
}
