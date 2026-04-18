import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contractService, transactionService, type ContractPaymentMethod, type SignContractPayload } from '../services/paymentService';

// ── Contract Hooks ──

export function useUserContracts(params?: { status?: string; page?: number }) {
    return useQuery({
        queryKey: ['contracts', 'me', params],
        queryFn: () => contractService.getUserContracts(params),
    });
}

export function useContract(id: string) {
    return useQuery({
        queryKey: ['contracts', id],
        queryFn: () => contractService.get(id),
        enabled: !!id,
    });
}

export function useCreateContract() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: contractService.create,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts'] }),
    });
}

export function useSignContract() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data?: SignContractPayload }) =>
            contractService.sign(id, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts'] }),
    });
}

export function useDeclineContract() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => contractService.decline(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts'] }),
    });
}

export function useSwitchContractPaymentMethod() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, paymentMethod }: { id: string; paymentMethod: ContractPaymentMethod }) =>
            contractService.switchPaymentMethod(id, paymentMethod),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts'] }),
    });
}

// ── Transaction Hooks ──

export function useUserTransactions(params?: { type?: string; status?: string; page?: number }) {
    return useQuery({
        queryKey: ['transactions', 'me', params],
        queryFn: () => transactionService.getUserTransactions(params),
    });
}

export function useTransaction(id: string) {
    return useQuery({
        queryKey: ['transactions', id],
        queryFn: () => transactionService.get(id),
        enabled: !!id,
    });
}

export function useInitiatePayment() {
    return useMutation({
        mutationFn: transactionService.initiate,
    });
}

export function useConfirmPayment() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: transactionService.confirm,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['transactions'] });
            qc.invalidateQueries({ queryKey: ['contracts'] });
        },
    });
}

export function useRecordOfflinePayment() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: transactionService.recordOffline,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
    });
}

export function useConfirmOfflinePayment() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => transactionService.confirmOffline(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
    });
}
