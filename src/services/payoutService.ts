import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const BASE_URL = process.env.EXPO_PUBLIC_API_EVENT_URL || 'https://netsaa-events-service.onrender.com';
const client = axios.create({ baseURL: BASE_URL, timeout: 15000 });
client.interceptors.request.use((c) => { const t = useAuthStore.getState().accessToken; if (t) c.headers.Authorization = `Bearer ${t}`; return c; });

export type PayoutStatus = 'not_started' | 'submitted' | 'pending_kyc' | 'verified' | 'rejected' | 'suspended';

export interface PayoutAccount {
  status: PayoutStatus; panMasked?: string; bankLast4?: string; bankName?: string;
  accountHolderName?: string; gstin?: string; rejectionReason?: string; linkedAccountId?: string;
}

export type NameMatchResult =
  | 'DIRECT_MATCH' | 'GOOD_PARTIAL_MATCH' | 'MODERATE_PARTIAL_MATCH'
  | 'POOR_PARTIAL_MATCH' | 'NO_MATCH' | 'MATCH';

export interface VerifyResult {
  method: 'upi' | 'bank';
  valid: boolean;
  statusCode?: string;
  nameAtBank?: string;
  nameMatchScore?: number;
  nameMatchResult?: NameMatchResult;
  bankName?: string;
  /** Backend verdict on whether the resolved name is close enough to the PAN name. */
  nameMatchAcceptable: boolean;
}

export const payoutService = {
  getMine: async (): Promise<PayoutAccount> => (await client.get('/v1/payouts/account/me')).data.data,
  submit: async (body: {
    businessType: string; pan: string; accountHolderName: string;
    bankAccount: string; ifsc: string; gstin?: string; email: string;
  }): Promise<PayoutAccount> => (await client.post('/v1/payouts/account', body)).data.data,

  // Cashfree Secure ID real-time verification (pre-submit, stateless). UPI-first; bank fallback.
  verifyUpi: async (body: { vpa: string; accountHolderName?: string }): Promise<VerifyResult> =>
    (await client.post('/v1/payouts/verify-upi', body)).data.data,
  verifyBank: async (body: { bankAccount: string; ifsc: string; accountHolderName?: string }): Promise<VerifyResult> =>
    (await client.post('/v1/payouts/verify-bank', body)).data.data,
};
