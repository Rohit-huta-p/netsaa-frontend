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
}

import { Conversation } from "./chat";

export interface Connection {
    _id: string;
    requesterId: { _id: string, displayName: string, firstfirstNameName: string, email: string, role: string, artistType: string, profileImageUrl?: string };
    recipientId: { _id: string, displayName: string, emfirstNameail: string, role: string, artistType: string, profileImageUrl?: string };
    createdAt: string;
    conversation?: string | Conversation;
}


