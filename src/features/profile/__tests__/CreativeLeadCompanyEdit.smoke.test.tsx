/**
 * Smoke test — CreativeLeadCompanyEdit mounts on a populated organizer and on a
 * cold-start (empty) one, surfacing the editorial section heads + save control.
 * All data/media hooks are mocked; we only assert the editor renders key text.
 */
import React from 'react';

let mockUser: any;
let mockRole: string;
let mockOrganizer: any;

jest.mock('@/stores/authStore', () => {
    const useAuthStore: any = (sel: any) => sel({ user: mockUser, role: mockRole });
    useAuthStore.setState = jest.fn();
    useAuthStore.getState = () => ({ user: mockUser, role: mockRole, accessToken: null });
    return { __esModule: true, useAuthStore, default: useAuthStore };
});
jest.mock('@/hooks/useOrganizer', () => ({ useOrganizer: () => ({ organizer: mockOrganizer }) }));
jest.mock('@/hooks/usePickAndCrop', () => ({
    __esModule: true,
    usePickAndCrop: () => ({ pickAndCrop: jest.fn(), cropperProps: {} }),
    default: () => ({ pickAndCrop: jest.fn(), cropperProps: {} }),
}));
jest.mock('@/components/media/MediaCropper', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/inputs/SearchableMultiSelect', () => ({ SearchableMultiSelect: () => null }));
jest.mock('@/utils/upload', () => ({ uploadMediaFlow: jest.fn(), validateMediaFile: () => ({ valid: true }) }));
jest.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: jest.fn() }) }));
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn(), MediaTypeOptions: { Images: 'Images' } }));

const TestRenderer = require('react-test-renderer');
import { CreativeLeadCompanyEdit } from '../CreativeLeadCompanyEdit';

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
        r = TestRenderer.create(<CreativeLeadCompanyEdit />);
    });
    const txt = collectText(r.toJSON()).join(' ');
    TestRenderer.act(() => { r.unmount(); });
    return txt;
}

describe('CreativeLeadCompanyEdit smoke', () => {
    it('renders a populated company', () => {
        mockRole = 'creative_lead';
        mockUser = { _id: 'org1', coverImageUrl: 'https://img/cover.jpg', location: 'Pune', instagramHandle: '@mehfil.collective' };
        mockOrganizer = {
            organizationName: 'Mehfil Collective',
            organizerTypeCategory: 'production_company',
            logoUrl: 'https://img/logo.jpg',
            bio: 'A Pune production house.',
            services: ['Sangeet', 'Bollywood'],
            photos: ['https://img/1.jpg', 'https://img/2.jpg'],
            organizationWebsite: 'mehfilcollective.in',
            yearsInBusiness: 6,
            teamSize: 8,
        };

        const txt = renderText();
        expect(txt).toContain('Edit company');
        expect(txt).toContain('The masthead');
        expect(txt).toContain('What you do');
        expect(txt).toContain('known for');       // Specialties title
        expect(txt).toContain('The showcase');     // Productions title
        expect(txt).toContain('Production company'); // org-type option label
        expect(txt).toContain('Coming soon');       // Team / Billing (P2)
        expect(txt).toContain('Save changes');
    });

    it('renders a cold-start company without crashing', () => {
        mockRole = 'creative_lead';
        mockUser = { _id: 'org1' };
        mockOrganizer = undefined;

        const txt = renderText();
        expect(txt).toContain('Edit company');
        expect(txt).toContain('The masthead');
        expect(txt).toContain('Save changes');
    });
});
