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
});
