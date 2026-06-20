import TestRenderer from 'react-test-renderer';
import { InviteCard } from '../InviteCard';
import type { Invite } from '@/services/inviteService';

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

const base: Invite = {
    _id: '1', fromClientId: 'c1', fromSnapshot: { displayName: 'Aarav Kothari', city: 'Pune' },
    toUserId: 'u1', toRole: 'creative_lead', status: 'sent', createdAt: '2026-06-20T00:00:00Z',
};
const noop = () => {};

it('renders requirement preview + accept/decline when pending and requirement-attached', () => {
    let tree: any;
    TestRenderer.act(() => {
        tree = TestRenderer.create(
            <InviteCard
                invite={{ ...base, requirementId: 'r1', requirementSnapshot: { title: 'Sangeet set', city: 'Pune' } }}
                busy={false} errorMsg="" onAccept={noop} onDecline={noop}
            />
        );
    });
    const text = allText(tree.toJSON());
    expect(text).toContain('Aarav Kothari');
    expect(text).toContain('Sangeet set');
    expect(text).toContain('Accept');
    expect(text).toContain('Decline');
});

it('shows the note and hides actions for an accepted context-free invite', () => {
    let tree: any;
    TestRenderer.act(() => {
        tree = TestRenderer.create(
            <InviteCard
                invite={{ ...base, status: 'accepted', note: 'Open to a call?' }}
                busy={false} errorMsg="" onAccept={noop} onDecline={noop}
            />
        );
    });
    const text = allText(tree.toJSON());
    expect(text).toContain('Open to a call?');
    expect(text).toContain('Accepted');
    expect(text).not.toContain('Decline');
});

it('renders an inline error when provided', () => {
    let tree: any;
    TestRenderer.act(() => {
        tree = TestRenderer.create(<InviteCard invite={base} busy={false} errorMsg="Could not accept" onAccept={noop} onDecline={noop} />);
    });
    expect(allText(tree.toJSON())).toContain('Could not accept');
});
