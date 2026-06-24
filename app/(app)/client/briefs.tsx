// app/(app)/client/briefs.tsx
// "Your briefs" — the full management surface Home's peek links to. Season
// Timeline: an Ongoing bucket (no fixed date) + month-grouped event dates, with
// a needs-your-decision accent. A List toggle gives a flat status view.
import { useState } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Repeat, MapPin, ArrowRight, CalendarClock, List, Plus } from 'lucide-react-native';
import { requirementService } from '@/services/requirementService';
import { useMobileTabBarHeight } from '@/components/MobileTabBar';

const STATUS_TINT: Record<string, string> = {
    open: '#5B8DEF', in_discussion: '#F59E0B', booked: '#22C55E',
    closed: '#71717a', cancelled: '#71717a', expired: '#71717a',
};
const STATUS_LABEL: Record<string, string> = {
    open: 'Open', in_discussion: 'In discussion', booked: 'Booked',
    closed: 'Closed', cancelled: 'Cancelled', expired: 'Expired',
};
const ACTIVE = new Set(['open', 'in_discussion', 'booked']);

function monthKey(iso: string): string {
    try { return new Date(iso).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }); }
    catch { return 'Scheduled'; }
}
function dateBadge(iso: string): { day: string; mon: string } {
    try {
        const d = new Date(iso);
        return { day: String(d.getDate()), mon: d.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase() };
    } catch { return { day: '–', mon: '' }; }
}
const needsDecision = (r: any) => (r.proposalCount ?? 0) > 0 && r.status !== 'booked';

// ─── right-side status/action ────────────────────────────────────────────────
function ActionRight({ req }: { req: any }) {
    if (req.status === 'booked') {
        return <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#22C55E', fontSize: 12.5 }}>Booked</Text>;
    }
    if (needsDecision(req)) {
        return (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FF6B35', borderRadius: 9, paddingVertical: 6, paddingHorizontal: 10 }}>
                <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#1A0D06', fontSize: 12 }}>Review {req.proposalCount}</Text>
                <ArrowRight size={12} color="#1A0D06" strokeWidth={2.4} />
            </View>
        );
    }
    return <Text style={{ fontFamily: 'Outfit-Regular', color: '#52525b', fontSize: 12 }}>Collecting…</Text>;
}

function BriefBody({ req }: { req: any }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                    <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: STATUS_TINT[req.status] ?? '#71717a' }} />
                    <Text style={{ fontFamily: 'Outfit-Regular', color: '#f4f4f5', fontSize: 14.5, letterSpacing: -0.1, flex: 1 }} numberOfLines={1}>
                        {req.title || req.occasionText}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5, marginLeft: 14 }}>
                    {!!req.city && <MapPin size={11} color="#71717a" />}
                    <Text style={{ fontFamily: 'Outfit-Regular', color: '#71717a', fontSize: 11.5 }} numberOfLines={1}>
                        {[req.occasionText, req.city].filter(Boolean).join(' · ')}
                    </Text>
                </View>
            </View>
            <ActionRight req={req} />
        </View>
    );
}

