declare module 'react-native-razorpay' {
    export interface RazorpayOptions {
        description?: string;
        image?: string;
        currency: string;
        key: string;
        amount: number;
        name: string;
        order_id?: string;
        prefill?: {
            email?: string;
            contact?: string;
            name?: string;
        };
        theme?: {
            color?: string;
        };
        notes?: Record<string, string>;
    }

    export interface RazorpaySuccess {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
    }

    export interface RazorpayError {
        code: number | string;
        description: string;
        source?: string;
        step?: string;
        reason?: string;
    }

    interface RazorpayCheckoutAPI {
        open(options: RazorpayOptions): Promise<RazorpaySuccess>;
    }

    const RazorpayCheckout: RazorpayCheckoutAPI;
    export default RazorpayCheckout;
}
