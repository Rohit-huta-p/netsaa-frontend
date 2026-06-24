import RazorpayCheckout from 'react-native-razorpay';
import type { OpenCheckoutParams, CheckoutSuccess } from './razorpayCheckout.types';

export type { OpenCheckoutParams, CheckoutSuccess };

/**
 * Opens the native Razorpay checkout sheet (iOS/Android). Returns resolved data on success.
 * Throws on user-cancel or payment failure — caller surfaces error UI.
 *
 * Metro auto-resolves to razorpayCheckout.web.ts on web — that variant uses
 * the Razorpay Web Standard SDK (checkout.js) since react-native-razorpay
 * is iOS/Android only.
 *
 * Note: the actual payment confirmation comes from the Razorpay webhook on
 * the backend (Plan 8 Task 3). Mobile observes results by polling
 * /registrations/me — see EventRegisterSheetV2 pollUntilConfirmed.
 */
export async function openRazorpayCheckout(params: OpenCheckoutParams): Promise<CheckoutSuccess> {
    const options = {
        description: `Event: ${params.eventTitle}`,
        currency: params.currency,
        key: params.key_id,
        amount: params.amount,
        order_id: params.order_id,
        name: 'NETSA',
        theme: { color: '#FF6B35' },
        prefill: {
            name: params.prefill.name ?? '',
            email: params.prefill.email ?? '',
            contact: params.prefill.contact ?? '',
        },
    };

    return await RazorpayCheckout.open(options);
}