// ─── timeline node (rail + card) ─────────────────────────────────────────────
function TimelineNode({ req, isLast, ongoing }: { req: any; isLast: boolean; ongoing?: boolean }) {
    const router = useRouter();
    const accent = needsDecision(req);
    const b = ongoing ? null : dateBadge(req.eventDate);
    return (
        <View style={{ flexDirection: 'row', gap: 14, paddingVertical: 9 }}>
            <View style={{ width: 34, alignItems: 'center', position: 'relative' }}>
                {!isLast && <View style={{ position: 'absolute', top: 36, bottom: -18, width: 2, backgroundColor: 'rgba(255,255,255,0.12)' }} />}
                {ongoing ? (
                    <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#17151d', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                        <Repeat size={14} color="#EAB308" />
                    </View>
                ) : (
                    <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: req.status === 'booked' ? 'rgba(34,197,94,0.14)' : '#17151d', borderWidth: 1, borderColor: req.status === 'booked' ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                        <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#f4f4f5', fontSize: 13, lineHeight: 14 }}>{b!.day}</Text>
                        <Text style={{ fontFamily: 'Outfit-Regular', color: '#71717a', fontSize: 7, marginTop: 1 }}>{b!.mon}</Text>
                    </View>
                )}
            </View>
            <Pressable
                onPress={() => router.push(`/(app)/client/${req._id}` as any)}
                style={{
                    flex: 1, borderWidth: 1, borderRadius: 15, padding: 13,
                    borderColor: accent ? 'rgba(255,107,53,0.32)' : 'rgba(255,255,255,0.08)',
                    backgroundColor: accent ? 'rgba(255,107,53,0.06)' : 'rgba(255,255,255,0.02)',
                }}
            >
                <BriefBody req={req} />
            </Pressable>
        </View>
    );
}

function ListCard({ req }: { req: any }) {
    const router = useRouter();
    const accent = needsDecision(req);
    return (
        <Pressable
            onPress={() => router.push(`/(app)/client/${req._id}` as any)}
            style={{
                borderWidth: 1, borderRadius: 15, padding: 14, marginBottom: 10,
                borderColor: accent ? 'rgba(255,107,53,0.32)' : 'rgba(255,255,255,0.08)',
                backgroundColor: accent ? 'rgba(255,107,53,0.06)' : 'rgba(255,255,255,0.02)',
            }}
        >
            <BriefBody req={req} />
        </Pressable>
    );
}

function SectionLabel({ icon, text }: { icon?: React.ReactNode; text: string }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18, marginBottom: 4 }}>
            {icon}
            <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#a1a1aa', fontSize: 10.5, letterSpacing: 1.4, textTransform: 'uppercase' }}>{text}</Text>
        </View>
    );
}

