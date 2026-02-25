// ─── Support Ticket Types ───

export type TicketCategory = 'payment' | 'gig' | 'event' | 'account' | 'safety' | 'technical';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketStatus = 'open' | 'in_review' | 'waiting_user' | 'resolved' | 'closed';
export type SenderType = 'user' | 'admin';
export type ArticleAudience = 'artist' | 'organizer' | 'all';
export type ArticleCategory = 'getting_started' | 'payments' | 'gigs' | 'events' | 'account' | 'safety' | 'technical';

export interface RelatedEntity {
    type: 'gig' | 'event' | 'conversation' | 'contract' | 'payment';
    entityId: string;
}

export interface SupportTicket {
    _id: string;
    userId: string;
    role: 'artist' | 'organizer';
    category: TicketCategory;
    subcategory?: string;
    relatedEntity?: RelatedEntity;
    priority: TicketPriority;
    status: TicketStatus;
    slaDeadline: string;
    slaBreached?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface SupportMessage {
    _id: string;
    ticketId: string;
    senderType: SenderType;
    senderId: string;
    message: string;
    attachments: MessageAttachment[];
    createdAt: string;
}

export interface MessageAttachment {
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
}

export interface HelpArticle {
    _id: string;
    title: string;
    slug: string;
    category: ArticleCategory;
    audience: ArticleAudience;
    content: string;
    excerpt?: string;
    tags: string[];
    relatedArticles: HelpArticle[];
    viewCount: number;
    updatedAt: string;
    finalScore?: number;
}

// ─── API Request / Response ───

export interface CreateTicketPayload {
    category: TicketCategory;
    subcategory?: string;
    priority?: TicketPriority;
    message: string;
    relatedEntity?: RelatedEntity;
}

export interface SendMessagePayload {
    message: string;
    attachments?: MessageAttachment[];
}

export interface UpdateStatusPayload {
    status: TicketStatus;
}

export interface ApiMeta {
    status: number;
    message: string;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface ApiResponse<T> {
    meta: ApiMeta;
    data: T;
}

// ─── SLA display helpers ───

export const PRIORITY_SLA_HOURS: Record<TicketPriority, number> = {
    low: 72,
    medium: 48,
    high: 24,
    critical: 4,
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
    open: 'Open',
    in_review: 'In Review',
    waiting_user: 'Waiting on You',
    resolved: 'Resolved',
    closed: 'Closed',
};

export const STATUS_COLORS: Record<TicketStatus, string> = {
    open: '#3B82F6',
    in_review: '#F59E0B',
    waiting_user: '#EF4444',
    resolved: '#10B981',
    closed: '#6B7280',
};

export const CATEGORY_ICONS: Record<TicketCategory, string> = {
    payment: '💳',
    gig: '🎵',
    event: '🎪',
    account: '👤',
    safety: '🛡️',
    technical: '🔧',
};

export const ARTICLE_CATEGORY_LABELS: Record<ArticleCategory, string> = {
    getting_started: 'Getting Started',
    payments: 'Payments',
    gigs: 'Gigs',
    events: 'Events',
    account: 'Account',
    safety: 'Safety',
    technical: 'Technical',
};
