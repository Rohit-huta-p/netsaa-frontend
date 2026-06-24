import React from 'react';
import { render } from '@testing-library/react-native';
import { HubMiniTimeline } from '../components/HubMiniTimeline';

describe('HubMiniTimeline', () => {
    it('renders 4 nodes', () => {
        const { getAllByTestId } = render(
            <HubMiniTimeline
                nodes={[
                    { state: 'done', color: 'green' },
                    { state: 'done', color: 'green' },
                    { state: 'active', color: 'gold' },
                    { state: 'pending', color: 'grey' },
                ]}
                overlay={null}
            />
        );
        // 4 dot views (testID per node)
        const dots = getAllByTestId('mini-tl-node');
        expect(dots.length).toBe(4);
    });

    it('disputed overlay renders red ring', () => {
        const { getAllByTestId } = render(
            <HubMiniTimeline
                nodes={[
                    { state: 'done', color: 'green' },
                    { state: 'done', color: 'green' },
                    { state: 'active', color: 'gold' },
                    { state: 'pending', color: 'grey' },
                ]}
                overlay="disputed"
            />
        );
        const overlayMarker = getAllByTestId('mini-tl-overlay-disputed');
        expect(overlayMarker.length).toBe(1);
    });

    it('connector colors reflect adjacent node reachability', () => {
        // active branch with no payment yet — only nodes 0/1 are done
        const { getAllByTestId } = render(
            <HubMiniTimeline
                nodes={[
                    { state: 'done', color: 'green' },
                    { state: 'done', color: 'green' },
                    { state: 'active', color: 'gold' },
                    { state: 'pending', color: 'grey' },
                ]}
                overlay={null}
            />
        );
        const connectors = getAllByTestId('mini-tl-connector');
        expect(connectors).toHaveLength(3);

        // Connector 0→1: both done → green (#22C55E)
        const flatStyle0 = Array.isArray(connectors[0].props.style)
            ? Object.assign({}, ...connectors[0].props.style)
            : connectors[0].props.style;
        expect(flatStyle0.backgroundColor).toBe('#22C55E');

        // Connector 1→2: left done, right active (not pending) → green from left node
        const flatStyle1 = Array.isArray(connectors[1].props.style)
            ? Object.assign({}, ...connectors[1].props.style)
            : connectors[1].props.style;
        expect(flatStyle1.backgroundColor).toBe('#22C55E');

        // Connector 2→3: left active (not done) → faint white
        const flatStyle2 = Array.isArray(connectors[2].props.style)
            ? Object.assign({}, ...connectors[2].props.style)
            : connectors[2].props.style;
        expect(flatStyle2.backgroundColor).toBe('rgba(255,255,255,0.09)');
    });
});
