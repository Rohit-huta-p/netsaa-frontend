const TestRenderer = require('react-test-renderer');
import type { Invite } from '@/services/inviteService';

const mockInvites: Invite[] = [
    { _id: 'p1', fromClientId: 'c1', fromSnapshot: { displayName: 'Aarav Kothari', city: 'Pune' }, toUserId: 'u', toRole: 'creative_lead', status: 'sent', createdAt: '2026-06-20T00:00:00Z', requirementId: 'r1', requirementSnapshot: { title: 'Sangeet set' } },
    { _id: 'p2', fromClientId: 'c2', fromSnapshot: { displayName: 'Meera Nair', city: 'Mumbai' }, toUserId: 'u', toRole: 'creative_lead', status: 'viewed', createdAt: '2026-06-20T00:00:00Z', note: 'Open to a call?' },
    { _id: 'a1', fromClientId: 'c3', fromSnapshot: { displayName: 'Sunita Rao' }, toUserId: 'u', toRole: 'creative_lead', status: 'accepted', createdAt: '2026-06-19T00:00:00Z' },
];

jest.mock('expo-router', () => ({ Stack: { Screen: () => null }, useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@tanstack/react-query', () => ({
    useQuery: () => ({ data: mockInvites, isLoading: false }),
    useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));
jest.mock('@/services/inviteService', () => ({ inviteService: { received: jest.fn(), respond: jest.fn() } }));
jest.mock('@/services/conversationService', () => ({ __esModule: true, default: { createConversation: jest.fn() } }));
jest.mock('@/stores/authStore', () => ({ useAuthStore: (sel: any) => sel({ user: { displayName: 'Tester' } }) }));
jest.mock('@/components/MobileTabBar', () => ({ useMobileTabBarHeight: () => 64 }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: ({ children }: any) => children }));
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => () => null }));

function allText(node: any): string {
    const out: string[] = [];
    const walk = (n: any) => {
        if (n == null) return;
        if (typeof n === 'string') { out.push(n); return; }
        if (Array.isArray(n)) return n.forEach(walk);
        if (n.children) walk(n.children);
    };
    walk(node);
    return out.join(' ');
}

it('defaults to Pending, shows pending senders + count, hides accepted-only sender', () => {
    const Invites = require('../invites').default;
    let tree: any;
    TestRenderer.act(() => { tree = TestRenderer.create(<Invites />); });
    const text = allText(tree.toJSON());
    // Combined Activity inbox — defaults to the Received face.
    expect(text).toContain('Activity');
    expect(text).toContain('Received');
    expect(text).toContain('Sent');
    expect(text).toContain('2 clients want to work with you.');
    expect(text).toContain('Aarav Kothari');
    expect(text).toContain('Meera Nair');
    expect(text).not.toContain('Sunita Rao');
});
