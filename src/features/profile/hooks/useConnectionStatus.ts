import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import connectionService from '@/services/connectionService';

type ConnectionState = 'none' | 'pending' | 'connected' | 'following';

type UseConnectionStatusReturn = {
    connectionStatus: ConnectionState;
    isConnectionLoading: boolean;
    handleConnect: () => Promise<void>;
};

export const useConnectionStatus = (
    profileId: string | undefined,
    isOwner: boolean
): UseConnectionStatusReturn => {
    const { user } = useAuthStore();
    const [connectionStatus, setConnectionStatus] = useState<ConnectionState>('none');
    const [isConnectionLoading, setIsConnectionLoading] = useState(false);

    useEffect(() => {
        if (isOwner || !profileId || !user) return;

        const checkStatus = async () => {
            try {
                const connections = await connectionService.getConnections();
                const isConnected = connections.some(
                    (c: any) => c.requesterId?._id === profileId || c.recipientId?._id === profileId
                );
                if (isConnected) {
                    setConnectionStatus('connected');
                    return;
                }

                const sentRequests = await connectionService.getSentConnectionRequests();
                const isPending = sentRequests.some(
                    (r: any) => r.recipientId?._id === profileId || r.recipientId === profileId
                );
                if (isPending) setConnectionStatus('pending');
            } catch (err) {
                console.error('[useConnectionStatus] Failed to check status:', err);
            }
        };

        checkStatus();
    }, [profileId, isOwner, user]);

    const handleConnect = useCallback(async () => {
        if (!profileId || isConnectionLoading || connectionStatus === 'pending') return;

        try {
            setIsConnectionLoading(true);

            if (connectionStatus === 'connected') {
                const connections = await connectionService.getConnections();
                const connection = connections.find(
                    (c: any) => c.requesterId?._id === profileId || c.recipientId?._id === profileId
                );
                if (connection) {
                    await connectionService.removeConnection(connection._id);
                    setConnectionStatus('none');
                }
            } else {
                await connectionService.sendConnectionRequest(profileId);
                setConnectionStatus('pending');
            }
        } catch (err) {
            console.error('[useConnectionStatus] Failed to update connection:', err);
        } finally {
            setIsConnectionLoading(false);
        }
    }, [profileId, connectionStatus, isConnectionLoading]);

    return { connectionStatus, isConnectionLoading, handleConnect };
};
