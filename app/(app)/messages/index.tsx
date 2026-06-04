// app/(app)/messages/index.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    Image,
    ScrollView,
    ActivityIndicator,
    Platform,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Search, X, PenSquare } from 'lucide-react-native';
import { ChatWindow, UserBasic } from '@/components/connections/ChatWindow';
import conversationService, { PopulatedConversation } from '@/services/conversationService';
import { useAuthStore } from '@/stores/authStore';
import noAvatar from '@/assets/no-avatar.jpg';

// ── Theme ──
const C = {
    bg: '#0a0807',
    panel: '#13110f',
    panelHover: 'rgba(255,200,140,0.04)',
    panelActive: 'rgba(212,161,85,0.10)',
    border: 'rgba(212,161,85,0.18)',
    borderSoft: 'rgba(212,161,85,0.10)',
    text1: '#F5F0EB',
    text2: '#A19BAA',
    text3: '#4A4656',
    gold: '#D4A155',
    orange: '#FF6B35',
    unreadBadge: '#2563EB',
};

const DESKTOP_BREAKPOINT = 900;

// ── Helpers ──
const timeAgo = (iso?: string) => {
    if (!iso) return '';
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d`;
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

// Resolve a usable display name from whatever shape the backend hands back.
// Server populate currently selects 'username firstName lastName displayName
// profilePicture profileImageUrl', so any of these may be present.
const resolveName = (u: any): string | undefined => {
    if (!u || typeof u !== 'object') return undefined;
    if (u.displayName) return String(u.displayName);
    const composed = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
    if (composed) return composed;
    if (u.username) return String(u.username);
    return undefined;
};

// Robust other-participant extractor. Backend may serve participants as either
// populated user objects OR raw ObjectId strings. Normalise both to an object
// shape (with whatever fields exist) and compute a sensible name + avatar.
const otherParticipant = (
    convo: PopulatedConversation,
    selfId?: string
): {
    _id: string;
    displayName?: string;
    profilePicture?: string;
    profileImageUrl?: string;
} | undefined => {
    const list = (convo as any)?.participants;
    if (!Array.isArray(list) || list.length === 0) return undefined;
    const normalise = (p: any) => (typeof p === 'string' ? { _id: p } : p);
    const others = list.map(normalise).filter((p) => p && p._id && p._id !== selfId);
    const raw = others[0] ?? normalise(list[0]);
    if (!raw) return undefined;
    return {
        _id: raw._id,
        displayName: resolveName(raw),
        profilePicture: raw.profilePicture ?? raw.profileImageUrl,
        profileImageUrl: raw.profileImageUrl ?? raw.profilePicture,
    };
};

// ── Conversation row in the sidebar ──
const ConvoRow = ({
    convo,
    selfId,
    active,
    onPress,
}: {
    convo: PopulatedConversation;
    selfId?: string;
    active: boolean;
    onPress: () => void;
}) => {
    const other = otherParticipant(convo, selfId);
    const name = other?.displayName || 'Conversation';
    const preview = convo.lastMessage || 'No messages yet';
    const unread = (convo.unreadCount ?? 0) > 0;
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed, hovered }: any) => ({
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderBottomWidth: 1,
                borderBottomColor: C.borderSoft,
                backgroundColor: active
                    ? C.panelActive
                    : (hovered || pressed)
                    ? C.panelHover
                    : 'transparent',
                borderLeftWidth: 2,
                borderLeftColor: active ? C.orange : 'transparent',
            })}
        >
            <Image
                source={other?.profilePicture ? { uri: other.profilePicture } : noAvatar}
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                }}
            />
            <View style={{ flex: 1, marginLeft: 12, marginRight: 8, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <Text
                        style={{
                            color: C.text1,
                            fontFamily: unread ? 'Outfit-Bold' : 'Outfit-SemiBold',
                            fontSize: 14,
                            flex: 1,
                        }}
                        numberOfLines={1}
                    >
                        {name}
                    </Text>
                    <Text
                        style={{
                            color: C.text3,
                            fontSize: 10,
                            fontFamily: 'SpaceMono',
                            letterSpacing: 0.5,
                            marginLeft: 6,
                        }}
                    >
                        {timeAgo(convo.updatedAt as any)}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                    <Text
                        style={{
                            color: unread ? C.text1 : C.text2,
                            fontSize: 12,
                            flex: 1,
                            fontFamily: unread ? 'Outfit-Medium' : 'Outfit-Regular',
                        }}
                        numberOfLines={1}
                    >
                        {preview}
                    </Text>
                    {unread ? (
                        <View
                            style={{
                                backgroundColor: C.unreadBadge,
                                minWidth: 18,
                                height: 18,
                                paddingHorizontal: 5,
                                borderRadius: 9,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginLeft: 6,
                            }}
                        >
                            <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'Outfit-Bold' }}>
                                {convo.unreadCount}
                            </Text>
                        </View>
                    ) : null}
                </View>
            </View>
        </Pressable>
    );
};

// ── Sidebar (conversation list) ──
const Sidebar = ({
    conversations,
    selfId,
    activeId,
    loading,
    onSelect,
    onBack,
    showBack,
}: {
    conversations: PopulatedConversation[];
    selfId?: string;
    activeId?: string;
    loading: boolean;
    onSelect: (id: string) => void;
    onBack?: () => void;
    showBack?: boolean;
}) => {
    const [q, setQ] = useState('');
    const filtered = useMemo(() => {
        const needle = q.trim().toLowerCase();
        if (!needle) return conversations;
        return conversations.filter((c) => {
            const o = otherParticipant(c, selfId);
            return (
                o?.displayName?.toLowerCase().includes(needle) ||
                (c.lastMessage ?? '').toLowerCase().includes(needle)
            );
        });
    }, [conversations, q, selfId]);

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: C.panel,
                borderRightWidth: 1,
                borderRightColor: C.border,
            }}
        >
            {/* Header */}
            <View
                style={{
                    paddingHorizontal: 16,
                    paddingTop: 14,
                    paddingBottom: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: C.borderSoft,
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    {showBack && onBack ? (
                        <Pressable
                            onPress={onBack}
                            style={({ pressed }) => ({
                                width: 32,
                                height: 32,
                                borderRadius: 16,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 8,
                                opacity: pressed ? 0.5 : 1,
                            })}
                        >
                            <ChevronLeft size={18} color={C.text2} />
                        </Pressable>
                    ) : null}
                    <View style={{ flex: 1 }}>
                        <Text
                            style={{
                                color: C.gold,
                                fontFamily: 'SpaceMono',
                                fontSize: 10,
                                letterSpacing: 3,
                            }}
                        >
                            INBOX
                        </Text>
                        <Text
                            style={{
                                color: C.text1,
                                fontFamily: 'DMSerifDisplay_400Regular',
                                fontSize: 22,
                                ...(Platform.OS === 'web' ? { fontStyle: 'italic' as any } : {}),
                                marginTop: 2,
                            }}
                        >
                            Messages
                        </Text>
                    </View>
                    <Pressable
                        onPress={() => {/* compose stub */}}
                        style={({ pressed }) => ({
                            width: 34,
                            height: 34,
                            borderRadius: 17,
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: pressed ? 0.5 : 1,
                        })}
                    >
                        <PenSquare size={16} color={C.text2} />
                    </Pressable>
                </View>
                {/* Search */}
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: C.borderSoft,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                    }}
                >
                    <Search size={14} color={C.text3} />
                    <TextInput
                        value={q}
                        onChangeText={setQ}
                        placeholder="Search messages"
                        placeholderTextColor={C.text3}
                        style={{
                            flex: 1,
                            color: C.text1,
                            fontSize: 13,
                            marginLeft: 8,
                            paddingVertical: Platform.OS === 'web' ? 4 : 2,
                            ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
                        }}
                    />
                    {q ? (
                        <Pressable onPress={() => setQ('')} hitSlop={8}>
                            <X size={14} color={C.text3} />
                        </Pressable>
                    ) : null}
                </View>
            </View>

            {/* Conversations */}
            <ScrollView style={{ flex: 1 }}>
                {loading ? (
                    <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                        <ActivityIndicator size="small" color={C.gold} />
                    </View>
                ) : filtered.length === 0 ? (
                    <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                        <Text
                            style={{
                                color: C.text3,
                                fontFamily: 'DMSerifDisplay_400Regular',
                                fontSize: 26,
                                marginBottom: 6,
                            }}
                        >
                            ⋄
                        </Text>
                        <Text style={{ color: C.text2, fontSize: 13 }}>
                            {q ? 'No matches' : 'No conversations yet'}
                        </Text>
                    </View>
                ) : (
                    filtered.map((c) => (
                        <ConvoRow
                            key={c._id}
                            convo={c}
                            selfId={selfId}
                            active={c._id === activeId}
                            onPress={() => onSelect(c._id)}
                        />
                    ))
                )}
            </ScrollView>
        </View>
    );
};

// ── Empty state for the chat pane (desktop, no convo selected) ──
const ChatEmpty = () => (
    <View
        style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: C.bg,
        }}
    >
        <Text
            style={{
                color: C.text3,
                fontFamily: 'DMSerifDisplay_400Regular',
                fontSize: 48,
                marginBottom: 14,
            }}
        >
            ✦
        </Text>
        <Text
            style={{
                color: C.text1,
                fontFamily: 'DMSerifDisplay_400Regular',
                fontSize: 22,
                marginBottom: 6,
                ...(Platform.OS === 'web' ? { fontStyle: 'italic' as any } : {}),
            }}
        >
            Pick a conversation
        </Text>
        <Text style={{ color: C.text2, fontSize: 13 }}>or start one from a profile</Text>
    </View>
);

// ── Page ──
export default function MessagesPage() {
    const router = useRouter();
    const params = useLocalSearchParams<{ c?: string }>();
    const { user } = useAuthStore();
    const selfId = user?._id;
    const { width } = useWindowDimensions();
    const isDesktop = width >= DESKTOP_BREAKPOINT;

    const [conversations, setConversations] = useState<PopulatedConversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeId, setActiveId] = useState<string | undefined>(params.c as string | undefined);

    const fetchAll = useCallback(async () => {
        try {
            const list = await conversationService.getConversations();
            setConversations(list || []);
        } catch (e) {
            console.error('[messages] fetch failed', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    // Keep activeId in sync with the URL — handles inbound navigation from
    // /network's message-bubble tap that arrives as ?c=<id>.
    useEffect(() => {
        const incoming = params.c as string | undefined;
        if (incoming && incoming !== activeId) {
            setActiveId(incoming);
        }
    }, [params.c]);

    // If the URL points at a conversation we don't have in the list yet (e.g.
    // just created via /network → openMessage), fetch it by id and inject so
    // the chat pane can render immediately.
    useEffect(() => {
        if (!activeId) return;
        const present = conversations.some((c) => c._id === activeId);
        if (present) return;
        let cancelled = false;
        (async () => {
            try {
                const convo = await conversationService.getConversationById(activeId);
                if (!cancelled && convo) {
                    setConversations((prev) => {
                        if (prev.some((c) => c._id === convo._id)) return prev;
                        return [convo, ...prev];
                    });
                }
            } catch (e) {
                console.error('[messages] fetch by id failed', e);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [activeId, conversations]);

    // Auto-pick first convo on desktop when none selected and list is ready
    useEffect(() => {
        if (isDesktop && !activeId && conversations.length > 0) {
            setActiveId(conversations[0]._id);
        }
    }, [isDesktop, activeId, conversations]);

    const handleSelect = (id: string) => {
        setActiveId(id);
        router.setParams({ c: id });
    };

    const handleBackToList = () => {
        setActiveId(undefined);
        router.setParams({ c: undefined as any });
    };

    const activeConvo = useMemo(
        () => conversations.find((c) => c._id === activeId),
        [conversations, activeId]
    );

    const recipient: UserBasic | undefined = useMemo(() => {
        if (!activeConvo) return undefined;
        const o = otherParticipant(activeConvo, selfId) as any;
        if (!o) return undefined;
        return {
            _id: o._id,
            displayName: o.displayName,
            // Backend populates either `profilePicture` or `profileImageUrl` depending on
            // service shape. Pass both — ChatWindow falls through.
            profilePicture: o.profilePicture ?? o.profileImageUrl,
            profileImageUrl: o.profileImageUrl ?? o.profilePicture,
        };
    }, [activeConvo, selfId]);

    // ── Mobile layout: show one panel at a time ──
    if (!isDesktop) {
        return (
            <View style={{ flex: 1, backgroundColor: C.bg }}>
                <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                    {!activeId ? (
                        <Sidebar
                            conversations={conversations}
                            selfId={selfId}
                            activeId={activeId}
                            loading={loading}
                            onSelect={handleSelect}
                            showBack
                            onBack={() => router.back()}
                        />
                    ) : (
                        // Let ChatWindow own the chat view fully on mobile.
                        // Its onClose acts as our 'back to list' affordance.
                        <View style={{ flex: 1, backgroundColor: C.panel }}>
                            <ChatWindow
                                conversationId={activeId}
                                recipient={recipient}
                                onClose={handleBackToList}
                            />
                        </View>
                    )}
                </SafeAreaView>
            </View>
        );
    }

    // ── Desktop layout: 2-column ──
    return (
        <View style={{ flex: 1, backgroundColor: C.bg }}>
            <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                <View
                    style={{
                        flex: 1,
                        flexDirection: 'row',
                        maxWidth: 1400,
                        width: '100%',
                        alignSelf: 'center',
                        borderWidth: 1,
                        borderColor: C.border,
                        borderRadius: 14,
                        overflow: 'hidden',
                        marginVertical: 14,
                        marginHorizontal: 14,
                    }}
                >
                    <View style={{ width: 360 }}>
                        <Sidebar
                            conversations={conversations}
                            selfId={selfId}
                            activeId={activeId}
                            loading={loading}
                            onSelect={handleSelect}
                        />
                    </View>
                    <View style={{ flex: 1, backgroundColor: C.panel }}>
                        {activeId ? (
                            // Always mount when an active id exists; ChatWindow's own
                            // getConversationById fetch will fill in the recipient
                            // when our local memo can't resolve it (e.g. backend
                            // returns participants as raw ObjectId strings).
                            <ChatWindow
                                conversationId={activeId}
                                recipient={recipient}
                                onClose={() => setActiveId(undefined)}
                                hideClose
                            />
                        ) : (
                            <ChatEmpty />
                        )}
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}
