const TestRenderer = require('react-test-renderer');
import { InviteTabs } from '../InviteTabs';

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

it('shows counts on pending/accepted (when > 0) and fires onChange', () => {
    const onChange = jest.fn();
    let tree: any;
    TestRenderer.act(() => {
        tree = TestRenderer.create(<InviteTabs active="pending" counts={{ pending: 3, accepted: 1, archive: 2 }} onChange={onChange} />);
    });
    const text = allText(tree.toJSON());
    expect(text).toContain('Pending · 3');
    expect(text).toContain('Accepted · 1');
    expect(text).toContain('Archive');
    expect(text).not.toContain('Archive · 2');

    const pressables = tree.root.findAll((n: any) => typeof n.props.onPress === 'function');
    TestRenderer.act(() => { pressables[1].props.onPress(); });
    expect(onChange).toHaveBeenCalledWith('accepted');
});

it('hides the count when zero', () => {
    let tree: any;
    TestRenderer.act(() => {
        tree = TestRenderer.create(<InviteTabs active="pending" counts={{ pending: 0, accepted: 0, archive: 0 }} onChange={() => {}} />);
    });
    expect(allText(tree.toJSON())).not.toContain('·');
});
