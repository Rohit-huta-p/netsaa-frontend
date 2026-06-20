import TestRenderer from 'react-test-renderer';
import { InvitesHeader } from '../InvitesHeader';

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

it('pluralizes the subline and shows the all-caught-up state at zero', () => {
    let many: any, one: any, none: any;
    TestRenderer.act(() => {
        many = TestRenderer.create(<InvitesHeader pendingCount={3} />);
        one = TestRenderer.create(<InvitesHeader pendingCount={1} />);
        none = TestRenderer.create(<InvitesHeader pendingCount={0} />);
    });
    expect(allText(many.toJSON())).toContain('Invites');
    expect(allText(many.toJSON())).toContain('3 clients want to work with you.');
    expect(allText(one.toJSON())).toContain('1 client wants to work with you.');
    expect(allText(none.toJSON())).toContain("You're all caught up.");
});
