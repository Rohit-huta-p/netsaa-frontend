// CONTRACTS-DISABLED: contracts list route stubbed.
// Contracts UI is rolled back; this route now redirects to the dashboard.
// To re-enable, restore the original implementation from git history
// (last live revision: commit `fcac626` on develop).
import React from 'react';
import { Redirect } from 'expo-router';

export default function ContractsListScreen() {
    return <Redirect href="/(app)/dashboard" />;
}
