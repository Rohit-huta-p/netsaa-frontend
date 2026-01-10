import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';

const getBaseUrl = () => {
    if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL.replace('/api', '');
    // if (Platform.OS === 'web') return 'http://localhost:5001';
    return 'https://netsaa-backend.onrender.com';
};

class SocketService {
    private socket: Socket | null = null;
    private static instance: SocketService;

    private constructor() { }

    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    public connect(token: string): Socket {
        if (this.socket) {
            // Already connected or connecting, check if token changed?
            // For now, if connected, just return.
            // If we need to re-auth, we might need to disconnect first.
            if (this.socket.connected) {
                console.log('SocketService: Already connected');
                return this.socket;
            }
        }

        console.log('SocketService: Connecting...');
        this.socket = io(getBaseUrl(), {
            auth: {
                token: token
            },
            transports: ['websocket'], // Recommended for React Native
            autoConnect: true,
            reconnection: true,
        });

        this.setupListeners();

        return this.socket;
    }

    public disconnect(): void {
        if (this.socket) {
            console.log('SocketService: Disconnecting...');
            this.socket.disconnect();
            this.socket = null;
        }
    }

    public getSocket(): Socket | null {
        return this.socket;
    }

    public joinDiscussion(payload: { type: 'event' | 'gig'; topicId: string }) {
        if (this.socket) {
            this.socket.emit('discussion:join', payload);
        }
    }

    public leaveDiscussion(payload: { type: 'event' | 'gig'; topicId: string }) {
        if (this.socket) {
            this.socket.emit('discussion:leave', payload);
        }
    }

    public onDiscussionNew(callback: (message: any) => void): () => void {
        if (this.socket) {
            this.socket.on('discussion:new', callback);
        }
        return () => {
            if (this.socket) {
                this.socket.off('discussion:new', callback);
            }
        };
    }

    private setupListeners() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('SocketService: Connected', this.socket?.id);
        });

        this.socket.on('disconnect', (reason) => {
            console.log('SocketService: Disconnected', reason);
        });

        this.socket.on('connect_error', (error) => {
            console.error('SocketService: Connection Error', error);
        });
    }
}

export const socketService = SocketService.getInstance();
