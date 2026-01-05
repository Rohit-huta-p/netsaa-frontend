export interface ConnectionRequest {
    _id: string;
    requesterId: {
        _id: string;
        displayName: string;
        email: string;
        role: string;
        profilePicture?: string;
    };
    message?: string;
    mutuals?: number;
}

import { Conversation } from "./chat";

export interface Connection {
    _id: string;
    requesterId: { _id: string, displayName: string, email: string, role: string, profilePicture?: string };
    recipientId: { _id: string, displayName: string, email: string, role: string, profilePicture?: string };
    createdAt: string;
    conversation?: string | Conversation;
}


