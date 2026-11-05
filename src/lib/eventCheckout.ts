import { openRazorpayCheckout } from './razorpayCheckout';
import { eventService } from '@/services/eventService';

/**
 * Provider-neutral event checkout.
 *
 * Events settle through Cashfree (Easy Split). The attendee pays via the Cashfree
 * checkout rendered by <CashfreeCheckoutHost/> (a WebView on native, the JS SDK on
 * web) using the order's `payment_session_id`. Confirmation is webhook-driven: the
 * backend's POST /v1/cashfree/webhook flips the reservation/registration to paid and
 * the caller observes it by polling /registrations/me — so this promise resolving only
 * means "the checkout UI finished", exactly like the old Razorpay flow did.
 *
 * EXPO_PUBLIC_PAYMENT_PROVIDER=razorpay keeps the legacy native/web Razorpay sheet as a
 * rollback, mirroring the backend PAYMENT_PROVIDER switch.
 */
export type PaymentProviderName = 'cashfree' | 'razorpay';

export const PAYMENT_PROVIDER: PaymentProviderName =
  (process.env.EXPO_PUBLIC_PAYMENT_PROVIDER || 'cashfree').toLowerCase() === 'razorpay'
    ? 'razorpay'
    : 'cashfree';

export const CASHFREE_MODE: 'sandbox' | 'production' =
  (process.env.EXPO_PUBLIC_CASHFREE_ENV || 'sandbox').toLowerCase() === 'production'
    ? 'production'
    : 'sandbox';

/**
 * True when the backend handed us a mock payment session (CASHFREE_DEV_MODE=1). The events-service
 * only emits the `session_dev_` prefix in dev mode, so this self-synchronizes with the backend —
 * no extra client flag. A real Cashfree (sandbox or prod) session never carries this prefix, so
 * the live checkout path is untouched.
 */
export const isDevPaymentSession = (sessionId?: string): boolean =>
  !!sessionId && sessionId.startsWith('session_dev_');

export interface EventCheckoutParams {
  /** Cashfree payment_session_id from the reserve / approve response. */
  paymentSessionId?: string;
  /** Provider order id (persisted in the `razorpayOrderId` field). Used by the Razorpay rollback. */
  orderId: string;
  /** Amount in paise — only the Razorpay rollback needs it. */
  amountPaise: number;
  eventTitle: string;
  prefill: { name?: string; email?: string; contact?: string };
}

type Done = (ok: boolean, err?: string) => void;
type HostFn = (sessionId: string, done: Done) => void;

let host: HostFn | null = null;

/** CashfreeCheckoutHost registers itself here on mount; returns an unsubscribe. */
export function registerCashfreeHost(fn: HostFn): () => void {
  host = fn;
  return () => {
    if (host === fn) host = null;
  };
}

/**
 * Open the attendee checkout. Resolves when the payment UI finishes (the caller then
 * polls for webhook confirmation); rejects on cancel/failure so the caller can show a
 * retry.
 */
export function openEventCheckout(params: EventCheckoutParams): Promise<void> {
  // DEV mock: no real Cashfree order exists for a `session_dev_` session, so skip the checkout UI
  // and confirm the hold straight through the dev endpoint (same confirmReservationPaid the real
  // webhook runs). `orderId` is the reservation's razorpayOrderId — every caller passes it — so
  // this unblocks register, retry and pay-after-approval alike. Inert against a live session.
  if (isDevPaymentSession(params.paymentSessionId)) {
    return eventService.devConfirmReservation(params.orderId).then(() => undefined);
  }
  if (PAYMENT_PROVIDER === 'razorpay') {
    return openRazorpayCheckout({
      key_id: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID!,
      order_id: params.orderId,
      amount: params.amountPaise,
      currency: 'INR',
      eventTitle: params.eventTitle,
      prefill: params.prefill,
    }).then(() => undefined);
  }
  if (!params.paymentSessionId) {
    return Promise.reject(new Error('Missing payment session — please try again.'));
  }
  if (!host) {
    return Promise.reject(new Error('Checkout is not ready. Please try again in a moment.'));
  }
  return new Promise<void>((resolve, reject) => {
    host!(params.paymentSessionId!, (ok, err) =>
      ok ? resolve() : reject(new Error(err || 'Payment cancelled.')),
    );
  });
}
