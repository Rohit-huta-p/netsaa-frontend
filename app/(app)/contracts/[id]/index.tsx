// CONTRACTS-DISABLED: ContractWorkspace route stubbed.
// Restore original (thin shell mounting <ContractWorkspace />) from git
// history. Last live revision: commit `fcac626` on develop.
import React from 'react';
import { Redirect } from 'expo-router';

export default function ContractDetailScreen() {
    return <Redirect href="/(app)/dashboard" />;
}
