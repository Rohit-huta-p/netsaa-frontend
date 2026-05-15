import RazorpayCheckout from 'react-native-razorpay';

export interface OpenCheckoutParams {
    key_id: string;
    order_id: string;
    amount: number;            // paise
    currency: string;
    eventTitle: string;
    prefill: {
        name?: string;
        email?: string;
        contact?: string;
    };
}

export interface CheckoutSuccess {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

/**
 * Opens the native Razorpay checkout sheet. Returns resolved data on success.
 * Throws on user-cancel or payment failure — caller surfaces error UI.
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
