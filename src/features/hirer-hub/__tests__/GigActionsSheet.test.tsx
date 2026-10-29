import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { GigActionsSheet } from '../components/GigActionsSheet';

const mk = (over: any = {}) => ({
    visible: true,
    slotsTotal: 4,
    applicationsPaused: false,
    autoCloseWhenFilled: true,
    status: 'published',
    onClose: jest.fn(),
    onEdit: jest.fn(),
    onShare: jest.fn(),
    onTogglePause: jest.fn(),
    onToggleAutoClose: jest.fn(),
    onCloseGig: jest.fn(),
    ...over,
});

describe('GigActionsSheet', () => {
    it('returns null when not visible', () => {
        const { toJSON } = render(<GigActionsSheet {...mk({ visible: false })} />);
        expect(toJSON()).toBeNull();
    });

    it('renders the Manage gig menu with all five actions', () => {
        const { getByText, getByLabelText } = render(<GigActionsSheet {...mk()} />);
        expect(getByText('Manage gig')).toBeTruthy();
        expect(getByLabelText('Edit gig')).toBeTruthy();
        expect(getByLabelText('Share gig')).toBeTruthy();
        expect(getByLabelText('Pause applications')).toBeTruthy();
        expect(getByLabelText('Auto-close when filled')).toBeTruthy();
        expect(getByLabelText('Close gig')).toBeTruthy();
        // auto-close subtitle reflects the slot count
        expect(getByText('Stop automatically at 4 of 4 hired')).toBeTruthy();
    });

    it('Edit and Share fire their handlers', () => {
        const p = mk();
        const { getByLabelText } = render(<GigActionsSheet {...p} />);
        fireEvent.press(getByLabelText('Edit gig'));
        expect(p.onEdit).toHaveBeenCalled();
        fireEvent.press(getByLabelText('Share gig'));
        expect(p.onShare).toHaveBeenCalled();
    });

    it('toggling Pause fires onTogglePause with the next value (off → on)', () => {
        const p = mk({ applicationsPaused: false });
        const { getByLabelText } = render(<GigActionsSheet {...p} />);
        fireEvent.press(getByLabelText('Pause applications'));
        expect(p.onTogglePause).toHaveBeenCalledWith(true);
    });

    it('toggling Auto-close fires onToggleAutoClose with the next value (on → off)', () => {
        const p = mk({ autoCloseWhenFilled: true });
        const { getByLabelText } = render(<GigActionsSheet {...p} />);
        fireEvent.press(getByLabelText('Auto-close when filled'));
        expect(p.onToggleAutoClose).toHaveBeenCalledWith(false);
    });

    it('Close gig asks for inline confirmation before firing onCloseGig', () => {
        const p = mk();
        const { getByLabelText, getByText, queryByText } = render(<GigActionsSheet {...p} />);
        // first tap only reveals the confirm — does not close yet
        fireEvent.press(getByLabelText('Close gig'));
        expect(p.onCloseGig).not.toHaveBeenCalled();
        expect(getByText('Close this gig?')).toBeTruthy();
        // confirm
        fireEvent.press(getByLabelText('Confirm close gig'));
        expect(p.onCloseGig).toHaveBeenCalled();
    });

    it('shows a closed state (no Close action) when the gig is already closed', () => {
        const { getByText, queryByLabelText } = render(<GigActionsSheet {...mk({ status: 'closed' })} />);
        expect(getByText('Gig closed')).toBeTruthy();
        expect(queryByLabelText('Close gig')).toBeNull();
    });
});
