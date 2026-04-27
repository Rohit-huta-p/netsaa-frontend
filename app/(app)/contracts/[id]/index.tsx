// app/(app)/contracts/[id]/index.tsx
import React from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import { ContractWorkspace } from '@/features/contract-workspace/ContractWorkspace';

export default function ContractDetailScreen() {
    const { id } = useLocalSearchParams<{ id?: string | string[] }>();
    const contractId = Array.isArray(id) ? id[0] : id;
    if (!contractId) return null;
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <ContractWorkspace contractId={contractId} />
        </>
    );
}
