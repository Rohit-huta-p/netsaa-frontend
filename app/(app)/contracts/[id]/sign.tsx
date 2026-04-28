// CONTRACTS-DISABLED: contract sign-page route stubbed.
// Restore original from git history. Last live revision: `fcac626` on develop.
import React from 'react';
import { Redirect } from 'expo-router';

export default function ContractSignScreen() {
    return <Redirect href="/(app)/dashboard" />;
}
