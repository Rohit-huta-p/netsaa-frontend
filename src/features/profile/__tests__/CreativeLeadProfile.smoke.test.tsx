/**
 * Smoke test — CreativeLeadProfile renders without crashing on both a populated
 * organizer and a cold-start (empty) one. Data hooks + MediaViewer are mocked;
 * we only assert the component mounts and surfaces key text.
 */
import React from 'react';

// Mutable fixtures the mocked hooks read at render time (jest allows `mock*` names).
let mockUser: any;
let mockEvents: any[];

jest.mock('@/hooks/useUser', () => ({ useUser: () => ({ data: mockUser }) }));
jest.mock('@/hooks/useOrganizer', () => ({ useOrganizer: () => ({ organizer: undefined }) }));
jest.mock('@/hooks/useEventsByOrganizer', () => ({
    useEventsByOrganizer: () => ({ data: { events: mockEvents, total: mockEvents.length } }),
}));
jest.mock('@/components/profile/MediaViewer', () => ({ __esModule: true, default: () => null }));
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));

const TestRenderer = require('react-test-renderer');
import { CreativeLeadProfile } from '../CreativeLeadProfile';

function collectText(node: any, out: string[] = []): string[] {
    if (node == null) return out;
    if (typeof node === 'string') { out.push(node); return out; }
    if (Array.isArray(node)) { node.forEach((n) => collectText(n, out)); return out; }
    if (node.children) collectText(node.children, out);
    return out;
}

function renderText(): string {
    let r: any;
    TestRenderer.act(() => {
        r = TestRenderer.create(<CreativeLeadProfile userId="org1" />);
    });
    const txt = collectText(r.toJSON()).join(' ');
    r.unmount();
    return txt;
}

describe('CreativeLeadProfile smoke', () => {
    it('renders a populated organizer', () => {
        mockUser = {
            _id: 'org1',
            role: 'creative_lead',
            organizationName: 'Mehfil Collective',
            organizerTypeCategory: 'production_company',
            primaryCity: 'Pune',
            bio: 'A Pune production house.',
            services: ['Sangeet', 'Bollywood Dance'],
            photos: ['https://img/1.jpg', 'https://img/2.jpg', 'https://img/3.jpg', 'https://img/4.jpg', 'https://img/5.jpg'],
            organizationWebsite: 'mehfil.co',
            yearsInBusiness: 6,
            teamSize: 8,
            verified: true,
            trustTier: 'trusted',
            organizerStats: { gigsPosted: 48, averageRating: 4.8, artistsHired: 120, avgReplyMinutes: 120 },
        };
        mockEvents = [{ _id: 'e1', title: 'Kathak masterclass', eventType: 'workshop', city: 'Pune', startDate: '2026-11-22', price: 500 }];

        const txt = renderText();
        expect(txt).toContain('Mehfil Collective');
        expect(txt).toContain('What we do');
        expect(txt).toContain('Productions');
        expect(txt).toContain('Gigs hosted');
        expect(txt).toContain('TRUSTED');
        expect(txt).toContain('Events they host');
    });

    it('renders a cold-start organizer without crashing', () => {
        mockUser = { _id: 'org1', role: 'creative_lead' };
        mockEvents = [];
        const txt = renderText();
        expect(txt).toContain('Creative Lead'); // fallback name
    });
});
