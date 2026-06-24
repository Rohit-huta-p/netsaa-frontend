import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useUser } from '@/hooks/useUser';
import { ProfileScreen } from '@/features/profile/ProfileScreen';
import {
    ClientPublicProfile,
    type ClientPublicData,
} from '@/features/profile/ClientPublicProfile';
import { PerformerProfile } from '@/features/profile/PerformerProfile';

export default function UserProfile() {
    const { user } = useAuthStore();
    const viewerRole = useAuthStore((s) => s.role);
    const { id: paramId, gigId, applicationId, fromGig } = useLocalSearchParams<{
        id: string;
        gigId?: string;
        applicationId?: string;
        fromGig?: string;
    }>();

    const resolvedId = Array.isArray(paramId) ? paramId[0] : paramId;
    const isOwner = resolvedId === user?._id;

    // Always fetch the target by id — shared React Query cache key with
    // ProfileScreen's own useUser, so non-client targets cost no extra request.
    // For a `role:'client'` target the response is the bare, already-tiered DTO
    // (no email/phone). We use it for owner AND non-owner, so an agency viewing
    // its OWN public profile sees the same rich showcase everyone else sees.
    const { data: fetched, isLoading } = useUser(resolvedId);

    const targetRole = (fetched as any)?.role ?? viewerRole;
    const viewerIsClientOrCL = viewerRole === 'client' || viewerRole === 'creative_lead';

    // Spinner until the fetch resolves, so we don't flash the artist ProfileScreen
    // before discovering the target is a client.
    if (isLoading && !fetched) {
        return (
            <View style={{ flex: 1, backgroundColor: '#09090b', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#FF6B35" />
            </View>
        );
    }

    // Client target → tiered public client profile (lean vs agency inside).
    if (targetRole === 'client' && fetched) {
        return (
            <ClientPublicProfile
                data={fetched as unknown as ClientPublicData}
                viewerIsClientOrCL={viewerIsClientOrCL}
            />
        );
    }

    // Client viewing a performer (artist / Creative Lead / organizer) → the
    // mockup-matched performer profile. Leaves the shared ProfileScreen for
    // self-view, peer views, and the gig-hiring flow.
    if (
        viewerRole === 'client' &&
        !isOwner &&
        (targetRole === 'artist' || targetRole === 'creative_lead' || targetRole === 'organizer')
    ) {
        return <PerformerProfile userId={resolvedId || ''} />;
    }

    // Everything else (artist / creative_lead / organizer) → unchanged path.
    return (
        <ProfileScreen
            userId={resolvedId || ''}
            isOwner={isOwner}
            gigContext={{ gigId, applicationId, fromGig }}
        />
    );
}
