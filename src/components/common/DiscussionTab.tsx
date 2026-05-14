// src/components/common/DiscussionTab.tsx
//
// Apr 30 redesign — added moderation:
//   - Pin (gig owner only, cap 3 server-side)
//   - Soft delete (author OR organizer OR platform admin)
//   - Inline dropdown under the row (3-dot button OR long-press triggers it)
//   - Pin badge + pinned-first sort + "[deleted]" placeholder for masked rows
//
// Styling: inline palette-18 colors. The original NativeWind tokens
// (bg-netsa-card / text-netsa-text-secondary / font-satoshi-bold etc.) were
// never registered in tailwind.config.js → they collapsed to no styling and
// left message bodies invisible on dark bg. Inline styles match the
// HirerGigHub pattern (which also avoids NW for critical surfaces).

import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
    Pressable,
} from "react-native";
import { MoreVertical, Pin, Send, Trash2 } from "lucide-react-native";
import { useRouter } from "expo-router";

import { socketService } from "@/services/socketService";
import eventService from "@/services/eventService";
import gigService from "@/services/gigService";
import useAuthStore from "@/stores/authStore";

/* ================= TYPES ================= */

interface DiscussionMessage {
    _id: string;
    collectionType: 'event' | 'gig';
    topicId: string;
    text: string;

    authorId: string;
    authorName: string;
    authorImageUrl?: string;

    // Apr 30 — moderation flags. Optional on the type so existing event
    // discussions (which don't yet have a moderation backend) don't break.
    isPinned?: boolean;
    pinnedAt?: string;
    pinnedBy?: string;
    isDeleted?: boolean;
    deletedAt?: string;
    deletedReason?: 'self' | 'organizer' | 'admin';

    createdAt: string;
    updatedAt?: string;
}

interface DiscussionTabProps {
    id: string;
    type: 'event' | 'gig';
    /**
     * Apr 30 — moderation awareness. The Hub knows the gig owner; pass that
     * id here so the row dropdown can show owner-only actions (Pin, Delete-
     * any). Optional — defaults to non-owner. Event discussions don't have a
     * moderation backend yet, so leave this undefined for type='event'.
     */
    ownerId?: string;
    /**
     * Plan 5 v2 — when true, drop ALL outer card chrome (background,
     * border, rounded corners, margin) so the thread renders flat on
     * the parent page surface. Used on the artist-side gig detail page;
     * defaults to false so the Event detail page keeps its standalone
     * card look.
     */
    inline?: boolean;
}

/* ================= HELPERS ================= */

