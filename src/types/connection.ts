export interface ConnectionRequest {
    _id: string;
    requesterId: {
        _id: string;
        displayName: string;
        firstName: string,
        email: string;
        role: string;
        artistType: string;
        profileImageUrl?: string;
    };
    message?: string;
    mutuals?: number;
    createdAt?: string;
}

import { Conversation } from "./chat";

export type ConnectionContext = 'worked_together' | 'met_at_event' | 'mutual_introduction' | 'know_outside' | 'admire_work';

export interface Connection {
    _id: string;
    requesterId: { _id: string; displayName: string; firstName: string; email: string; role: string; artistType: string; profileImageUrl?: string };
    recipientId: { _id: string; displayName: string; firstName: string; email: string; role: string; artistType: string; profileImageUrl?: string };
    status: 'pending' | 'accepted' | 'rejected' | 'blocked';
    message?: string;
    context?: ConnectionContext;
    createdAt: string;
    conversation?: string | Conversation;
}


