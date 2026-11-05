import { isDevPaymentSession, openEventCheckout } from '../eventCheckout';
import { eventService } from '@/services/eventService';

// Keep native Razorpay out of the node test env, and stub the dev-confirm network call.
jest.mock('../razorpayCheckout', () => ({ openRazorpayCheckout: jest.fn() }));
jest.mock('@/services/eventService', () => ({
  eventService: { devConfirmReservation: jest.fn().mockResolvedValue(undefined) },
}));

const devConfirm = eventService.devConfirmReservation as jest.Mock;

const params = (paymentSessionId?: string) => ({
  paymentSessionId,
  orderId: 'evt_order_1',
  amountPaise: 450000,
  eventTitle: 'Kathak',
  prefill: {},
});

describe('isDevPaymentSession', () => {
  it('is true only for the backend dev-mode prefix', () => {
    expect(isDevPaymentSession('session_dev_abc')).toBe(true);
    expect(isDevPaymentSession('session_live_abc')).toBe(false);
    expect(isDevPaymentSession('abc')).toBe(false);
    expect(isDevPaymentSession(undefined)).toBe(false);
  });
});

describe('openEventCheckout dev short-circuit', () => {
  beforeEach(() => devConfirm.mockClear());

  it('confirms the hold via the dev endpoint (no checkout UI) for a session_dev_ session', async () => {
    await expect(openEventCheckout(params('session_dev_xyz'))).resolves.toBeUndefined();
    expect(devConfirm).toHaveBeenCalledTimes(1);
    expect(devConfirm).toHaveBeenCalledWith('evt_order_1');
  });

  it('does NOT dev-confirm a real session — it falls through to the live checkout path', async () => {
    // No CashfreeCheckoutHost is registered in this test, so the live path rejects with
    // "Checkout is not ready" — which proves the dev branch was bypassed for a real session.
    await expect(openEventCheckout(params('session_real_token'))).rejects.toThrow(/not ready/i);
    expect(devConfirm).not.toHaveBeenCalled();
  });
});
