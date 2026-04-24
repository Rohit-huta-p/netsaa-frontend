import React from 'react';
import { render } from '@testing-library/react-native';
import PaymentsStrip from '../PaymentsStrip';

// PaymentsStrip doesn't call useRouter directly, but its SectionCard parent
// imports `Link` from expo-router and the jest-level override here
// supersedes the global mock from jest-setup.ts, so we stub both explicitly.
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }), Link: 'Link' }));

describe('PaymentsStrip', () => {
  it('renders the coming-soon scaffold', () => {
    const { getByText } = render(<PaymentsStrip />);
    expect(getByText('Spend overview')).toBeTruthy();
    expect(getByText(/coming soon|land with payment tooling/i)).toBeTruthy();
  });
});
