// netsa-mobile/src/components/dashboard/hirer/__tests__/PaymentsStrip.smoke.test.tsx
//
// PAYMENTS-DISABLED (Apr 29): card reverted to "coming soon" stub. Tests
// reduced to a single render assertion. The wired-version tests (3 cases:
// loading / empty / populated with summary) are recoverable from git
// history (commit b22e7a4) when off-platform recording reactivates.
import React from 'react';
import { render } from '@testing-library/react-native';
import PaymentsStrip from '../PaymentsStrip';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }), Link: 'Link' }));

describe('PaymentsStrip', () => {
    it('renders the coming-soon scaffold', () => {
        const { getByText } = render(<PaymentsStrip />);
        expect(getByText('Spend overview')).toBeTruthy();
        expect(getByText(/coming soon|land with payment tooling/i)).toBeTruthy();
    });
});
