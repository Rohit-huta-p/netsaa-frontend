export interface Conversation {
    _id: string;
    participants: string[];
    lastMessage?: string; // Text content of the last message
    lastMessageAt?: string; // ISO Date string
}

export interface Message {
    _id: string;
    conversationId: string;
    senderId: string;
    text: string;
    seenBy: string[];
    createdAt: string; // ISO Date string
    clientMessageId?: string; // For idempotency

    // Frontend-only fields
    optimistic?: boolean;
    failed?: boolean;
}
