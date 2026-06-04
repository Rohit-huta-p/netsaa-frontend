import { useEffect, useRef, useState } from 'react';
import { socketService } from '@/services/socketService';

/**
 * Track real-time online presence for a set of user IDs.
 *
 * Backend (users-service presence.socket.ts) emits:
 *   - 'user:online'  { userId }            on connect (broadcast)
 *   - 'user:offline' { userId }            on disconnect (broadcast)
 *   - 'presence:online-list' { onlineUserIds }  in reply to 'presence:check'
 *
 * This hook asks for the current presence of `userIds` on mount + reconnect
 * (so already-online users show immediately, not only after they reconnect),
 * then keeps the set live via the broadcast events.
 *
 * Returns a Set of currently-online user IDs. Callers use `online.has(id)`.
 */
export function usePresence(userIds: string[]): Set<string> {
    const [online, setOnline] = useState<Set<string>>(new Set());

    // Stable, sorted key so the effect only re-subscribes when the *set* of
    // ids actually changes — not on every array identity change.
    const idsKey = Array.from(new Set(userIds.filter(Boolean))).sort().join(',');
    const idsRef = useRef<string[]>([]);
    idsRef.current = idsKey ? idsKey.split(',') : [];

    useEffect(() => {
        const ids = idsRef.current;
        if (ids.length === 0) {
            setOnline(new Set());
            return;
        }
        const socket = socketService.getSocket();
        if (!socket) return;

        const watch = new Set(ids);

        const onOnline = (p: { userId: string }) => {
            if (watch.has(p.userId)) {
                setOnline((prev) => {
                    if (prev.has(p.userId)) return prev;
                    const next = new Set(prev);
                    next.add(p.userId);
                    return next;
                });
            }
        };
        const onOffline = (p: { userId: string }) => {
            if (watch.has(p.userId)) {
                setOnline((prev) => {
                    if (!prev.has(p.userId)) return prev;
                    const next = new Set(prev);
                    next.delete(p.userId);
                    return next;
                });
            }
        };
        const onList = (p: { onlineUserIds: string[] }) => {
            const list = Array.isArray(p?.onlineUserIds) ? p.onlineUserIds : [];
            setOnline(new Set(list.filter((id) => watch.has(id))));
        };

        socket.on('user:online', onOnline);
        socket.on('user:offline', onOffline);
        socket.on('presence:online-list', onList);

        const requestPresence = () => socket.emit('presence:check', { userIds: ids });
        requestPresence();
        socket.on('connect', requestPresence);

        return () => {
            socket.off('user:online', onOnline);
            socket.off('user:offline', onOffline);
            socket.off('presence:online-list', onList);
            socket.off('connect', requestPresence);
        };
    }, [idsKey]);

    return online;
}
