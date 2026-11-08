/**
 * Smoke test — CreativeLeadProfile renders without crashing for a public viewer
 * (populated + cold-start) and for the OWNER (Your gigs / insights / completeness /
 * manage affordances). Data hooks + MediaViewer are mocked; we assert the component
 * mounts and surfaces key text.
 */
import React from 'react';

// Mutable fixtures the mocked hooks read at render time (jest allows `mock*` names).
let mockUser: any;
let mockEvents: any[];
let mockGigs: any[];
let mockOwnerGigs: any[];

jest.mock('@/hooks/useUser', () => ({ useUser: () => ({ data: mockUser }) }));
jest.mock('@/hooks/useOrganizer', () => ({ useOrganizer: () => ({ organizer: undefined }) }));
jest.mock('@/hooks/useEventsByOrganizer', () => ({
    useEventsByOrganizer: () => ({ data: { events: mockEvents, total: mockEvents.length } }),
}));
jest.mock('@/hooks/useOrganizerGigsPublic', () => ({
    useOrganizerGigsPublic: () => ({ data: { gigs: mockGigs, total: mockGigs.length } }),
}));
jest.mock('@/hooks/useGigs', () => ({ useOrganizerGigs: () => ({ data: mockOwnerGigs }) }));
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

// Text collector for React elements / test-instances (walks props.children).
function elText(node: any, out: string[] = []): string[] {
    if (node == null || node === false) return out;
    if (typeof node === 'string' || typeof node === 'number') { out.push(String(node)); return out; }
    if (Array.isArray(node)) { node.forEach((n) => elText(n, out)); return out; }
    if (node.props && node.props.children != null) elText(node.props.children, out);
    return out;
}

function renderText(isOwner = false): string {
    let r: any;
    TestRenderer.act(() => {
        r = TestRenderer.create(<CreativeLeadProfile userId="org1" isOwner={isOwner} />);
    });
    const txt = collectText(r.toJSON()).join(' ');
    TestRenderer.act(() => { r.unmount(); });
    return txt;
}

const POPULATED = {
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

describe('CreativeLeadProfile smoke', () => {
    it('renders a populated organizer (public viewer)', () => {
        mockUser = POPULATED;
        mockEvents = [{ _id: 'e1', title: 'Kathak masterclass', eventType: 'workshop', city: 'Pune', startDate: '2026-11-22', price: 500 }];
        mockGigs = [
            { _id: 'g1', title: 'Lead dancer — Diwali gala', artistTypes: ['Bollywood'], location: { city: 'Pune', isRemote: false }, compensation: { model: 'fixed', amount: 32000 }, schedule: { startDate: '2026-11-07' }, applicationDeadline: '2099-11-05' },
        ];
        mockOwnerGigs = [];

        const txt = renderText(false);
        expect(txt).toContain('Mehfil Collective');
        expect(txt).toContain('What we do');
        expect(txt).toContain('Now hiring');
        expect(txt).toContain('Lead dancer — Diwali gala');
        expect(txt).toContain('Events they host');
        // No owner chrome leaks into the public view.
        expect(txt).not.toContain('Your gigs');
        expect(txt).not.toContain('View as visitor');
    });

    it('renders the OWNER view (Your gigs / insights / manage)', () => {
        mockUser = POPULATED;
        mockEvents = [{ _id: 'e1', title: 'Kathak masterclass', eventType: 'workshop', city: 'Pune', startDate: '2026-11-22', price: 500 }];
        mockGigs = [];
        mockOwnerGigs = [
            { _id: 'og1', title: 'Lead dancer — gala', status: 'published', applicants: 8, artistTypes: ['Bollywood'], location: { city: 'Pune' }, compensation: { model: 'fixed', amount: 32000 }, applicationDeadline: '2099-11-05' },
            { _id: 'og2', title: 'Sangeet choreographer', status: 'draft', applicants: 0, artistTypes: ['Choreography'], location: { city: 'Pune' }, compensation: { model: 'fixed', amount: 15000 } },
        ];

        const txt = renderText(true);
        expect(txt).toContain('View as visitor');
        expect(txt).toContain('Private to you');           // insights band
        expect(txt).toContain('to review');
        expect(txt).toContain('Your gigs');
        expect(txt).toContain('Post a gig');
        expect(txt).toContain('8 applicants →');            // live gig count
        expect(txt).toContain('Draft · not visible yet');   // draft status
        expect(txt).toContain('Finish & publish →');
        expect(txt).toContain('Your events');
        expect(txt).toContain('Edit profile');
        // Public CTAs are replaced in the owner view.
        expect(txt).not.toContain('+ Follow');
        expect(txt).not.toContain('Now hiring');
    });

    it('owner: "View as visitor" opens the phone-frame preview', () => {
        mockUser = POPULATED;
        mockEvents = [];
        mockGigs = [];
        mockOwnerGigs = [];

        let r: any;
        TestRenderer.act(() => {
            r = TestRenderer.create(<CreativeLeadProfile userId="org1" isOwner />);
        });
        // Preview chrome is absent until the owner invokes it.
        expect(collectText(r.toJSON()).join(' ')).not.toContain('How visitors see your page');

        const triggers = r.root.findAll(
            (n: any) => typeof n.props?.onPress === 'function'
                && elText(n.props.children).join(' ').includes('View as visitor'),
        );
        expect(triggers.length).toBeGreaterThan(0);
        TestRenderer.act(() => { triggers[triggers.length - 1].props.onPress(); });

        const after = collectText(r.toJSON()).join(' ');
        expect(after).toContain('How visitors see your page'); // phone-preview caption
        expect(after).toContain('Done');                       // exit affordance
        TestRenderer.act(() => { r.unmount(); });
    });

    it('renders a cold-start organizer without crashing', () => {
        mockUser = { _id: 'org1', role: 'creative_lead' };
        mockEvents = [];
        mockGigs = [];
        mockOwnerGigs = [];
        const txt = renderText(false);
        expect(txt).toContain('Creative Lead'); // fallback name
    });
});
