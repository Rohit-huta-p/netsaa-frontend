const TestRenderer = require('react-test-renderer');
import { RequirementPreview } from '../RequirementPreview';

jest.mock('lucide-react-native', () =>
    new Proxy({}, { get: () => () => null })
);

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

it('renders title, budget, date, city, craft, and invited count', () => {
    let tree: any;
    TestRenderer.act(() => {
        tree = TestRenderer.create(
            <RequirementPreview
                role="creative_lead"
                snapshot={{ title: 'Sangeet — live Kathak ensemble', budgetMin: 40000, budgetMax: 60000, eventDate: '2026-07-12T00:00:00Z', city: 'Pune', craft: 'Kathak', invitedCount: 4 }}
            />
        );
    });
    const text = allText(tree.toJSON());
    expect(text).toContain('Sangeet — live Kathak ensemble');
    expect(text).toContain('₹40k–60k');
    expect(text).toContain('Pune');
    expect(text).toContain('Kathak');
    expect(text).toContain('4 creative leads invited');
});

it('falls back to fallbackTitle and renders nothing when no title at all', () => {
    let withFallback: any, empty: any;
    TestRenderer.act(() => {
        withFallback = TestRenderer.create(<RequirementPreview role="artist" fallbackTitle="Legacy title" />);
        empty = TestRenderer.create(<RequirementPreview role="artist" />);
    });
    expect(allText(withFallback.toJSON())).toContain('Legacy title');
    expect(empty.toJSON()).toBeNull();
});
