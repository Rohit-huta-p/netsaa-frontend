// CONTRACTS-DISABLED: Booking Terms editor route stubbed.
// Master template editor is hidden until the contract artifact is restored.
// Hirer-authored terms now live on Page 4 (Logistics) of the GigForm via
// the simple termsAndConditions textarea + TermsTemplates chip row.
// Restore original from git history. Last live revision: `fcac626` on develop.
import React from 'react';
import { useLocalSearchParams, Redirect } from 'expo-router';

export default function BookingTermsScreen() {
    const params = useLocalSearchParams<{ id?: string | string[] }>();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    // Edit lives on the shared /create route in edit mode (?gigId=...).
    return <Redirect href={id ? `/(app)/create?gigId=${id}` : '/(app)/dashboard'} />;
}
