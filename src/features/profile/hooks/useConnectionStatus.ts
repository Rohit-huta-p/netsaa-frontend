import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import connectionService from '@/services/connectionService';
import type { ConnectionContext } from '@/types/connection';
import { interpretConnectionError } from '@/utils/connectionErrors';

type ConnectionState = 'none' | 'pending' | 'connected' | 'following';

type UseConnectionStatusReturn = {
    connectionStatus: ConnectionState;
    isConnectionLoading: boolean;
    /** For 'none' — opens compose sheet. For 'pending'/'connected' — opens action menu dropdown. */
    handleConnect: () => void;
    /** Sends new request (called from compose sheet). */
    sendRequest: (message?: string, context?: ConnectionContext) => Promise<void>;
    /** Remove an accepted connection. */
    removeConnection: () => Promise<void>;
    /** Withdraw a pending outgoing request. */
    withdrawRequest: () => Promise<void>;
    /** Block user (keeps record, status=blocked). */
    blockUser: () => Promise<void>;
    showRequestSheet: boolean;
    setShowRequestSheet: (v: boolean) => void;
    showActionMenu: boolean;
    setShowActionMenu: (v: boolean) => void;
};

export const useConnectionStatus = (
    profileId: string | undefined,
    isOwner: boolean
): UseConnectionStatusReturn => {
    const { user } = useAuthStore();
    const [connectionStatus, setConnectionStatus] = useState<ConnectionState>('none');
    const [isConnectionLoading, setIsConnectionLoading] = useState(false);
    const [connectionId, setConnectionId] = useState<string | null>(null);
    const [showRequestSheet, setShowRequestSheet] = useState(false);
    const [showActionMenu, setShowActionMenu] = useState(false);

    useEffect(() => {
        if (isOwner || !profileId || !user) return;

        const checkStatus = async () => {
            try {
                const connections = await connectionService.getConnections();
                const existingConnection = connections.find(
                    (c: any) => c.requesterId?._id === profileId || c.recipientId?._id === profileId
                );
                if (existingConnection) {
                    setConnectionStatus('connected');
                    setConnectionId(existingConnection._id);
                    return;
                }

                const sentRequests = await connectionService.getSentConnectionRequests();
                const pendingRequest = sentRequests.find(
                    (r: any) => r.recipientId?._id === profileId || r.recipientId === profileId
                );
                if (pendingRequest) {
                    setConnectionStatus('pending');
                    setConnectionId(pendingRequest._id);
                }
            } catch (err) {
                console.error('[useConnectionStatus] Failed to check status:', err);
            }
        };

        checkStatus();
    }, [profileId, isOwner, user]);

    const handleConnect = useCallback(() => {
        if (!profileId) return;
        if (connectionStatus === 'none') {
            setShowRequestSheet(true);
        } else {
            // connected or pending — open action menu
            setShowActionMenu(true);
        }
    }, [profileId, connectionStatus]);

    const refreshStatus = useCallback(async () => {
        if (!profileId) return;
        try {
            const connections = await connectionService.getConnections();
            const existing = connections.find(
                (c: any) => c.requesterId?._id === profileId || c.recipientId?._id === profileId
            );
            if (existing) {
                setConnectionStatus('connected');
                setConnectionId(existing._id);
                return;
            }
            const sent = await connectionService.getSentConnectionRequests();
            const pending = sent.find(
                (r: any) => r.recipientId?._id === profileId || r.recipientId === profileId
            );
            if (pending) {
                setConnectionStatus('pending');
                setConnectionId(pending._id);
            }
        } catch (err) {
            console.error('[useConnectionStatus] Refresh failed:', err);
        }
    }, [profileId]);

    const sendRequest = useCallback(async (message?: string, context?: ConnectionContext) => {
        if (!profileId || isConnectionLoading) return;
        try {
            setIsConnectionLoading(true);
            const result = await connectionService.sendConnectionRequest(profileId, message, context);
            setConnectionStatus('pending');
            setConnectionId(result.data?._id || result._id || null);
            setShowRequestSheet(false);
        } catch (err: any) {
            const info = interpretConnectionError(err);

            // 'already exists' → swallow, refresh to sync state
            if (info.swallow) {
                await refreshStatus();
                setShowRequestSheet(false);
                return;
            }

            // Close the sheet so the alert isn't stacked over a modal on iOS
            setShowRequestSheet(false);
            Alert.alert(info.title, info.message);
            console.warn('[useConnectionStatus] sendRequest rejected:', err?.response?.data?.code || err?.message);
        } finally {
            setIsConnectionLoading(false);
        }
    }, [profileId, isConnectionLoading, refreshStatus]);

    const removeConnection = useCallback(async () => {
        if (!connectionId || isConnectionLoading) return;
        try {
            setIsConnectionLoading(true);
            await connectionService.removeConnection(connectionId);
            setConnectionStatus('none');
            setConnectionId(null);
            setShowActionMenu(false);
        } catch (err) {
            console.error('[useConnectionStatus] Failed to remove:', err);
            throw err;
        } finally {
            setIsConnectionLoading(false);
        }
    }, [connectionId, isConnectionLoading]);

    const withdrawRequest = useCallback(async () => {
        if (!connectionId || isConnectionLoading) return;
        try {
            setIsConnectionLoading(true);
            // Use /withdraw (records withdrawnAt for cooldown) instead of DELETE
            await connectionService.withdrawConnectionRequest(connectionId);
            setConnectionStatus('none');
            setConnectionId(null);
            setShowActionMenu(false);
        } catch (err) {
            console.error('[useConnectionStatus] Failed to withdraw:', err);
            throw err;
        } finally {
            setIsConnectionLoading(false);
        }
    }, [connectionId, isConnectionLoading]);

    const blockUser = useCallback(async () => {
        if (!connectionId || isConnectionLoading) return;
        try {
            setIsConnectionLoading(true);
            await connectionService.blockConnection(connectionId);
            setConnectionStatus('none');
            setConnectionId(null);
            setShowActionMenu(false);
        } catch (err) {
            console.error('[useConnectionStatus] Failed to block:', err);
            throw err;
        } finally {
            setIsConnectionLoading(false);
        }
    }, [connectionId, isConnectionLoading]);

    return {
        connectionStatus, isConnectionLoading, handleConnect, sendRequest,
        removeConnection, withdrawRequest, blockUser,
        showRequestSheet, setShowRequestSheet,
        showActionMenu, setShowActionMenu,
    };
};
