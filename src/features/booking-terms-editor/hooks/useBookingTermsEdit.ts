// src/features/booking-terms-editor/hooks/useBookingTermsEdit.ts
//
// Local form state + dirty tracking + save wrapper.
// Save composes a partial Gig payload from dirty fields only.

import { useState, useCallback, useMemo } from 'react';
import { useUpdateGig } from '@/hooks/useGigs';

type PaymentStructure = 'full' | 'advance_balance';
type CancellationPolicy = '24h' | '48h' | '72h';

type Initial = {
    paymentStructure?: PaymentStructure;
    cancellationPolicy?: CancellationPolicy;
    negotiable?: boolean;
};

export function useBookingTermsEdit(gigId: string, initial: Initial) {
    const [paymentStructure, setPaymentStructure] = useState<PaymentStructure>(initial.paymentStructure ?? 'full');
    const [cancellationPolicy, setCancellationPolicy] = useState<CancellationPolicy>(initial.cancellationPolicy ?? '48h');
    const [negotiable, setNegotiable] = useState<boolean>(initial.negotiable ?? false);

    const updateMutation = useUpdateGig();

    const dirtyFields = useMemo(() => {
        const dirty: any = {};
        if (paymentStructure !== (initial.paymentStructure ?? 'full')) dirty.paymentStructure = paymentStructure;
        if (cancellationPolicy !== (initial.cancellationPolicy ?? '48h')) dirty.cancellationPolicy = cancellationPolicy;
        if (negotiable !== (initial.negotiable ?? false)) {
            dirty.compensation = { negotiable };
        }
        return dirty;
    }, [paymentStructure, cancellationPolicy, negotiable, initial]);

    const isDirty = Object.keys(dirtyFields).length > 0;

    const save = useCallback(async () => {
        if (!isDirty) return null;
        return updateMutation.mutateAsync({ id: gigId, payload: dirtyFields });
    }, [isDirty, dirtyFields, gigId, updateMutation]);

    return {
        paymentStructure, setPaymentStructure,
        cancellationPolicy, setCancellationPolicy,
        negotiable, setNegotiable,
        isDirty,
        isSaving: updateMutation.isPending,
        saveError: updateMutation.error as Error | null,
        save,
    };
}
