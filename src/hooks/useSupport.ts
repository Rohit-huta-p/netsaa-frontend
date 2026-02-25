import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import supportService from '../services/supportService';
import type {
    SupportTicket,
    SupportMessage,
    HelpArticle,
    CreateTicketPayload,
    SendMessagePayload,
} from '../types/support';

// ─── Query Key Factory ───

export const supportKeys = {
    all: ['support'] as const,

    // Tickets
    tickets: () => [...supportKeys.all, 'tickets'] as const,
    myTickets: (page?: number) => [...supportKeys.tickets(), 'me', page] as const,
    ticket: (id: string) => [...supportKeys.tickets(), id] as const,

    // Messages
    messages: (ticketId: string) => [...supportKeys.all, 'messages', ticketId] as const,

    // Articles
    articles: () => [...supportKeys.all, 'articles'] as const,
    articleSearch: (q?: string, tab?: string, category?: string, page?: number) =>
        [...supportKeys.articles(), { q, tab, category, page }] as const,
    article: (slug: string) => [...supportKeys.articles(), slug] as const,
};

// ═══════════════════════════════════════════════════════════
// TICKET QUERIES
// ═══════════════════════════════════════════════════════════

export const useMyTickets = (page = 1) => {
    return useQuery({
        queryKey: supportKeys.myTickets(page),
        queryFn: () => supportService.getMyTickets({ page, limit: 20 }).then((r) => r.data),
    });
};

export const useTicket = (id: string) => {
    return useQuery({
        queryKey: supportKeys.ticket(id),
        queryFn: () => supportService.getTicketById(id).then((r) => r.data),
        enabled: !!id,
    });
};

export const useCreateTicket = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateTicketPayload) =>
            supportService.createTicket(payload).then((r) => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: supportKeys.tickets() });
        },
    });
};

// ═══════════════════════════════════════════════════════════
// MESSAGE QUERIES (with optimistic updates)
// ═══════════════════════════════════════════════════════════

export const useMessages = (ticketId: string) => {
    return useQuery({
        queryKey: supportKeys.messages(ticketId),
        queryFn: () => supportService.getMessages(ticketId, { limit: 100 }).then((r) => r.data),
        enabled: !!ticketId,
        refetchInterval: 15000, // Poll every 15s for new messages
    });
};

export const useSendMessage = (ticketId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: SendMessagePayload) =>
            supportService.sendMessage(ticketId, payload).then((r) => r.data),

        // ─── Optimistic Update ───
        onMutate: async (newMessage) => {
            await queryClient.cancelQueries({ queryKey: supportKeys.messages(ticketId) });

            const previousMessages = queryClient.getQueryData<SupportMessage[]>(
                supportKeys.messages(ticketId)
            );

            const optimistic: SupportMessage = {
                _id: `temp-${Date.now()}`,
                ticketId,
                senderType: 'user',
                senderId: 'me',
                message: newMessage.message,
                attachments: newMessage.attachments || [],
                createdAt: new Date().toISOString(),
            };

            queryClient.setQueryData<SupportMessage[]>(
                supportKeys.messages(ticketId),
                (old) => [...(old || []), optimistic]
            );

            return { previousMessages };
        },

        onError: (_err, _variables, context) => {
            // Rollback on error
            if (context?.previousMessages) {
                queryClient.setQueryData(
                    supportKeys.messages(ticketId),
                    context.previousMessages
                );
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: supportKeys.messages(ticketId) });
        },
    });
};

// ═══════════════════════════════════════════════════════════
// ARTICLE QUERIES
// ═══════════════════════════════════════════════════════════

export const useArticleSearch = (params: {
    q?: string;
    tab?: string;
    category?: string;
    page?: number;
}) => {
    return useQuery({
        queryKey: supportKeys.articleSearch(params.q, params.tab, params.category, params.page),
        queryFn: () =>
            supportService
                .searchArticles({ ...params, limit: 10 })
                .then((r) => r.data),
        placeholderData: (prev) => prev,
    });
};

export const useArticle = (slug: string) => {
    return useQuery({
        queryKey: supportKeys.article(slug),
        queryFn: () => supportService.getArticleBySlug(slug).then((r) => r.data),
        enabled: !!slug,
    });
};
