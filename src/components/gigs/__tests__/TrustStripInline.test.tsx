// src/components/gigs/__tests__/TrustStripInline.test.tsx
//
// Plan 5 v2 — verified-only trust pill below the producer card.

import React from 'react';
import { render } from '@testing-library/react-native';
import { TrustStripInline } from '../TrustStripInline';

describe('TrustStripInline', () => {
    it('renders the verified pill when isVerified=true', () => {
        const { getByTestId } = render(<TrustStripInline isVerified />);
        expect(getByTestId('trust-strip-inline')).toBeTruthy();
    });

    it('renders nothing when isVerified is false / undefined', () => {
        const { queryByTestId } = render(<TrustStripInline />);
        expect(queryByTestId('trust-strip-inline')).toBeNull();
        const { queryByTestId: q2 } = render(
            <TrustStripInline isVerified={false} />
        );
        expect(q2('trust-strip-inline')).toBeNull();
    });
});
