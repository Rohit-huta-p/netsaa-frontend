import type { OpenCheckoutParams, CheckoutSuccess } from './razorpayCheckout.types';

export type { OpenCheckoutParams, CheckoutSuccess };

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

let scriptPromise: Promise<void> | null = null;

/**
 * Lazily inject the Razorpay Web Standard SDK script tag on first use.
 * Idempotent — repeated calls return the same in-flight promise.
 */
function loadRazorpayScript(): Promise<void> {
    if (scriptPromise) return scriptPromise;
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return Promise.reject(new Error('Razorpay Web SDK requires a browser environment'));
    }
    if ((window as any).Razorpay) return Promise.resolve();

    scriptPromise = new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = RAZORPAY_SCRIPT_URL;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => {
            scriptPromise = null;
            reject(new Error('Failed to load Razorpay Web SDK'));
        };
        document.head.appendChild(script);
    });
    return scriptPromise;
}

/**
 * Web-only implementation that mirrors the native API surface from
 * razorpayCheckout.ts. Metro auto-resolves THIS file when bundling for web
 * because of the .web.ts extension convention.
 *
 * Uses Razorpay's Checkout JS (window.Razorpay) — opens the same modal flow
 * users see on razorpay.com test pages. Resolves with the same shape as the
 * native counterpart so callers don't need a platform guard.
 */
export async function openRazorpayCheckout(params: OpenCheckoutParams): Promise<CheckoutSuccess> {
    await loadRazorpayScript();

    const Razorpay = (window as any).Razorpay;
    if (!Razorpay) {
        throw new Error('Razorpay Web SDK is not available on window');
    }

    return new Promise<CheckoutSuccess>((resolve, reject) => {
        const rzp = new Razorpay({
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
            handler: (response: any) => {
                resolve({
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature,
                });
            },
            modal: {
                ondismiss: () => {
                    reject({
                        code: 'PAYMENT_CANCELLED',
                        description: 'Payment cancelled.',
                    });
                },
            },
        });

        rzp.on('payment.failed', (response: any) => {
            reject({
                code: response?.error?.code ?? 'PAYMENT_FAILED',
                description: response?.error?.description ?? 'Payment failed.',
            });
        });

        rzp.open();
    });
}
