/**
 * useChooseProposal — shared Choose-flow hook used by both
 * client/[id].tsx (proposal detail) and client/[id]/compare.tsx (compare columns).
 *
 * Steps:
 *  1. requirementService.patchProposal(proposalId, 'accept')
 *  2. conversationService.createConversation(leadId, context, seedText)
 *  3. queryClient.invalidateQueries(['client','requirements'])
 *  4. router.replace('/(app)/inbox?c=<conversationId>')
 *
 * Double-submit guarded via `busy` state.
 * Errors surface as a string (the caller renders inline).
 */
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { requirementService } from '@/services/requirementService';
import conversationService from '@/services/conversationService';

export interface ChooseProposalOptions {
    requirementId: string;
    occasionText?: string;
    /** Called on success before navigation (optional, e.g. to dismiss a sheet) */
    onSuccess?: () => void;
}

export interface ChooseProposalResult {
    choose: (proposalId: string, leadId: string, leadName: string) => Promise<void>;
    busy: boolean;
    error: string;
    clearError: () => void;
}

export function useChooseProposal({
    requirementId,
    occasionText,
    onSuccess,
}: ChooseProposalOptions): ChooseProposalResult {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const choose = async (proposalId: string, leadId: string, leadName: string) => {
        if (busy) return;
        setBusy(true);
        setError('');
        try {
            // Step 1: accept the proposal.
            // Wrap with retry-tolerance: if a previous attempt succeeded but step 2
            // (createConversation) failed, the proposal is already 'accepted' and the
            // server will 400. Swallow only that specific transition rejection so the
            // user can safely press Choose again — createConversation is idempotent
            // (server get-or-create on participants).
            try {
                await requirementService.patchProposal(proposalId, 'accept');
            } catch (e: any) {
                const status = e?.response?.status;
                const msg = e?.response?.data?.meta?.message || '';
                // A retry after a failed step 2: the proposal is already accepted. Proceed —
                // createConversation is idempotent (server get-or-create). Only swallow the
                // "already accepted" transition rejection, not other errors.
                const alreadyAccepted = status === 400 && /accept/i.test(msg);
                if (!alreadyAccepted) throw e;
            }

            // Step 2: create (or get) the anchored conversation
            const seedText = `You chose ${leadName}'s proposal · arrange the details`;
            const context = {
                requirementId,
                proposalId,
                label: occasionText ?? 'Booking',
            };
            const conv = await conversationService.createConversation(leadId, context, seedText);

            // Step 3: invalidate so home/detail re-render with updated status
            await queryClient.invalidateQueries({ queryKey: ['client', 'requirements'] });
            await queryClient.invalidateQueries({ queryKey: ['client', 'requirement', requirementId] });

            onSuccess?.();

            // Step 4: navigate into the chat thread
            const convId = conv?._id;
            if (convId) {
                router.replace((`/(app)/inbox?c=${convId}`) as any);
            } else {
                router.replace('/(app)/inbox' as any);
            }
        } catch (e: any) {
            const msg =
                e?.response?.data?.meta?.message ||
                e?.response?.data?.message ||
                'Something went wrong. Please try again.';
            setError(msg);
        } finally {
            setBusy(false);
        }
    };

    return { choose, busy, error, clearError: () => setError('') };
}
