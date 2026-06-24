const TestRenderer = require('react-test-renderer');
import { InviteEmptyState } from '../InviteEmptyState';

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

it('shows the right copy per tab', () => {
    let pending: any, accepted: any, archive: any;
    TestRenderer.act(() => {
        pending = TestRenderer.create(<InviteEmptyState tab="pending" />);
        accepted = TestRenderer.create(<InviteEmptyState tab="accepted" />);
        archive = TestRenderer.create(<InviteEmptyState tab="archive" />);
    });
    expect(allText(pending.toJSON())).toContain('Clients can invite you directly from your profile.');
    expect(allText(accepted.toJSON())).toContain('Nothing accepted yet');
    expect(allText(archive.toJSON())).toContain('Nothing here');
});