export default function ClientBriefs() {
    const router = useRouter();
    const navClearance = (useMobileTabBarHeight() || 64) + 40;
    const [view, setView] = useState<'timeline' | 'list'>('timeline');

    const { data: requirements = [], isLoading, isFetching, refetch } = useQuery({
        queryKey: ['client', 'requirements'],
        queryFn: requirementService.mine,
    });

    const active: any[] = (requirements as any[]).filter((r) => ACTIVE.has(r.status));
    const totalProposals = active.reduce((s, r) => s + (r.proposalCount ?? 0), 0);
    const needCount = active.filter(needsDecision).length;

    // Timeline split: ongoing (no date) + dated, sorted ascending and grouped by month.
    const ongoing = active.filter((r) => !r.eventDate);
    const dated = active
        .filter((r) => !!r.eventDate)
        .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
    const months: { key: string; items: any[] }[] = [];
    dated.forEach((r) => {
        const k = monthKey(r.eventDate);
        const grp = months.find((m) => m.key === k);
        if (grp) grp.items.push(r);
        else months.push({ key: k, items: [r] });
    });

    // For the list view: needs-decision first, then by soonest date.
    const listSorted = [...active].sort((a, b) => {
        if (needsDecision(a) !== needsDecision(b)) return needsDecision(a) ? -1 : 1;
        const da = a.eventDate ? new Date(a.eventDate).getTime() : Infinity;
        const db = b.eventDate ? new Date(b.eventDate).getTime() : Infinity;
        return da - db;
    });

    const summary = [
        `${active.length} active`,
        `${totalProposals} proposal${totalProposals === 1 ? '' : 's'}`,
        ...(needCount > 0 ? [`${needCount} need your decision`] : []),
    ];

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={{ flex: 1, backgroundColor: '#09090b' }}>
                {/* Nav */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8 }}>
                    <Pressable onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronLeft size={18} color="#f4f4f5" />
                    </Pressable>
                    <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', color: '#f4f4f5', fontSize: 22 }}>Your briefs</Text>
                </View>

                {isLoading ? (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <ActivityIndicator color="#FF6B35" />
                    </View>
                ) : (
                    <ScrollView
                        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: navClearance }}
                        showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor="#FF6B35" />}
                    >
                        {/* Summary */}
                        <Text style={{ fontFamily: 'Outfit-Regular', color: '#a1a1aa', fontSize: 12.5, marginBottom: 12 }}>
                            {active.length === 0 ? 'No active briefs yet' : (
                                <>
                                    <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#f4f4f5' }}>{active.length} active</Text>
                                    {`  ·  ${summary.slice(1).join('  ·  ')}`}
                                </>
                            )}
                        </Text>

                        {active.length === 0 ? (
                            <View style={{ paddingTop: 30, alignItems: 'center' }}>
                                <Text style={{ fontFamily: 'Outfit-Regular', color: '#71717a', fontSize: 13.5, textAlign: 'center', lineHeight: 20, maxWidth: 260 }}>
                                    When you post a requirement, it'll show up here on your timeline.
                                </Text>
                                <Pressable onPress={() => router.push('/(app)/client/new-requirement' as any)} style={{ marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FF6B35', borderRadius: 13, paddingVertical: 13, paddingHorizontal: 20 }}>
                                    <Plus size={16} color="#1A0D06" strokeWidth={2.6} />
                                    <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#1A0D06', fontSize: 14 }}>Post a requirement</Text>
                                </Pressable>
                            </View>
                        ) : (
                            <>
                                {/* View toggle */}
                                <View style={{ flexDirection: 'row', alignSelf: 'flex-start', gap: 4, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 11, padding: 4, marginBottom: 4 }}>
                                    {([['timeline', 'Timeline', CalendarClock], ['list', 'List', List]] as const).map(([key, label, Icon]) => {
                                        const on = view === key;
                                        return (
                                            <Pressable key={key} onPress={() => setView(key)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 13, borderRadius: 8, backgroundColor: on ? '#f4f4f5' : 'transparent' }}>
                                                <Icon size={13} color={on ? '#1A0D06' : '#a1a1aa'} />
                                                <Text style={{ fontFamily: 'Outfit-SemiBold', color: on ? '#1A0D06' : '#a1a1aa', fontSize: 12 }}>{label}</Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>

                                {view === 'timeline' ? (
                                    <>
                                        {ongoing.length > 0 && (
                                            <>
                                                <SectionLabel icon={<Repeat size={13} color="#71717a" />} text="Ongoing · no fixed date" />
                                                {ongoing.map((r, i) => (
                                                    <TimelineNode key={r._id} req={r} ongoing isLast={i === ongoing.length - 1} />
                                                ))}
                                            </>
                                        )}
                                        {months.map((m) => (
                                            <View key={m.key}>
                                                <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', color: '#FFB088', fontSize: 17, marginTop: 16, marginBottom: 2, marginLeft: 48 }}>{m.key}</Text>
                                                {m.items.map((r, i) => (
                                                    <TimelineNode key={r._id} req={r} isLast={i === m.items.length - 1} />
                                                ))}
                                            </View>
                                        ))}
                                    </>
                                ) : (
                                    <View style={{ marginTop: 14 }}>
                                        {listSorted.map((r) => <ListCard key={r._id} req={r} />)}
                                    </View>
                                )}

                                {/* New requirement */}
                                <Pressable
                                    onPress={() => router.push('/(app)/client/new-requirement' as any)}
                                    style={{ marginTop: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,107,53,0.35)', borderRadius: 14, paddingVertical: 15 }}
                                >
                                    <Plus size={16} color="#FF6B35" strokeWidth={2.2} />
                                    <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#FF6B35', fontSize: 13.5 }}>Post a new requirement</Text>
                                </Pressable>
                            </>
                        )}
                    </ScrollView>
                )}
            </View>
        </>
    );
}