const sortMessages = (a: DiscussionMessage, b: DiscussionMessage) => {
    // Pinned first; within each group, oldest first (matches server sort).
    if (!!a.isPinned !== !!b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
};

const deletedLabel = (reason?: 'self' | 'organizer' | 'admin') => {
    if (reason === 'organizer') return 'Removed by gig organizer';
    if (reason === 'admin') return 'Removed by NETSA';
    return 'Removed by author';
};

/* ================= COMPONENT ================= */

export default function DiscussionTab({ id, type, ownerId, inline = false }: DiscussionTabProps) {
    const [messages, setMessages] = useState<DiscussionMessage[]>([]);
    const [inputText, setInputText] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    // Which row's dropdown is open. null = none. Using state here so a tap
    // outside (overlay) can close it. Only one open at a time.
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const currentUser = useAuthStore((state) => state.user);
    const router = useRouter();

    // Treat the auth store flag OR a JWT-derived role as admin. The store
    // shape can vary across builds — check both shapes defensively.
    const isAdmin = !!(currentUser as any)?.isAdmin || (currentUser as any)?.role === 'admin';
    const isOwner = !!ownerId && !!currentUser?._id && String(ownerId) === String(currentUser._id);

    /* ---------- Fetch initial discussion ---------- */

    useEffect(() => {
        let mounted = true;

        const fetchMessages = async () => {
            try {
                const res =
                    type === "event"
                        ? await eventService.getEventDiscussion(id)
                        : await gigService.getGigDiscussion(id);

                const data = res?.data ?? res;

                if (mounted && Array.isArray(data)) {
                    setMessages(data);
                }
            } catch (err) {
                console.error("Failed to fetch discussion:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchMessages();

        return () => {
            mounted = false;
        };
    }, [id, type]);

    /* ---------- Socket integration ---------- */

    useEffect(() => {
        socketService.joinDiscussion({ type, topicId: id });

        const offNew = socketService.onDiscussionNew(
            (newMessage: DiscussionMessage) => {
                setMessages((prev) => {
                    if (prev.some((m) => m._id === newMessage._id)) return prev;
                    return [...prev, newMessage];
                });
            }
        );

        // Apr 30 — pin/delete events. Both arrive as partial payloads; we
        // splice them in by _id. Defensive: events emitted by Event
        // discussions (which don't yet emit pin/delete) are simply no-ops.
        const offPin = socketService.onDiscussionPin((payload) => {
            if (!payload?._id) return;
            setMessages((prev) =>
                prev.map((m) =>
                    m._id === payload._id
                        ? {
                            ...m,
                            isPinned: payload.isPinned,
                            pinnedAt: payload.pinnedAt,
                            pinnedBy: payload.pinnedBy,
                        }
                        : m
                )
            );
        });

        const offDelete = socketService.onDiscussionDelete((payload) => {
            if (!payload?._id) return;
            setMessages((prev) =>
                prev.map((m) => (m._id === payload._id ? { ...m, ...payload } : m))
            );
        });

        return () => {
            socketService.leaveDiscussion({ type, topicId: id });
            offNew();
            offPin();
            offDelete();
        };
    }, [id, type]);

    /* ---------- Send message ---------- */

    const handleSend = async () => {
        if (!inputText.trim() || sending || !currentUser) return;

        const text = inputText.trim();
        setInputText("");
        setSending(true);

        const tempId = `temp-${Date.now()}`;

        const optimisticMessage: DiscussionMessage = {
            _id: tempId,
            collectionType: type,
            topicId: id,
            text,

            authorId: currentUser._id,
            authorName: currentUser.displayName || "You",
            authorImageUrl: currentUser.profileImageUrl,

            createdAt: new Date().toISOString()
        };

        setMessages((prev) => [...prev, optimisticMessage]);

        try {
            const res =
                type === "event"
                    ? await eventService.postEventDiscussion(id, text)
                    : await gigService.postGigDiscussion(id, text);

            const created = res?.data ?? res;

            if (created?._id) {
                setMessages((prev) =>
                    prev.map((m) => (m._id === tempId ? created : m))
                );
            }
        } catch (err) {
            console.error("Failed to post discussion message:", err);
            setMessages((prev) => prev.filter((m) => m._id !== tempId));
            setInputText(text);
        } finally {
            setSending(false);
        }
    };

    /* ---------- Author profile route ---------- */
    const openAuthorProfile = (authorId?: string) => {
        if (!authorId) return;
        router.push(`/(app)/profile/${authorId}` as any);
    };

    /* ---------- Pin / unpin ---------- */
    // Owner-only on gigs. Event discussions don't expose this surface.
    const handleTogglePin = async (msg: DiscussionMessage) => {
        if (type !== 'gig' || !isOwner) return;
        setOpenMenuId(null);

        // Optimistic flip — server enforces the cap of 3 and may unpin the
        // oldest. The socket event will reconcile state for us when that
        // happens.
        const willPin = !msg.isPinned;
        setMessages((prev) =>
            prev.map((m) =>
                m._id === msg._id
                    ? { ...m, isPinned: willPin, pinnedAt: willPin ? new Date().toISOString() : undefined }
                    : m
            )
        );

        try {
            await gigService.togglePinGigComment(id, msg._id);
        } catch (err) {
            console.error('Failed to toggle pin:', err);
            // Revert
            setMessages((prev) =>
                prev.map((m) =>
                    m._id === msg._id ? { ...m, isPinned: !willPin } : m
                )
            );
            Alert.alert('Pin failed', 'Could not update pin. Try again.');
        }
    };

    /* ---------- Delete ---------- */
    const handleDelete = (msg: DiscussionMessage) => {
        if (type !== 'gig') return;
        setOpenMenuId(null);

        Alert.alert(
            'Delete comment?',
            'This comment will be replaced with "[deleted]". The thread will keep its order.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        // Optimistic — flip locally first
                        const isAuthor = String(msg.authorId) === String(currentUser?._id);
                        const reason: 'self' | 'organizer' | 'admin' = isAuthor
                            ? 'self'
                            : isOwner ? 'organizer' : 'admin';
                        setMessages((prev) =>
                            prev.map((m) =>
                                m._id === msg._id
                                    ? {
                                        ...m,
                                        isDeleted: true,
                                        deletedReason: reason,
                                        text: '[deleted]',
                                        isPinned: false,
                                    }
                                    : m
                            )
                        );

                        try {
                            await gigService.deleteGigComment(id, msg._id);
                        } catch (err) {
                            console.error('Failed to delete comment:', err);
                            // Revert — refetch is the simplest safe path
                            try {
                                const res = await gigService.getGigDiscussion(id);
                                const data = res?.data ?? res;
                                if (Array.isArray(data)) setMessages(data);
                            } catch {
                                // give up; user can pull-to-refresh upstream
                            }
                            Alert.alert('Delete failed', 'Could not delete comment. Try again.');
                        }
                    },
                },
            ]
        );
    };

    /* ---------- Sorted view ---------- */
    const sorted = useMemo(() => [...messages].sort(sortMessages), [messages]);

    /* ================= UI ================= */

    return (
        <View
            style={{
                // Plan 5 v2 — `inline` strips ALL card chrome so the thread
                // sits flat on the parent page background. Default keeps
                // the standalone card look (used on Event detail).
                backgroundColor: inline ? 'transparent' : '#15131C',
                borderRadius: inline ? 0 : 16,
                paddingHorizontal: inline ? 0 : 20,
                paddingVertical: inline ? 16 : 20,
                marginTop: inline ? 0 : 24,
                borderWidth: inline ? 0 : 1,
                borderColor: inline ? 'transparent' : 'rgba(255,255,255,0.06)',
                // Required so the absolute backdrop below stays inside the
                // section. Without this the backdrop would clip oddly on Android.
                position: 'relative',
            }}
        >
            {/* Backdrop — appears whenever a row dropdown is open. Catches
                taps anywhere on the card and closes the menu. zIndex 15 sits
                above rows (default 0) but below the dropdown itself
                (zIndex 20), so dropdown buttons keep working. */}
            {openMenuId && (
                <Pressable
                    onPress={() => setOpenMenuId(null)}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 15,
                    }}
                    accessibilityElementsHidden
                />
            )}

            <Text
                style={{
                    color: '#F0ECE6',
                    fontFamily: 'Outfit-Bold',
                    fontSize: 16,
                    marginBottom: 16,
                }}
            >
                Discussion
            </Text>

            {loading ? (
                <ActivityIndicator color="#F0ECE6" />
            ) : (
                <View style={{ marginBottom: 20 }}>
                    {sorted.length === 0 ? (
                        <Text
                            style={{
                                color: '#6B6878',
                                fontStyle: 'italic',
                                textAlign: 'center',
                                paddingVertical: 16,
                                fontSize: 13,
                            }}
                        >
                            No comments yet. Be the first!
                        </Text>
                    ) : (
                        sorted.map((msg, idx) => {
                            const isAuthor = String(msg.authorId) === String(currentUser?._id);
                            // Permission gates for moderation actions.
                            // Pin: owner only (gig type only). Delete: author
                            // OR owner OR admin (gig type only). Event
                            // discussions don't expose moderation in this
                            // pass — backend not wired yet for events.
                            const canPin = type === 'gig' && isOwner && !msg.isDeleted;
                            const canDelete = type === 'gig' && (isAuthor || isOwner || isAdmin) && !msg.isDeleted;
                            const showMenuButton = canPin || canDelete;

                            return (
                                <View
                                    key={msg._id}
                                    style={{
                                        paddingTop: idx === 0 ? 0 : 12,
                                        paddingBottom: 12,
                                        borderBottomWidth: idx === sorted.length - 1 ? 0 : 1,
                                        borderBottomColor: 'rgba(255,255,255,0.04)',
                                        // Apr 30: relative anchor for the
                                        // absolute-positioned dropdown.
                                        position: 'relative',
                                    }}
                                >
                                    {/* Pin badge — sits above the row content
                                        when pinned. Subtle so it doesn't
                                        compete with the body text. */}
                                    {msg.isPinned && !msg.isDeleted && (
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 4,
                                                marginBottom: 6,
                                                marginLeft: 44,
                                            }}
                                        >
                                            <Pin size={11} color="#EAB308" fill="#EAB308" />
                                            <Text
                                                style={{
                                                    color: '#EAB308',
                                                    fontSize: 10,
                                                    fontFamily: 'Outfit-SemiBold',
                                                    letterSpacing: 0.5,
                                                    textTransform: 'uppercase',
                                                }}
                                            >
                                                Pinned by organizer
                                            </Text>
                                        </View>
                                    )}

                                    <Pressable
                                        onLongPress={() => {
                                            if (showMenuButton) setOpenMenuId(msg._id);
                                        }}
                                        delayLongPress={400}
                                        accessibilityLabel={`comment-${msg._id}`}
                                    >
                                        <View style={{ flexDirection: 'row', gap: 12 }}>
                                            <TouchableOpacity
                                                onPress={() => openAuthorProfile(msg.authorId)}
                                                accessibilityRole="button"
                                                accessibilityLabel={`Open profile for ${msg.authorName}`}
                                            >
                                                <Image
                                                    source={{
                                                        uri:
                                                            msg.authorImageUrl ||
                                                            'https://i.pravatar.cc/150?img=12',
                                                    }}
                                                    style={{
                                                        width: 32,
                                                        height: 32,
                                                        borderRadius: 16,
                                                        backgroundColor: '#2A2730',
                                                        opacity: msg.isDeleted ? 0.4 : 1,
                                                    }}
                                                />
                                            </TouchableOpacity>
                                            <View style={{ flex: 1 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                                                    <TouchableOpacity
                                                        onPress={() => openAuthorProfile(msg.authorId)}
                                                        accessibilityRole="button"
                                                        accessibilityLabel={`Open profile for ${msg.authorName}`}
                                                        disabled={msg.isDeleted}
                                                    >
                                                        <Text
                                                            style={{
                                                                color: msg.isDeleted ? '#6B6878' : '#F0ECE6',
                                                                fontFamily: 'Outfit-SemiBold',
                                                                fontSize: 13,
                                                            }}
                                                        >
                                                            {msg.isDeleted ? '—' : msg.authorName}
                                                        </Text>
                                                    </TouchableOpacity>
                                                    <Text
                                                        style={{
                                                            color: '#6B6878',
                                                            fontSize: 11,
                                                        }}
                                                    >
                                                        {new Date(msg.createdAt).toLocaleDateString()}
                                                    </Text>
                                                </View>
                                                {msg.isDeleted ? (
                                                    <Text
                                                        style={{
                                                            color: '#6B6878',
                                                            fontStyle: 'italic',
                                                            fontSize: 12,
                                                            marginTop: 4,
                                                        }}
                                                    >
                                                        {deletedLabel(msg.deletedReason)}
                                                    </Text>
                                                ) : (
                                                    <Text
                                                        style={{
                                                            color: '#D5D0C8',
                                                            fontSize: 13,
                                                            lineHeight: 19,
                                                            marginTop: 2,
                                                        }}
                                                    >
                                                        {msg.text}
                                                    </Text>
                                                )}
                                            </View>

                                            {/* 3-dot trigger. Hidden when the
                                                user has no actions for this
                                                row to keep visual noise low. */}
                                            {showMenuButton && (
                                                <TouchableOpacity
                                                    onPress={() =>
                                                        setOpenMenuId(openMenuId === msg._id ? null : msg._id)
                                                    }
                                                    accessibilityRole="button"
                                                    accessibilityLabel={`Comment options for ${msg.authorName}`}
                                                    hitSlop={8}
                                                    style={{ padding: 4 }}
                                                >
                                                    <MoreVertical size={16} color="#6B6878" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </Pressable>

                                    {/* Apr 30 redesign — dropdown now absolute,
                                        small, anchored to the 3-dot icon. The
                                        backdrop (full-card transparent
                                        Pressable rendered once at the bottom
                                        of this map) catches outside taps and
                                        closes the menu without taking the
                                        thread layout offline. */}
                                    {openMenuId === msg._id && (
                                        <View
                                            style={{
                                                position: 'absolute',
                                                top: 28,
                                                right: 0,
                                                width: 150,
                                                backgroundColor: '#1A1820',
                                                borderRadius: 10,
                                                borderWidth: 1,
                                                borderColor: 'rgba(255,255,255,0.08)',
                                                overflow: 'hidden',
                                                zIndex: 20,
                                                // RN Android needs elevation in addition
                                                // to zIndex to lift overlapping siblings.
                                                elevation: 8,
                                                shadowColor: '#000',
                                                shadowOpacity: 0.4,
                                                shadowRadius: 12,
                                                shadowOffset: { width: 0, height: 4 },
                                            }}
                                        >
                                            {canPin && (
                                                <TouchableOpacity
                                                    onPress={() => handleTogglePin(msg)}
                                                    style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                        paddingHorizontal: 12,
                                                        paddingVertical: 10,
                                                        borderBottomWidth: canDelete ? 1 : 0,
                                                        borderBottomColor: 'rgba(255,255,255,0.05)',
                                                    }}
                                                    accessibilityRole="button"
                                                    accessibilityLabel={msg.isPinned ? 'Unpin comment' : 'Pin comment'}
                                                >
                                                    <Pin
                                                        size={13}
                                                        color={msg.isPinned ? '#EAB308' : '#D5D0C8'}
                                                        fill={msg.isPinned ? '#EAB308' : 'none'}
                                                    />
                                                    <Text style={{ color: '#F0ECE6', fontSize: 12, fontFamily: 'Outfit-Medium' }}>
                                                        {msg.isPinned ? 'Unpin' : 'Pin (max 3)'}
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                            {canDelete && (
                                                <TouchableOpacity
                                                    onPress={() => handleDelete(msg)}
                                                    style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                        paddingHorizontal: 12,
                                                        paddingVertical: 10,
                                                    }}
                                                    accessibilityRole="button"
                                                    accessibilityLabel="Delete comment"
                                                >
                                                    <Trash2 size={13} color="#EF4444" />
                                                    <Text style={{ color: '#EF4444', fontSize: 12, fontFamily: 'Outfit-Medium' }}>
                                                        {isAuthor ? 'Delete' : 'Remove'}
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    )}
                                </View>
                            );
                        })
                    )}
                </View>
            )}

            {/* Input */}
            <View
                style={{
                    flexDirection: 'row',
                    gap: 8,
                    alignItems: 'center',
                    backgroundColor: 'rgba(0,0,0,0.25)',
                    padding: 8,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.06)',
                }}
            >
                <TextInput
                    style={{
                        flex: 1,
                        color: '#F0ECE6',
                        padding: 8,
                        minHeight: 40,
                        outlineStyle: 'none',
                        fontSize: 14,
                    } as any}
                    placeholder="Add to the discussion..."
                    placeholderTextColor="#6B6878"
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                    onFocus={() => setOpenMenuId(null)}
                />
                <TouchableOpacity
                    onPress={handleSend}
                    disabled={!inputText.trim() || sending}
                    style={{
                        padding: 8,
                        borderRadius: 999,
                        backgroundColor: !inputText.trim() ? '#2A2730' : '#F97316',
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Post comment"
                >
                    {sending ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Send
                            size={18}
                            color={!inputText.trim() ? '#6B6878' : 'white'}
                        />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}
