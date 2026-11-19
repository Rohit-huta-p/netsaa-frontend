// src/features/hirer-hub/hooks/useGigApplicantActions.ts
//
// The applicant-action controller for the owner hub, shared by HirerGigHub and
// the "See all" screen (GigApplicantsAllScreen) so the subtle bits — the
// swipeable profile modal, close-then-confirm Hire/Remove, reversible Pass +
// "just viewed" pulse — live in ONE place and can't diverge between the two.
//
// Owns the modal/sheet targets + the status mutations; the screens render the
// shared <GigApplicantActionModals> bound to this state and wire their own
// list into `openProfileModal` (the hub uses its active stage list, the See-all
// screen uses its paginated stage list).

import { useCallback, useEffect, useState } from 'react';
import { Share } from 'react-native';
import { useRouter } from 'expo-router';
import { useUpdateApplicationStatus } from '@/hooks/useGigApplications';
import type { ContactTarget } from '@/features/team/ContactActionSheet';

export type ProfileModalState = { applications: any[]; index: number } | null;

export function useGigApplicantActions(gigId: string, gig: any, data: any) {
    const router = useRouter();
    const updateStatusMutation = useUpdateApplicationStatus();

    // FROZEN at open (a snapshot of the caller's stage list) so Pass/Shortlist
    // mutations can't reindex the pager or drift the "N / total" counter.
    const [profileModal, setProfileModal] = useState<ProfileModalState>(null);
    // The just-viewed applicant — its list card pulses twice after close.
    const [pulseId, setPulseId] = useState<string | null>(null);
    const [hireTarget, setHireTarget] = useState<any | null>(null);
    const [contactTarget, setContactTarget] = useState<ContactTarget | null>(null);
    const [removeTarget, setRemoveTarget] = useState<any | null>(null);

    useEffect(() => {
        if (!pulseId) return;
        const t = setTimeout(() => setPulseId(null), 1800);
        return () => clearTimeout(t);
    }, [pulseId]);

    const findApplication = useCallback((applicationId: string) =>
        data.pendingApplicants?.find((a: any) => a._id === applicationId)
        ?? data.applications?.find((a: any) => a._id === applicationId)
        ?? null,
    [data.pendingApplicants, data.applications]);

    const handleQuickHire = useCallback((applicationId: string) => {
        const app = findApplication(applicationId);
        if (app) setHireTarget(app);
    }, [findApplication]);

    const handleQuickReject = useCallback((applicationId: string) => {
        updateStatusMutation.mutate({ applicationId, status: 'rejected' });
    }, [updateStatusMutation]);

    // Undo a Pass — flip rejected -> applied (the section keeps the card on
    // screen meanwhile, so this just restores the server state).
    const handleUndoPass = useCallback((applicationId: string) => {
        updateStatusMutation.mutate({ applicationId, status: 'applied' });
    }, [updateStatusMutation]);

    const handleQuickShortlist = useCallback((applicationId: string) => {
        updateStatusMutation.mutate({ applicationId, status: 'shortlisted' });
    }, [updateStatusMutation]);

    // Message an applicant — reuse the team ContactActionSheet (the only DM
    // entry point today). artistId may be populated (object) or a raw id.
    const handleMessageApplicant = useCallback((applicationId: string) => {
        const app = findApplication(applicationId);
        if (!app) return;
        const artistId = typeof app.artistId === 'object' ? app.artistId?._id : app.artistId;
        setContactTarget({
            artistId: artistId ?? '',
            displayName: app.artistSnapshot?.displayName ?? 'Artist',
            phoneNumber: app.artistSnapshot?.phoneNumber,
            gigTitle: gig?.title,
        });
    }, [findApplication, gig?.title]);

    // Open the profile modal over a FROZEN list, positioned on `id`.
    const openProfileModal = useCallback((list: any[], applicationId: string) => {
        const index = list.findIndex((a: any) => a._id === applicationId);
        if (index >= 0) setProfileModal({ applications: list, index });
    }, []);

    // Close the modal; a viewedId pulses that card on the list behind it.
    const closeProfileModal = useCallback((viewedId?: string) => {
        setProfileModal(null);
        if (viewedId) setPulseId(viewedId);
    }, []);

    // The modal's "Open full profile" escape hatch / non-artist fallback.
    const openFullProfile = useCallback((artistId: string) => {
        setProfileModal(null);
        router.push(`/(app)/profile/${artistId}` as any);
    }, [router]);

    // Remove-hire is a reversible DEMOTE (hired -> shortlisted); the confirm
    // sheet spells out the cascade.
    const handleRemoveHire = useCallback((applicationId: string) => {
        const app = findApplication(applicationId);
        if (app) setRemoveTarget(app);
    }, [findApplication]);

    const confirmRemoveHire = useCallback((applicationId: string) => {
        updateStatusMutation.mutate({ applicationId, status: 'shortlisted' });
        setRemoveTarget(null);
    }, [updateStatusMutation]);

    const handleShareApplicant = useCallback(async (applicationId: string) => {
        const app = (data.applications as any[])?.find((a) => a._id === applicationId);
        const name = (app?.artistSnapshot?.displayName ?? '').trim() || 'This applicant';
        const message = `${name} applied to “${gig?.title}” on NETSA`;
        try { await Share.share({ message }); } catch { /* dismissed */ }
    }, [data.applications, gig?.title]);

    return {
        // state
        profileModal, pulseId, hireTarget, contactTarget, removeTarget,
        // setters / closers (for the modals component)
        setHireTarget, setContactTarget, setRemoveTarget, closeProfileModal,
        // handlers
        findApplication, openProfileModal, openFullProfile,
        handleQuickHire, handleQuickReject, handleUndoPass, handleQuickShortlist,
        handleMessageApplicant, handleShareApplicant, handleRemoveHire, confirmRemoveHire,
    };
}

export type GigApplicantActions = ReturnType<typeof useGigApplicantActions>;

export default useGigApplicantActions;
