import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    ActivityIndicator
} from "react-native";
import { Send } from "lucide-react-native";

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

    createdAt: string;
    updatedAt?: string;
}

interface DiscussionTabProps {
    id: string;
    type: 'event' | 'gig';
}

/* ================= COMPONENT ================= */

export default function DiscussionTab({ id, type }: DiscussionTabProps) {
    const [messages, setMessages] = useState<DiscussionMessage[]>([]);
    const [inputText, setInputText] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const currentUser = useAuthStore((state) => state.user);

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

        const unsubscribe = socketService.onDiscussionNew(
            (newMessage: DiscussionMessage) => {
                setMessages((prev) => {
                    if (prev.some((m) => m._id === newMessage._id)) return prev;
                    return [...prev, newMessage];
                });
            }
        );

        return () => {
            socketService.leaveDiscussion({ type, topicId: id });
            unsubscribe();
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

    /* ================= UI ================= */

    return (
        <View className="bg-netsa-card rounded-2xl p-6 mt-6 border border-white/10">
            <Text className="text-white font-satoshi-bold text-lg mb-4">
                Discussion
            </Text>

            {loading ? (
                <ActivityIndicator color="white" />
            ) : (
                <View className="space-y-4 mb-6">
                    {messages.length === 0 ? (
                        <Text className="text-netsa-text-muted italic text-center py-4">
                            No comments yet. Be the first!
                        </Text>
                    ) : (
                        messages.map((msg) => (
                            <View key={msg._id} className="flex-row gap-3">
                                <Image
                                    source={{
                                        uri:
                                            msg.authorImageUrl ||
                                            "https://i.pravatar.cc/150?img=12"
                                    }}
                                    className="w-8 h-8 rounded-full bg-gray-700"
                                />
                                <View className="flex-1">
                                    <View className="flex-row items-baseline gap-2">
                                        <Text className="text-white font-satoshi-bold text-sm">
                                            {msg.authorName}
                                        </Text>
                                        <Text className="text-xs text-netsa-text-muted">
                                            {new Date(msg.createdAt).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <Text className="text-netsa-text-secondary font-inter text-sm mt-0.5">
                                        {msg.text}
                                    </Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            )}

            {/* Input */}
            <View className="flex-row gap-2 items-center bg-black/20 p-2 rounded-xl border border-white/5">
                <TextInput
                    className="flex-1 text-white font-inter p-2 min-h-[40px] outline-none"
                    placeholder="Add to the discussion..."
                    placeholderTextColor="#666"
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                />
                <TouchableOpacity
                    onPress={handleSend}
                    disabled={!inputText.trim() || sending}
                    className={`p-2 rounded-full ${!inputText.trim()
                        ? "bg-gray-800"
                        : "bg-netsa-accent-purple"
                        }`}
                >
                    {sending ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Send
                            size={18}
                            color={!inputText.trim() ? "#999" : "white"}
                        />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}
