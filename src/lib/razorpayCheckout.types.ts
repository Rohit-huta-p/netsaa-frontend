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
