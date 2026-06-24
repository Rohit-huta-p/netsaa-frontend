// src/components/gigs/__tests__/StatusPillRow.test.tsx
//
// Plan 5 v2 — three pills above the title block: gig type · deadline ·
// applied count. Each pill auto-hides when its data is empty so the row
// collapses cleanly.

import React from 'react';
import { render } from '@testing-library/react-native';
import { StatusPillRow } from '../StatusPillRow';

function flatten(host: any): string {
    const flat: string[] = [];
    const walk = (node: any) => {
        if (node == null) return;
        if (typeof node === 'string' || typeof node === 'number') {
            flat.push(String(node));
            return;
        }
        if (Array.isArray(node)) return node.forEach(walk);
        if (node?.props?.children !== undefined) walk(node.props.children);
    };
    walk(host.props.children);
    return flat.join('');
}

describe('StatusPillRow', () => {
    it('renders the type pill when typeLabel is set', () => {
        const { getByTestId } = render(
            <StatusPillRow typeLabel="Sangeet" />
        );
        expect(getByTestId('status-pill-type')).toBeTruthy();
    });

    it('renders the applied pill when count > 0', () => {
        const { getByTestId } = render(
            <StatusPillRow typeLabel="Sangeet" appliedCount={14} />
        );
        const flat = flatten(getByTestId('status-pill-applied'));
        expect(flat).toContain('14 applied');
    });

    it('hides the applied pill when count is 0 or undefined', () => {
        const { queryByTestId } = render(
            <StatusPillRow typeLabel="Sangeet" appliedCount={0} />
        );
        expect(queryByTestId('status-pill-applied')).toBeNull();
    });

    it('renders deadline countdown in days when far out', () => {
        // +12d + 1h padding so we don't fall into the prev-day floor.
        const future = new Date(Date.now() + 12 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000);
        const { getByTestId } = render(
            <StatusPillRow applicationDeadline={future.toISOString()} />
        );
        const flat = flatten(getByTestId('status-pill-deadline'));
        expect(flat).toMatch(/Closes in 12 days/);
    });

    it('renders deadline countdown in hours when < 24h', () => {
        const future = new Date(Date.now() + 5 * 60 * 60 * 1000);
        const { getByTestId } = render(
            <StatusPillRow applicationDeadline={future.toISOString()} />
        );
        const flat = flatten(getByTestId('status-pill-deadline'));
        expect(flat).toMatch(/Closes in \dh/);
    });

    it('says "Closed" when deadline is in the past', () => {
        const past = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const { getByTestId } = render(
            <StatusPillRow applicationDeadline={past.toISOString()} />
        );
        const flat = flatten(getByTestId('status-pill-deadline'));
        expect(flat).toContain('Closed');
    });

    it('returns null when nothing to display', () => {
        const { queryByTestId } = render(<StatusPillRow />);
        expect(queryByTestId('status-pill-row')).toBeNull();
    });
});
